import { useEffect, useState } from "react";

/**
 * Retourne la valeur courante de location.hash (sans le '#'), et met à jour
 * le composant quand elle change. Simple et sans dépendance de routing.
 */
export function useHashRoute(): string {
  const [hash, setHash] = useState<string>(() => window.location.hash.replace(/^#\/?/, ""));

  useEffect(() => {
    const onChange = () => setHash(window.location.hash.replace(/^#\/?/, ""));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return hash;
}
