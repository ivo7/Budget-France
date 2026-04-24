import { useMemo, useState } from "react";
import type { BudgetSnapshot } from "../types";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

interface Props {
  data: BudgetSnapshot;
}

/**
 * Page complète dédiée à la Sécurité sociale et aux Collectivités territoriales :
 *   1. Vue d'ensemble des 3 sphères publiques (État / Sécu / Collectivités)
 *   2. Breakdown par branche (Sécu) et par niveau (Collectivités)
 *   3. Financement : d'où vient l'argent de chacune
 *   4. Simulateur fiche de paie : sur un salaire donné, que deviennent les
 *      cotisations salariales et patronales ? où partent-elles ?
 *   5. Bénéfices concrets pour le citoyen sur toute une vie
 */
export function SecuCollectivitesPage({ data }: Props) {
  const sc = data.secuCollectivites;
  if (!sc) {
    return (
      <div className="card p-6 text-sm text-slate-600 mt-6">
        Données Sécurité sociale / Collectivités indisponibles. Régénère le pipeline :{" "}
        <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-900">docker compose run --rm pipeline</code>
      </div>
    );
  }

  const etatDep = data.budgetPrevisionnel.value / 1e9;
  const secuDep = sc.secu.totalDepenses;
  const collecDep = sc.collectivites.totalDepenses;
  const totalApu = etatDep + secuDep + collecDep;

  return (
    <>
      <section className="mt-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs uppercase tracking-widest text-muted">Sphères publiques hors État</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-warn border border-amber-200 uppercase tracking-wider">
            millésime 2024-2026
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">
          Sécurité sociale & Collectivités — l'argent public que tu ne vois pas
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-3xl">
          Les chiffres affichés sur cette page sont des <strong>ordres de grandeur 2024-2026</strong>
          issus de la LFSS 2025 (pour la Sécu), des comptes APUL INSEE 2024 (pour les collectivités) et
          des barèmes URSSAF 2024-2025 (pour les cotisations). Ils évoluent peu d'une année à l'autre.
        </p>
        <p className="text-sm text-slate-600 mt-2 max-w-3xl">
          Le budget de l'État que le site affiche ailleurs (580 Md€) n'est <strong>qu'un tiers</strong> de
          la dépense publique totale. À côté, il y a la Sécurité sociale ({secuDep} Md€) et les
          collectivités territoriales ({collecDep} Md€). Voyons ce qu'elles font, d'où vient leur
          argent, et ce qu'elles te rapportent concrètement chaque mois.
        </p>
      </section>

      {/* Vue d'ensemble 3 sphères */}
      <section className="mt-6">
        <DownloadableCard filename="apu-trois-spheres" shareTitle="Budget France — 3 sphères publiques" className="card p-5 md:p-6">
          <div className="text-xs uppercase tracking-widest text-muted">Les 3 sphères publiques (APU)</div>
          <div className="font-display text-xl font-semibold text-slate-900 mt-1">
            Où partent les {Math.round(totalApu)} Md€ de dépense publique ?
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <SphereCard
              title="État central"
              value={etatDep}
              part={etatDep / totalApu}
              color="#0055A4"
              subtitle="Éducation, Défense, Justice, Intérieur…"
            />
            <SphereCard
              title="Sécurité sociale"
              value={secuDep}
              part={secuDep / totalApu}
              color="#16a34a"
              subtitle="Maladie, Retraites, Famille, Autonomie…"
            />
            <SphereCard
              title="Collectivités"
              value={collecDep}
              part={collecDep / totalApu}
              color="#d97706"
              subtitle="Communes, Départements, Régions"
            />
          </div>

          <div className="mt-5 text-[11px] text-slate-500 leading-relaxed">
            Source : {sc.source.label}. Les 3 sphères sont consolidées par Eurostat dans la
            notion d'<strong>administrations publiques (APU)</strong> — c'est ce périmètre
            qu'on compare entre pays quand on parle de dépense publique / PIB (~57 % en France).
          </div>
        </DownloadableCard>
      </section>

      {/* Branches Sécu + Niveaux Collectivités — il s'agit bien de la
          répartition des DÉPENSES (et non des recettes), c.-à-d. ce que
          chaque sous-ensemble verse aux assurés / habitants. */}
      <section className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BranchesBreakdown
          title="Sécurité sociale — répartition des dépenses par branche"
          subtitle="Ce que la Sécu verse chaque année (prestations + frais de gestion), ventilé par branche."
          total={secuDep}
          items={sc.secu.branches.map((b) => ({ ...b, value: b.depenses }))}
          color="#16a34a"
          source={sc.source.label}
        />
        <BranchesBreakdown
          title="Collectivités — répartition des dépenses par niveau"
          subtitle="Ce que dépensent communes, départements et régions (fonctionnement + investissement), ventilé par niveau."
          total={collecDep}
          items={sc.collectivites.niveaux.map((b) => ({ ...b, value: b.depenses }))}
          color="#d97706"
          source={sc.source.label}
        />
      </section>

      {/* Financement = d'où viennent les RECETTES de chaque sphère. */}
      <section className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FinancementBreakdown
          title="Sécurité sociale — répartition des recettes (financement)"
          subtitle="Cotisations, CSG, taxes affectées, transferts de l'État…"
          items={sc.secu.financement}
          color="#16a34a"
          source={sc.source.label}
        />
        <FinancementBreakdown
          title="Collectivités — répartition des recettes (financement)"
          subtitle="Impôts locaux, dotations de l'État, fiscalité transférée…"
          items={sc.collectivites.financement}
          color="#d97706"
          source={sc.source.label}
        />
      </section>

      {/* Simulateur fiche de paie */}
      <section className="mt-4">
        <FichePaieSimulator data={data} />
      </section>

      {/* Bénéfices concrets */}
      <section className="mt-4">
        <BenefitsPanel benefits={sc.beneficesCitoyens} />
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Composants internes
// ---------------------------------------------------------------------------

function SphereCard({
  title, value, part, color, subtitle,
}: {
  title: string; value: number; part: number; color: string; subtitle: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{title}</span>
      </div>
      <div className="font-display text-4xl font-bold tabular-nums" style={{ color }}>
        {Math.round(value)} <span className="text-lg">Md€/an</span>
      </div>
      <div className="text-sm font-medium text-slate-600 mt-1">{(part * 100).toFixed(0)} % de la dépense publique</div>
      <div className="text-xs text-slate-500 mt-2">{subtitle}</div>
    </div>
  );
}

function BranchesBreakdown({
  title, subtitle, total, items, color, source,
}: {
  title: string;
  subtitle?: string;
  total: number;
  items: { id: string; label: string; value: number; description: string; beneficesExemple: string }[];
  color: string;
  source?: string;
}) {
  const max = Math.max(...items.map((i) => i.value));
  const csvData = () => {
    const rows = [...items].sort((a, b) => b.value - a.value).map((i) => ({
      id: i.id,
      label: i.label,
      depenses_milliards: i.value,
      part_pourcent: ((i.value / total) * 100).toFixed(1),
      description: i.description,
      benefices_exemple: i.beneficesExemple,
    }));
    return objectsToCsv(rows);
  };
  return (
    <DownloadableCard
      filename={`breakdown-${title.slice(0, 20)}`}
      shareTitle={`Budget France — ${title}`}
      className="card p-5 md:p-6"
      getCsvData={csvData}
    >
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="font-display text-lg font-semibold text-slate-900">{title}</h3>
        <span className="text-sm font-semibold tabular-nums" style={{ color }}>{total} Md€</span>
      </div>
      {subtitle && <p className="text-xs text-slate-500 mb-3 leading-relaxed">{subtitle}</p>}

      <ul className="space-y-3">
        {items.sort((a, b) => b.value - a.value).map((item) => {
          const pctOfTotal = (item.value / total) * 100;
          const pctOfMax = (item.value / max) * 100;
          return (
            <li key={item.id}>
              <div className="flex items-center justify-between gap-3 text-sm mb-1">
                <span className="font-medium text-slate-800 truncate">{item.label}</span>
                <span className="tabular-nums text-slate-500 shrink-0">
                  <span className="font-semibold text-slate-900">{item.value} Md€</span>
                  <span className="ml-1.5">({pctOfTotal.toFixed(0)} %)</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(3, pctOfMax)}%`, background: color }} />
              </div>
              <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">{item.description}</div>
              <div className="text-[11px] text-slate-400 italic mt-0.5">Ex. : {item.beneficesExemple}</div>
            </li>
          );
        })}
      </ul>
      {source && <div className="mt-4 text-[10px] text-slate-400">Source : {source}</div>}
    </DownloadableCard>
  );
}

function FinancementBreakdown({
  title, subtitle, items, color, source,
}: {
  title: string;
  subtitle?: string;
  items: { id: string; label: string; partPourcent: number; description: string }[];
  color: string;
  source?: string;
}) {
  const csvData = () => {
    const rows = [...items].sort((a, b) => b.partPourcent - a.partPourcent).map((i) => ({
      id: i.id,
      label: i.label,
      part_pourcent: i.partPourcent,
      description: i.description,
    }));
    return objectsToCsv(rows);
  };
  return (
    <DownloadableCard
      filename={`financement-${title.slice(0, 20)}`}
      shareTitle={title}
      className="card p-5 md:p-6"
      getCsvData={csvData}
    >
      <h3 className="font-display text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mb-3 leading-relaxed">{subtitle}</p>}
      <ul className="space-y-2.5">
        {items.sort((a, b) => b.partPourcent - a.partPourcent).map((item) => (
          <li key={item.id}>
            <div className="flex items-center justify-between gap-3 text-sm mb-1">
              <span className="font-medium text-slate-800 truncate">{item.label}</span>
              <span className="tabular-nums font-semibold" style={{ color }}>{item.partPourcent} %</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.partPourcent}%`, background: color }} />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">{item.description}</div>
          </li>
        ))}
      </ul>
      {source && <div className="mt-4 text-[10px] text-slate-400">Source : {source}</div>}
    </DownloadableCard>
  );
}

