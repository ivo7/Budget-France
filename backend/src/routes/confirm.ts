import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/db.ts";
import { config } from "../lib/config.ts";

const querySchema = z.object({ token: z.string().min(16).max(100) });

export function registerConfirmRoutes(app: FastifyInstance) {
  // Endpoint HTML (ouvert directement par l'utilisateur depuis son email)
  app.get("/api/confirm", async (req, reply) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.code(400).type("text/html").send(renderPage({
        ok: false,
        title: "Lien invalide",
        message: "Le lien de confirmation est mal formé. Recommence l'inscription.",
      }));
    }

    const { token } = parsed.data;
    const sub = await prisma.subscriber.findUnique({ where: { confirmToken: token } });

    if (!sub) {
      return reply.code(404).type("text/html").send(renderPage({
        ok: false,
        title: "Lien expiré ou déjà utilisé",
        message: "Ce lien n'est plus valide. Si tu ne reçois plus rien, réinscris-toi.",
      }));
    }

    if (sub.confirmedAt) {
      return reply.type("text/html").send(renderPage({
        ok: true,
        title: "Inscription déjà confirmée",
        message: "Tu es bien abonné. Les notifications commenceront au prochain cycle.",
      }));
    }

    await prisma.subscriber.update({
      where: { id: sub.id },
      data: { confirmedAt: new Date() },
    });

    return reply.type("text/html").send(renderPage({
      ok: true,
      title: "Inscription confirmée",
      message: "C'est validé. Tu recevras les notifications selon les préférences choisies.",
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
