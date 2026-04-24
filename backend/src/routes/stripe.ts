// ============================================================================
// Routes Stripe — checkout / portal / webhook / status
// ============================================================================
//
// 4 endpoints :
//
//   POST /api/stripe/checkout
//     Body: { email, billingCycle: "monthly" | "yearly" }
//     → retourne { url } vers la page Checkout hosted Stripe
//
//   GET  /api/stripe/status?token=<unsubscribeToken>
//     → retourne { plan, status, currentPeriodEnd, portalUrl? }
//     L'abonné s'authentifie via son token de désinscription (déjà en base).
//
//   POST /api/stripe/portal
//     Body: { token }
//     → retourne { url } vers le Billing Portal (gestion self-service)
//
//   POST /api/stripe/webhook
//     Reçu par Stripe pour notifier les events (subscription.created,
//     subscription.updated, payment_failed, etc.). Body RAW, signature vérifiée.

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type Stripe from "stripe";
import { prisma } from "../lib/db.ts";
import { config } from "../lib/config.ts";
import {
  findOrCreateCustomer,
  createCheckoutSession,
  createPortalSession,
  verifyWebhookSignature,
  isStripeEnabled,
} from "../lib/stripe.ts";

const checkoutSchema = z.object({
  email: z.string().email().transform((s) => s.toLowerCase().trim()),
  billingCycle: z.enum(["monthly", "yearly"]),
});

export function registerStripeRoutes(app: FastifyInstance) {
  // ------------------------------------------------------------------------
  // POST /api/stripe/checkout
  // ------------------------------------------------------------------------
  app.post(
    "/api/stripe/checkout",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (req, reply) => {
      if (!isStripeEnabled()) {
        return reply.code(503).send({ error: "stripe_not_configured" });
      }
      const parsed = checkoutSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "validation", issues: parsed.error.issues });
      }
      const { email, billingCycle } = parsed.data;

      // L'abonné DOIT déjà exister (et idéalement être confirmé).
      // Si non, on crée un Subscriber minimal (l'utilisateur peut
      // confirmer son email séparément, c'est pas bloquant pour payer).
      let subscriber = await prisma.subscriber.findUnique({ where: { email } });
      if (!subscriber) {
        const { newToken } = await import("../lib/tokens.ts");
        subscriber = await prisma.subscriber.create({
          data: {
            email,
            type: "particulier",
            confirmToken: newToken(),
            unsubscribeToken: newToken(),
            plan: "free",
          },
        });
      }

      const priceId = billingCycle === "monthly"
        ? config.stripe.priceMonthly
        : config.stripe.priceYearly;
      if (!priceId) {
        return reply.code(503).send({ error: "stripe_price_missing", cycle: billingCycle });
      }

      try {
        const customer = await findOrCreateCustomer({
          email: subscriber.email,
          name: [subscriber.firstName, subscriber.lastName].filter(Boolean).join(" ") || null,
          metadata: { subscriberId: subscriber.id },
        });

        const session = await createCheckoutSession({
          customerId: customer.id,
          priceId,
          successUrl: `${config.publicBaseUrl}/#/paiement-reussi?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${config.publicBaseUrl}/#/tarifs?annule=1`,
          trialDays: 7,
          subscriberId: subscriber.id,
        });

        return { url: session.url, sessionId: session.id };
      } catch (e) {
        req.log.error({ err: e }, "stripe checkout failed");
        return reply.code(500).send({ error: "stripe_error", message: (e as Error).message });
      }
    },
  );

  // ------------------------------------------------------------------------
  // GET /api/stripe/status?token=<unsubscribeToken>
  // ------------------------------------------------------------------------
  app.get("/api/stripe/status", async (req, reply) => {
    const token = (req.query as { token?: string }).token;
    if (!token) return reply.code(400).send({ error: "missing_token" });

    const subscriber = await prisma.subscriber.findUnique({
      where: { unsubscribeToken: token },
      include: { subscription: true },
    });
    if (!subscriber) return reply.code(404).send({ error: "not_found" });

    return {
      email: subscriber.email,
      plan: subscriber.plan,
      subscription: subscriber.subscription
        ? {
            status: subscriber.subscription.status,
            billingCycle: subscriber.subscription.billingCycle,
            amountCents: subscriber.subscription.amountCents,
            currency: subscriber.subscription.currency,
            currentPeriodEnd: subscriber.subscription.currentPeriodEnd,
            trialEndsAt: subscriber.subscription.trialEndsAt,
            cancelAtPeriodEnd: subscriber.subscription.cancelAtPeriodEnd,
          }
        : null,
    };
  });

  // ------------------------------------------------------------------------
  // POST /api/stripe/portal — billing self-service
  // ------------------------------------------------------------------------
  app.post("/api/stripe/portal", async (req, reply) => {
    if (!isStripeEnabled()) {
      return reply.code(503).send({ error: "stripe_not_configured" });
    }
    const body = req.body as { token?: string } | undefined;
    if (!body?.token) return reply.code(400).send({ error: "missing_token" });

    const subscriber = await prisma.subscriber.findUnique({
      where: { unsubscribeToken: body.token },
      include: { subscription: true },
    });
    if (!subscriber?.subscription) return reply.code(404).send({ error: "no_subscription" });

    try {
      const portal = await createPortalSession({
        customerId: subscriber.subscription.stripeCustomerId,
        returnUrl: `${config.publicBaseUrl}/#/compte?token=${subscriber.unsubscribeToken}`,
      });
      return { url: portal.url };
    } catch (e) {
      return reply.code(500).send({ error: "stripe_error", message: (e as Error).message });
    }
  });

  // ------------------------------------------------------------------------
  // POST /api/stripe/webhook
  // Stripe envoie les events ici. La signature doit être vérifiée avec
  // le RAW body (surtout PAS le body parsé par Fastify).
  // ------------------------------------------------------------------------
  app.post(
    "/api/stripe/webhook",
    {
      config: {
        // Pas de rate-limit sur les webhooks Stripe (ils arrivent à haute fréquence)
        rateLimit: false,
      },
    },
    async (req, reply) => {
      const signature = req.headers["stripe-signature"];
      if (!signature || typeof signature !== "string") {
        return reply.code(400).send({ error: "missing_signature" });
      }

      let event: Stripe.Event;
      try {
        // Le body raw est injecté par @fastify/raw-body (voir server.ts)
        const rawBody = (req as unknown as { rawBody?: Buffer | string }).rawBody;
        if (!rawBody) throw new Error("Raw body not available");
        event = verifyWebhookSignature(rawBody, signature);
      } catch (e) {
        req.log.warn({ err: e }, "stripe webhook signature verification failed");
        return reply.code(400).send({ error: "invalid_signature" });
      }

      try {
        await handleStripeEvent(event, req.log.info.bind(req.log));
      } catch (e) {
        req.log.error({ err: e, eventType: event.type }, "stripe webhook handler failed");
        // Retourner 500 fait réessayer Stripe (backoff exponentiel)
        return reply.code(500).send({ error: "handler_failed" });
      }

      return { received: true };
    },
  );
}

