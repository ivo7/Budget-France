// Configuration runtime chargée depuis process.env.
// Toutes les variables ont un défaut sauf DATABASE_URL.

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variable d'environnement manquante : ${name}`);
  return v;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

function intEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  port: intEnv("PORT", 3000),
  host: optional("HOST", "0.0.0.0"),

  databaseUrl: required("DATABASE_URL"),

  // Email
  smtp: {
    host: optional("SMTP_HOST"),
    port: intEnv("SMTP_PORT", 587),
    user: optional("SMTP_USER"),
    pass: optional("SMTP_PASS"),
    secure: optional("SMTP_SECURE", "false") === "true",
  },
  emailFrom: optional("EMAIL_FROM", "Budget France <notifications@budgetfrance.local>"),
  emailReplyTo: optional("EMAIL_REPLY_TO", ""),

  // URLs publiques (servent à construire les liens de confirmation / désinscription)
  publicBaseUrl: optional("PUBLIC_BASE_URL", "http://localhost:4280"),

  // Fichier JSON produit par le pipeline (monté en volume lecture seule)
  snapshotPath: optional("SNAPSHOT_PATH", "/data/budget.json"),

  // Seuils d'alerte
  thresholds: {
    detteJumpEur: intEnv("THRESHOLD_DETTE_EUR", 50_000_000_000),   // 50 Md€
    oatJumpBp: intEnv("THRESHOLD_OAT_BP", 20),                     // 20 points de base = 0,20 pt
  },

  // Webhooks sortants : sur chaque alerte de seuil franchi, on peut pinger
  // Slack / Discord / un endpoint générique. Tous optionnels.
  webhooks: {
    slackUrl: optional("SLACK_WEBHOOK_URL"),
    discordUrl: optional("DISCORD_WEBHOOK_URL"),
    genericUrl: optional("GENERIC_WEBHOOK_URL"),
  },

  // API publique : clé admin optionnelle pour dépasser le rate-limit
  // (par défaut 30 req/min). Laisser vide pour désactiver l'API key.
  apiAdminKey: optional("API_ADMIN_KEY"),

  // Stripe — intégration paiements pour le plan premium
  // Le webhook secret est séparé de la clé secrète pour la vérification
  // de signature des événements entrants.
  stripe: {
    secretKey: optional("STRIPE_SECRET_KEY"),
    publishableKey: optional("STRIPE_PUBLISHABLE_KEY"),
    webhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
    priceMonthly: optional("STRIPE_PRICE_MONTHLY"),       // price_xxx pour 5,99 €/mois
    priceYearly: optional("STRIPE_PRICE_YEARLY"),         // price_xxx pour 57,50 €/an
    productPremium: optional("STRIPE_PRODUCT_PREMIUM"),   // prod_xxx
  },

  // Mode dev : si SMTP_HOST est vide, on log les emails dans stdout.
  isEmailConsoleMode: !process.env.SMTP_HOST,

  // CORS : on autorise le frontend local ET l'URL publique.
  corsOrigins: optional("CORS_ORIGINS", "http://localhost:4280,http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

export type AppConfig = typeof config;
