// ============================================================================
// RegalienPage — Police, Gendarmerie, Justice, Prisons
// ============================================================================
//
// Page transparente sur les missions régaliennes de l'État. Données budget,
// effectifs, activité, enjeux par mission + comparaisons internationales.
//
// Route : #/regalien
// ============================================================================

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  COMPARAISONS_REGALIEN,
  MISSIONS_REGALIENNES,
  PERIMETRE_HORS_ETAT,
  TOTAL_REGALIEN_MD_EUR,
  type MissionRegalienne,
} from "../data/regalien";
import { ARetenir, Methodologie } from "./PageBlocks";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

const POPULATION_FRANCE = 67_800_000;

export function RegalienPage() {
  const totalHorsEtat = PERIMETRE_HORS_ETAT.reduce(
    (acc, p) => acc + p.montantMdEur,
    0,
  );
  const coutParHabitant = (TOTAL_REGALIEN_MD_EUR * 1e9) / POPULATION_FRANCE;

  // Bar chart par mission
  const barData = MISSIONS_REGALIENNES.map((m) => ({
    nom: m.nom,
    budget: m.budgetMdEur,
    couleur: m.couleur,
  })).sort((a, b) => b.budget - a.budget);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <header className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-blue-50 to-white border border-blue-200/60 shadow-card">
        <span className="text-xs uppercase tracking-widest text-blue-700 font-semibold">
          Missions régaliennes · État central
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-2">
          Police, Gendarmerie, Justice, Prisons
        </h1>
        <p className="text-base text-slate-700 mt-3 max-w-3xl leading-relaxed">
          Le cœur des fonctions régaliennes de l'État —{" "}
          <strong>{TOTAL_REGALIEN_MD_EUR.toFixed(1)} Md€/an</strong>, soit{" "}
          <strong>{Math.round(coutParHabitant).toLocaleString("fr-FR")} €/habitant</strong>.
          Sujets quotidiennement médiatisés, données rarement contextualisées.
          Cette page agrège budgets, effectifs, activité et comparaisons
          internationales par mission.
        </p>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiBox
            label="Police + Gendarmerie"
            value={`${(12.5 + 10.7).toFixed(1)} Md€`}
            hint="Mission Sécurités"
            color="text-blue-700"
          />
          <KpiBox
            label="Justice (toutes branches)"
            value={`${(5.0 + 4.7 + 1.0 + 0.7).toFixed(1)} Md€`}
            hint="Mission Justice"
            color="text-indigo-700"
          />
          <KpiBox
            label="Total régalien"
            value={`${TOTAL_REGALIEN_MD_EUR.toFixed(1)} Md€`}
            hint="LFI 2025"
            color="text-slate-700"
          />
          <KpiBox
            label="Coût/habitant"
            value={`${Math.round(coutParHabitant).toLocaleString("fr-FR")} €`}
            hint="moyenne nationale"
            color="text-emerald-700"
          />
        </div>
      </header>

      {/* Bar chart par mission */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Budget par mission régalienne (LFI 2025)
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          En milliards d'euros. Police et gendarmerie pèsent les deux tiers du
          régalien, devant administration pénitentiaire et justice judiciaire.
        </p>
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ top: 8, right: 32, left: 130, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                tickFormatter={(v: number) => `${v} Md€`}
                stroke="#64748b"
                tick={{ fontSize: 12 }}
              />
              <YAxis type="category" dataKey="nom" stroke="#475569" tick={{ fontSize: 11 }} width={120} interval={0} />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)} Md€`, "Budget LFI 2025"]}
                contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="budget" radius={[0, 4, 4, 0]}>
                {barData.map((d, i) => (
                  <Cell key={i} fill={d.couleur} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Détail par mission */}
      <DownloadableCard
        filename="regalien-missions"
        shareTitle="Budget France — Missions régaliennes"
        className="card p-5 md:p-6"
        getCsvData={() =>
          objectsToCsv(
            MISSIONS_REGALIENNES.map((m) => ({
              mission: m.nom,
              budget_md_eur: m.budgetMdEur,
              effectif: m.effectif,
              evolution_10ans: m.evolution10ans,
              source: m.source,
            })),
          )
        }
      >
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Détail par mission
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Pour chaque mission : budget, effectifs, activité, enjeux et source.
        </p>

        <ul className="space-y-3">
          {MISSIONS_REGALIENNES.map((m) => (
            <CarteMission key={m.id} mission={m} />
          ))}
        </ul>
      </DownloadableCard>

      {/* Surpopulation prisons — encart spécial */}
      <section className="rounded-2xl p-5 md:p-6 bg-purple-50/40 border border-purple-200/60 shadow-card">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl">🔒</span>
          <div className="text-xs uppercase tracking-widest text-purple-700 font-semibold">
            Le sujet le plus structurel : la surpopulation carcérale
          </div>
        </div>
        <h2 className="font-display text-xl font-semibold text-slate-900 mt-1.5">
          76 200 détenus pour 60 800 places — 125 % d'occupation
        </h2>
        <div className="mt-3 text-sm text-slate-700 space-y-2 leading-relaxed">
          <p>
            La France compte <strong>76 200 personnes incarcérées</strong> au 1ᵉʳ avril
            2025 dans les <strong>188 établissements pénitentiaires</strong>.
            Or la capacité opérationnelle n'est que de <strong>60 800 places</strong>
            — soit un <strong>taux d'occupation moyen de 125 %</strong>.
          </p>
          <p>
            La surcharge n'est pas répartie équitablement : <strong>les maisons
            d'arrêt</strong> (où sont placés les prévenus en attente de procès et
            les courtes peines) atteignent <strong>jusqu'à 180 % d'occupation</strong>{" "}
            dans certains établissements (Marseille-Baumettes, Toulouse-Seysses,
            Bois-d'Arcy). Conséquences : matelas au sol, conflits, dégradation des
            conditions de détention, condamnations régulières de la France par la
            CEDH.
          </p>
          <p>
            <strong>Plan 15 000 places</strong> annoncé en 2017, repris en 2023 :
            objectif d'aboutir à 75 000 places opérationnelles d'ici 2027. Réalisé à
            ~60 % à mi-2025 (retards d'urbanisme, recours, contraintes locales).
          </p>
        </div>
      </section>

      {/* Comparaisons internationales */}
      <section className="card p-5 md:p-6 bg-amber-50/30 border-amber-200/60">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Comparaison internationale (Eurostat COFOG)
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          Dépenses publiques en pourcentage du PIB pour l'ordre public (police,
          sécurité civile) et la justice (cours, prisons). Source : Eurostat,
          classification COFOG, données 2023.
        </p>

        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3 font-semibold">Pays</th>
                <th className="py-2 pr-3 font-semibold tabular-nums">Police / sécurité</th>
                <th className="py-2 pr-3 font-semibold tabular-nums">Justice / prisons</th>
                <th className="py-2 pr-3 font-semibold tabular-nums">Total</th>
                <th className="py-2 pr-3 font-semibold">Note</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {COMPARAISONS_REGALIEN.map((c) => {
                const isFrance = c.pays === "France";
                return (
                  <tr key={c.pays} className={`border-b border-slate-100 ${isFrance ? "bg-brand-soft/40 font-semibold" : ""}`}>
                    <td className="py-2 pr-3"><span className="mr-1.5">{c.drapeau}</span>{c.pays}</td>
                    <td className="py-2 pr-3 tabular-nums">{c.ordrePubliqueSecurite.toFixed(1)} %</td>
                    <td className="py-2 pr-3 tabular-nums">{c.justice.toFixed(1)} %</td>
                    <td className="py-2 pr-3 tabular-nums font-semibold">{c.total.toFixed(1)} %</td>
                    <td className="py-2 pr-3 text-xs text-slate-600">{c.note ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-slate-500 mt-3 italic leading-relaxed">
          La France est légèrement <strong>en dessous</strong> de la moyenne européenne
          sur les dépenses régaliennes (1,8 % vs ~1,9 % UE). L'écart se concentre
          surtout sur la <strong>justice</strong>, sous-dotée par rapport à
          l'Allemagne et au Royaume-Uni.
        </p>
      </section>

      {/* Hors État central */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-1">
          Au-delà de l'État central (pour information)
        </h2>
        <p className="text-xs text-slate-600 mb-4">
          La sécurité publique en France est aussi assurée par d'autres acteurs,
          financés différemment.
        </p>
        <ul className="space-y-3">
          {PERIMETRE_HORS_ETAT.map((p) => (
            <li
              key={p.label}
              className="border border-slate-200 rounded-lg p-4 hover:border-brand/30 transition"
            >
              <div className="flex items-baseline justify-between gap-3">
                <strong className="text-slate-900">{p.label}</strong>
                <span className="font-display text-lg font-bold tabular-nums text-slate-900">
                  {p.montantMdEur.toFixed(1)} Md€
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {p.description}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-4 text-[11px] text-slate-500 italic">
          Total acteurs hors État central : ~{totalHorsEtat.toFixed(1)} Md€. Si on
          ajoute au régalien d'État, la dépense totale en sécurité/justice en France
          monte à ~{(TOTAL_REGALIEN_MD_EUR + totalHorsEtat).toFixed(1)} Md€/an
          (~{Math.round(((TOTAL_REGALIEN_MD_EUR + totalHorsEtat) * 1e9) / POPULATION_FRANCE)} €/hab).
        </div>
      </section>

      {/* À retenir */}
      <ARetenir
        items={[
          <>
            <strong>{TOTAL_REGALIEN_MD_EUR.toFixed(1)} Md€/an</strong> pour les
            missions régaliennes État (police, gendarmerie, justice, prisons),
            soit ~{Math.round(coutParHabitant).toLocaleString("fr-FR")} €/habitant.
          </>,
          <>
            La France est <strong>légèrement en dessous</strong> de la moyenne
            UE (1,8 % du PIB vs ~1,9 %). L'écart se concentre sur la{" "}
            <strong>justice</strong> (sous-effectif chronique en magistrats).
          </>,
          <>
            <strong>9 000 magistrats pour 67 millions d'habitants</strong> —
            soit 11 / 100 000 hab., contre 24 en Allemagne. Loi de programmation
            2023-2027 prévoit +1 500 magistrats.
          </>,
          <>
            <strong>Surpopulation carcérale chronique</strong> : 125 % en
            moyenne, jusqu'à 180 % dans certaines maisons d'arrêt. Plan{" "}
            +15 000 places à horizon 2027.
          </>,
          <>
            La sécurité publique mobilise au total ~
            {(TOTAL_REGALIEN_MD_EUR + totalHorsEtat).toFixed(0)} Md€ en
            comptant les pompiers (SDIS), polices municipales et sécurité privée.
          </>,
        ]}
      />

      {/* Méthodologie */}
      <Methodologie
        sources={[
          <>
            <a
              href="https://www.budget.gouv.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              LFI 2025 — Mission Sécurités et Mission Justice
            </a>{" "}
            (PAP / RAP)
          </>,
          <>
            Direction de l'Administration Pénitentiaire (DAP) — statistiques
            mensuelles détenus / places
          </>,
          <>
            DGPN, DGGN — bilans annuels effectifs et activité
          </>,
          <>
            Conseil de l'Europe — CEPEJ (rapport biennal sur les systèmes
            judiciaires européens)
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
            — classification COFOG des dépenses publiques (Order &amp; Safety)
          </>,
          <>Cour des comptes — rapports annuels mission Sécurités, Justice</>,
        ]}
        methode={
          <>
            Les budgets sont les <strong>crédits de paiement</strong> votés en
            LFI 2025 (autorisations de dépense effectives). Pour la
            comparaison internationale, on utilise la classification COFOG
            d'Eurostat qui agrège État + collectivités. Effectifs en
            équivalents temps plein.
          </>
        }
        limites={
          <>
            Les chiffres exécution réelle peuvent différer de la LFI (gels de
            crédits, dégels, virements). On affiche la prévision LFI, plus
            stable et publique. Les dépenses fiscales liées à la sécurité
            (réductions IS sécurité privée…) ne sont pas comptées ici.
          </>
        }
        miseAJour="LFI 2025 (votée décembre 2024). Mise à jour annuelle prévue."
      />
    </div>
  );
}

// ============================================================================
// CarteMission — détail d'une mission
// ============================================================================

function CarteMission({ mission }: { mission: MissionRegalienne }) {
  return (
    <li className="border border-slate-200 rounded-xl p-4 hover:border-brand/30 transition">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-3 flex-1 min-w-0">
          <span className="text-2xl">{mission.emoji}</span>
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900">
              {mission.nom}
            </h3>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {mission.effectif}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div
            className="font-display text-xl font-bold tabular-nums"
            style={{ color: mission.couleur }}
          >
            {mission.budgetMdEur.toFixed(1)} Md€
          </div>
          <div className="text-[10px] text-slate-500">budget LFI 2025</div>
          <div
            className="text-[10px] mt-0.5 px-2 py-0.5 rounded-full inline-block"
            style={{
              background: `${mission.couleur}15`,
              color: mission.couleur,
            }}
          >
            {mission.evolution10ans}
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-700 mt-3 leading-relaxed">
        {mission.description}
      </p>

      {/* Indicateurs */}
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
        {mission.indicateurs.map((ind, i) => (
          <div key={i} className="bg-slate-50/70 border border-slate-200 rounded-lg p-2">
            <div className="text-[9px] uppercase tracking-wider text-slate-500 leading-tight">
              {ind.label}
            </div>
            <div className="font-display text-sm font-bold text-slate-900 tabular-nums mt-0.5">
              {ind.value}
            </div>
            {ind.description && (
              <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                {ind.description}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Enjeux */}
      <div className="mt-3 text-xs italic text-amber-800 bg-amber-50/60 border-l-2 border-amber-300 px-3 py-1.5 rounded-r">
        <strong>Enjeux :</strong> {mission.enjeux}
      </div>

      <div className="mt-2 text-[10px] text-slate-400">
        Source : {mission.source}
      </div>
    </li>
  );
}

// ============================================================================
// KpiBox
// ============================================================================

function KpiBox({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: string;
  hint?: string;
  color: string;
}) {
  return (
    <div className="bg-white/80 border border-blue-200/40 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-widest text-blue-700 font-semibold">
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
