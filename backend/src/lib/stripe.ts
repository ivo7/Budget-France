// ============================================================================
// Client Stripe — wrapper autour du SDK officiel
// ============================================================================
//
// Initialisation centralisée + helpers pour les opérations courantes :
//  - Créer/retrouver un customer Stripe à partir d'un email
//  - Créer une Checkout Session (hosted page de paiement)
//  - Créer une Billing Portal Session (gestion self-service par le client)
//  - Valider une signature de webhook
//
// Mode "stub" si STRIPE_SECRET_KEY est absente : on log en console et
// on renvoie des erreurs claires au lieu de crasher au démarrage (utile
// pour tester l'intégration sans créer de compte Stripe au préalable).

import Stripe from "stripe";
import { config } from "./config.ts";

let cachedClient: Stripe | null = null;

export function stripe(): Stripe {
  if (!config.stripe.secretKey) {
    throw new Error(
      "Stripe n'est pas configuré. Renseigne STRIPE_SECRET_KEY dans ton .env " +
      "(voir https://dashboard.stripe.com/apikeys)",
    );
  }
  if (!cachedClient) {
    cachedClient = new Stripe(config.stripe.secretKey, {
      apiVersion: "2024-09-30.acacia",
      appInfo: { name: "budget-france", version: "0.1.0" },
    });
  }
  return cachedClient;
}

/** Helper : indique si Stripe est activé sur l'instance (clé configurée). */
export function isStripeEnabled(): boolean {
  return Boolean(config.stripe.secretKey);
}

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

/**
 * Retrouve le customer Stripe par email ou en crée un nouveau.
 * Évite la création de doublons si l'utilisateur s'inscrit 2 fois.
 */
export async function findOrCreateCustomer(args: {
  email: string;
  name?: string | null;
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer> {
  const s = stripe();
  // Recherche par email
  const existing = await s.customers.list({ email: args.email, limit: 1 });
  if (existing.data.length > 0) {
    return existing.data[0]!;
  }
  return s.customers.create({
    email: args.email,
    name: args.name ?? undefined,
    metadata: args.metadata ?? {},
  });
}

// ---------------------------------------------------------------------------
// Checkout Session — génère l'URL hosted par Stripe pour payer
// ---------------------------------------------------------------------------

export async function createCheckoutSession(args: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays: number;
  subscriberId: string;
}): Promise<Stripe.Checkout.Session> {
  const s = stripe();
  return s.checkout.sessions.create({
    mode: "subscription",
    customer: args.customerId,
    line_items: [{ price: args.priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: args.trialDays > 0 ? args.trialDays : undefined,
      metadata: { subscriberId: args.subscriberId },
    },
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    allow_promotion_codes: true,
    locale: "fr",
    billing_address_collection: "auto",
    customer_update: { address: "auto", name: "auto" },
  });
}

// ---------------------------------------------------------------------------
// Billing Portal — URL pour que le client gère son abonnement lui-même
// ---------------------------------------------------------------------------

export async function createPortalSession(args: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  const s = stripe();
  return s.billingPortal.sessions.create({
    customer: args.customerId,
    return_url: args.returnUrl,
  });
}

// ---------------------------------------------------------------------------
// Webhooks — vérification de signature
// ---------------------------------------------------------------------------

/**
 * Vérifie la signature d'un événement webhook et retourne l'event typé.
 * Throws si la signature est invalide (sécurité critique : sans ça, un
 * attaquant pourrait forger des événements et activer des abonnements).
 */
export function verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
  if (!config.stripe.webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET non configuré");
  }
  return stripe().webhooks.constructEvent(payload, signature, config.stripe.webhookSecret);
}
