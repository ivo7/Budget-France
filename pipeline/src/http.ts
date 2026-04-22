// Wrapper autour de fetch (natif depuis Node 18+, stable en 22+).
// Pas de dépendance externe pour garder le pipeline léger.

export interface FetchOptions {
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export async function httpGet(url: string, opts: FetchOptions = {}): Promise<string> {
  const { timeoutMs = 15_000, headers = {} } = opts;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "budget-france-pipeline/0.1 (+https://github.com/budget-france)",
        Accept: "application/json, text/csv, application/xml;q=0.9, */*;q=0.5",
        ...headers,
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function httpGetJson<T = unknown>(url: string, opts: FetchOptions = {}): Promise<T> {
  const body = await httpGet(url, opts);
  try {
    return JSON.parse(body) as T;
  } catch (e) {
    throw new Error(`Invalid JSON from ${url}: ${(e as Error).message}`);
  }
}
