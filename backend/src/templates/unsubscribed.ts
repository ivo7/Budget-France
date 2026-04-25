// Email envoyé en confirmation d'une désinscription.
// Bonne pratique RGPD : l'utilisateur reçoit toujours un accusé de réception,
// qu'il s'agisse d'une inscription, d'une confirmation ou d'une désinscription.

import { emailLayout } from "./layout.ts";
import type { EmailMessage } from "../lib/email.ts";

export function buildUnsubscribedEmail({
  to,
  firstName,
  resubscribeUrl,
}: {
  to: string;
  firstName: string | null;
  resubscribeUrl: string;
}): EmailMessage {
  const salutation = firstName ? `Bonjour ${firstName},` : "Bonjour,";

  const bodyHtml = `
    <p style="margin:0 0 12px 0;">${salutation}</p>
    <p style="margin:0 0 12px 0;">
      Votre désinscription des notifications <strong>Budget France</strong> est confirmée.
      Vous ne recevrez plus aucun email de notre part à compter de maintenant.
    </p>
    <p style="margin:0 0 12px 0;color:#6b7280;font-size:13px;">
      Toutes vos données personnelles restent supprimables à la demande.
      Si vous changez d'avis, vous pouvez vous réinscrire à tout moment depuis
      le site.
    </p>
    <p style="margin:16px 0 0 0;color:#6b7280;font-size:13px;">
      Une question, une remarque ? Écrivez-nous à
      <a href="mailto:contact@budgetfrance.org" style="color:#ff5a4e;">
        contact@budgetfrance.org
      </a>.
    </p>
  `;

  const text = [
    salutation,
    "",
    "Votre désinscription des notifications Budget France est confirmée.",
    "Vous ne recevrez plus aucun email de notre part à compter de maintenant.",
    "",
    `Pour vous réinscrire plus tard : ${resubscribeUrl}`,
    "",
    "Une question ? contact@budgetfrance.org",
  ].join("\n");

  const html = emailLayout({
    title: "Désinscription confirmée",
    preheader: "Vous ne recevrez plus de notifications Budget France.",
    bodyHtml,
    ctaLabel: "Se réinscrire",
    ctaUrl: resubscribeUrl,
    footerNote:
      "Cet email d'accusé de désinscription vous est envoyé une seule fois.",
  });

  return {
    to,
    subject: "Désinscription confirmée — Budget France",
    html,
    text,
  };
}
