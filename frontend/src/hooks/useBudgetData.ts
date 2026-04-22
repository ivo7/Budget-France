import { useEffect, useState } from "react";
import type { BudgetSnapshot } from "../types";

interface State {
  data: BudgetSnapshot | null;
  loading: boolean;
  error: string | null;
}

/**
 * Charge le snapshot budget.json servi en statique par nginx (ou par Vite en dev).
 * Rafraîchit toutes les 5 minutes.
 */
export function useBudgetData(): State {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const url = `${import.meta.env.BASE_URL}data/budget.json?ts=${Date.now()}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as BudgetSnapshot;
        if (!cancelled) setState({ data: json, loading: false, error: null });
      } catch (e) {
        if (!cancelled) setState({ data: null, loading: false, error: (e as Error).message });
      }
    }

    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return state;
}
