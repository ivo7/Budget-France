import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/db.ts";
import { verifyEmailTransport } from "../lib/email.ts";
import { readSnapshot } from "../lib/snapshot.ts";

export function registerHealthRoutes(app: FastifyInstance) {
  app.get("/api/health", async () => {
    const [dbOk, email, snapshot, subscriberCount] = await Promise.all([
      prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
      verifyEmailTransport(),
      readSnapshot().then(Boolean),
      prisma.subscriber.count({ where: { confirmedAt: { not: null }, unsubscribedAt: null } }).catch(() => 0),
    ]);
    return {
      ok: dbOk && email.ok,
      db: dbOk,
      email,
      snapshot,
      confirmedSubscribers: subscriberCount,
      now: new Date().toISOString(),
    };
  });

  app.get("/api/stats", async () => {
    const [total, confirmed, byType] = await Promise.all([
      prisma.subscriber.count(),
      prisma.subscriber.count({ where: { confirmedAt: { not: null }, unsubscribedAt: null } }),
      prisma.subscriber.groupBy({
        by: ["type"],
        _count: true,
        where: { confirmedAt: { not: null }, unsubscribedAt: null },
      }),
    ]);
    return {
      total,
      confirmed,
      byType: Object.fromEntries(byType.map((r) => [r.type, r._count])),
    };
  });
}
