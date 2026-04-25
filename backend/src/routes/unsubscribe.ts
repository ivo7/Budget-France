import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/db.ts";
import { config } from "../lib/config.ts";
import { sendEmail } from "../lib/email.ts";
import { buildUnsubscribedEmail } from "../templates/unsubscribed.ts";

const querySchema = z.object({ token: z.string().min(16).max(100) });

export function registerUnsubscribeRoutes(app: FastifyInstance) {
  app.get("/api/unsubscribe", async (req, reply) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).type("text/html").send(renderPage({
        ok: false,
        title: "Lien invalide",
        message: "Le lien de désinscription est mal formé.",
      }));
    }

    const sub = await prisma.subscriber.findUnique({
      where: { unsubscribeToken: parsed.data.token },
    });

    if (!sub) {
      return reply.code(404).type("text/html").send(renderPage({
        ok: false,
        title: "Lien inconnu",
        message: "Ce lien ne correspond à aucun abonnement actif.",
      }));
    }

    if (sub.unsubscribedAt) {
      return reply.type("text/html").send(renderPage({
        ok: true,
        title: "Déjà désinscrit",
        message: "Tu ne reçois plus aucune notification de notre part.",
      }));
    }

    await prisma.subscriber.update({
      where: { id: sub.id },
      data: { unsubscribedAt: new Date() },
    });

    // Envoi d'un email d'accusé de désinscription (bonne pratique RGPD).
    // On loggue l'échec sans bloquer la confirmation côté UI : la désinscription
    // côté base est déjà effective, l'email est un bonus.
    try {
      const msg = buildUnsubscribedEmail({
        to: sub.email,
        firstName: sub.firstName,
        resubscribeUrl: `${config.publicBaseUrl}#subscribe`,
      });
      const sendRes = await sendEmail(msg);
      await prisma.notificationLog.create({
        data: {
          subscriberId: sub.id,
          type: "confirm",          // pas de type dédié pour l'instant
          success: sendRes.ok,
          error: sendRes.error ?? null,
          metadata: { kind: "unsubscribed" },
        },
      });
    } catch (e) {
      // Ne pas faire planter la page de désinscription si l'email échoue
      app.log.error({ err: e }, "failed to send unsubscribe confirmation email");
    }

    return reply.type("text/html").send(renderPage({
      ok: true,
      title: "Désinscription confirmée",
      message:
        "C'est fait. Tu ne recevras plus de notifications Budget France. " +
        "Un email de confirmation vient d'être envoyé à ton adresse.",
    }));
  });
}

function renderPage({ ok, title, message }: { ok: boolean; title: string; message: string }): string {
  const color = ok ? "#5ee2a0" : "#ff5a4e";
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} — Budget France</title>
<style>
  body { margin:0; background:#0b0f17; color:#e5e7eb; font-family:Inter,system-ui,sans-serif; display:grid; place-items:center; min-height:100vh; padding:24px; }
  .box { max-width:460px; background:#10151f; border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:32px; text-align:center; }
  h1 { margin:0 0 12px 0; font-size:22px; color:${color}; }
  p { line-height:1.55; color:#8892a6; margin:0 0 18px 0; }
  a { display:inline-block; background:#ff5a4e; color:#fff; padding:10px 20px; border-radius:10px; text-decoration:none; font-weight:600; }
</style></head>
<body><div class="box">
  <h1>${title}</h1>
  <p>${message}</p>
  <a href="${config.publicBaseUrl}">← Retour au dashboard</a>
</div></body></html>`;
}
