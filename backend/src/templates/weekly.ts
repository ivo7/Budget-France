import { emailLayout } from "./layout.ts";
import type { EmailMessage } from "../lib/email.ts";
import type { SnapshotLite } from "../lib/snapshot.ts";
import { formatEurCompact, formatPct, formatPercent } from "./format.ts";

interface WeeklyDeltas {
  dette?: number;      // delta absolu en €
  oat?: number;        // delta en points de %
  spreadBp?: number;   // delta en points de base
}

/**
 * Template du bulletin hebdomadaire premium. Plus éditorialisé que le mensuel :
 *  - Chiffre de la semaine mis en avant (avec contexte)
 *  - 3-4 "brefs" chiffrés
 *  - Comparaisons européennes (FR vs DE)
 *  - Mot pédagogique ("le concept du jour")
 *  - Lien vers le dashboard + désinscription + gestion abonnement
 */
export function buildWeeklyEmail({
  to,
  firstName,
  snapshot,
  deltas,
  unsubscribeUrl,
  accountUrl,
  publicUrl,
  semaineNum,
}: {
  to: string;
  firstName: string | null;
  snapshot: SnapshotLite;
  deltas: WeeklyDeltas;
  unsubscribeUrl: string;
  accountUrl: string;
  publicUrl: string;
  semaineNum: number;
}): EmailMessage {
  const salutation = firstName ? `Bonjour ${firstName},` : "Bonjour,";

  const miniStat = (label: string, value: string, delta?: string) => `
    <td style="padding:10px 8px;border:1px solid #eef0f4;border-radius:8px;background:#f8fafc;vertical-align:top;">
      <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">${label}</div>
      <div style="font-size:16px;font-weight:700;color:#0b0f17;margin-top:2px;">${value}</div>
      ${delta ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">${delta}</div>` : ""}
    </td>`;

  const detteDelta = deltas.dette != null
    ? `${deltas.dette >= 0 ? "+" : "−"}${formatEurCompact(Math.abs(deltas.dette))}/semaine`
    : "";
  const oatDelta = deltas.oat != null
    ? `${deltas.oat >= 0 ? "+" : "−"}${Math.abs(deltas.oat * 100).toFixed(0)} pb sem.`
    : "";

  const bodyHtml = `
    <p style="margin:0 0 12px 0;">${salutation}</p>
    <p style="margin:0 0 14px 0;">
      Voici les chiffres marquants de la semaine sur les finances publiques françaises.
    </p>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;padding:14px 16px;border-radius:10px;margin:16px 0;">
      <div style="font-size:11px;color:#0055A4;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">
        Chiffre de la semaine
      </div>
      <div style="font-family:'Space Grotesk',Inter,sans-serif;font-size:22px;font-weight:700;color:#0b0f17;margin-top:4px;">
        ${formatEurCompact(snapshot.dettePublique.value)}
      </div>
      <div style="font-size:13px;color:#374151;margin-top:4px;">
        La dette publique française atteint ${formatEurCompact(snapshot.dettePublique.value)},
        soit ${formatPercent(snapshot.ratioDettePib.value)} du PIB.
        ${deltas.dette ? `Progression ${detteDelta}, soit environ ${Math.round(snapshot.vitesseEndettementEurParSec.value)} €/seconde.` : ""}
      </div>
    </div>

    <div style="margin:16px 0 12px 0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">
      Les 4 indicateurs à suivre
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="6" border="0">
      <tr>
        ${miniStat("OAT 10 ans", formatPct(snapshot.tauxOat10ans.value), oatDelta)}
        ${miniStat("Taux BCE", formatPct(snapshot.tauxDirecteurBce.value))}
      </tr>
      <tr>
        ${miniStat("Dette / PIB", formatPercent(snapshot.ratioDettePib.value))}
        ${miniStat("Solde prévu", formatEurCompact(snapshot.soldeBudgetaire.value))}
      </tr>
    </table>

    <div style="margin:18px 0 8px 0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">
      Actu budgétaire
    </div>
    <ul style="margin:0;padding-left:18px;font-size:14px;color:#374151;line-height:1.6;">
      <li>LFI ${snapshot.annee} : dépenses ${formatEurCompact(snapshot.budgetPrevisionnel.value)}
          pour ${formatEurCompact(snapshot.recettesPrevisionnelles.value)} de recettes.</li>
      <li>Vitesse d'endettement : ${Math.round(snapshot.vitesseEndettementEurParSec.value).toLocaleString("fr-FR")} €/s
          (soit ${(snapshot.vitesseEndettementEurParSec.value * 86_400 / 1e6).toFixed(1)} M€/jour).</li>
      ${deltas.spreadBp != null ? `<li>Spread OAT-Bund : ${deltas.spreadBp >= 0 ? "+" : ""}${deltas.spreadBp} pb sur la semaine.</li>` : ""}
    </ul>

    <p style="margin:18px 0 0 0;font-size:12px;color:#6b7280;">
      Retrouve tous les graphiques interactifs, l'historique 1945+ et l'archive des bulletins
      sur budgetfrance.fr.
    </p>
  `;

  const text = [
    salutation,
    "",
    `Budget France — bulletin semaine ${semaineNum}`,
    "",
    `Chiffre de la semaine : dette publique ${formatEurCompact(snapshot.dettePublique.value)} (${formatPercent(snapshot.ratioDettePib.value)} du PIB)`,
    "",
    "Indicateurs clés :",
    `• Dette / PIB       : ${formatPercent(snapshot.ratioDettePib.value)}`,
    `• OAT 10 ans        : ${formatPct(snapshot.tauxOat10ans.value)}${oatDelta ? " (" + oatDelta + ")" : ""}`,
    `• Taux BCE          : ${formatPct(snapshot.tauxDirecteurBce.value)}`,
    `• Solde prévu       : ${formatEurCompact(snapshot.soldeBudgetaire.value)}`,
    `• Vitesse endett.   : ${Math.round(snapshot.vitesseEndettementEurParSec.value).toLocaleString("fr-FR")} €/s`,
    "",
    `Dashboard          : ${publicUrl}`,
    `Mon abonnement     : ${accountUrl}`,
    `Se désinscrire     : ${unsubscribeUrl}`,
  ].join("\n");

  const html = emailLayout({
    title: `Bulletin Budget France · semaine ${semaineNum}`,
    preheader: `Dette ${formatEurCompact(snapshot.dettePublique.value)} · OAT ${formatPct(snapshot.tauxOat10ans.value)}`,
    bodyHtml,
    ctaLabel: "Voir le dashboard complet",
    ctaUrl: publicUrl,
    unsubscribeUrl,
    footerNote: "Bulletin hebdomadaire Budget France Premium · merci de votre soutien.",
  });

  return {
    to,
    subject: `Budget France · S${semaineNum} · dette ${formatEurCompact(snapshot.dettePublique.value)}, OAT ${formatPct(snapshot.tauxOat10ans.value)}`,
    html,
    text,
  };
}
