import { emailLayout } from "./layout.ts";
import type { EmailMessage } from "../lib/email.ts";
import type { SnapshotLite } from "../lib/snapshot.ts";
import { formatEurCompact, formatPct, formatPercent } from "./format.ts";

interface Deltas {
  dette?: number;       // delta absolu en €
  oat?: number;          // delta en points de %
}

export function buildMonthlyEmail({
  to,
  firstName,
  companyName,
  snapshot,
  deltas,
  unsubscribeUrl,
  publicUrl,
}: {
  to: string;
  firstName: string | null;
  companyName: string | null;
  snapshot: SnapshotLite;
  deltas: Deltas;
  unsubscribeUrl: string;
  publicUrl: string;
}): EmailMessage {
  const salutation = companyName
    ? `Bonjour,`
    : firstName
      ? `Bonjour ${firstName},`
      : "Bonjour,";

  const row = (label: string, value: string, sub?: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eef0f4;">
        <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">${label}</div>
        <div style="font-size:18px;font-weight:600;color:#0b0f17;margin-top:2px;">${value}</div>
        ${sub ? `<div style="font-size:12px;color:#6b7280;margin-top:2px;">${sub}</div>` : ""}
      </td>
    </tr>`;

  const detteLine = deltas.dette != null
    ? `${deltas.dette >= 0 ? "+" : "−"}${formatEurCompact(Math.abs(deltas.dette))} sur un mois`
    : "";
  const oatLine = deltas.oat != null
    ? `${deltas.oat >= 0 ? "+" : "−"}${Math.abs(deltas.oat).toFixed(2)} pt sur un mois`
    : "";

  const bodyHtml = `
    <p style="margin:0 0 12px 0;">${salutation}</p>
    <p style="margin:0 0 16px 0;">
      Voici les chiffres clés des finances publiques françaises ce mois-ci.
      Données issues d'Eurostat, de la BCE et de l'INSEE.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${row("Dette publique", formatEurCompact(snapshot.dettePublique.value), detteLine)}
      ${row("Ratio dette / PIB", formatPercent(snapshot.ratioDettePib.value))}
      ${row("Taux OAT 10 ans", formatPct(snapshot.tauxOat10ans.value), oatLine)}
      ${row("Taux directeur BCE", formatPct(snapshot.tauxDirecteurBce.value))}
      ${row("Budget prévisionnel ${annee}".replace("${annee}", String(snapshot.annee)), formatEurCompact(snapshot.budgetPrevisionnel.value))}
      ${row("Solde budgétaire prévu", formatEurCompact(snapshot.soldeBudgetaire.value))}
    </table>
  `;

  const text = [
    salutation,
    "",
    "Chiffres clés Budget France (mensuel) :",
    `• Dette publique      : ${formatEurCompact(snapshot.dettePublique.value)}${detteLine ? " (" + detteLine + ")" : ""}`,
    `• Ratio dette / PIB   : ${formatPercent(snapshot.ratioDettePib.value)}`,
    `• Taux OAT 10 ans     : ${formatPct(snapshot.tauxOat10ans.value)}${oatLine ? " (" + oatLine + ")" : ""}`,
    `• Taux directeur BCE  : ${formatPct(snapshot.tauxDirecteurBce.value)}`,
    `• Budget prévisionnel : ${formatEurCompact(snapshot.budgetPrevisionnel.value)}`,
    `• Solde prévu         : ${formatEurCompact(snapshot.soldeBudgetaire.value)}`,
    "",
    `Dashboard complet : ${publicUrl}`,
    `Se désinscrire    : ${unsubscribeUrl}`,
  ].join("\n");

  const html = emailLayout({
    title: "Chiffres clés — Budget France",
    preheader: `Dette ${formatEurCompact(snapshot.dettePublique.value)} · OAT ${formatPct(snapshot.tauxOat10ans.value)}`,
    bodyHtml,
    ctaLabel: "Voir le dashboard complet",
    ctaUrl: publicUrl,
    unsubscribeUrl,
    footerNote: "Vous recevez cet email car vous êtes abonné au bulletin mensuel Budget France.",
  });

  return {
    to,
    subject: `Budget France — chiffres du mois (${formatEurCompact(snapshot.dettePublique.value)} de dette)`,
    html,
    text,
  };
}
