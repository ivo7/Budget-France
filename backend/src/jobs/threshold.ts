import { prisma } from "../lib/db.ts";
import { readSnapshot, type SnapshotLite } from "../lib/snapshot.ts";
import { config } from "../lib/config.ts";
import { sendEmail } from "../lib/email.ts";
import { buildThresholdEmail, type ThresholdEvent } from "../templates/threshold.ts";
import { formatEurCompact, formatPct } from "../templates/format.ts";
import { broadcastAlert } from "../lib/webhooks.ts";

const LAST_KEY = "last_snapshot";

/** Détecte si la dette a franchi un cap rond (multiple de 100 Md€). */
function crossedDetteMilestone(prev: number, next: number): string | undefined {
  const step = 100_000_000_000; // 100 Md€
  const prevBucket = Math.floor(prev / step);
  const nextBucket = Math.floor(next / step);
  if (nextBucket > prevBucket) {
    return formatEurCompact(nextBucket * step);
  }
  return undefined;
}

export async function checkThresholds(): Promise<void> {
  const snapshot = await readSnapshot();
  if (!snapshot) {
    console.warn("[threshold] pas de snapshot disponible, skip");
    return;
  }

  const stored = await prisma.keyValueStore.findUnique({ where: { key: LAST_KEY } });
  const previous = stored?.value as unknown as SnapshotLite | null;

  // Persister d'abord pour éviter les doublons en cas de retry.
  await prisma.keyValueStore.upsert({
    where: { key: LAST_KEY },
    create: { key: LAST_KEY, value: snapshot as unknown as object },
    update: { value: snapshot as unknown as object },
  });

  if (!previous) {
    console.log("[threshold] premier snapshot stocké, pas d'alerte");
    return;
  }

  const events: ThresholdEvent[] = [];

  // Dette
  const detteDelta = snapshot.dettePublique.value - previous.dettePublique.value;
  const milestone = crossedDetteMilestone(previous.dettePublique.value, snapshot.dettePublique.value);
  if (Math.abs(detteDelta) >= config.thresholds.detteJumpEur || milestone) {
    events.push({
      kind: "dette",
      previousValue: previous.dettePublique.value,
      newValue: snapshot.dettePublique.value,
      deltaLabel: `${detteDelta >= 0 ? "+" : "−"}${formatEurCompact(Math.abs(detteDelta))}`,
      crossedMilestone: milestone,
    });
  }

  // OAT 10 ans (en points de pourcentage)
  const oatDelta = snapshot.tauxOat10ans.value - previous.tauxOat10ans.value;
  const oatBp = Math.abs(oatDelta) * 100;
  if (oatBp >= config.thresholds.oatJumpBp) {
    events.push({
      kind: "oat",
      previousValue: previous.tauxOat10ans.value,
      newValue: snapshot.tauxOat10ans.value,
      deltaLabel: `${oatDelta >= 0 ? "+" : "−"}${Math.abs(oatDelta).toFixed(2)} pt`,
    });
  }

  if (events.length === 0) {
    console.log("[threshold] aucun seuil franchi");
    return;
  }

  console.log(`[threshold] ${events.length} événement(s) détecté(s)`);

  // Broadcast vers webhooks externes (Slack / Discord / générique) en parallèle
  // de l'envoi email. Ne bloque pas en cas d'échec webhook.
  for (const ev of events) {
    const title = ev.kind === "dette"
      ? `Dette publique : ${ev.deltaLabel}`
      : `Taux OAT 10 ans : ${ev.deltaLabel}`;
    const summary = ev.kind === "dette"
      ? `La dette publique française est passée de ${formatEurCompact(ev.previousValue)} à ${formatEurCompact(ev.newValue)}.`
      : `Le rendement OAT 10 ans est passé de ${formatPct(ev.previousValue)} à ${formatPct(ev.newValue)}.`;

    const webhookResults = await broadcastAlert({
      kind: ev.kind,
      title,
      summary,
      previousValue: ev.kind === "dette" ? formatEurCompact(ev.previousValue) : formatPct(ev.previousValue),
      newValue: ev.kind === "dette" ? formatEurCompact(ev.newValue) : formatPct(ev.newValue),
      deltaLabel: ev.deltaLabel,
      ...(ev.crossedMilestone ? { crossedMilestone: ev.crossedMilestone } : {}),
      dashboardUrl: config.publicBaseUrl,
    });
    if (webhookResults.length > 0) {
      console.log(`[threshold] webhooks : ${webhookResults.map((r) => `${r.transport}=${r.ok ? "OK" : "FAIL"}`).join(" ")}`);
    }
  }

  const subscribers = await prisma.subscriber.findMany({
    where: {
      confirmedAt: { not: null },
      unsubscribedAt: null,
      prefThreshold: true,
    },
  });

  for (const sub of subscribers) {
    for (const event of events) {
      const unsubscribeUrl = `${config.publicBaseUrl}/api/unsubscribe?token=${sub.unsubscribeToken}`;
      const msg = buildThresholdEmail({
        to: sub.email,
        firstName: sub.firstName,
        event,
        unsubscribeUrl,
        publicUrl: config.publicBaseUrl,
      });
      const res = await sendEmail(msg);
      await prisma.notificationLog.create({
        data: {
          subscriberId: sub.id,
          type: "threshold",
          success: res.ok,
          error: res.error ?? null,
          metadata: { kind: event.kind, delta: event.deltaLabel },
        },
      });
    }
  }
}
