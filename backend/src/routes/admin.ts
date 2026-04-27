// ============================================================================
// Routes admin — dashboard back-office accessible depuis le frontend (/admin)
// ============================================================================
//
// Sécurité :
//   - Authentification par mot de passe simple (config.adminPassword)
//   - Comparaison constant-time (timingSafeEqual)
//   - Session token aléatoire en mémoire, expire en 24h
//   - Rate-limit strict sur /api/admin/login (5 tentatives/min)
//   - Toutes les autres routes admin nécessitent un Bearer token valide
//
// Routes :
//   POST /api/admin/login           → { password } → { token, expiresIn }
//   POST /api/admin/logout          → invalide le token courant
//   GET  /api/admin/me              → { authenticated: true } si token ok
//   GET  /api/admin/subscribers     → liste des abonnés (max 1000)
//   GET  /api/admin/stats           → KPIs + évolution sur 30 jours
//   GET  /api/admin/sources         → état des sources de données (snapshot)
//   GET  /api/admin/email-logs      → logs d'envoi email (max 1000)
//
// ============================================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { prisma } from "../lib/db.ts";
import { config } from "../lib/config.ts";

// ----------------------------------------------------------------------------
// Session store en mémoire — token → timestamp d'expiration (epoch ms)
// ----------------------------------------------------------------------------

const sessions = new Map<string, number>();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

function purgeExpiredSessions() {
  const now = Date.now();
  for (const [token, exp] of sessions) {
    if (exp < now) sessions.delete(token);
  }
}

// Compare deux chaînes en temps constant pour empêcher les attaques par timing.
function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function getBearerToken(req: FastifyRequest): string | null {
  const auth = req.headers["authorization"] || "";
  if (typeof auth !== "string" || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  return token || null;
}

// Helper exporté : utile pour protéger d'autres routes (ex: /api/admin/run/*)
export function isAdminAuthenticated(req: FastifyRequest): boolean {
  const token = getBearerToken(req);
  if (!token) return false;
  purgeExpiredSessions();
  const exp = sessions.get(token);
  if (!exp || exp < Date.now()) return false;
  return true;
}

// PreHandler Fastify pour les routes protégées.
async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  if (!isAdminAuthenticated(req)) {
    return reply.code(401).send({ error: "unauthorized" });
  }
}

// ----------------------------------------------------------------------------

const loginSchema = z.object({
  password: z.string().min(1).max(200),
});

