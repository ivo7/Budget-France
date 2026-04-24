import { useState } from "react";

type Cycle = "monthly" | "yearly";

/**
 * Page tarifs : comparaison Free vs Premium, checkout Stripe en 1 clic.
 *
 * Flow :
 *  1. L'utilisateur entre son email + choisit mensuel / annuel
 *  2. POST /api/stripe/checkout → redirige vers Stripe Checkout hosted
 *  3. Paiement sur la page Stripe (sécurisée, PCI DSS)
 *  4. Stripe redirige vers /#/paiement-reussi?session_id=...
 *  5. Webhook côté backend met à jour le plan en "premium"
 */
export function PricingPage() {
  const [cycle, setCycle] = useState<Cycle>("yearly");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    if (!email || !email.includes("@")) {
      setError("Merci d'entrer un email valide.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, billingCycle: cycle }),
      });
      const body = await res.json();
      if (!res.ok) {
        if (body.error === "stripe_not_configured") {
          setError("Le paiement n'est pas encore actif. Contacte l'administrateur.");
        } else if (body.error === "stripe_price_missing") {
          setError(`Plan ${cycle === "monthly" ? "mensuel" : "annuel"} indisponible pour le moment.`);
        } else {
          setError(body.message ?? "Erreur lors de l'initialisation du paiement.");
        }
        return;
      }
      if (body.url) {
        window.location.href = body.url;
      } else {
        setError("Réponse du serveur inattendue.");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const monthlyPrice = 5.99;
  const yearlyTotal = 57.5;
  const yearlyEquiv = yearlyTotal / 12;
  const savingYearlyEuro = monthlyPrice * 12 - yearlyTotal;

  return (
    <>
      <section className="mt-6">
        <div className="text-xs uppercase tracking-widest text-muted">Abonnement Premium</div>
        <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">
          Passer au Premium
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">
          Le site reste gratuit et ouvert à tous. L'abonnement Premium finance le projet
          et te donne un accès privilégié : bulletin chaque lundi matin, archives de tous
          les bulletins, notifications personnalisées sur les indicateurs qui t'intéressent.
        </p>
      </section>

      {/* Toggle mensuel / annuel */}
      <section className="mt-6 flex items-center gap-3 flex-wrap">
        <div className="inline-flex rounded-full bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setCycle("monthly")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              cycle === "monthly" ? "bg-brand text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setCycle("yearly")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              cycle === "yearly" ? "bg-brand text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Annuel
          </button>
        </div>
        {cycle === "yearly" && (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-money border border-green-200">
            −20 % · tu économises {savingYearlyEuro.toFixed(2)} €/an
          </span>
        )}
      </section>

      {/* Comparaison Free vs Premium */}
      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Free */}
        <div className="card p-6">
          <div className="text-xs uppercase tracking-widest text-muted">Gratuit</div>
          <h2 className="font-display text-2xl font-semibold text-slate-900 mt-1">Compte libre</h2>
          <div className="font-display text-4xl font-bold text-slate-900 mt-4">
            0 €<span className="text-base font-normal text-slate-500">/toujours</span>
          </div>
          <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
            <Feature ok>Dashboard complet en accès libre</Feature>
            <Feature ok>Bulletin mensuel par email</Feature>
            <Feature ok>Notifications de mise à jour du site</Feature>
            <Feature ok>Historique 1945 → 2025 consultable</Feature>
            <Feature ok>Téléchargement / partage des graphiques</Feature>
            <Feature ok>API publique 30 req/min</Feature>
          </ul>
        </div>

        {/* Premium */}
        <div className="card p-6 border-2 border-brand relative">
          <div className="absolute -top-3 left-6 bg-brand text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Recommandé
          </div>
          <div className="text-xs uppercase tracking-widest text-brand">Premium</div>
          <h2 className="font-display text-2xl font-semibold text-slate-900 mt-1">Soutenir & aller plus loin</h2>
          <div className="font-display text-4xl font-bold text-slate-900 mt-4">
            {cycle === "monthly"
              ? <>{monthlyPrice.toFixed(2).replace(".", ",")} €<span className="text-base font-normal text-slate-500">/mois</span></>
              : <>{yearlyEquiv.toFixed(2).replace(".", ",")} €<span className="text-base font-normal text-slate-500">/mois</span></>
            }
          </div>
          {cycle === "yearly" && (
            <div className="text-sm text-slate-600 mt-1">
              Soit {yearlyTotal.toFixed(2).replace(".", ",")} € facturés annuellement
            </div>
          )}
          <div className="mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-soft text-brand border border-blue-200">
            7 jours d'essai gratuit
          </div>

          <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
            <Feature ok>Tout le plan gratuit, plus :</Feature>
            <Feature ok highlight><strong>Bulletin hebdomadaire</strong> chaque lundi matin</Feature>
            <Feature ok highlight><strong>Archives</strong> de tous les bulletins en ligne</Feature>
            <Feature ok highlight><strong>Alertes personnalisées</strong> (tes propres seuils)</Feature>
            <Feature ok>Résiliation en 1 clic, sans engagement</Feature>
            <Feature ok>Tu soutiens un projet d'utilité publique indépendant</Feature>
          </ul>

          <div className="mt-6 space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted mb-1">Ton email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@email.fr"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            {error && <div className="text-sm text-flag-red">{error}</div>}
            <button
              type="button"
              onClick={startCheckout}
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-semibold rounded-xl px-5 py-3 transition-colors"
            >
              {loading ? "Redirection vers Stripe…" : "Démarrer l'essai gratuit 7 jours"}
            </button>
            <div className="text-[11px] text-slate-500 leading-relaxed">
              Paiement sécurisé par <strong>Stripe</strong>. Pas de carte bancaire requise pour
              l'essai — tu peux annuler à tout moment pendant les 7 jours sans être facturé.
              Après l'essai, renouvellement automatique au tarif affiché. Résiliation en 1 clic
              depuis la page « Mon compte ».
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-6 card p-6">
        <h3 className="font-display text-xl font-semibold text-slate-900 mb-4">Questions fréquentes</h3>
        <div className="space-y-4 text-sm">
          <Faq
            q="Puis-je annuler facilement ?"
            a="Oui, à tout moment. Page « Mon compte » → « Gérer mon abonnement » → « Annuler ». L'accès premium reste actif jusqu'à la fin de la période payée."
          />
          <Faq
            q="Que se passe-t-il pendant les 7 jours d'essai ?"
            a="Tu as accès à toutes les fonctionnalités premium (bulletin hebdo, alertes perso, archives). Si tu annules avant la fin des 7 jours, tu n'es pas facturé."
          />
          <Faq
            q="Puis-je changer de mensuel à annuel ou inversement ?"
            a="Oui. Depuis « Mon compte » → « Gérer mon abonnement », tu peux switcher à tout moment. La différence est calculée au prorata."
          />
          <Faq
            q="Mes données de paiement sont-elles en sécurité ?"
            a="Budget France ne stocke AUCUNE donnée de carte bancaire. Tout est géré par Stripe, certifié PCI DSS niveau 1 (le standard le plus strict, utilisé par Apple, Amazon, Uber)."
          />
          <Faq
            q="Puis-je me faire rembourser ?"
            a="Oui, satisfait ou remboursé sous 14 jours pour le mensuel et sous 30 jours pour l'annuel. Envoie-nous un email depuis l'adresse liée à ton compte."
          />
        </div>
      </section>
    </>
  );
}

function Feature({ ok, highlight, children }: { ok?: boolean; highlight?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${ok ? "bg-money/15 text-money" : "bg-slate-100 text-slate-400"}`}>
        {ok ? "✓" : "—"}
      </span>
      <span className={highlight ? "text-slate-900" : "text-slate-700"}>{children}</span>
    </li>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-slate-100 pb-3 last:border-b-0">
      <summary className="cursor-pointer font-medium text-slate-800 hover:text-brand transition list-none flex items-center justify-between">
        <span>{q}</span>
        <span className="text-slate-400 group-open:rotate-45 transition-transform text-lg">+</span>
      </summary>
      <div className="mt-2 text-slate-600 leading-relaxed">{a}</div>
    </details>
  );
}
