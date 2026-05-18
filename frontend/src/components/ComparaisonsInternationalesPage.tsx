// ============================================================================
// ComparaisonsInternationalesPage — France vs OCDE/UE sur 15 indicateurs
// ============================================================================
//
// Route : #/comparaisons-internationales
// ============================================================================

import { useMemo, useState } from "react";
import {
  CATEGORIES_INFO,
  INDICATEURS,
  MYTHES_COMPARAISONS,
  PAYS,
  TOTAL_INDICATEURS,
  TOTAL_PAYS,
  type CategorieIndicateur,
  type Indicateur,
} from "../data/comparaisonsInternationales";
import { ARetenir, Methodologie } from "./PageBlocks";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

type FiltreCategorie = "tous" | CategorieIndicateur;

export function ComparaisonsInternationalesPage() {
  const [filtre, setFiltre] = useState<FiltreCategorie>("tous");

  const filtered = useMemo(() => {
    if (filtre === "tous") return INDICATEURS;
    return INDICATEURS.filter((i) => i.categorie === filtre);
  }, [filtre]);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-cyan-50 to-white border border-cyan-200/60 shadow-card">
        <span className="text-xs uppercase tracking-widest text-cyan-700 font-semibold">
          OCDE / Eurostat / FMI · 15 indicateurs sur 11 pays
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-2">
          La France comparée aux autres économies
        </h1>
        <p className="text-base text-slate-700 mt-3 max-w-3xl leading-relaxed">
          Comment se situe la France sur les <strong>{TOTAL_INDICATEURS} grands
          indicateurs</strong> de finances publiques et de société, comparée à{" "}
          <strong>{TOTAL_PAYS - 1} pays</strong> représentatifs : voisins
          européens (Allemagne, Italie, Espagne, UK), modèles nordiques (Suède,
          Danemark), pays « compétitifs » (Pays-Bas, Irlande, Suisse), et grands
          comparateurs hors UE (USA, Japon).
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiBox label="Dette publique" value="115 % PIB" hint="3ᵉ pire UE" color="text-red-700" />
          <KpiBox label="Prélèvements obligatoires" value="45,5 % PIB" hint="2ᵉ OCDE" color="text-cyan-700" />
          <KpiBox label="Dépenses publiques" value="57 % PIB" hint="1ᵉʳ OCDE" color="text-cyan-700" />
          <KpiBox label="Inégalités (Gini)" value="29" hint="parmi les plus bas" color="text-emerald-700" />
        </div>
      </header>

      {/* Pédagogie */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-3">
          Pourquoi les comparaisons internationales sont compliquées
        </h2>
        <div className="text-sm text-slate-700 space-y-3 leading-relaxed">
          <p>
            Comparer des pays n'est jamais trivial. <strong>3 pièges principaux</strong> :
          </p>
          <ul className="space-y-2 ml-3">
            <li>
              • <strong>Définitions différentes</strong>. Le « déficit public »
              en France inclut Sécu + collectivités, aux USA c'est seulement le
              fédéral. Eurostat normalise les comparaisons UE via le SEC 2010.
              Hors UE, les données OCDE et FMI font de leur mieux mais restent
              imparfaites.
            </li>
            <li>
              • <strong>Effets de structure</strong>. L'Irlande affiche
              23,7 % de dépenses publiques/PIB — mais son PIB est gonflé par les
              holdings GAFAM domiciliées à Dublin. Le « vrai » niveau irlandais
              est plus proche de 35-40 %.
            </li>
            <li>
              • <strong>Modèles institutionnels différents</strong>. Le
              Danemark a 0,1 % de cotisations sociales mais 47 % de
              prélèvements totaux — la Sécu y est financée par l'impôt sur le
              revenu (modèle beveridgien), pas par cotisations (modèle
              bismarckien français). Comparer juste un poste isolé est trompeur.
            </li>
          </ul>
          <p>
            <strong>Les chiffres ci-dessous</strong> proviennent des bases
            harmonisées OCDE, Eurostat et FMI 2023-2024. Ils sont fiables pour
            les ordres de grandeur, à interpréter avec les caveats ci-dessus.
          </p>
        </div>
      </section>

      {/* Filtres catégorie */}
      <section className="card p-5 md:p-6">
        <div className="flex flex-wrap items-baseline gap-3 mb-3">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Filtrer par catégorie
          </h2>
          <span className="text-xs text-slate-500">
            {filtered.length} indicateur(s) affiché(s)
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterButton
            active={filtre === "tous"}
            onClick={() => setFiltre("tous")}
            label="Tous"
            color="#475569"
          />
          {(Object.keys(CATEGORIES_INFO) as CategorieIndicateur[]).map((c) => (
            <FilterButton
              key={c}
              active={filtre === c}
              onClick={() => setFiltre(c)}
              label={`${CATEGORIES_INFO[c].emoji} ${CATEGORIES_INFO[c].label}`}
              color={CATEGORIES_INFO[c].color}
            />
          ))}
        </div>
      </section>

      {/* Tableau principal heatmap */}
      <DownloadableCard
        filename="comparaisons-internationales"
        shareTitle="Budget France — Comparaisons internationales"
        className="card p-5 md:p-6"
        getCsvData={() =>
          objectsToCsv(
            filtered.flatMap((ind) =>
              PAYS.map((p) => ({
                indicateur: ind.label,
                categorie: CATEGORIES_INFO[ind.categorie].label,
                pays: p.nom,
                valeur: ind.valeurs[p.code] ?? null,
                unite: ind.unite,
              })),
            ),
          )
        }
      >
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Tableau comparatif (heatmap)
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Code couleur : vert = bonne performance, rouge = à améliorer (selon le
          sens favorable de chaque indicateur). Gris = sens neutre (pas de
          jugement). La France est en colonne mise en valeur.
        </p>

        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                <th className="text-left py-2 pr-2 font-semibold sticky left-0 bg-white z-10 min-w-[200px]">
                  Indicateur
                </th>
                {PAYS.map((p) => (
                  <th
                    key={p.code}
                    className={`text-center py-2 px-2 font-semibold ${
                      p.code === "fr" ? "bg-brand-soft/40 text-brand" : ""
                    }`}
                  >
                    <div className="text-base">{p.drapeau}</div>
                    <div className="text-[10px]">{p.nom}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ind) => (
                <tr key={ind.id} className="border-t border-slate-100">
                  <td className="py-2 pr-2 text-left sticky left-0 bg-white z-10">
                    <div className="flex items-baseline gap-1.5">
                      <span>{ind.emoji}</span>
                      <strong className="text-slate-900">{ind.label}</strong>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{ind.unite}</div>
                  </td>
                  {PAYS.map((p) => {
                    const v = ind.valeurs[p.code];
                    const bgColor = computeHeatmapColor(v, ind);
                    return (
                      <td
                        key={p.code}
                        className={`text-center py-2 px-2 tabular-nums ${
                          p.code === "fr" ? "font-bold border-2 border-brand/30" : ""
                        }`}
                        style={{ background: bgColor }}
                      >
                        {v === 0 && (ind.id === "tva-normal" || ind.id === "smic-relatif" || ind.id === "cotisations-sociales-pib") ? (
                          <span className="text-slate-400 italic text-[10px]">n/a</span>
                        ) : v != null ? (
                          formatValue(v, ind.unite)
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DownloadableCard>

      {/* Détail descriptif */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-3">
          Contexte de chaque indicateur
        </h2>
        <ul className="space-y-3">
          {filtered.map((ind) => {
            const cat = CATEGORIES_INFO[ind.categorie];
            const vFr = ind.valeurs.fr;
            return (
              <li
                key={ind.id}
                className="border border-slate-200 rounded-lg p-4 hover:border-cyan-300 transition"
              >
                <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                  <strong className="text-slate-900 flex items-baseline gap-2">
                    <span>{ind.emoji}</span> {ind.label}
                  </strong>
                  <span
                    className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${cat.color}15`,
                      color: cat.color,
                      border: `1px solid ${cat.color}40`,
                    }}
                  >
                    {cat.emoji} {cat.label}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{ind.description}</p>
                <div className="mt-2 flex items-baseline gap-3 text-xs">
                  <strong className="text-brand">🇫🇷 France :</strong>
                  <span className="font-display text-base font-bold tabular-nums text-slate-900">
                    {formatValue(vFr, ind.unite)} {ind.unite}
                  </span>
                  <span className="text-slate-400 text-[10px] ml-auto">
                    Source : {ind.source}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Mythes */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          5 idées reçues sur les comparaisons internationales
        </h2>
        <ul className="space-y-3 mt-4">
          {MYTHES_COMPARAISONS.map((m, i) => (
            <li
              key={i}
              className="border border-slate-200 rounded-lg p-4 hover:border-cyan-300 transition"
            >
              <div className="text-sm font-display font-semibold text-slate-900 mb-1">
                {m.mythe}
              </div>
              <div className="text-xs text-slate-700 leading-relaxed">{m.realite}</div>
            </li>
          ))}
        </ul>
      </section>

      {/* À retenir */}
      <ARetenir
        items={[
          <>
            La France est <strong>au sommet des dépenses publiques OCDE</strong>{" "}
            (57 % PIB, n°1) et au 3ᵉ rang des prélèvements obligatoires (45,5 %).
            Modèle de forte intervention publique, similaire à la Suède et au
            Danemark.
          </>,
          <>
            <strong>Inégalités parmi les plus basses OCDE</strong> grâce à une
            redistribution massive (Gini 29, équivalent Allemagne et Pays-Bas).
            Loin du système US (Gini 39).
          </>,
          <>
            <strong>Dette publique haute (115 % PIB)</strong> mais inférieure à
            Italie (137 %) et Japon (252 %). USA en passe de nous dépasser
            (122 %). Allemagne reste exemplaire (64 %).
          </>,
          <>
            <strong>Espérance de vie 82,5 ans</strong>, dans le peloton de tête
            OCDE. Le système de santé fonctionne malgré ses 12,1 % du PIB
            (vs 16,6 % aux USA pour 76 ans seulement).
          </>,
          <>
            <strong>Taux d'emploi 68 % en retard</strong> sur Allemagne (77 %)
            et Pays-Bas (81 %). C'est le talon d'Achille français : faible
            participation des seniors, jeunes en études prolongées, temps
            partiel féminin moins développé.
          </>,
        ]}
      />

      {/* Méthodologie */}
      <Methodologie
        sources={[
          <>
            <a
              href="https://www.oecd.org/fr/stats/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              OCDE Statistics
            </a>{" "}
            — Government at a Glance, Revenue Statistics, Health, Education,
            Labour Force
          </>,
          <>
            <a
              href="https://ec.europa.eu/eurostat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Eurostat
            </a>{" "}
            — Government Finance Statistics, Taxation Trends 2024
          </>,
          <>
            <a
              href="https://www.imf.org/en/Publications/WEO"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              FMI
            </a>{" "}
            — World Economic Outlook database (oct. 2024), Fiscal Monitor
          </>,
          <>
            <a
              href="https://data.worldbank.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Banque mondiale
            </a>{" "}
            — World Development Indicators
          </>,
          <>
            SIPRI (Stockholm International Peace Research Institute) — dépenses
            militaires
          </>,
        ]}
        methode={
          <>
            Données 2023-2024 selon disponibilité (les comptes nationaux ont
            ~1 an de décalage). Le code couleur de la heatmap est calculé sur
            la base du sens favorable de chaque indicateur : vert si la valeur
            est dans le top 33 % des pays comparés, rouge si dans le bottom
            33 %, jaune entre les deux. Pour les indicateurs neutres (TVA,
            cotisations, IS), pas de jugement de valeur — juste position
            relative.
          </>
        }
        limites={
          <>
            11 pays seulement ont été retenus pour la lisibilité (sur 38 pays
            OCDE). Les méthodologies nationales diffèrent malgré les efforts
            d'harmonisation OCDE/Eurostat — les chiffres restent comparables
            mais pas strictement identiques. Le PIB irlandais est artificiellement
            gonflé par les holdings multinationales (effet bien documenté). Les
            chiffres COVID 2020-2021 ne sont pas affichés (anomaliques).
          </>
        }
        miseAJour="Données 2023-2024 (publications OCDE/Eurostat/FMI octobre 2024)."
      />
    </div>
  );
}

// ============================================================================
// Calcul du code couleur heatmap
// ============================================================================

function computeHeatmapColor(v: number | undefined, ind: Indicateur): string {
  if (v == null || (v === 0 && ind.sensFavorable !== "neutre")) return "transparent";

  // On rank les valeurs des 11 pays sur cet indicateur
  const values = Object.values(ind.valeurs).filter(
    (x) => x != null && !(x === 0 && (ind.id === "tva-normal" || ind.id === "smic-relatif" || ind.id === "cotisations-sociales-pib")),
  );
  if (values.length < 2) return "transparent";

  values.sort((a, b) => a - b);
  const min = values[0]!;
  const max = values[values.length - 1]!;
  if (max === min) return "transparent";

  // Position relative entre 0 (min) et 1 (max)
  const rel = (v - min) / (max - min);

  // Pour sens "haut" = haut = vert ; sens "bas" = bas = vert ; "neutre" = pas de couleur fortement marquée
  let scoreGreen: number; // 0 (rouge) → 1 (vert)
  if (ind.sensFavorable === "haut") scoreGreen = rel;
  else if (ind.sensFavorable === "bas") scoreGreen = 1 - rel;
  else return `rgba(100, 116, 139, ${0.05 + rel * 0.1})`; // gris léger pour neutre

  // Échelle rouge → jaune → vert
  if (scoreGreen >= 0.66) return "rgba(22, 163, 74, 0.18)"; // vert
  if (scoreGreen >= 0.33) return "rgba(217, 119, 6, 0.15)"; // jaune
  return "rgba(220, 38, 38, 0.15)"; // rouge
}

function formatValue(v: number, unite: string): string {
  if (v === 0) return "0";
  if (Math.abs(v) >= 100) return v.toFixed(0);
  if (Math.abs(v) >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

// ============================================================================
// Sous-composants
// ============================================================================

function KpiBox({
  label,
  value,
  hint,
  color = "text-cyan-700",
}: {
  label: string;
  value: string;
  hint?: string;
  color?: string;
}) {
  return (
    <div className="bg-white/80 border border-cyan-200/40 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-widest text-cyan-700 font-semibold">
        {label}
      </div>
      <div
        className={`font-display text-xl md:text-2xl font-bold tabular-nums mt-0.5 ${color}`}
      >
        {value}
      </div>
      {hint && <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
        active
          ? "text-white border-transparent shadow-sm"
          : "bg-white text-slate-700 border-slate-200 hover:border-brand/40"
      }`}
      style={active ? { background: color } : {}}
    >
      {label}
    </button>
  );
}
