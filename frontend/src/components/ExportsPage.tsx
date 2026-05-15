// ============================================================================
// ExportsPage — téléchargement bulk des données communes (CSV/JSON/Excel)
// ============================================================================
//
// Page d'accès aux exports massifs : permet aux chercheurs, journalistes,
// data-scientists, devs de récupérer en 1 clic l'ensemble des données
// communales pour analyse hors ligne (R, Python pandas, Excel, etc.).
//
// Backend : GET /api/exports/communes.{csv,json,xlsx}
//
// Route : #/exports
// ============================================================================

import { useEffect, useState } from "react";

interface ExportStats {
  totalCommunes: number;
  totalRows: number;
  derniereAnnee: number | null;
  rateLimit: string;
  formats: string[];
  tailleEstimee: Record<string, string>;
  licence: string;
}

export function ExportsPage() {
  const [stats, setStats] = useState<ExportStats | null>(null);
  const [year, setYear] = useState<string>("");
  const [dep, setDep] = useState<string>("");

  useEffect(() => {
    fetch("/api/exports/stats")
      .then((r) => r.json())
      .then((d: ExportStats) => setStats(d))
      .catch(() => setStats(null));
  }, []);

  function buildUrl(format: "csv" | "json" | "xlsx"): string {
    const params = new URLSearchParams();
    if (year.trim()) params.set("year", year.trim());
    if (dep.trim()) params.set("dep", dep.trim());
    const qs = params.toString();
    return `/api/exports/communes.${format}${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-card">
        <span className="text-xs uppercase tracking-widest text-slate-600 font-semibold">
          Pour les chercheurs · data-scientists · journalistes
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-2">
          Exports bulk des données communes
        </h1>
        <p className="text-base text-slate-700 mt-3 max-w-3xl leading-relaxed">
          Télécharge en un clic l'ensemble des données budgétaires des{" "}
          <strong>{stats?.totalCommunes.toLocaleString("fr-FR") ?? "35 000"} communes</strong>{" "}
          françaises pour analyse hors ligne (R, Python pandas, Excel, etc.).
          Données issues d'OFGL/DGFiP, mises à jour annuelle. Sous licence{" "}
          <strong>Licence Ouverte 2.0 Etalab</strong> — réutilisation libre y
          compris commerciale, à condition de citer la source.
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiBox
            label="Communes en base"
            value={stats?.totalCommunes.toLocaleString("fr-FR") ?? "—"}
            hint="OFGL/DGFiP"
          />
          <KpiBox
            label="Lignes totales"
            value={stats?.totalRows.toLocaleString("fr-FR") ?? "—"}
            hint="commune × année"
          />
          <KpiBox
            label="Dernière année"
            value={stats?.derniereAnnee ? String(stats.derniereAnnee) : "—"}
            hint="exercice clôturé"
          />
          <KpiBox
            label="Rate-limit"
            value={stats?.rateLimit ?? "5 / heure"}
            hint="par IP"
          />
        </div>
      </header>

      {/* Filtres */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-lg font-semibold text-slate-900 mb-3">
          Filtres (optionnels)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">
              Année (laisser vide pour la plus récente)
            </label>
            <input
              type="number"
              min={2017}
              max={2030}
              placeholder="ex. 2024"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <div className="text-[11px] text-slate-500 mt-1">
              Disponible : 2017 → {stats?.derniereAnnee ?? "—"}
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">
              Département (code INSEE, optionnel)
            </label>
            <input
              type="text"
              placeholder="ex. 69, 75, 13, 2A…"
              value={dep}
              onChange={(e) => setDep(e.target.value)}
              maxLength={3}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <div className="text-[11px] text-slate-500 mt-1">
              Vide = toutes les 35 000 communes
            </div>
          </div>
        </div>
      </section>

      {/* Formats de téléchargement */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormatCard
          format="csv"
          emoji="📄"
          title="CSV"
          description="Standard universel. S'ouvre dans Excel, Numbers, LibreOffice, R, Python (pandas.read_csv), tableurs en ligne. Encodage UTF-8 avec BOM, séparateur virgule, format RFC 4180."
          taille={stats?.tailleEstimee.csv ?? "~7 Mo"}
          url={buildUrl("csv")}
          recommendedFor="La majorité des cas. Le format à choisir si tu hésites."
          color="emerald"
        />
        <FormatCard
          format="json"
          emoji="🧬"
          title="JSON"
          description="Format structuré idéal pour développeurs et data-scientists. Inclut métadonnées (date génération, licence, source). Lit avec pandas.read_json, jq, ou tout langage moderne."
          taille={stats?.tailleEstimee.json ?? "~15 Mo"}
          url={buildUrl("json")}
          recommendedFor="Intégration dans une app, traitement programmatique, archivage."
          color="brand"
        />
        <FormatCard
          format="xlsx"
          emoji="📊"
          title="Excel"
          description="Fichier .xlsx avec en-tête formaté, filtres auto, freeze de la 1ère ligne. Ouvre directement dans Excel, Numbers, LibreOffice Calc, Google Sheets."
          taille={stats?.tailleEstimee.xlsx ?? "~10 Mo"}
          url={buildUrl("xlsx")}
          recommendedFor="Analyse rapide visuelle sans coder, exploration par tri/filtre."
          color="amber"
        />
      </section>

      {/* Format Parquet (à venir) */}
      <section className="card p-5 md:p-6 bg-slate-50/50 border-dashed">
        <h2 className="font-display text-lg font-semibold text-slate-700 mb-2">
          Parquet · sur demande
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Le format <strong>Apache Parquet</strong> (binaire columnar, idéal
          pour Spark, DuckDB, Polars) est disponible sur demande. C'est un
          format plus niche, donc on ne l'expose pas par défaut. Si tu en as
          besoin, écris à{" "}
          <a
            href="mailto:contact@budgetfrance.org"
            className="text-brand hover:underline font-medium"
          >
            contact@budgetfrance.org
          </a>{" "}
          en précisant ton usage (recherche, journalisme data, analytique pro).
        </p>
      </section>

      {/* Comment utiliser */}
      <section className="card p-5 md:p-6 bg-slate-900 text-slate-100">
        <h2 className="font-display text-lg font-semibold text-white mb-3">
          Exemples d'usage
        </h2>
        <div className="space-y-3 text-xs">
          <Example
            label="Python — pandas (recommandé pour data-scientists)"
            cmd={`import pandas as pd
df = pd.read_csv("https://budgetfrance.org/api/exports/communes.csv")
df[df.population > 100_000].sort_values("detteEncoursEur", ascending=False).head(20)`}
          />
          <Example
            label="R — analyse classique"
            cmd={`df <- read.csv("https://budgetfrance.org/api/exports/communes.csv")
summary(df[, c("detteEncoursEur", "capaciteAutofinancementEur")])`}
          />
          <Example
            label="curl + jq — exploration ligne de commande"
            cmd={`curl -s 'https://budgetfrance.org/api/exports/communes.json' | jq '.data | sort_by(-.detteEncoursEur) | .[0:10]'`}
          />
          <Example
            label="Téléchargement direct (Excel)"
            cmd={`wget 'https://budgetfrance.org/api/exports/communes.xlsx?year=2024' -O communes-2024.xlsx`}
          />
        </div>
      </section>

      {/* Notes & licence */}
      <section className="card p-5 md:p-6 bg-emerald-50/40 border-emerald-200/60">
        <h2 className="font-display text-lg font-semibold text-slate-900 mb-2">
          🎓 Notes importantes
        </h2>
        <ul className="text-sm text-slate-700 space-y-2 leading-relaxed">
          <li>
            <strong>Licence</strong> : Licence Ouverte 2.0 Etalab. Réutilisation
            libre y compris commerciale, à condition de citer la source :{" "}
            <em>« Budget France, d'après OFGL/DGFiP »</em>.
          </li>
          <li>
            <strong>Citation académique</strong> recommandée :
            <br />
            <code className="text-xs bg-white border border-slate-200 px-2 py-1 rounded inline-block mt-1">
              Budget France (2026), Données budgétaires communales. https://budgetfrance.org/exports
            </code>
          </li>
          <li>
            <strong>Rate-limit</strong> : 5 téléchargements/heure/IP. Pour usage
            massif (téléchargements répétés, intégration prod), écris à{" "}
            <a
              href="mailto:contact@budgetfrance.org"
              className="text-brand hover:underline font-medium"
            >
              contact@budgetfrance.org
            </a>{" "}
            pour une clé API.
          </li>
          <li>
            <strong>Documentation OpenAPI complète</strong> :{" "}
            <a href="#/api-docs" className="text-brand hover:underline font-medium">
              /api-docs
            </a>{" "}
            (tous les endpoints, schémas, exemples).
          </li>
          <li>
            <strong>Signaler un problème</strong> : si tu identifies un chiffre
            douteux, une commune manquante, ou une incohérence,{" "}
            <a
              href="mailto:contact@budgetfrance.org"
              className="text-brand hover:underline font-medium"
            >
              écris-nous
            </a>
            .
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

function FormatCard({
  format,
  emoji,
  title,
  description,
  taille,
  url,
  recommendedFor,
  color,
}: {
  format: string;
  emoji: string;
  title: string;
  description: string;
  taille: string;
  url: string;
  recommendedFor: string;
  color: "emerald" | "brand" | "amber";
}) {
  const colorClasses = {
    emerald: "bg-emerald-600 hover:bg-emerald-700",
    brand: "bg-brand hover:bg-brand-dark",
    amber: "bg-amber-600 hover:bg-amber-700",
  };

  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl">{emoji}</span>
        <h3 className="font-display text-xl font-bold text-slate-900">{title}</h3>
        <span className="text-[10px] uppercase tracking-wider text-slate-500 ml-auto">
          .{format}
        </span>
      </div>
      <p className="text-xs text-slate-700 leading-relaxed flex-1">{description}</p>
      <div className="mt-3 space-y-2">
        <div className="flex items-baseline justify-between text-[11px]">
          <span className="text-slate-500">Taille estimée</span>
          <strong className="text-slate-900">{taille}</strong>
        </div>
        <div className="text-[11px] text-slate-600 italic">
          ✓ {recommendedFor}
        </div>
        <a
          href={url}
          download
          className={`block text-center text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors ${colorClasses[color]}`}
        >
          ⬇ Télécharger
        </a>
      </div>
    </div>
  );
}

function Example({ label, cmd }: { label: string; cmd: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">
        {label}
      </div>
      <pre className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 overflow-x-auto text-emerald-300 whitespace-pre-wrap">
        <code>{cmd}</code>
      </pre>
    </div>
  );
}
