// ============================================================================
// FraudesEuropeChart — comparaison France vs principales puissances européennes
// ============================================================================
//
// Sources et méthode :
//   - Fraude fiscale (TVA gap principalement) : Commission européenne, Tax Gap
//     Report 2023 (données 2021), complété par estimations OFCE et Tax Justice
//     Network pour les pays.
//   - Fraude sociale : estimations nationales agrégées (Cour des comptes FR,
//     HMRC UK, Bundesrechnungshof DE, Corte dei Conti IT, AEAT ES). Méthodes
//     hétérogènes — à interpréter en ordre de grandeur.
//   - Tous les chiffres sont en Md€ courants 2021-2023. La fraude fiscale
//     évolue lentement, donc l'ordre de grandeur reste pertinent en 2026.
//
// Présentation :
//   - Tableau comparatif (montants Md€ + % du PIB)
//   - Bar chart en deux séries (fraude fiscale + fraude sociale empilées)
//   - Toggle Md€ / % du PIB pour comparaison équitable
// ============================================================================

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

interface CountryRow {
  pays: string;
  paysCode: string;
  flag: string;
  pibMd: number;
  fraudeFiscaleMd: number;          // ESTIMÉE (gap fiscal)
  fraudeSocialeMd: number;          // ESTIMÉE
  sources: string;
  // Fraude DÉTECTÉE — montants officiels publiés par l'administration.
  // Optionnel : laissé undefined quand pas de bilan annuel public unifié
  // disponible (mieux que d'inventer un chiffre).
  fraudeDetecteeMd?: number;
  fraudeDetecteeAnnee?: number;
  fraudeDetecteeSource?: string;
  fraudeDetecteeNote?: string;       // précision méthodologique si scope ≠ FR
}

// Ordres de grandeur 2021-2023 (en Md€), agrégés depuis les rapports officiels.
// La fourchette est large par construction : la fraude fiscale est par nature
// difficile à mesurer. On retient ici les estimations « centrales ».
const COUNTRIES: CountryRow[] = [
  {
    pays: "France",
    paysCode: "FR",
    flag: "🇫🇷",
    pibMd: 2640,
    fraudeFiscaleMd: 90, // Cour des comptes 2023 : fourchette 80-100 Md€
    fraudeSocialeMd: 8, // CNAM/CNAF/MSA 2024 : estimation ~7-10 Md€
    sources: "Cour des comptes 2023 ; HCFP 2024",
    fraudeDetecteeMd: 20.1,
    fraudeDetecteeAnnee: 2024,
    fraudeDetecteeSource: "DGFiP + URSSAF/CNAF/CNAM",
    fraudeDetecteeNote: "17,1 Md€ fiscale (droits + pénalités notifiés) + 3 Md€ sociale",
  },
  {
    pays: "Allemagne",
    paysCode: "DE",
    flag: "🇩🇪",
    pibMd: 4120,
    fraudeFiscaleMd: 125, // Bundesrechnungshof estimation TVA gap + impôt sociétés
    fraudeSocialeMd: 11, // Sozialgesetzbuch — estimation Bundesagentur Arbeit
    sources: "Bundesrechnungshof 2023 ; EU Tax Gap Report",
    fraudeDetecteeMd: 5,
    fraudeDetecteeAnnee: 2023,
    fraudeDetecteeSource: "BMF + Bundesrechnungshof",
    fraudeDetecteeNote:
      "Agrégat approximatif (compétences réparties Bund + 16 Länder ; pas de bilan unifié)",
  },
  {
    pays: "Italie",
    paysCode: "IT",
    flag: "🇮🇹",
    pibMd: 2080,
    fraudeFiscaleMd: 190, // ISTAT/MEF — la plus haute d'Europe en valeur absolue
    fraudeSocialeMd: 15,
    sources: "ISTAT/MEF Rapporto Evasione 2023",
    fraudeDetecteeMd: 24.7,
    fraudeDetecteeAnnee: 2023,
    fraudeDetecteeSource: "Agenzia delle Entrate-Riscossione",
    fraudeDetecteeNote: "Incassi da contrasto all'evasione (sommes effectivement recouvrées)",
  },
  {
    pays: "Espagne",
    paysCode: "ES",
    flag: "🇪🇸",
    pibMd: 1490,
    fraudeFiscaleMd: 70, // AEAT — estimation dans la fourchette officielle
    fraudeSocialeMd: 5,
    sources: "AEAT/Sindicato GESTHA 2023",
    fraudeDetecteeMd: 16.5,
    fraudeDetecteeAnnee: 2023,
    fraudeDetecteeSource: "AEAT (Agencia Tributaria) — Memoria anual",
    fraudeDetecteeNote: "Resultados de actuaciones de control",
  },
  {
    pays: "Royaume-Uni",
    paysCode: "UK",
    flag: "🇬🇧",
    pibMd: 3070, // PIB en € (taux GBP/EUR ~1,17)
    fraudeFiscaleMd: 42, // HMRC Tax Gap Report 2023 : £35 Bn ~= 42 Md€
    fraudeSocialeMd: 7, // DWP Fraud and Error stats 2023
    sources: "HMRC 2023 ; DWP Fraud Stats",
    fraudeDetecteeMd: 41.8,
    fraudeDetecteeAnnee: 2023,
    fraudeDetecteeSource: "HMRC — Annual Report 2022-23 (compliance yield)",
    fraudeDetecteeNote:
      "⚠ « Compliance yield » : scope plus large (inclut conformité volontaire et prévention) — pas strictement comparable à FR/IT/ES",
  },
  {
    pays: "Pologne",
    paysCode: "PL",
    flag: "🇵🇱",
    pibMd: 715,
    fraudeFiscaleMd: 22,
    fraudeSocialeMd: 2,
    sources: "EU Tax Gap Report 2023",
    // Pas de bilan annuel public unifié comparable disponible
  },
  {
    pays: "Pays-Bas",
    paysCode: "NL",
    flag: "🇳🇱",
    pibMd: 990,
    fraudeFiscaleMd: 12, // l'un des plus bas en % du PIB d'Europe
    fraudeSocialeMd: 1.5,
    sources: "Algemene Rekenkamer 2023 ; EU Tax Gap",
    // Belastingdienst publie des chiffres partiels mais pas un agrégat
    // équivalent « droits notifiés » comparable.
  },
];

