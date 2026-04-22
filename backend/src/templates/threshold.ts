import { emailLayout } from "./layout.ts";
import type { EmailMessage } from "../lib/email.ts";
import { formatEurCompact, formatPct } from "./format.ts";

export interface ThresholdEvent {
  kind: "dette" | "oat";
  previousValue: number;
  newValue: number;
  deltaLabel: string;           // ex: "+60 Md€ en 6h"
  crossedMilestone?: string;    // ex: "3 500 Md€"
}

export function buildThresholdEmail({
  to,
  firstName,
  event,
  unsubscribeUrl,
  publicUrl,
}: {
  to: string;
  firstName: string | null;
  event: ThresholdEvent;
  unsubscribeUrl: string;
  publicUrl: string;
}): EmailMessage {
  const salutation = firstName ? `Bonjour ${firstName},` : "Bonjour,";

  const headline = event.kind === "dette"
    ? `La dette publique vient de bouger de ${event.deltaLabel}`
    : `Le taux OAT 10 ans vient de bouger de ${event.deltaLabel}`;

  const values = event.kind === "dette"
    ? `${formatEurCompact(event.previousValue)} → <strong>${formatEurCompact(event.newValue)}</strong>`
    : `${formatPct(event.previousValue)} → <strong>${formatPct(event.newValue)}</strong>`;

  const crossed = event.crossedMilestone
    ? `<p style="margin:0 0 12px 0;color:#b45309;background:#fef3c7;padding:10px 14px;border-radius:10px;">
         Cap franchi : <strong>${event.crossedMilestone}</strong>.
       </p>`
    : "";

  const bodyHtml = `
    <p style="margin:0 0 12px 0;">${salutation}</p>
    <p style="margin:0 0 12px 0;">${headline}.</p>
    ${crossed}
    <p style="margin:0 0 12px 0;font-size:16px;">${values}</p>
    <p style="margin:12px 0 0 0;color:#6b7280;font-size:13px;">
      Basé sur la dernière agrégation des sources officielles (Eurostat, BCE).
    </p>
  `;

  const text = [
    salutation,
    "",
    headline,
    event.crossedMilestone ? `Cap franchi : ${event.crossedMilestone}` : "",
    event.kind === "dette"
      ? `${formatEurCompact(event.previousValue)} → ${formatEurCompact(event.newValue)}`
      : `${formatPct(event.previousValue)} → ${formatPct(event.newValue)}`,
    "",
    `Dashboard : ${publicUrl}`,
    `Se désinscrire : ${unsubscribeUrl}`,
  ].filter(Boolean).join("\n");

  const html = emailLayout({
    title: "Alerte Budget France",
    preheader: headline,
    bodyHtml,
    ctaLabel: "Voir le dashboard",
    ctaUrl: publicUrl,
    unsubscribeUrl,
    footerNote: "Vous recevez cette alerte car vous êtes abonné aux alertes de seuil.",
  });

  return {
    to,
    subject: event.kind === "dette"
      ? `⚠︎ Dette française : ${event.deltaLabel}`
      : `⚠︎ Taux OAT 10 ans : ${event.deltaLabel}`,
    html,
    text,
  };
}
