import { emailLayout } from "./layout.ts";
import type { EmailMessage } from "../lib/email.ts";

export function buildConfirmEmail({
  to,
  firstName,
  confirmUrl,
  unsubscribeUrl,
}: {
  to: string;
  firstName: string | null;
  confirmUrl: string;
  unsubscribeUrl: string;
}): EmailMessage {
  const salutation = firstName ? `Bonjour ${firstName},` : "Bonjour,";

  const bodyHtml = `
    <p style="margin:0 0 12px 0;">${salutation}</p>
    <p style="margin:0 0 12px 0;">
      Merci de votre inscription aux notifications <strong>Budget France</strong>.
      Pour finaliser, cliquez sur le bouton ci-dessous. Ce lien est valable 7 jours.
    </p>
    <p style="margin:16px 0 0 0;color:#6b7280;font-size:13px;">
      Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement ce message :
      aucune suite ne sera donnée sans confirmation.
    </p>
  `;

  const text = [
    salutation,
    "",
    "Merci de votre inscription aux notifications Budget France.",
    "Confirmez votre inscription en ouvrant ce lien (valable 7 jours) :",
    confirmUrl,
    "",
    `Si ce n'est pas vous : ignorez ce message. Pour vous désinscrire : ${unsubscribeUrl}`,
  ].join("\n");

  const html = emailLayout({
    title: "Confirmez votre inscription",
    preheader: "Un dernier clic pour recevoir nos notifications.",
    bodyHtml,
    ctaLabel: "Confirmer mon inscription",
    ctaUrl: confirmUrl,
    unsubscribeUrl,
  });

  return {
    to,
    subject: "Confirmez votre inscription — Budget France",
    html,
    text,
  };
}
