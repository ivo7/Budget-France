// Formatters francophones centralisés.

const eur0 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
const pct = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1, minimumFractionDigits: 1 });

export function formatEurCompact(eur: number): string {
  const abs = Math.abs(eur);
  if (abs >= 1e12) return `${eur2.format(eur / 1e12)} T€`;
  if (abs >= 1e9) return `${eur2.format(eur / 1e9)} Md€`;
  if (abs >= 1e6) return `${eur0.format(eur / 1e6)} M€`;
  return `${eur0.format(eur)} €`;
}

export function formatEurFull(eur: number): string {
  return `${eur0.format(Math.round(eur))} €`;
}

export function formatPercent(ratio: number): string {
  return pct.format(ratio);
}

export function formatPctPoints(pctPoints: number): string {
  return `${eur2.format(pctPoints)} %`;
}

/**
 * Formate un grand nombre en chaîne groupée par classes de 3 (style "3 415 892 104 123").
 * Utilisé par le compteur live.
 */
export function formatGrouped(n: number): string {
  return eur0.format(Math.round(n));
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(d);
}

export function formatDateTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(d);
}

/** Population France 2026 (INSEE, estimation de population) — ~68,5 millions. */
export const POPULATION_FRANCE = 68_500_000;

/**
 * Exprime un montant en euros "par habitant" en utilisant la population France.
 * Ex : 3 482 Md€ / 68,5 M = ~50 830 €/habitant.
 */
export function formatPerCapita(totalEur: number): string {
  const perCapita = totalEur / POPULATION_FRANCE;
  if (Math.abs(perCapita) >= 1000) {
    return `${Math.round(perCapita).toLocaleString("fr-FR")} €/habitant`;
  }
  return `${eur2.format(perCapita)} €/habitant`;
}
