import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/db.ts";
import { newToken } from "../lib/tokens.ts";
import { sendEmail } from "../lib/email.ts";
import { buildConfirmEmail } from "../templates/confirm.ts";
import { config } from "../lib/config.ts";

const baseFields = {
  email: z.string().email("Email invalide").max(254).transform((s) => s.toLowerCase().trim()),
  prefMonthly: z.boolean().default(true),
  prefThreshold: z.boolean().default(true),
  consent: z.literal(true, { errorMap: () => ({ message: "Le consentement est obligatoire" }) }),
};

const particulierSchema = z.object({
  type: z.literal("particulier"),
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  ...baseFields,
});

const entrepriseSchema = z.object({
  type: z.literal("entreprise"),
  companyName: z.string().min(1, "Nom d'entreprise requis").max(160),
  siret: z.string().regex(/^\d{14}$/, "Le SIRET doit faire 14 chiffres").optional(),
  role: z.string().max(120).optional(),
  companySize: z.enum(["1", "2-10", "11-50", "51-250", "251-1000", "1000+"]).optional(),
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  ...baseFields,
});

const subscribeSchema = z.discriminatedUnion("type", [particulierSchema, entrepriseSchema]);

export function registerSubscribeRoutes(app: FastifyInstance) {
  app.post("/api/subscribe", {
    config: {
      rateLimit: { max: 5, timeWindow: "1 minute" },
    },
  }, async (req, reply) => {
    const parsed = subscribeSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "validation",
        issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }

    const data = parsed.data;

    const existing = await prisma.subscriber.findUnique({ where: { email: data.email } });

    // Si l'utilisateur est déjà confirmé et actif, on lui dit clairement.
    // (Compromis : permet l'énumération d'emails, mais l'UX civique
    // « tu es déjà inscrit, va check ta boîte » prime ici.)
    if (existing && existing.confirmedAt && !existing.unsubscribedAt) {
      return reply.code(409).send({
        error: "already_subscribed",
        message:
          "Cette adresse est déjà inscrite et confirmée. Vérifie ta boîte mail (et tes spams) — tu reçois déjà les notifications. Pour te désinscrire, clique sur le lien en bas du dernier email reçu.",
      });
    }

    // Si en attente de confirmation : on regénère un token frais et renvoie
    // l'email — message clair à l'utilisateur.
    const isPendingResend = Boolean(existing && !existing.confirmedAt && !existing.unsubscribedAt);

    const confirmToken = newToken();
    const unsubscribeToken = existing?.unsubscribeToken ?? newToken();

    const base = {
      email: data.email,
      type: data.type,
      prefMonthly: data.prefMonthly,
      prefThreshold: data.prefThreshold,
      confirmToken,
      unsubscribeToken,
      unsubscribedAt: null,
    };

    const typeSpecific = data.type === "particulier"
      ? {
          firstName: data.firstName ?? null,
          lastName: data.lastName ?? null,
          companyName: null,
          siret: null,
          role: null,
          companySize: null,
        }
      : {
          firstName: data.firstName ?? null,
          lastName: data.lastName ?? null,
          companyName: data.companyName,
          siret: data.siret ?? null,
          role: data.role ?? null,
          companySize: data.companySize ?? null,
        };

    const subscriber = existing
      ? await prisma.subscriber.update({
          where: { email: data.email },
          data: { ...base, ...typeSpecific },
        })
      : await prisma.subscriber.create({ data: { ...base, ...typeSpecific } });

    // Envoi de l'email de confirmation (double opt-in)
    const confirmUrl = `${config.publicBaseUrl}/api/confirm?token=${confirmToken}`;
    const unsubscribeUrl = `${config.publicBaseUrl}/api/unsubscribe?token=${unsubscribeToken}`;

    const msg = buildConfirmEmail({
      to: subscriber.email,
      firstName: subscriber.firstName,
      confirmUrl,
      unsubscribeUrl,
    });

    const sendRes = await sendEmail(msg);

    await prisma.notificationLog.create({
      data: {
        subscriberId: subscriber.id,
        type: "confirm",
        success: sendRes.ok,
        error: sendRes.error ?? null,
        metadata: { confirmUrl },
      },
    });

    return reply.code(202).send({
      ok: true,
      message: isPendingResend
        ? "Tu étais déjà pré-inscrit. Un nouvel email de confirmation vient d'être envoyé — clique dessus pour finaliser ton inscription."
        : "Un email de confirmation vient d'être envoyé. Clique sur le lien pour finaliser.",
    });
  });
}