// ---------------------------------------------------------------------------
// Handler principal — route par event type
// ---------------------------------------------------------------------------

async function handleStripeEvent(event: Stripe.Event, log: (msg: string) => void): Promise<void> {
  log(`[stripe] event ${event.type} id=${event.id}`);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriberId = session.metadata?.subscriberId
        ?? (session.subscription_details?.metadata?.subscriberId as string | undefined);
      if (!subscriberId) {
        log(`[stripe] session ${session.id} sans subscriberId, skip`);
        return;
      }
      // Stripe a déjà créé la subscription, mais l'event subscription.created
      // nous donnera les vrais dates. Ici on log juste l'intent.
      log(`[stripe] checkout complété pour subscriber ${subscriberId}`);
      return;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      await upsertSubscription(sub, log);
      return;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(sub, log);
      return;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription?.id;
      if (subId) {
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subId },
          data: { status: "past_due" },
        });
      }
      log(`[stripe] payment failed for subscription ${subId}`);
      return;
    }

    default:
      log(`[stripe] event type ${event.type} non géré`);
  }
}

// ---------------------------------------------------------------------------
// Upsert — synchronise la subscription Stripe vers notre base
// ---------------------------------------------------------------------------

async function upsertSubscription(sub: Stripe.Subscription, log: (msg: string) => void): Promise<void> {
  const subscriberId = sub.metadata?.subscriberId;
  if (!subscriberId) {
    log(`[stripe] subscription ${sub.id} sans metadata.subscriberId, recherche par customer email`);
    // Fallback : retrouver via l'email du customer
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const { stripe } = await import("../lib/stripe.ts");
    const customer = await stripe().customers.retrieve(customerId) as Stripe.Customer;
    if (customer.deleted) return;
    const subscriber = await prisma.subscriber.findUnique({ where: { email: customer.email ?? "" } });
    if (!subscriber) {
      log(`[stripe] impossible de lier sub ${sub.id} à un subscriber`);
      return;
    }
    await syncSubscription(subscriber.id, sub);
    return;
  }
  await syncSubscription(subscriberId, sub);
}

async function syncSubscription(subscriberId: string, sub: Stripe.Subscription): Promise<void> {
  const item = sub.items.data[0];
  if (!item) return;

  const price = item.price;
  const cycle: "monthly" | "yearly" = price.recurring?.interval === "year" ? "yearly" : "monthly";
  const status = mapStripeStatus(sub.status);
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: sub.id },
    create: {
      subscriberId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      status,
      billingCycle: cycle,
      priceId: price.id,
      amountCents: price.unit_amount ?? 0,
      currency: price.currency,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    },
    update: {
      status,
      billingCycle: cycle,
      priceId: price.id,
      amountCents: price.unit_amount ?? 0,
      currency: price.currency,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    },
  });

  // Mise à jour du plan sur le Subscriber : active/trial/past_due → premium, reste → free
  const plan = (status === "active" || status === "trialing" || status === "past_due") ? "premium" : "free";
  await prisma.subscriber.update({
    where: { id: subscriberId },
    data: { plan },
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription, log: (msg: string) => void): Promise<void> {
  const existing = await prisma.subscription.findUnique({ where: { stripeSubscriptionId: sub.id } });
  if (!existing) {
    log(`[stripe] subscription ${sub.id} non trouvée en base, skip delete`);
    return;
  }
  await prisma.subscription.update({
    where: { id: existing.id },
    data: {
      status: "canceled",
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : new Date(),
    },
  });
  await prisma.subscriber.update({
    where: { id: existing.subscriberId },
    data: { plan: "free" },
  });
  log(`[stripe] subscription ${sub.id} annulée, subscriber repassé en free`);
}

function mapStripeStatus(s: Stripe.Subscription.Status): "trialing" | "active" | "past_due" | "canceled" | "unpaid" {
  switch (s) {
    case "trialing": return "trialing";
    case "active":   return "active";
    case "past_due": return "past_due";
    case "unpaid":   return "unpaid";
    case "canceled": return "canceled";
    case "incomplete":
    case "incomplete_expired":
    case "paused":
    default:
      return "canceled";
  }
}