export function registerAdminRoutes(app: FastifyInstance) {
  // --------------------------------------------------------------------------
  // POST /api/admin/login
  // --------------------------------------------------------------------------
  app.post(
    "/api/admin/login",
    {
      config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
    },
    async (req, reply) => {
      if (!config.adminPassword) {
        return reply.code(503).send({
          error: "admin_disabled",
          message:
            "Dashboard admin désactivé : ADMIN_PASSWORD n'est pas défini côté serveur.",
        });
      }
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "validation" });
      }
      if (!safeEqual(parsed.data.password, config.adminPassword)) {
        // Délai artificiel pour limiter le brute-force (en plus du rate-limit)
        await new Promise((r) => setTimeout(r, 250));
        return reply.code(401).send({ error: "invalid_password" });
      }
      const token = randomBytes(32).toString("hex");
      const expiresAt = Date.now() + SESSION_TTL_MS;
      sessions.set(token, expiresAt);
      purgeExpiredSessions();
      return {
        token,
        expiresIn: Math.floor(SESSION_TTL_MS / 1000),
        expiresAt: new Date(expiresAt).toISOString(),
      };
    },
  );

  // --------------------------------------------------------------------------
  // POST /api/admin/logout
  // --------------------------------------------------------------------------
  app.post("/api/admin/logout", async (req, reply) => {
    const token = getBearerToken(req);
    if (token) sessions.delete(token);
    return reply.code(204).send();
  });

  // --------------------------------------------------------------------------
  // GET /api/admin/me — pour vérifier qu'un token est encore valide au reload
  // --------------------------------------------------------------------------
  app.get("/api/admin/me", { preHandler: requireAdmin }, async () => {
    return { authenticated: true };
  });

  // --------------------------------------------------------------------------
  // GET /api/admin/subscribers — liste des abonnés (sans tokens sensibles)
  // --------------------------------------------------------------------------
  app.get(
    "/api/admin/subscribers",
    { preHandler: requireAdmin },
    async () => {
      const rows = await prisma.subscriber.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          type: true,
          plan: true,
          firstName: true,
          lastName: true,
          companyName: true,
          siret: true,
          role: true,
          companySize: true,
          createdAt: true,
          confirmedAt: true,
          unsubscribedAt: true,
          prefMonthly: true,
          prefWeekly: true,
          prefThreshold: true,
          lastNotifiedAt: true,
        },
        take: 1000,
      });
      return { subscribers: rows };
    },
  );

  // --------------------------------------------------------------------------
  // POST /api/admin/subscribers/:id/suspend
  // Marque un abonné comme désinscrit (soft delete : il ne reçoit plus rien
  // mais reste en base pour traçabilité RGPD / audit).
  // --------------------------------------------------------------------------
  app.post(
    "/api/admin/subscribers/:id/suspend",
    { preHandler: requireAdmin },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const sub = await prisma.subscriber.findUnique({ where: { id } });
      if (!sub) {
        return reply.code(404).send({ error: "not_found" });
      }
      if (sub.unsubscribedAt) {
        return { ok: true, alreadySuspended: true };
      }
      await prisma.subscriber.update({
        where: { id },
        data: { unsubscribedAt: new Date() },
      });
      return { ok: true };
    },
  );

  // --------------------------------------------------------------------------
  // POST /api/admin/subscribers/:id/reactivate
  // Réactive un abonné précédemment suspendu (lève unsubscribedAt).
  // --------------------------------------------------------------------------
  app.post(
    "/api/admin/subscribers/:id/reactivate",
    { preHandler: requireAdmin },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const sub = await prisma.subscriber.findUnique({ where: { id } });
      if (!sub) {
        return reply.code(404).send({ error: "not_found" });
      }
      await prisma.subscriber.update({
        where: { id },
        data: { unsubscribedAt: null },
      });
      return { ok: true };
    },
  );

  // --------------------------------------------------------------------------
  // DELETE /api/admin/subscribers/:id
  // Suppression définitive (hard delete) — efface l'abonné et ses logs
  // (cascade Prisma sur NotificationLog). À utiliser pour les demandes RGPD.
  // --------------------------------------------------------------------------
  app.delete(
    "/api/admin/subscribers/:id",
    { preHandler: requireAdmin },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const sub = await prisma.subscriber.findUnique({ where: { id } });
      if (!sub) {
        return reply.code(404).send({ error: "not_found" });
      }
      await prisma.subscriber.delete({ where: { id } });
      return { ok: true, deletedEmail: sub.email };
    },
  );

  // --------------------------------------------------------------------------
  // GET /api/admin/stats — KPIs globaux + évolution 30 j
  // --------------------------------------------------------------------------
  app.get("/api/admin/stats", { preHandler: requireAdmin }, async () => {
    const [
      total,
      confirmed,
      pending,
      unsubscribed,
      particuliers,
      entreprises,
    ] = await Promise.all([
      prisma.subscriber.count(),
      prisma.subscriber.count({
        where: { confirmedAt: { not: null }, unsubscribedAt: null },
      }),
      prisma.subscriber.count({
        where: { confirmedAt: null, unsubscribedAt: null },
      }),
      prisma.subscriber.count({ where: { unsubscribedAt: { not: null } } }),
      prisma.subscriber.count({ where: { type: "particulier" } }),
      prisma.subscriber.count({ where: { type: "entreprise" } }),
    ]);

    // Inscriptions par jour sur les 30 derniers jours (regroupé en mémoire,
    // suffisant tant qu'on reste sous quelques milliers d'abonnés).
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recent = await prisma.subscriber.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, confirmedAt: true, unsubscribedAt: true },
    });
    const byDay = new Map<
      string,
      { signups: number; confirmed: number; unsubscribed: number }
    >();
    for (const s of recent) {
      const day = s.createdAt.toISOString().slice(0, 10);
      const e = byDay.get(day) ?? { signups: 0, confirmed: 0, unsubscribed: 0 };
      e.signups++;
      if (s.confirmedAt) e.confirmed++;
      if (s.unsubscribedAt) e.unsubscribed++;
      byDay.set(day, e);
    }
    const evolution = Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, ...v }));

    // Abonnements récents avec emails (5 derniers)
    const recentList = await prisma.subscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        email: true,
        type: true,
        createdAt: true,
        confirmedAt: true,
      },
    });

    return {
      total,
      confirmed,
      pending,
      unsubscribed,
      particuliers,
      entreprises,
      confirmationRate:
        total > 0 ? Math.round((confirmed / total) * 1000) / 10 : 0,
      evolution,
      recentList,
    };
  });

  // --------------------------------------------------------------------------
  // GET /api/admin/sources — état des sources de données (snapshot)
  // --------------------------------------------------------------------------
  app.get("/api/admin/sources", { preHandler: requireAdmin }, async () => {
    try {
      const raw = await readFile(config.snapshotPath, "utf-8");
      const snapshot = JSON.parse(raw) as {
        generatedAt?: string;
        sources?: Array<{
          id: string;
          label: string;
          status?: string;
          url?: string;
          fallback?: boolean;
        }>;
      };
      const sources = snapshot.sources ?? [];
      const live = sources.filter(
        (s) => !s.fallback && s.status !== "fallback" && s.status !== "error",
      ).length;
      const fallback = sources.filter(
        (s) => s.fallback || s.status === "fallback",
      ).length;
      const error = sources.filter((s) => s.status === "error").length;
      return {
        generatedAt: snapshot.generatedAt ?? null,
        snapshotPath: config.snapshotPath,
        counts: { total: sources.length, live, fallback, error },
        sources,
      };
    } catch (e) {
      return {
        generatedAt: null,
        snapshotPath: config.snapshotPath,
        counts: { total: 0, live: 0, fallback: 0, error: 0 },
        sources: [],
        error: e instanceof Error ? e.message : String(e),
      };
    }
  });

  // --------------------------------------------------------------------------
  // GET /api/admin/check-sources — vérifie que toutes les URLs des sources
  // répondent (HTTP 2xx/3xx). Réponse : status, latence, code HTTP par source.
  // Timeout serré (5s/source) car appel synchrone depuis le dashboard.
  // --------------------------------------------------------------------------
  app.get(
    "/api/admin/check-sources",
    { preHandler: requireAdmin },
    async () => {
      const raw = await readFile(config.snapshotPath, "utf-8");
      const snapshot = JSON.parse(raw) as {
        generatedAt?: string;
        sources?: Array<{ id: string; label: string; url?: string }>;
      };
      const sources = snapshot.sources ?? [];

      const results = await Promise.all(
        sources.map(async (s) => {
          if (!s.url) {
            return {
              id: s.id,
              label: s.label,
              url: null,
              ok: false,
              error: "URL manquante",
              httpStatus: null,
              durationMs: 0,
            };
          }
          const start = Date.now();
          try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 5000);
            // HEAD d'abord, GET avec Range si HEAD ne marche pas
            let res = await fetch(s.url, {
              method: "HEAD",
              signal: ctrl.signal,
              redirect: "follow",
              headers: {
                "User-Agent":
                  "BudgetFrance-SourceChecker/1.0 (https://budgetfrance.org)",
              },
            }).catch(() => null);
            if (!res || res.status === 405) {
              const ctrl2 = new AbortController();
              const timer2 = setTimeout(() => ctrl2.abort(), 5000);
              res = await fetch(s.url, {
                method: "GET",
                signal: ctrl2.signal,
                redirect: "follow",
                headers: {
                  "User-Agent":
                    "BudgetFrance-SourceChecker/1.0 (https://budgetfrance.org)",
                  Range: "bytes=0-1023",
                },
              }).catch(() => null);
              clearTimeout(timer2);
            }
            clearTimeout(timer);
            if (!res) {
              return {
                id: s.id,
                label: s.label,
                url: s.url,
                ok: false,
                error: "no response",
                httpStatus: null,
                durationMs: Date.now() - start,
              };
            }
            return {
              id: s.id,
              label: s.label,
              url: s.url,
              ok: res.status >= 200 && res.status < 400,
              httpStatus: res.status,
              error: null,
              durationMs: Date.now() - start,
            };
          } catch (e) {
            return {
              id: s.id,
              label: s.label,
              url: s.url,
              ok: false,
              error: e instanceof Error ? e.message : String(e),
              httpStatus: null,
              durationMs: Date.now() - start,
            };
          }
        }),
      );

      results.sort((a, b) => a.id.localeCompare(b.id));
      const counts = {
        total: results.length,
        ok: results.filter((r) => r.ok).length,
        ko: results.filter((r) => !r.ok && r.url).length,
        noUrl: results.filter((r) => !r.url).length,
      };
      return { generatedAt: snapshot.generatedAt ?? null, counts, results };
    },
  );

  // --------------------------------------------------------------------------
  // GET /api/admin/analytics — fréquentation, téléchargements, top pages
  // --------------------------------------------------------------------------
  app.get(
    "/api/admin/analytics",
    { preHandler: requireAdmin },
    async () => {
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 1 * 86_400_000);
      const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
      const monthAgo = new Date(now.getTime() - 30 * 86_400_000);

      // Vues et visiteurs uniques sur différentes fenêtres
      const [
        viewsTotal,
        viewsDay,
        viewsWeek,
        viewsMonth,
        sessionsDay,
        sessionsWeek,
        sessionsMonth,
        downloadsTotal,
        downloadsDay,
        downloadsWeek,
      ] = await Promise.all([
        prisma.pageView.count(),
        prisma.pageView.count({ where: { ts: { gte: dayAgo } } }),
        prisma.pageView.count({ where: { ts: { gte: weekAgo } } }),
        prisma.pageView.count({ where: { ts: { gte: monthAgo } } }),
        prisma.pageView.findMany({
          where: { ts: { gte: dayAgo } },
          distinct: ["sessionId"],
          select: { sessionId: true },
        }),
        prisma.pageView.findMany({
          where: { ts: { gte: weekAgo } },
          distinct: ["sessionId"],
          select: { sessionId: true },
        }),
        prisma.pageView.findMany({
          where: { ts: { gte: monthAgo } },
          distinct: ["sessionId"],
          select: { sessionId: true },
        }),
        prisma.downloadEvent.count(),
        prisma.downloadEvent.count({ where: { ts: { gte: dayAgo } } }),
        prisma.downloadEvent.count({ where: { ts: { gte: weekAgo } } }),
      ]);

      // Top pages sur 30 jours
      const topPages = await prisma.pageView.groupBy({
        by: ["page"],
        where: { ts: { gte: monthAgo } },
        _count: { _all: true },
        orderBy: { _count: { page: "desc" } },
        take: 20,
      });

      // Téléchargements par format
      const dlByFormat = await prisma.downloadEvent.groupBy({
        by: ["format"],
        _count: { _all: true },
      });

      // Top fichiers téléchargés
      const topFiles = await prisma.downloadEvent.groupBy({
        by: ["filename", "format"],
        _count: { _all: true },
        orderBy: { _count: { filename: "desc" } },
        take: 25,
      });

      // Évolution sur 30 jours (vues + visiteurs uniques + téléchargements)
      const allViewsLastMonth = await prisma.pageView.findMany({
        where: { ts: { gte: monthAgo } },
        select: { ts: true, sessionId: true },
      });
      const allDlsLastMonth = await prisma.downloadEvent.findMany({
        where: { ts: { gte: monthAgo } },
        select: { ts: true },
      });

      const byDay = new Map<
        string,
        { date: string; views: number; sessions: Set<string>; downloads: number }
      >();
      const ensureDay = (date: string) => {
        let e = byDay.get(date);
        if (!e) {
          e = { date, views: 0, sessions: new Set(), downloads: 0 };
          byDay.set(date, e);
        }
        return e;
      };
      for (const v of allViewsLastMonth) {
        const d = v.ts.toISOString().slice(0, 10);
        const e = ensureDay(d);
        e.views++;
        e.sessions.add(v.sessionId);
      }
      for (const d of allDlsLastMonth) {
        const day = d.ts.toISOString().slice(0, 10);
        const e = ensureDay(day);
        e.downloads++;
      }
      const evolution = Array.from(byDay.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((e) => ({
          date: e.date,
          views: e.views,
          sessions: e.sessions.size,
          downloads: e.downloads,
        }));

      // Top pays sur 30 jours (ne compte que les visites avec country résolu)
      const topCountries = await prisma.pageView.groupBy({
        by: ["country"],
        where: { ts: { gte: monthAgo }, country: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { country: "desc" } },
        take: 20,
      });

      // Visiteurs uniques par pays (pas vues, mais sessions distinctes)
      const sessionsByCountry = await prisma.pageView.findMany({
        where: { ts: { gte: monthAgo }, country: { not: null } },
        select: { country: true, sessionId: true },
        distinct: ["country", "sessionId"],
      });
      const sessionsCountByCountry = new Map<string, number>();
      for (const v of sessionsByCountry) {
        if (!v.country) continue;
        sessionsCountByCountry.set(v.country, (sessionsCountByCountry.get(v.country) ?? 0) + 1);
      }

      const totalCountryViews = topCountries.reduce((a, b) => a + b._count._all, 0);
      const unknownCountryViews = viewsMonth - totalCountryViews;

      return {
        windows: {
          today: { views: viewsDay, sessions: sessionsDay.length, downloads: downloadsDay },
          week: { views: viewsWeek, sessions: sessionsWeek.length, downloads: downloadsWeek },
          month: {
            views: viewsMonth,
            sessions: sessionsMonth.length,
            downloads: 0, // recalculable, ici on garde week/day pour rester rapide
          },
          allTime: { views: viewsTotal, downloads: downloadsTotal },
        },
        topPages: topPages.map((p) => ({ page: p.page, views: p._count._all })),
        downloadsByFormat: dlByFormat.map((d) => ({ format: d.format, count: d._count._all })),
        topFiles: topFiles.map((f) => ({
          filename: f.filename,
          format: f.format,
          count: f._count._all,
        })),
        evolution,
        topCountries: topCountries.map((c) => ({
          country: c.country!,
          views: c._count._all,
          sessions: sessionsCountByCountry.get(c.country!) ?? 0,
        })),
        unknownCountryViews,
      };
    },
  );

  // --------------------------------------------------------------------------
  // GET /api/admin/email-logs — logs d'envoi email
  // --------------------------------------------------------------------------
  app.get(
    "/api/admin/email-logs",
    { preHandler: requireAdmin },
    async (req) => {
      const q = (req.query as { limit?: string }) || {};
      const limit = Math.min(Math.max(Number(q.limit) || 200, 1), 1000);
      const logs = await prisma.notificationLog.findMany({
        orderBy: { sentAt: "desc" },
        take: limit,
        include: {
          subscriber: { select: { email: true, type: true } },
        },
      });
      const totals = {
        success: logs.filter((l) => l.success).length,
        failure: logs.filter((l) => !l.success).length,
      };
      return { totals, logs };
    },
  );
}
