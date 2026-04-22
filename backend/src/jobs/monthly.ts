import { prisma } from "../lib/db.ts";
import { readSnapshot } from "../lib/snapshot.ts";
import { config } from "../lib/config.ts";
import { sendEmail } from "../lib/email.ts";
import { buildMonthlyEmail } from "../templates/monthly.ts";

/** Envoi du bulletin mensuel à tous les abonnés confirmés ayant prefMonthly=true. */
export async function sendMonthlyBulletin(): Promise<void> {
  const snapshot = await readSnapshot();
  if (!snapshot) {
    console.warn("[monthly] pas de snapshot, bulletin non envoyé");
    return;
  }

  // Pour les deltas mensuels, on compare à la dernière dette stockée en KV.
  const prevKv = await prisma.keyValueStore.findUnique({ where: { key: "last_monthly" } });
  const prev = prevKv?.value as { dette?: number; oat?: number } | null;

  const deltas = {
    dette: prev?.dette != null ? snapshot.dettePublique.value - prev.dette : undefined,
    oat: prev?.oat != null ? snapshot.tauxOat10ans.value - prev.oat : undefined,
  };

  await prisma.keyValueStore.upsert({
    where: { key: "last_monthly" },
    create: {
      key: "last_monthly",
      value: { dette: snapshot.dettePublique.value, oat: snapshot.tauxOat10ans.value },
    },
    update: {
      value: { dette: snapshot.dettePublique.value, oat: snapshot.tauxOat10ans.value },
    },
  });

  const subscribers = await prisma.subscriber.findMany({
    where: {
      confirmedAt: { not: null },
      unsubscribedAt: null,
      prefMonthly: true,
    },
  });

  console.log(`[monthly] envoi du bulletin à ${subscribers.length} abonné(s)`);

  for (const sub of subscribers) {
    const unsubscribeUrl = `${config.publicBaseUrl}/api/unsubscribe?token=${sub.unsubscribeToken}`;
    const msg = buildMonthlyEmail({
      to: sub.email,
      firstName: sub.firstName,
      companyName: sub.companyName,
      snapshot,
      deltas,
      unsubscribeUrl,
      publicUrl: config.publicBaseUrl,
    });
    const res = await sendEmail(msg);
    await prisma.notificationLog.create({
      data: {
        subscriberId: sub.id,
        type: "monthly",
        success: res.ok,
        error: res.error ?? null,
        metadata: { dette: snapshot.dettePublique.value, oat: snapshot.tauxOat10ans.value },
      },
    });
    // Throttle léger pour ne pas saturer le serveur SMTP
    await new Promise((r) => setTimeout(r, 120));
  }
}
