import nodemailer, { type Transporter } from "nodemailer";
import { config } from "./config.ts";

let transporterCache: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporterCache) return transporterCache;

  if (config.isEmailConsoleMode) {
    // Transport "jsonTransport" de Nodemailer : retourne le message en JSON
    // sans l'envoyer. On log ensuite dans la console.
    transporterCache = nodemailer.createTransport({ jsonTransport: true });
  } else {
    transporterCache = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure || config.smtp.port === 465,
      auth: config.smtp.user
        ? { user: config.smtp.user, pass: config.smtp.pass }
        : undefined,
    });
  }

  return transporterCache;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendResult {
  ok: boolean;
  error?: string;
  messageId?: string;
}

export async function sendEmail(msg: EmailMessage): Promise<SendResult> {
  const t = getTransporter();
  try {
    const info = await t.sendMail({
      from: config.emailFrom,
      replyTo: config.emailReplyTo || undefined,
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    });

    if (config.isEmailConsoleMode) {
      // En mode console, on affiche un résumé clair.
      console.log("─".repeat(72));
      console.log(`[EMAIL → ${msg.to}]`);
      console.log(`Subject: ${msg.subject}`);
      console.log(`Text   : ${msg.text.slice(0, 400)}${msg.text.length > 400 ? "…" : ""}`);
      console.log("─".repeat(72));
    }

    return { ok: true, messageId: info.messageId };
  } catch (e) {
    console.error("[email] send failed:", (e as Error).message);
    return { ok: false, error: (e as Error).message };
  }
}

export async function verifyEmailTransport(): Promise<{ ok: boolean; error?: string; mode: string }> {
  if (config.isEmailConsoleMode) {
    return { ok: true, mode: "console (SMTP non configuré)" };
  }
  try {
    await getTransporter().verify();
    return { ok: true, mode: `SMTP ${config.smtp.host}:${config.smtp.port}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message, mode: "SMTP (erreur)" };
  }
}
