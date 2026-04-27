// ============================================================================
// routes/analytics.ts — collecte de visites et de téléchargements
// ============================================================================
//
// Endpoints publics (rate-limited) :
//   POST /api/analytics/page     → { sessionId, page, referrer? }
//   POST /api/analytics/download → { sessionId, filename, format, page? }
//
// Pas d'authentification : c'est un tracking minimal de fréquentation, sans
// donnée personnelle (pas d'IP, pas de User-Agent stocké). Le sessionId est
// généré côté client et stocké en localStorage. Aucune corrélation possible
// avec l'identité réelle de l'utilisateur.
// ============================================================================

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/db.ts";
import { lookupCountry, clientIpFromRequest } from "../lib/geoip.ts";

const pageSchema = z.object({
  sessionId: z.string().min(8).max(100),
  page: z.string().min(1).max(50),
  referrer: z.string().max(200).optional(),
});

const downloadSchema = z.object({
  sessionId: z.string().min(8).max(100),
  filename: z.string().min(1).max(150),
  format: z.enum(["png", "jpeg", "csv"]),
  page: z.string().max(50).optional(),
});

export function registerAnalyticsRoutes(app: FastifyInstance) {
  // ----- POST /api/analytics/page -----------------------------------------
  app.post(
    "/api/analytics/page",
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const parsed = pageSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "validation" });
      }
      const { sessionId, page, referrer } = parsed.data;

      // On ne stocke que le host du referer (pas de path) pour ne pas
      // logguer d'éventuels paramètres sensibles dans les query strings.
      let cleanRef: string | null = null;
      if (referrer) {
        try {
          const u = new URL(referrer);
          cleanRef = u.host || null;
        } catch {
          cleanRef = null;
        }
      }

      // Résolution country code via GeoIP (asynchrone, sans bloquer la
      // réponse : on attend max 5 s, sinon on stocke sans country).
      // L'IP n'est PAS stockée — uniquement le code pays.
      const ip = clientIpFromRequest(req);
      const country = ip ? await lookupCountry(ip) : null;

      await prisma.pageView.create({
        data: { sessionId, page, referrer: cleanRef, country },
      });
      return reply.code(204).send();
    },
  );

  // ----- POST /api/analytics/download -------------------------------------
  app.post(
    "/api/analytics/download",
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const parsed = downloadSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "validation" });
      }
      const { sessionId, filename, format, page } = parsed.data;
      await prisma.downloadEvent.create({
        data: { sessionId, filename, format, page: page ?? null },
      });
      return reply.code(204).send();
    },
  );
}
