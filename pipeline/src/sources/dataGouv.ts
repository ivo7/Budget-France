// Source data.gouv.fr — budget de l'État (LFI, exécution).
// MVP : reachability check sur l'API des datasets + extraction des métadonnées
// du dataset PLF/LFI le plus récent. L'agrégation des montants détaillés par
// mission est reportée à une itération ultérieure.

import { httpGetJson } from "../http.ts";
import type { SourceInfo } from "../types.ts";

interface DatasetSearch {
  data: Array<{
    id: string;
    title: string;
    page: string;
    last_modified?: string;
  }>;
}

export async function pingBudgetEtat(): Promise<SourceInfo> {
  // On cherche le dataset "budget de l'État".
  const url = "https://www.data.gouv.fr/api/1/datasets/?q=loi+de+finances&page_size=5";
  try {
    const body = await httpGetJson<DatasetSearch>(url, { timeoutMs: 12_000 });
    const hit = body.data?.[0];
    if (!hit) throw new Error("data.gouv.fr : aucun dataset LFI trouvé");
    return {
      id: "datagouv.lfi",
      label: `data.gouv.fr — ${hit.title}`,
      url: hit.page,
      fetchedAt: new Date().toISOString(),
      status: "ok",
    };
  } catch (e) {
    return {
      id: "datagouv.lfi",
      label: "data.gouv.fr — Loi de finances",
      url: "https://www.data.gouv.fr/fr/datasets/?q=loi+de+finances",
      fetchedAt: new Date().toISOString(),
      status: "error",
      error: (e as Error).message,
    };
  }
}
