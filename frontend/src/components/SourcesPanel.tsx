import type { SourceInfo } from "../types";
import { formatDateTime } from "../lib/format";

interface Props {
  sources: SourceInfo[];
  generatedAt: string;
}

const dotColor: Record<SourceInfo["status"], string> = {
  ok: "bg-money",
  fallback: "bg-warn",
  error: "bg-flag-red",
};

const statusLabel: Record<SourceInfo["status"], string> = {
  ok: "live",
  fallback: "secours",
  error: "erreur",
};

const badgeColor: Record<SourceInfo["status"], string> = {
  ok: "bg-green-50 text-money border-green-200",
  fallback: "bg-amber-50 text-warn border-amber-200",
  error: "bg-red-50 text-flag-red border-red-200",
};

export function SourcesPanel({ sources, generatedAt }: Props) {
  const dedup = Array.from(new Map(sources.map((s) => [s.id, s])).values());

  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Transparence</div>
          <div className="font-display text-xl font-semibold text-slate-900">
            Sources officielles
          </div>
        </div>
        <div className="text-[11px] text-slate-500">
          Snapshot généré le {formatDateTime(generatedAt)}
        </div>
      </div>

      {/* Compteur unique — nombre total de sources */}
      <div className="mt-4 inline-flex items-baseline gap-2">
        <span className="font-display text-4xl font-bold text-brand tabular-nums">
          {dedup.length}
        </span>
        <span className="text-sm text-slate-600">sources officielles utilisées</span>
      </div>

      {dedup.length === 0 ? (
        <div className="mt-6 p-6 text-center text-slate-500 bg-slate-50 rounded-xl">
          Aucune source n'a encore été enregistrée. Lance le pipeline : <code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">docker compose run --rm pipeline</code>
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-slate-100">
          {dedup.map((s) => (
            <li key={s.id} className="py-3 flex items-center gap-3 text-sm">
              <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${dotColor[s.status]}`} />
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium text-slate-800">{s.label}</div>
                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-slate-500 hover:text-brand hover:underline truncate block"
                  >
                    {s.url}
                  </a>
                )}
                {s.error && <div className="text-[11px] text-flag-red mt-0.5">{s.error}</div>}
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider border ${badgeColor[s.status]}`}>
                {statusLabel[s.status]}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 text-xs text-slate-500 leading-relaxed">
        Chaque chiffre du dashboard provient d'une source publique identifiée. Les sources
        sont testées dans un ordre fixé (Eurostat → INSEE → Banque de France → data.gouv.fr
        → seed) et la première qui répond fournit la valeur. Les valeurs <em>secours</em>
        sont des chiffres connus stockés en dur lorsque l'API n'est pas câblée ou
        indisponible.
      </div>
    </div>
  );
}