function FichePaieSimulator({ data }: { data: BudgetSnapshot }) {
  const [brutMensuel, setBrutMensuel] = useState(3000);

  const cotisations = data.secuCollectivites?.cotisationsTypes ?? [];

  const detailBySalarial = cotisations.map((c) => ({
    ...c,
    montantSalarial: (brutMensuel * c.partSalariale) / 100,
    montantPatronal: (brutMensuel * c.partPatronale) / 100,
  }));

  const totalSalarial = detailBySalarial.reduce((a, b) => a + b.montantSalarial, 0);
  const totalPatronal = detailBySalarial.reduce((a, b) => a + b.montantPatronal, 0);
  const net = brutMensuel - totalSalarial;
  const superBrut = brutMensuel + totalPatronal;

  return (
    <DownloadableCard filename="simulateur-fiche-paie" shareTitle="Budget France — simulateur fiche de paie" className="card p-5 md:p-6">
      <div className="text-xs uppercase tracking-widest text-muted">Simulateur personnel</div>
      <h3 className="font-display text-2xl font-semibold text-slate-900 mt-1">
        Ma fiche de paie : où partent mes cotisations ?
      </h3>
      <p className="text-xs text-slate-500 mt-1 max-w-2xl">
        Entre ton salaire mensuel <strong>brut</strong> et découvre à quelles branches de la Sécu,
        aux retraites complémentaires, à l'Unédic, etc., partent tes cotisations — côté salarial
        (ce qui te manque sur le net) et côté patronal (ce que paie ton employeur en plus).
      </p>

      <div className="mt-5">
        <label className="block text-xs uppercase tracking-widest text-muted mb-1">
          Salaire mensuel brut (€)
        </label>
        <input
          type="number"
          value={brutMensuel}
          min={0}
          max={50000}
          step={100}
          onChange={(e) => setBrutMensuel(Math.max(0, Number(e.target.value) || 0))}
          className="w-full md:max-w-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-lg font-semibold tabular-nums focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <input
          type="range"
          min={1500}
          max={12000}
          step={100}
          value={Math.min(Math.max(brutMensuel, 1500), 12000)}
          onChange={(e) => setBrutMensuel(Number(e.target.value))}
          className="w-full mt-2 accent-brand md:max-w-md"
        />
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <BigStat label="Super-brut (coût employeur)" value={`${Math.round(superBrut).toLocaleString("fr-FR")} €`} color="text-slate-900" hint="brut + cotisations patronales" />
        <BigStat label="Brut" value={`${Math.round(brutMensuel).toLocaleString("fr-FR")} €`} color="text-slate-900" hint="sur ta fiche de paie" />
        <BigStat label="Net" value={`${Math.round(net).toLocaleString("fr-FR")} €`} color="text-money" hint="ce qui arrive sur ton compte" />
        <BigStat label="Total prélevé" value={`${Math.round(totalSalarial + totalPatronal).toLocaleString("fr-FR")} €`} color="text-flag-red" hint="salarial + patronal" />
      </div>

      <div className="mt-6">
        <div className="text-xs uppercase tracking-widest text-muted mb-2">
          Répartition mensuelle des prélèvements
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="text-left py-2 pr-3">Ligne</th>
                <th className="text-right py-2 px-2">Part salariale</th>
                <th className="text-right py-2 px-2">Part patronale</th>
                <th className="text-left py-2 pl-3">Destination</th>
              </tr>
            </thead>
            <tbody>
              {detailBySalarial.map((c) => (
                <tr key={c.id} className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium text-slate-800">{c.label}</td>
                  <td className="py-2 px-2 text-right tabular-nums">
                    {c.partSalariale > 0 ? (
                      <span>
                        <strong>{Math.round(c.montantSalarial).toLocaleString("fr-FR")} €</strong>
                        <span className="text-slate-500 text-xs ml-1">({c.partSalariale} %)</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums">
                    {c.partPatronale > 0 ? (
                      <span>
                        <strong>{Math.round(c.montantPatronal).toLocaleString("fr-FR")} €</strong>
                        <span className="text-slate-500 text-xs ml-1">({c.partPatronale} %)</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2 pl-3 text-slate-600 text-xs">{c.destination}</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="py-2 pr-3">Total</td>
                <td className="py-2 px-2 text-right tabular-nums text-flag-red">
                  {Math.round(totalSalarial).toLocaleString("fr-FR")} €
                </td>
                <td className="py-2 px-2 text-right tabular-nums text-flag-red">
                  {Math.round(totalPatronal).toLocaleString("fr-FR")} €
                </td>
                <td className="py-2 pl-3 text-slate-500 text-xs">Ensemble des branches Sécu + UNEDIC</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 p-4 rounded-xl bg-brand-soft/40 border border-brand/20">
        <div className="text-xs uppercase tracking-widest text-brand mb-1">Lecture</div>
        <div className="text-sm text-slate-800">
          Sur un brut de <strong>{Math.round(brutMensuel).toLocaleString("fr-FR")} €/mois</strong>,
          ton employeur paie réellement <strong>{Math.round(superBrut).toLocaleString("fr-FR")} €</strong>
          {" "}(super-brut) et tu touches <strong>{Math.round(net).toLocaleString("fr-FR")} €</strong> net.
          La différence de <strong>{Math.round(superBrut - net).toLocaleString("fr-FR")} €</strong>
          {" "}(~{Math.round((superBrut - net) / superBrut * 100)} % du super-brut) finance intégralement
          retraite, maladie, famille, chômage, dépendance, formation. Tu le retrouveras (en partie) à
          la retraite, en cas de maladie, de chômage, de parentalité, ou de perte d'autonomie.
        </div>
      </div>

      <div className="mt-3 text-[11px] text-slate-500">
        Source : barèmes URSSAF 2024 (salarié non-cadre, régime général, taux standards).
        Les cadres paient en plus l'APEC et des taux spécifiques AGIRC sur la tranche 2.
        Le simulateur ne prend pas en compte les exonérations Fillon / réductions Bayrou
        sur les bas salaires.
      </div>
    </DownloadableCard>
  );
}

function BigStat({ label, value, color, hint }: { label: string; value: string; color: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted">{label}</div>
      <div className={`font-display text-xl font-bold tabular-nums ${color}`}>{value}</div>
      {hint && <div className="text-[10px] text-slate-500 mt-0.5">{hint}</div>}
    </div>
  );
}

function BenefitsPanel({ benefits }: { benefits: { icon: string; titre: string; description: string; valeurApprox: string; source: "secu" | "collectivites" }[] }) {
  const [filter, setFilter] = useState<"all" | "secu" | "collectivites">("all");
  const filtered = useMemo(() => benefits.filter((b) => filter === "all" || b.source === filter), [benefits, filter]);

  return (
    <DownloadableCard filename="benefices-citoyens" shareTitle="Budget France — bénéfices Sécu/Collectivités" className="card p-5 md:p-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Ce que ça te rapporte</div>
          <div className="font-display text-xl font-semibold text-slate-900 mt-1">
            Bénéfices concrets pour ta vie quotidienne
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Services et prestations financés par la Sécu ou les collectivités, avec leur valeur
            approximative pour un citoyen type.
          </p>
        </div>
        <div className="inline-flex rounded-full bg-slate-100 p-1 border border-slate-200 text-xs shrink-0">
          <button onClick={() => setFilter("all")} className={`px-3 py-1 rounded-full font-medium transition ${filter === "all" ? "bg-brand text-white" : "text-slate-600 hover:text-slate-900"}`}>Tous</button>
          <button onClick={() => setFilter("secu")} className={`px-3 py-1 rounded-full font-medium transition ${filter === "secu" ? "bg-money text-white" : "text-slate-600 hover:text-slate-900"}`}>Sécu</button>
          <button onClick={() => setFilter("collectivites")} className={`px-3 py-1 rounded-full font-medium transition ${filter === "collectivites" ? "bg-amber-600 text-white" : "text-slate-600 hover:text-slate-900"}`}>Collectivités</button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((b, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 flex gap-3">
            <div className="text-3xl shrink-0">{b.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900">{b.titre}</div>
              <div className="text-xs text-slate-600 mt-1 leading-relaxed">{b.description}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-semibold" style={{ color: b.source === "secu" ? "#16a34a" : "#d97706" }}>
                  {b.valeurApprox}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                  b.source === "secu"
                    ? "bg-green-50 text-money border-green-200"
                    : "bg-amber-50 text-amber-600 border-amber-200"
                }`}>
                  {b.source === "secu" ? "Sécu" : "Collectivités"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DownloadableCard>
  );
}
