// ============================================================================
// GeoIP — résolution country code depuis une IP via ip-api.com
// ============================================================================
//
// API publique gratuite (45 req/min/IP), retourne le code pays ISO 2 lettres.
// Cache en mémoire : on ne ré-interroge pas la même IP plus d'une fois par
// période de TTL (24 h) — l'IP d'un visiteur ne change pas géographiquement.
//
// En cas de timeout / erreur, retourne null (la PageView sera enregistrée
// sans country, on n'empêche jamais le tracking de fonctionner).
//
// Privacy : on ne stocke JAMAIS l'IP en base, uniquement le country code.
// ============================================================================

interface CacheEntry {
  country: string | null;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const TTL_MS = 24 * 60 * 60 * 1000; // 24 h

// IPs locales / privées qu'on n'envoie pas à l'API (gain de temps)
function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  if (ip === "::1" || ip === "127.0.0.1" || ip === "localhost") return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("172.")) {
    const second = parseInt(ip.split(".")[1] ?? "0", 10);
    if (second >= 16 && second <= 31) return true;
  }
  // IPv6 link-local et unique-local
  if (ip.startsWith("fe80:") || ip.startsWith("fc") || ip.startsWith("fd")) return true;
  return false;
}

/**
 * Résout le code pays ISO 2 lettres pour une IP. Retourne null si :
 *   - IP invalide ou privée
 *   - timeout réseau (5 s)
 *   - API indisponible
 *
 * Mise en cache 24 h en mémoire (perdue au redémarrage, recalculée à la volée).
 */
export async function lookupCountry(ip: string): Promise<string | null> {
  if (!ip || isPrivateIp(ip)) return null;

  const now = Date.now();
  const cached = cache.get(ip);
  if (cached && cached.expiresAt > now) {
    return cached.country;
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    // ip-api.com : endpoint "/json/{ip}" retourne { country, countryCode, ... }
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode`, {
      signal: ctrl.signal,
      headers: { "User-Agent": "BudgetFrance-Analytics/1.0" },
    });
    clearTimeout(timer);
    if (!res.ok) {
      cache.set(ip, { country: null, expiresAt: now + TTL_MS });
      return null;
    }
    const body = (await res.json()) as { status?: string; countryCode?: string };
    const country = body.status === "success" && body.countryCode ? body.countryCode : null;
    cache.set(ip, { country, expiresAt: now + TTL_MS });
    return country;
  } catch {
    // Timeout ou erreur réseau : on cache "null" pour 1 h pour ne pas réessayer trop souvent
    cache.set(ip, { country: null, expiresAt: now + 60 * 60 * 1000 });
    return null;
  }
}

/**
 * Extrait l'IP réelle du client depuis la requête Fastify.
 * Caddy met l'IP réelle dans X-Forwarded-For ; Fastify avec trustProxy:true
 * la résout dans req.ip automatiquement.
 */
export function clientIpFromRequest(req: { ip?: string; headers: Record<string, string | string[] | undefined> }): string {
  // Priorité : req.ip (Fastify avec trust proxy)
  if (req.ip) return req.ip;
  // Fallback : X-Real-IP ou première IP de X-Forwarded-For
  const xri = req.headers["x-real-ip"];
  if (typeof xri === "string") return xri;
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string") return xff.split(",")[0]!.trim();
  return "";
}
