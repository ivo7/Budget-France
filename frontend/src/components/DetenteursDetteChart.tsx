import type { BudgetSnapshot } from "../types";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";
import { formatEurCompact } from "../lib/format";

interface Props {
  data: BudgetSnapshot;
}

const COLORS = ["#0055A4", "#16a34a", "#7c3aed", "#d97706", "#EF4135", "#64748b"];

/**
 * Détenteurs de la dette publique française.
 * Répond à la question fréquente : "à qui doit-on cet argent ?"
 *
 * Visualisation : barres horizontales triées + total en Md€ pour chaque
 * catégorie, avec descriptions pédagogiques.
 */
export function DetenteursDetteChart({ data }: Props) {
  const det = data.detenteursDette;
  if (!det) return null;

  const detteTotale = data.dettePublique.value;
  // On considère que la dette négociable représente ~85 % de la dette
  // publique totale (le reste = dette non négociable, comptes courants Trésor)
  const detteNegociable = detteTotale * 0.85;

  return (
    <DownloadableCard
      filename="budget-france-detenteurs-dette"
      shareTitle="Budget France — À qui doit-on la dette française ?"
      className="card p-5 md:p-6"
      getCsvData={() => objectsToCsv(
        det.categories.map((c) => ({
          categorie: c.label,
          part_pct: c.partPourcent,
          montant_md_eur: Math.round(detteNegociable * c.partPourcent / 100 / 1e9),
        })),
      )}
    >
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Composition de la détention</div>
          <div className="font-display text-xl font-semibold text-slate-900 mt-1">
            À qui doit-on la dette française ?
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Sur une dette publique d'environ {formatEurCompact(detteTotale)},
            la dette négociable (OAT + BTF) représente ~{formatEurCompact(detteNegociable)}.
            Voici qui détient les titres :
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {det.categories
          .slice()
          .sort((a, b) => b.partPourcent - a.partPourcent)
          .map((c, idx) => {
            const montant = (detteNegociable * c.partPourcent) / 100;
            const color = COLORS[idx % COLORS.length];
            return (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                    <span className="font-semibold text-slate-900">{c.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-2xl font-bold tabular-nums" style={{ color }}>
                      {c.partPourcent} %
                    </span>
                    <span className="text-xs text-slate-500 ml-2">
                      ≈ {formatEurCompact(montant)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${c.partPourcent}%`, background: color }}
                  />
                </div>
                <div className="mt-2 text-xs text-slate-600 leading-relaxed">{c.description}</div>
              </div>
            );
          })}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-brand-soft/40 border border-brand/20 text-xs text-slate-700">
        <strong>À retenir :</strong> contrairement à une idée reçue, la dette française n'est
        pas détenue par un État ou une banque centrale étrangère hostile. Elle est dispersée
        entre des centaines de milliers d'investisseurs, dont beaucoup d'épargnants français
        indirectement (assurance-vie, fonds euros). La BCE en détient ~18 % via le QE — donc
        une partie des intérêts revient à l'État via les dividendes Banque de France.
      </div>

      <div className="mt-3 text-[11px] text-slate-500">
        Source : <a href={det.source.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand">{det.source.label}</a>.
        Mise à jour trimestrielle. Les pourcentages sont des ordres de grandeur — la composition exacte fluctue selon les émissions et rachats.
      </div>
    </DownloadableCard>
  );
}