type Mode = "absolute" | "ratio";

export function FraudesEuropeChart() {
  const [mode, setMode] = useState<Mode>("ratio");

  const rows = COUNTRIES.map((c) => {
    const total = c.fraudeFiscaleMd + c.fraudeSocialeMd;
    return {
      ...c,
      total,
      ratioFiscale: (c.fraudeFiscaleMd / c.pibMd) * 100,
      ratioSociale: (c.fraudeSocialeMd / c.pibMd) * 100,
      ratioTotal: (total / c.pibMd) * 100,
    };
  }).sort((a, b) =>
    mode === "absolute" ? b.total - a.total : b.ratioTotal - a.ratioTotal,
  );

  const chartData =
    mode === "absolute"
      ? rows.map((r) => ({
          pays: `${r.flag} ${r.paysCode}`,
          "Fraude fiscale": r.fraudeFiscaleMd,
          "Fraude sociale": r.fraudeSocialeMd,
        }))
      : rows.map((r) => ({
          pays: `${r.flag} ${r.paysCode}`,
          "Fraude fiscale": Number(r.ratioFiscale.toFixed(2)),
          "Fraude sociale": Number(r.ratioSociale.toFixed(2)),
        }));

  return (
    <DownloadableCard
      filename="budget-france-fraudes-europe"
      shareTitle="Budget France — fraudes en Europe"
      className="card p-5 md:p-6"
      getCsvData={() =>
        objectsToCsv(
          rows.map((r) => ({
            pays: r.pays,
            code: r.paysCode,
            pib_milliards: r.pibMd,
            fraude_fiscale_milliards: r.fraudeFiscaleMd,
            fraude_sociale_milliards: r.fraudeSocialeMd,
            total_milliards: r.total,
            ratio_fiscale_pourcent_pib: r.ratioFiscale.toFixed(2),
            ratio_sociale_pourcent_pib: r.ratioSociale.toFixed(2),
            ratio_total_pourcent_pib: r.ratioTotal.toFixed(2),
            sources: r.sources,
          })),
        )
      }
    >
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-muted">
              Comparaison européenne
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-warn border border-amber-200 uppercase tracking-wider">
              fraude estimée
            </span>
          </div>
          <div className="font-display text-xl font-semibold text-slate-900 mt-1">
            La France face aux principales puissances européennes
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            <strong>Fraude estimée</strong> (gap fiscal théorique), pas fraude
            détectée. Estimations consolidées 2021-2023 — les ordres de grandeur
            évoluent lentement. Pour comparer équitablement, on rapporte la fraude
            au PIB de chaque pays. La fraude détectée (montants effectivement
            redressés par chaque administration) n'est pas comparable d'un pays
            à l'autre car les méthodologies diffèrent.
          </p>
        </div>
        <div className="inline-flex rounded-full bg-slate-100 p-1 border border-slate-200 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setMode("ratio")}
            className={`px-3 py-1 rounded-full font-medium transition ${
              mode === "ratio" ? "bg-brand text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            % du PIB
          </button>
          <button
            type="button"
            onClick={() => setMode("absolute")}
            className={`px-3 py-1 rounded-full font-medium transition ${
              mode === "absolute" ? "bg-brand text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Md€
          </button>
        </div>
      </div>

      {/* Graphique en barres empilées */}
      <div className="mt-5 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="pays"
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (mode === "ratio" ? `${v}%` : `${v} Md€`)}
              width={60}
            />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                color: "#0f172a",
                boxShadow: "0 4px 20px -4px rgba(15, 23, 42, 0.15)",
                fontSize: 12,
              }}
              formatter={(v, name) => [
                `${v}${mode === "ratio" ? " %" : " Md€"}`,
                name,
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} iconType="square" />
            <Bar dataKey="Fraude fiscale" stackId="f" fill="#EF4135" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Fraude sociale" stackId="f" fill="#d97706" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tableau détaillé */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-widest text-muted">
            <tr>
              <th rowSpan={2} className="text-left p-2.5 align-bottom">Pays</th>
              <th rowSpan={2} className="text-right p-2.5 align-bottom">PIB (Md€)</th>
              <th colSpan={3} className="text-center p-2.5 border-l border-amber-200/50 bg-amber-50/40 text-warn">
                ⚠ Fraude estimée (gap fiscal)
              </th>
              <th rowSpan={2} className="text-right p-2.5 align-bottom border-l border-money/30 bg-green-50/40 text-money">
                ✓ Détectée<br /><span className="normal-case font-normal text-[10px]">(officielle, Md€)</span>
              </th>
            </tr>
            <tr>
              <th className="text-right p-2.5 border-l border-amber-200/50 bg-amber-50/40">Fiscale</th>
              <th className="text-right p-2.5 bg-amber-50/40">Sociale</th>
              <th className="text-right p-2.5 bg-amber-50/40">% PIB</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isFrance = r.paysCode === "FR";
              return (
                <tr
                  key={r.paysCode}
                  className={`border-t border-slate-100 ${
                    isFrance ? "bg-brand-soft/30 font-medium" : ""
                  }`}
                >
                  <td className="p-2.5 whitespace-nowrap">
                    <span className="mr-1.5">{r.flag}</span>
                    <span className={isFrance ? "text-brand font-semibold" : "text-slate-800"}>
                      {r.pays}
                    </span>
                  </td>
                  <td className="p-2.5 text-right tabular-nums text-slate-600">
                    {r.pibMd.toLocaleString("fr-FR")}
                  </td>
                  <td className="p-2.5 text-right tabular-nums text-flag-red border-l border-amber-200/50 bg-amber-50/20">
                    {r.fraudeFiscaleMd.toLocaleString("fr-FR")}
                  </td>
                  <td className="p-2.5 text-right tabular-nums text-amber-700 bg-amber-50/20">
                    {r.fraudeSocialeMd.toLocaleString("fr-FR")}
                  </td>
                  <td className="p-2.5 text-right tabular-nums bg-amber-50/20">
                    <span
                      className={
                        r.ratioTotal > 5
                          ? "text-flag-red font-semibold"
                          : r.ratioTotal > 3
                            ? "text-amber-700 font-semibold"
                            : "text-money font-semibold"
                      }
                    >
                      {r.ratioTotal.toFixed(1)} %
                    </span>
                  </td>
                  <td className="p-2.5 text-right tabular-nums border-l border-money/30 bg-green-50/20">
                    {r.fraudeDetecteeMd != null ? (
                      <span
                        className="text-money font-semibold cursor-help"
                        title={
                          [
                            r.fraudeDetecteeSource,
                            r.fraudeDetecteeAnnee ? `année ${r.fraudeDetecteeAnnee}` : "",
                            r.fraudeDetecteeNote,
                          ]
                            .filter(Boolean)
                            .join(" · ")
                        }
                      >
                        {r.fraudeDetecteeMd.toLocaleString("fr-FR")}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs" title="Pas de bilan annuel public unifié comparable">n.d.</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Encadré méthodologie pour la fraude détectée */}
      <div className="mt-4 p-3 rounded-lg bg-green-50/40 border border-money/20 text-xs text-slate-700 leading-relaxed">
        <div className="font-semibold text-money mb-1">
          ✓ Sources de la fraude détectée (colonne verte)
        </div>
        <ul className="list-disc list-inside space-y-0.5">
          <li><strong>🇫🇷 France</strong> : DGFiP (17,1 Md€ fiscale) + URSSAF/CNAF/CNAM (3 Md€ sociale) — 2024</li>
          <li><strong>🇮🇹 Italie</strong> : Agenzia delle Entrate-Riscossione, « incassi da contrasto all'evasione » 2023</li>
          <li><strong>🇪🇸 Espagne</strong> : AEAT, Memoria anual 2023 — résultats du contrôle</li>
          <li><strong>🇬🇧 UK</strong> : HMRC compliance yield 2022-23. ⚠ Scope plus large (inclut conformité volontaire) — pas strictement comparable.</li>
          <li><strong>🇩🇪 Allemagne</strong> : agrégat approximatif Bund + Länder (compétences réparties)</li>
          <li><strong>🇵🇱 Pologne / 🇳🇱 Pays-Bas</strong> : pas de bilan annuel public unifié comparable — non affiché.</li>
        </ul>
        <p className="mt-2">
          <strong>Au survol des chiffres en vert</strong>, tu vois la source précise et l'année de référence.
          Comme chaque administration mesure « ce qui est détecté » selon une définition légèrement différente,
          ces chiffres se comparent à <em>ordres de grandeur</em>, pas au point de pourcentage près.
        </p>
      </div>

      {/* Lecture clé */}
      <div className="mt-5 p-4 rounded-xl bg-brand-soft/30 border border-brand/15 text-sm text-slate-700 leading-relaxed">
        <div className="text-xs uppercase tracking-widest text-brand mb-1">Lecture</div>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>L'Italie est en tête</strong> en valeur absolue (~205 Md€) et en
            ratio (~9,6 % du PIB), suivie par l'Allemagne en valeur absolue
            (~136 Md€).
          </li>
          <li>
            <strong>La France</strong> se situe dans la moyenne haute européenne :
            ~98 Md€ soit ~3,7 % du PIB. C'est plus que la Belgique ou les
            Pays-Bas, comparable à l'Espagne, et inférieur à l'Italie.
          </li>
          <li>
            <strong>Les Pays-Bas et le Royaume-Uni</strong> ont les ratios les plus
            faibles d'Europe (~1,4-1,6 % du PIB), grâce à des administrations
            fiscales très digitalisées et à une économie peu cash-based.
          </li>
          <li>
            <strong>La fraude sociale</strong> reste partout très inférieure à la
            fraude fiscale (rapport 1:10 environ) — contrairement à ce qu'on
            entend dans le débat public.
          </li>
        </ul>
      </div>

      <div className="mt-3 text-[11px] text-slate-500 leading-relaxed">
        <strong>Méthode :</strong> les estimations agrégent fraude fiscale (TVA
        gap, impôt sur les sociétés, IR) et fraude sociale (prestations indues,
        fraude aux cotisations). Sources principales : Commission européenne
        Tax Gap Report 2023, Cour des comptes (FR), HMRC (UK),
        Bundesrechnungshof (DE), ISTAT/MEF (IT), AEAT (ES).
        {" "}
        <a
          href="https://taxation-customs.ec.europa.eu/taxation/tax-policy/vat-gap-eu_en"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:underline"
        >
          Voir le rapport européen →
        </a>
      </div>
    </DownloadableCard>
  );
}
