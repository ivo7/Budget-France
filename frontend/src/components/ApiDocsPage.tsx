// ============================================================================
// ApiDocsPage — documentation interactive de l'API publique Budget France
// ============================================================================
//
// Embarque Redoc (composant standard pour visualiser des specs OpenAPI 3) via
// son script CDN. Charge la spec depuis /api/openapi.json (servie par le
// backend Fastify).
//
// Public cible : développeurs tiers, chercheurs, journalistes, intégrateurs.
//
// Route : #/api-docs
// ============================================================================

import { useEffect, useRef } from "react";

const REDOC_CDN_URL =
  "https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js";

export function ApiDocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Charge Redoc CDN si pas déjà fait
    if (!document.querySelector(`script[src="${REDOC_CDN_URL}"]`)) {
      const script = document.createElement("script");
      script.src = REDOC_CDN_URL;
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-card">
        <span className="text-xs uppercase tracking-widest text-slate-600 font-semibold">
          Pour les développeurs · chercheurs · journalistes
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-2">
          API publique Budget France
        </h1>
        <p className="text-base text-slate-700 mt-3 max-w-3xl leading-relaxed">
          Tous les indicateurs et données du site sont accessibles via une API{" "}
          <strong>publique</strong>, <strong>en lecture seule</strong>, et{" "}
          <strong>sans authentification</strong>. Documentation interactive
          ci-dessous : tu peux tester chaque endpoint directement depuis cette
          page.
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiBox label="Endpoints" value="7" hint="lecture seule" />
          <KpiBox label="Communes en base" value="34 932" hint="OFGL/DGFiP 2023-2024" />
          <KpiBox label="Rate limit" value="30 / min" hint="par IP" />
          <KpiBox label="Format" value="JSON" hint="UTF-8" />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href="/api/openapi.json"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-700 transition"
          >
            📄 Télécharger la spec OpenAPI JSON
          </a>
          <a
            href="https://budgetfrance.org/api/health"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
          >
            ✓ Tester /api/health
          </a>
          <a
            href="https://budgetfrance.org/api/communes/stats"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-dark transition"
          >
            ✓ Tester /api/communes/stats
          </a>
        </div>
      </header>

      {/* Exemples curl */}
      <section className="card p-5 md:p-6 bg-slate-900 text-slate-100">
        <h2 className="font-display text-lg font-semibold text-white mb-3">
          Exemples curl
        </h2>
        <div className="space-y-3 text-xs font-mono">
          <ExampleCurl
            label="Recherche par nom"
            cmd="curl 'https://budgetfrance.org/api/communes/search?q=marseille&limit=5'"
          />
          <ExampleCurl
            label="Fiche complète d'une commune"
            cmd="curl 'https://budgetfrance.org/api/communes/lyon'"
          />
          <ExampleCurl
            label="Top 100 communes les plus endettées par habitant"
            cmd="curl 'https://budgetfrance.org/api/communes/rankings?indicator=dette-hab&limit=100&dir=desc'"
          />
          <ExampleCurl
            label="Voisines (département + même strate)"
            cmd="curl 'https://budgetfrance.org/api/communes/troyes/voisines?limit=10'"
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
          💡 Pour traiter la réponse en JSON :{" "}
          <code className="bg-slate-800 px-1 py-0.5 rounded">| python3 -m json.tool</code>{" "}
          ou{" "}
          <code className="bg-slate-800 px-1 py-0.5 rounded">| jq .</code>.
        </p>
      </section>

      {/* Redoc embed */}
      <section className="card p-0 md:p-0 overflow-hidden">
        <div className="px-5 md:px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Documentation interactive complète
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tous les endpoints, schémas, et exemples. Generated by{" "}
            <a
              href="https://github.com/Redocly/redoc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Redoc
            </a>
            .
          </p>
        </div>
        <div
          ref={containerRef}
          // dangerouslySetInnerHTML est OK ici : c'est un web component standard
          // chargé via CDN, sans contenu utilisateur. Le HTML est statique.
          dangerouslySetInnerHTML={{
            __html: `<redoc spec-url="/api/openapi.json" hide-loading></redoc>`,
          }}
        />
      </section>

      {/* Notes pour les chercheurs */}
      <section className="card p-5 md:p-6 bg-emerald-50/40 border-emerald-200/60">
        <h2 className="font-display text-lg font-semibold text-slate-900 mb-2">
          🎓 Notes pour les chercheurs et journalistes
        </h2>
        <ul className="text-sm text-slate-700 space-y-2 leading-relaxed">
          <li>
            <strong>Pour un usage massif</strong> (téléchargement &gt; 10 000
            communes, scraping de tous les indicateurs, intégration dans une
            base de données tierce) : contacte-nous à{" "}
            <a
              href="mailto:contact@budgetfrance.org"
              className="text-brand hover:underline font-medium"
            >
              contact@budgetfrance.org
            </a>{" "}
            avec un descriptif de ton projet. On peut te fournir un export bulk
            ou élever le rate-limit.
          </li>
          <li>
            <strong>Citation académique</strong> recommandée :
            <br />
            <code className="text-xs bg-white border border-slate-200 px-2 py-1 rounded inline-block mt-1">
              Budget France (2026), API publique communes. https://budgetfrance.org/api/openapi.json
            </code>
          </li>
          <li>
            <strong>Licence des données</strong> : Licence Ouverte 2.0 Etalab.
            Réutilisation libre y compris commerciale, à condition de citer la
            source (« Budget France, d'après OFGL/DGFiP/INSEE/Eurostat »).
          </li>
          <li>
            <strong>Mises à jour</strong> : annuelle pour les comptes communaux
            (publication OFGL automne N+1), mensuelle pour les indicateurs
            Bercy, quotidienne pour les taux d'intérêt.
          </li>
          <li>
            <strong>Signaler une erreur</strong> : si tu identifies un chiffre
            douteux ou une commune manquante, écris à{" "}
            <a
              href="mailto:contact@budgetfrance.org"
              className="text-brand hover:underline font-medium"
            >
              contact@budgetfrance.org
            </a>
            . On corrige rapidement.
          </li>
        </ul>
      </section>
    </div>
  );
}

// ============================================================================
// Sous-composants
// ============================================================================

function KpiBox({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-white/80 border border-slate-200 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
        {label}
      </div>
      <div className="font-display text-xl md:text-2xl font-bold tabular-nums text-slate-900 mt-0.5">
        {value}
      </div>
      {hint && <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>}
    </div>
  );
}

function ExampleCurl({ label, cmd }: { label: string; cmd: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-0.5">
        {label}
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 overflow-x-auto">
        <code className="text-emerald-300">{cmd}</code>
      </div>
    </div>
  );
}
