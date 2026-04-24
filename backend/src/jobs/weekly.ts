import { prisma } from "../lib/db.ts";
import { readSnapshot } from "../lib/snapshot.ts";
import { config } from "../lib/config.ts";
import { sendEmail } from "../lib/email.ts";
import { buildWeeklyEmail } from "../templates/weekly.ts";

/**
 * Bulletin hebdomadaire premium — envoyé chaque lundi à 07h45 (Europe/Paris).
 *
 * Ciblage : abonnés dont le plan est "premium", confirmé, avec prefWeekly=true,
 * et subscription active ou trialing (on continue à envoyer pendant l'essai).
 *
 * Les deltas sur la semaine sont calculés à partir du dernier snapshot stocké
 * dans KeyValueStore sous la clé "last_weekly".
 */
export async function sendWeeklyBulletin(): Promise<void> {
  const snapshot = await readSnapshot();
  if (!snapshot) {
    console.warn("[weekly] pas de snapshot, bulletin non envoyé");
    return;
  }

  // Deltas hebdo : comparaison au dernier snapshot stocké
  const prevKv = await prisma.keyValueStore.findUnique({ where: { key: "last_weekly" } });
  const prev = prevKv?.value as { dette?: number; oat?: number; spreadBp?: number } | null;

  const currentSpreadBp = await (async () => {
    const v = await prisma.keyValueStore.findUnique({ where: { key: "last_spread" } });
    return (v?.value as { bp?: number } | null)?.bp ?? null;
  })();

  const deltas = {
    dette: prev?.dette != null ? snapshot.dettePublique.value - prev.dette : undefined,
    oat: prev?.oat != null ? snapshot.tauxOat10ans.value - prev.oat : undefined,
    spreadBp: prev?.spreadBp != null && currentSpreadBp != null ? currentSpreadBp - prev.spreadBp : undefined,
  };

  await prisma.keyValueStore.upsert({
    where: { key: "last_weekly" },
    create: {
      key: "last_weekly",
      value: {
        dette: snapshot.dettePublique.value,
        oat: snapshot.tauxOat10ans.value,
        spreadBp: currentSpreadBp,
      },
    },
    update: {
      value: {
        dette: snapshot.dettePublique.value,
        oat: snapshot.tauxOat10ans.value,
        spreadBp: currentSpreadBp,
      },
    },
  });

  // Sélection des destinataires
  const subscribers = await prisma.subscriber.findMany({
    where: {
      plan: "premium",
      confirmedAt: { not: null },
      unsubscribedAt: null,
      prefWeekly: true,
      subscription: {
        status: { in: ["active", "trialing"] },
      },
    },
  });

  console.log(`[weekly] envoi du bulletin hebdo à ${subscribers.length} abonné(s) premium`);

  // Numéro de semaine ISO (simple)
  const now = new Date();
  const oneJan = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.ceil((now.getTime() - oneJan.getTime()) / 86_400_000);
  const semaineNum = Math.ceil(dayOfYear / 7);

  for (const sub of subscribers) {
    const unsubscribeUrl = `${config.publicBaseUrl}/api/unsubscribe?token=${sub.unsubscribeToken}`;
    const accountUrl = `${config.publicBaseUrl}/#/compte?token=${sub.unsubscribeToken}`;
    const msg = buildWeeklyEmail({
      to: sub.email,
      firstName: sub.firstName,
      snapshot,
      deltas,
      unsubscribeUrl,
      accountUrl,
      publicUrl: config.publicBaseUrl,
      semaineNum,
    });
    const res = await sendEmail(msg);
    await prisma.notificationLog.create({
      data: {
        subscriberId: sub.id,
        type: "weekly",
        success: res.ok,
        error: res.error ?? null,
        metadata: { semaine: semaineNum, dette: snapshot.dettePublique.value },
      },
    });
    // Petit throttle anti-spam
    await new Promise((r) => setTimeout(r, 120));
  }
}
