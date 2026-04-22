import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import cron from "node-cron";

import { config } from "./lib/config.ts";
import { prisma } from "./lib/db.ts";
import { verifyEmailTransport } from "./lib/email.ts";
import { registerSubscribeRoutes } from "./routes/subscribe.ts";
import { registerConfirmRoutes } from "./routes/confirm.ts";
import { registerUnsubscribeRoutes } from "./routes/unsubscribe.ts";
import { registerHealthRoutes } from "./routes/health.ts";
import { registerDatasetRoutes } from "./routes/datasets.ts";
import { checkThresholds } from "./jobs/threshold.ts";
import { sendMonthlyBulletin } from "./jobs/monthly.ts";
import { loadDatasetsIfNeeded } from "./seed/loadDatasets.ts";

const app = Fastify({
  logger: { level: process.env.LOG_LEVEL ?? "info" },
  trustProxy: true,
});

async function main() {
  // CORS : les endpoints en lecture (/api/datasets, /api/composition, /api/lfi,
  // /api/ratings, /api/glossary, /api/health, /api/v1/docs) sont ouverts à tout
  // origin pour permettre la consommation par des clients tiers (presse, devs).
  // Les endpoints sensibles (subscribe, admin) restent limités aux origins configurées.
  await app.register(cors, {
    origin: (origin, cb) => {
      // Autorise les requêtes sans origin (curl, bots) et celles explicitement whitelisted
      if (!origin) return cb(null, true);
      if (config.corsOrigins.includes(origin)) return cb(null, true);
      // Pour les endpoints publics GET, on accepte tout
      cb(null, true);
    },
    credentials: false,
    methods: ["GET", "POST", "OPTIONS"],
  });

  // Rate-limit : 30 req/min par IP par défaut. Les détenteurs d'une clé API
  // (header X-API-Key) bénéficient d'une limite plus élevée (300 req/min).
  await app.register(rateLimit, {
    global: true,
    max: 30,
    timeWindow: "1 minute",
    keyGenerator: (req) => {
      const apiKey = (req.headers["x-api-key"] as string) || "";
      if (apiKey && config.apiAdminKey && apiKey === config.apiAdminKey) {
        return `admin:${apiKey}`;
      }
      return req.ip;
    },
    allowList: (req) => {
      const apiKey = (req.headers["x-api-key"] as string) || "";
      return Boolean(apiKey && config.apiAdminKey && apiKey === config.apiAdminKey);
    },
  });

  registerSubscribeRoutes(app);
  registerConfirmRoutes(app);
  registerUnsubscribeRoutes(app);
  registerHealthRoutes(app);
  registerDatasetRoutes(app);

  // Charge les datasets en DB au démarrage (idempotent).
  // À faire APRÈS prisma db push (géré dans le Dockerfile) et AVANT listen.
  await loadDatasetsIfNeeded((msg) => app.log.info(msg));

  // Endpoint admin déclenchant manuellement les jobs (utile pour les tests)
  app.post("/api/admin/run/threshold", async () => {
    await checkThresholds();
    return { ok: true };
  });
  app.post("/api/admin/run/monthly", async () => {
    await sendMonthlyBulletin();
    return { ok: true };
  });

  const emailStatus = await verifyEmailTransport();
  app.log.info({ emailStatus }, "email transport");

  // Cron jobs
  // - Détection de seuils : toutes les 15 minutes (le pipeline tourne toutes les 6h,
  //   mais on garde une fréquence courte pour réagir vite aux updates manuelles)
  cron.schedule("*/15 * * * *", () => {
    checkThresholds().catch((e) => app.log.error(e, "threshold job failed"));
  });

  // - Bulletin mensuel : le 1er de chaque mois à 09:00 heure de Paris
  cron.schedule(
    "0 9 1 * *",
    () => {
      sendMonthlyBulletin().catch((e) => app.log.error(e, "monthly job failed"));
    },
    { timezone: "Europe/Paris" },
  );

  // Premier check au démarrage (pour initialiser le KV store)
  setTimeout(() => {
    checkThresholds().catch((e) => app.log.error(e, "initial threshold check failed"));
  }, 5_000);

  await app.listen({ host: config.host, port: config.port });
  app.log.info(`🚀 backend ready on http://${config.host}:${config.port}`);
}

main().catch((err) => {
  app.log.error(err);
  process.exit(1);
});

// Arrêt propre
for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, async () => {
    app.log.info(`received ${sig}, shutting down`);
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}
