// ============================================================================
// useCommune — hooks pour la recherche et le fetch de communes via l'API
// ============================================================================
//
// Phase 2 : on bascule du snapshot statique (40 villes) vers la DB Postgres
// (toutes les communes françaises). Ces hooks servent d'adaptateur.
//
// Stratégie de fallback :
//   - Si l'API répond → utilise les données de la DB (jusqu'à 35 000 communes)
//   - Si l'API échoue → fallback sur le snapshot local (40 villes Phase 1)
//
// Cela garantit que la page « Ma ville » fonctionne même si la DB n'est pas
// encore peuplée par l'import DGFiP.
// ============================================================================

import { useEffect, useState } from "react";

// ----------------------------------------------------------------------------
// Types renvoyés par l'API
// ----------------------------------------------------------------------------

export interface CommuneSearchResult {
  codeInsee: string;
  nom: string;
  slug: string;
  departement: string;
  population: number;
  classification: string;
}

export interface CommuneDetail {
  commune: {
    codeInsee: string;
    nom: string;
    slug: string;
    departement: string;
    departementCode: string;
    region: string;
    population: number;
    classification: string;
    metropole: string | null;
  };
  finances: {
    annee: number;
    recettesTotalesEur: number;
    recettesFonctionnementEur: number;
    recettesInvestEur: number;
    depensesTotalesEur: number;
    depensesFonctionnementEur: number;
    depensesInvestEur: number;
    soldeBudgetaireEur: number;
    budgetTotalEur: number;
    detteEncoursEur: number;
    chargeDetteEur: number;
    amortissementCapitalEur: number;
    capaciteAutofinancementEur: number;
    depensesPersonnelEur: number;
    depensesChargesGeneralesEur: number;
    depensesSubventionsEur: number;
    recettesImpotsLocauxEur: number;
    recettesDotationsEtatEur: number;
    recettesSubventionsEur: number;
    recettesServicesEur: number;
    compoRecettesImpotsPct: number;
    compoRecettesDotationsPct: number;
    compoRecettesSubvPct: number;
    compoRecettesServicesPct: number;
    compoRecettesAutresPct: number;
    compoDepensesPersonnelPct: number;
    compoDepensesGeneralesPct: number;
    compoDepensesSubvPct: number;
    compoDepensesFinancieresPct: number;
    compoDepensesInvestPct: number;
    source: string;
  }[];
}

// ----------------------------------------------------------------------------
// useCommuneSearch — recherche autocomplete via l'API
// ----------------------------------------------------------------------------

export function useCommuneSearch(query: string, limit: number = 20) {
  const [results, setResults] = useState<CommuneSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Petit debounce manuel : 200 ms
    const timer = setTimeout(() => {
      const url = `/api/communes/search?q=${encodeURIComponent(query)}&limit=${limit}`;
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data: { results: CommuneSearchResult[] }) => {
          if (cancelled) return;
          setResults(data.results ?? []);
          setLoading(false);
        })
        .catch((e: Error) => {
          if (cancelled) return;
          setError(e.message);
          setLoading(false);
        });
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, limit]);

  return { results, loading, error };
}

// ----------------------------------------------------------------------------
// useCommuneDetail — fetch d'une commune complète via son code/slug
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// useCommuneVoisines — fetch voisines géographiques + strate similaire
// ----------------------------------------------------------------------------

export interface CommuneVoisine {
  codeInsee: string;
  slug: string;
  nom: string;
  departement: string;
  departementCode: string;
  population: number;
  classification: string;
  annee: number;
  budgetParHab: number;
  recettesParHab: number;
  depensesParHab: number;
  detteParHab: number;
  chargeDetteParHab: number;
  cafParHab: number;
  personnelParHab: number;
  investParHab: number;
  impotsLocauxParHab: number;
  tauxEpargneBrute: number;
  capaciteDesendettement: number;
}

export interface CommuneVoisinesResponse {
  moi: CommuneVoisine | null;
  meta: {
    departement: string;
    departementCode: string;
    region: string;
    classification: string;
    /** Indique si le voisinage est au niveau département ou élargi à la région
     *  (cas Paris, DROM uniques dans leur département). */
    voisinageType: "departement" | "region";
    /** Libellé du périmètre géographique utilisé (ex. "Aube (10)" ou "Île-de-France"). */
    voisinageScope: string;
    nbVoisinesDept: number;
    nbVoisinesStrate: number;
  };
  voisinesDept: CommuneVoisine[];
  voisinesStrate: CommuneVoisine[];
}

export function useCommuneVoisines(slugOrCode: string | null, limit: number = 12) {
  const [data, setData] = useState<CommuneVoisinesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slugOrCode) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/communes/${encodeURIComponent(slugOrCode)}/voisines?limit=${limit}`)
      .then((res) => {
        if (res.status === 404) throw new Error("not_found");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((d: CommuneVoisinesResponse) => {
        if (cancelled) return;
        setData(d);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slugOrCode, limit]);

  return { data, loading, error };
}

export function useCommuneDetail(slugOrCode: string | null) {
  const [data, setData] = useState<CommuneDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slugOrCode) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/communes/${encodeURIComponent(slugOrCode)}`)
      .then((res) => {
        if (res.status === 404) throw new Error("not_found");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((d: CommuneDetail) => {
        if (cancelled) return;
        setData(d);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slugOrCode]);

  return { data, loading, error };
}
