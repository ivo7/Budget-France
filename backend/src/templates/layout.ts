// Layout HTML réutilisable pour les emails transactionnels.
// Table-based layout + styles inline = compatible Outlook / Gmail / Yahoo / Apple Mail.

export function emailLayout({
  title,
  preheader,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  unsubscribeUrl,
  footerNote,
}: {
  title: string;
  preheader: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  unsubscribeUrl?: string;
  footerNote?: string;
}): string {
  const cta = ctaLabel && ctaUrl
    ? `
      <tr><td align="center" style="padding: 24px 0 12px 0;">
        <a href="${ctaUrl}" style="display:inline-block;background:#ff5a4e;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-family:Inter,Helvetica,Arial,sans-serif;font-size:15px;">
          ${ctaLabel}
        </a>
      </td></tr>`
    : "";

  const unsub = unsubscribeUrl
    ? `<a href="${unsubscribeUrl}" style="color:#6b7280;text-decoration:underline;">Me désinscrire</a>`
    : "";

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f5f8;font-family:Inter,Helvetica,Arial,sans-serif;color:#1f2937;">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f5f8">
      <tr><td align="center" style="padding:32px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.06);">
          <tr><td style="padding:28px 32px 0 32px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="display:inline-block;width:6px;height:20px;background:#0055A4;border-radius:2px;"></span>
              <span style="display:inline-block;width:6px;height:20px;background:#ffffff;border:1px solid #e5e7eb;border-radius:2px;"></span>
              <span style="display:inline-block;width:6px;height:20px;background:#EF4135;border-radius:2px;"></span>
              <span style="font-weight:700;letter-spacing:-0.01em;margin-left:8px;font-size:16px;">Budget France</span>
            </div>
          </td></tr>
          <tr><td style="padding:24px 32px 8px 32px;">
            <h1 style="margin:0;font-family:'Space Grotesk',Inter,sans-serif;font-size:22px;font-weight:700;color:#0b0f17;">${title}</h1>
          </td></tr>
          <tr><td style="padding:8px 32px 16px 32px;font-size:15px;line-height:1.55;color:#374151;">
            ${bodyHtml}
          </td></tr>
          ${cta}
          <tr><td style="padding:24px 32px 32px 32px;border-top:1px solid #eef0f4;font-size:12px;color:#6b7280;line-height:1.5;">
            ${footerNote ?? ""}
            <div style="margin-top:12px;">
              Budget France — données publiques agrégées (Eurostat, INSEE, BCE, Banque de France, data.gouv.fr).
              ${unsub ? `<br>${unsub}` : ""}
            </div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
