// ============================================================================
// Utilitaire d'export CSV pour les graphiques
// ============================================================================
//
// Convertit un jeu de données tabulaire en chaîne CSV conforme RFC 4180,
// puis déclenche le téléchargement comme Blob avec extension `.csv`.
//
// Usage :
//   const csv = toCsv({ headers: ["année","valeur"], rows: [[2020, 100]] });
//   downloadCsv("budget-france-dette.csv", csv);
//
// Helpers spécifiques :
//   - timeseriesToCsv : convertit une série chronologique simple
//   - multiSeriesToCsv : combine plusieurs séries alignées sur l'axe temps

export interface CsvData {
  headers: string[];
  rows: (string | number | null | undefined)[][];
}

/**
 * Échappe une cellule selon la RFC 4180 : encadre par "..." les valeurs
 * contenant virgule, guillemet ou retour à la ligne, double les guillemets.
 */
function escapeCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "number" ? String(v) : String(v);
  if (/[",\n\r;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Sérialise CsvData en chaîne CSV. */
export function toCsv(data: CsvData): string {
  const headerLine = data.headers.map(escapeCell).join(",");
  const dataLines = data.rows.map((row) => row.map(escapeCell).join(","));
  // BOM UTF-8 ajouté en tête → Excel ouvre directement en UTF-8 (sinon les
  // accents « é è à » s'affichent en mojibake style "Ã©").
  return "\uFEFF" + headerLine + "\n" + dataLines.join("\n") + "\n";
}

/** Télécharge un CSV via un Blob (compatible tous navigateurs modernes). */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  // Libère la mémoire après le clic
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ----------------------------------------------------------------------------
// Helpers spécifiques aux types de données du dashboard
// ----------------------------------------------------------------------------

/**
 * Série chronologique simple → CSV à 2 colonnes (date, valeur).
 */
export function timeseriesToCsv(
  points: { date: string; value: number }[],
  valueLabel = "valeur",
): CsvData {
  return {
    headers: ["date", valueLabel],
    rows: points.map((p) => [p.date, p.value]),
  };
}

/**
 * Plusieurs séries alignées par date → CSV avec une colonne par série.
 * Les dates absentes d'une série donnent une cellule vide.
 */
export function multiSeriesToCsv(
  series: { id: string; label: string; points: { date: string; value: number }[] }[],
): CsvData {
  // Collecte toutes les dates uniques
  const allDates = new Set<string>();
  for (const s of series) {
    for (const p of s.points) allDates.add(p.date);
  }
  const sortedDates = Array.from(allDates).sort();

  // Maps date → value pour chaque série, pour lookup rapide
  const maps = series.map((s) => {
    const m = new Map<string, number>();
    for (const p of s.points) m.set(p.date, p.value);
    return m;
  });

  return {
    headers: ["date", ...series.map((s) => s.label)],
    rows: sortedDates.map((d) => [
      d,
      ...maps.map((m) => m.get(d) ?? null),
    ]),
  };
}

/**
 * Tableau d'objets génériques → CSV avec en-têtes auto-déduites.
 * Utile pour exporter des breakdowns LFI ou des ventilations.
 */
export function objectsToCsv<T extends Record<string, unknown>>(
  rows: T[],
  columnOrder?: (keyof T)[],
): CsvData {
  if (rows.length === 0) return { headers: [], rows: [] };
  const keys = columnOrder ?? (Object.keys(rows[0]!) as (keyof T)[]);
  return {
    headers: keys.map(String),
    rows: rows.map((r) => keys.map((k) => r[k] as string | number | null)),
  };
}
