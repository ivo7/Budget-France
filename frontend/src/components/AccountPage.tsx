import { useEffect, useState } from "react";

interface SubscriptionInfo {
  email: string;
  plan: "free" | "premium";
  subscription: {
    status: "trialing" | "active" | "past_due" | "canceled" | "unpaid";
    billingCycle: "monthly" | "yearly";
    amountCents: number;
    currency: string;
    currentPeriodEnd: string;
    trialEndsAt: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
}

/**
 * Page "Mon compte" : affiche le statut d'abonnement d'un utilisateur et
 * lui permet d'accéder au Customer Portal Stripe (self-service).
 *
 * Authentification : l'utilisateur arrive via un lien personnalisé
 * (ex. depuis un email) contenant ?token=<unsubscribeToken>. Ce token
 * sert de clef d'accès simple à ses propres données.
 *
 * Si aucun token n'est fourni, on affiche un formulaire de récupération
 * par email (envoi du lien de compte sur sa boîte).
 */
export function AccountPage() {
  const [token, setToken] = useState<string | null>(null);
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const query = hash.includes("?") ? hash.split("?")[1] : "";
    const params = new URLSearchParams(query);
    const t = params.get("token");
    if (t) {
      setToken(t);
      void loadInfo(t);
    }
  }, []);

  async function loadInfo(t: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stripe/status?token=${encodeURIComponent(t)}`);
      if (!res.ok) {
        setError(res.status === 404 ? "Compte introuvable ou lien expiré." : "Erreur de chargement.");
        return;
      }
      const body = await res.json();
      setInfo(body);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function openPortal() {
    if (!token) return;
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.message ?? "Impossible d'ouvrir le portail Stripe.");
        return;
      }
      window.location.href = body.url;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPortalLoading(false);
    }
  }

  if (!token) {
    return (
      <section className="mt-10 max-w-xl mx-auto">
        <div className="card p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-slate-900">Accès à ton compte</h1>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            Pour accéder à ton compte, utilise le lien personnalisé reçu dans l'email
            de confirmation ou dans n'importe quel email Budget France
            (section « Gérer mon abonnement »).
          </p>
          <a href="#/" className="mt-5 inline-block text-brand hover:underline">
            ← Retour au tableau de bord
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 max-w-3xl mx-auto">
      <div className="text-xs uppercase tracking-widest text-muted">Mon compte</div>
      <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">
        Gérer mon abonnement
      </h1>

      {loading && (
        <div className="card p-8 mt-6 text-center text-slate-600">Chargement…</div>
      )}

      {error && (
        <div className="card p-6 mt-6 border-flag-red/40">
          <div className="font-semibold text-flag-red">{error}</div>
          <a href="#/" className="mt-3 inline-block text-sm text-brand hover:underline">
            ← Retour au tableau de bord
          </a>
        </div>
      )}

      {info && (
        <>
          {/* Résumé compte */}
          <div className="card p-6 mt-6">
            <div className="text-[11px] uppercase tracking-widest text-muted mb-1">Email</div>
            <div className="font-semibold text-slate-900">{info.email}</div>

            <div className="mt-5 text-[11px] uppercase tracking-widest text-muted mb-1">Plan</div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                info.plan === "premium"
                  ? "bg-brand text-white"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}>
                {info.plan === "premium" ? "✨ Premium" : "Gratuit"}
              </span>
              {info.subscription && (
                <StatusBadge status={info.subscription.status} />
              )}
            </div>
          </div>

          {/* Détails abonnement */}
          {info.subscription ? (
            <div className="card p-6 mt-4">
              <h2 className="font-display text-lg font-semibold text-slate-900">Détails de l'abonnement</h2>

              <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <DetailRow label="Cycle de facturation" value={info.subscription.billingCycle === "monthly" ? "Mensuel" : "Annuel (−20%)"} />
                <DetailRow label="Tarif" value={`${(info.subscription.amountCents / 100).toFixed(2).replace(".", ",")} € / ${info.subscription.billingCycle === "monthly" ? "mois" : "an"}`} />
                {info.subscription.trialEndsAt && new Date(info.subscription.trialEndsAt) > new Date() && (
                  <DetailRow
                    label="Essai gratuit jusqu'au"
                    value={new Date(info.subscription.trialEndsAt).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                    highlight
                  />
                )}
                <DetailRow
                  label="Prochaine échéance"
                  value={new Date(info.subscription.currentPeriodEnd).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                />
                {info.subscription.cancelAtPeriodEnd && (
                  <DetailRow
                    label="Annulation programmée"
                    value="Oui — accès maintenu jusqu'à la fin de la période"
                    highlight
                    color="text-flag-red"
                  />
                )}
              </dl>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openPortal}
                  disabled={portalLoading}
                  className="inline-flex items-center bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-semibold rounded-xl px-5 py-3 transition-colors"
                >
                  {portalLoading ? "Ouverture…" : "Gérer mon abonnement (Stripe)"}
                </button>
                <a
                  href="#/"
                  className="inline-flex items-center border border-slate-200 hover:border-brand hover:text-brand text-slate-700 font-semibold rounded-xl px-5 py-3 transition-colors"
                >
                  Retour au tableau de bord
                </a>
              </div>

              <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
                Le portail Stripe te permet de : changer de carte bancaire, mettre à jour ton
                adresse de facturation, télécharger tes factures, changer de cycle (mensuel ↔ annuel),
                ou annuler ton abonnement.
              </p>
            </div>
          ) : (
            <div className="card p-6 mt-4">
              <h2 className="font-display text-lg font-semibold text-slate-900">Aucun abonnement actif</h2>
              <p className="text-sm text-slate-600 mt-2">
                Tu es inscrit au bulletin mensuel gratuit. Pour profiter du bulletin hebdomadaire,
                des alertes personnalisées et des archives, passe au Premium.
              </p>
              <a
                href="#/tarifs"
                className="mt-4 inline-flex items-center bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl px-5 py-3 transition-colors"
              >
                Voir les tarifs Premium
              </a>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, { label: string; color: string }> = {
    trialing: { label: "Essai gratuit", color: "bg-brand-soft text-brand border border-blue-200" },
    active: { label: "Actif", color: "bg-green-50 text-money border border-green-200" },
    past_due: { label: "Paiement en attente", color: "bg-amber-50 text-warn border border-amber-200" },
    canceled: { label: "Annulé", color: "bg-slate-100 text-slate-600 border border-slate-200" },
    unpaid: { label: "Impayé", color: "bg-red-50 text-flag-red border border-red-200" },
  };
  const info = labels[status] ?? { label: status, color: "bg-slate-100 text-slate-600" };
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider ${info.color}`}>
      {info.label}
    </span>
  );
}

function DetailRow({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-widest text-muted">{label}</dt>
      <dd className={`mt-0.5 font-semibold ${color ?? "text-slate-900"} ${highlight ? "" : ""}`}>{value}</dd>
    </div>
  );
}
