// Formatters côté backend (ne peut pas importer Intl.NumberFormat côté frontend)

const eur0 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

export function formatEurCompact(eur: number): string {
  const abs = Math.abs(eur);
  if (abs >= 1e12) return `${eur2.format(eur / 1e12)} T€`;
  if (abs >= 1e9) return `${eur2.format(eur / 1e9)} Md€`;
  if (abs >= 1e6) return `${eur0.format(eur / 1e6)} M€`;
  return `${eur0.format(eur)} €`;
}

export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)} %`;
}

export function formatPct(v: number): string {
  return `${v.toFixed(2)} %`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(d);
}
