// ============================================================================
// routes/assistant.ts — Assistant IA pédagogique sur les finances publiques
// ============================================================================
//
// Endpoint POST /api/assistant/ask
//   Body : { question: string, history?: ChatMessage[] }
//   Réponse : { answer: string, sources?: string[], blocked?: boolean }
//
// Sécurité :
//   - Rate limit : 10 questions / heure / IP (Map en mémoire, reset hourly)
//   - System prompt strict : refuse tout ce qui n'est pas finances/économie
//   - Max 800 tokens en réponse (limite financière)
//   - IP hashée (RGPD, on ne stocke pas l'IP en clair)
//
// LLM : Anthropic Claude Haiku 4.5 (claude-haiku-4-5-20251001)
//   Coût estimé : ~$0,20-1,00 / 1000 questions moyennes.
//
// Clé API : variable d'environnement ANTHROPIC_API_KEY (à mettre dans .env).
// ============================================================================

import type { FastifyInstance, FastifyRequest } from "fastify";
import { createHash } from "node:crypto";

// ----------------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------------

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MAX_TOKENS_RESPONSE = 800;
const MAX_QUESTION_LENGTH = 600;
const RATE_LIMIT_PER_HOUR = 10;

// ----------------------------------------------------------------------------
// System prompt — la pièce maîtresse pour cadrer l'assistant
// ----------------------------------------------------------------------------

const SYSTEM_PROMPT = `Tu es l'assistant officiel de Budget France (budgetfrance.org), un site pédagogique sur les finances publiques françaises. Tu aides les visiteurs à comprendre le budget de l'État, la fiscalité, la Sécurité sociale, les comptes communaux, et l'économie publique.

RÈGLES STRICTES — TU DOIS LES SUIVRE INTÉGRALEMENT :

1. **PÉRIMÈTRE LIMITÉ** : tu réponds UNIQUEMENT aux questions liées à :
   - Le site Budget France et ses pages (dette publique, niches fiscales, salaires des élus, marchés publics, etc.)
   - Le budget de l'État français, la Loi de Finances Initiale (LFI), les missions budgétaires
   - La fiscalité (IR, IS, TVA, taxes locales, niches fiscales)
   - La dette publique française et son contexte européen
   - La Sécurité sociale et ses 5 branches + Unédic
   - Les collectivités territoriales (régions, départements, communes, EPCI)
   - L'économie publique française, européenne, et comparaisons internationales OCDE
   - Les concepts pédagogiques (CSG, CRDS, CADES, déficit, dette/PIB, etc.)

   Si la question SORT de ce périmètre (météo, recettes de cuisine, sport, politique partisane, code informatique, vie personnelle, etc.), refuse poliment et propose de revenir sur le sujet du site.

2. **CITATIONS OBLIGATOIRES** : pour CHAQUE affirmation chiffrée ou factuelle, mentionne explicitement la source à la fin entre crochets, format "[Source : XXX]".
   Exemples de sources légitimes : INSEE, Eurostat, Banque de France, Cour des comptes, OFGL, Bercy/DGFiP, Voies et moyens PLF, LFSS, France Stratégie, IPP (Institut des Politiques Publiques), CPO, OCDE, LFI 2025.

   Si tu ne connais pas la source précise, dis-le clairement : "Source incertaine, à vérifier auprès de [organisme pertinent]".

3. **LIENS INTERNES** : quand c'est pertinent, oriente vers les pages du site avec leur URL hash :
   - Tableau de bord (dette, OAT) : #/
   - Niches fiscales : #/niches-fiscales
   - Salaires des élus : #/salaires-elus
   - Marchés publics : #/marches-publics
   - Aides aux entreprises : #/aides-entreprises
   - Fiscalité par secteur : #/fiscalite-secteur
   - Dette entreprises publiques : #/dette-entreprises-publiques
   - Sécu en détail : #/securite-sociale
   - Police, Justice, Prisons : #/regalien
   - Mes impôts : #/mes-impots
   - Ma ville : #/villes/[slug-commune]
   - Glossaire : #/glossaire
   - Données publiques : #/donnees-publiques

4. **PAS DE CONSEIL PERSONNEL FISCAL OU JURIDIQUE** : tu peux expliquer le fonctionnement de l'IR mais pas conseiller "tu devrais déclarer ainsi". Renvoie vers impots.gouv.fr ou un conseiller fiscal.

5. **POSITION POLITIQUE** : neutre, factuel, jamais partisan. Présente les arguments de chaque bord quand pertinent.

6. **HONNÊTETÉ** : si tu n'es pas sûr d'un chiffre, dis-le. Mieux vaut "je ne sais pas précisément" qu'inventer.

7. **TON** : pédagogique, accessible, court (3-6 phrases idéalement). Évite le jargon non expliqué.

8. **LANGUE** : français exclusivement.

EXEMPLES DE BONNES RÉPONSES :

Q: "Combien rapporte la TVA à la France ?"
R: "La TVA est la première recette fiscale française : environ 200 Md€/an en 2024, soit environ 40 % des recettes fiscales nettes de l'État [Source : LFI 2025]. Pour le détail des recettes par catégorie, voir la page Tableau de bord (#/) ou Mes impôts (#/mes-impots)."

Q: "Quel temps fait-il à Paris ?"
R: "Je suis un assistant spécialisé sur les finances publiques françaises. Je ne peux pas répondre aux questions météo. En revanche, si tu veux connaître le budget de Paris, regarde la fiche dédiée : #/villes/paris."

Q: "C'est quoi la CSG ?"
R: "La Contribution Sociale Généralisée (CSG) est un prélèvement créé en 1991 qui finance la Sécurité sociale. Taux standard : 9,2 % sur les salaires. Elle représente environ 100 Md€/an, soit la 2ᵉ recette fiscale française après la TVA [Source : LFSS 2024]. Plus de détails dans le glossaire (#/glossaire) ou sur la page Sécu en détail (#/securite-sociale)."

Réponds toujours en respectant ces 8 règles.`;

// ----------------------------------------------------------------------------
// Rate limit en mémoire (Map keyed by IP-hash → array de timestamps dans la dernière heure)
// ----------------------------------------------------------------------------

const rateLimitStore = new Map<string, number[]>();
const HOUR_MS = 60 * 60 * 1000;

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

function checkRateLimit(ipHash: string): {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
} {
  const now = Date.now();
  const cutoff = now - HOUR_MS;
  const history = (rateLimitStore.get(ipHash) ?? []).filter((t) => t > cutoff);
  rateLimitStore.set(ipHash, history);

  const remaining = RATE_LIMIT_PER_HOUR - history.length;
  if (history.length >= RATE_LIMIT_PER_HOUR) {
    const oldestInWindow = Math.min(...history);
    return {
      allowed: false,
      remaining: 0,
      resetInMs: oldestInWindow + HOUR_MS - now,
    };
  }
  history.push(now);
  return { allowed: true, remaining: remaining - 1, resetInMs: HOUR_MS };
}

// Nettoyage périodique pour éviter une fuite mémoire (toutes les heures)
setInterval(
  () => {
    const cutoff = Date.now() - HOUR_MS;
    for (const [key, history] of rateLimitStore.entries()) {
      const filtered = history.filter((t) => t > cutoff);
      if (filtered.length === 0) rateLimitStore.delete(key);
      else rateLimitStore.set(key, filtered);
    }
  },
  60 * 60 * 1000,
);

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AskBody {
  question: string;
  history?: ChatMessage[];
}

interface AnthropicResponse {
  content: { type: string; text: string }[];
  stop_reason?: string;
  usage?: { input_tokens: number; output_tokens: number };
}

// ----------------------------------------------------------------------------
// Helper : extraire les sources mentionnées dans une réponse
// ----------------------------------------------------------------------------

function extractSources(text: string): string[] {
  const re = /\[Source ?: ?([^\]]+)\]/gi;
  const sources = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    sources.add(match[1]!.trim());
  }
  return Array.from(sources);
}

// ----------------------------------------------------------------------------
// Helper : appel API Anthropic
// ----------------------------------------------------------------------------

async function callAnthropic(
  question: string,
  history: ChatMessage[],
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY non configurée. Ajouter la clé dans .env du backend.",
    );
  }

  // Construire la liste de messages : historique court + question actuelle
  const messages = [
    ...history.slice(-8).map((m) => ({
      role: m.role,
      content: String(m.content).slice(0, 2000),
    })),
    { role: "user" as const, content: question },
  ];

  const resp = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: MAX_TOKENS_RESPONSE,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Anthropic API ${resp.status} : ${errText.slice(0, 300)}`);
  }

  const data = (await resp.json()) as AnthropicResponse;
  const text = (data.content ?? [])
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Réponse vide d'Anthropic.");
  }

  return text;
}

// ----------------------------------------------------------------------------
// Route
// ----------------------------------------------------------------------------

export function registerAssistantRoutes(app: FastifyInstance) {
  app.post("/api/assistant/ask", async (req: FastifyRequest, reply) => {
    // 1. Récupérer IP client (gérer reverse proxy)
    const ipRaw =
      (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
      req.ip ??
      "unknown";
    const ipHash = hashIp(ipRaw);

    // 2. Rate limit
    const rl = checkRateLimit(ipHash);
    reply.header("X-RateLimit-Limit", String(RATE_LIMIT_PER_HOUR));
    reply.header("X-RateLimit-Remaining", String(Math.max(0, rl.remaining)));
    if (!rl.allowed) {
      return reply.code(429).send({
        error: "rate_limited",
        message: `Limite de ${RATE_LIMIT_PER_HOUR} questions/heure atteinte. Réessaye dans ${Math.ceil(rl.resetInMs / 60000)} minutes.`,
        resetInSec: Math.ceil(rl.resetInMs / 1000),
      });
    }

    // 3. Valider le body
    const body = req.body as AskBody | undefined;
    const question = String(body?.question ?? "").trim();
    if (!question) {
      return reply.code(400).send({ error: "question_required" });
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      return reply.code(400).send({
        error: "question_too_long",
        message: `Question limitée à ${MAX_QUESTION_LENGTH} caractères. La tienne fait ${question.length} caractères.`,
      });
    }

    const history = Array.isArray(body?.history) ? body.history : [];

    // 4. Appel LLM
    try {
      const answer = await callAnthropic(question, history);
      const sources = extractSources(answer);
      return reply.send({ answer, sources });
    } catch (err) {
      const message = (err as Error).message ?? "unknown error";
      // Log côté serveur
      req.log.error({ err: message }, "[assistant] erreur appel LLM");
      // Message générique côté client (pas de fuite de la clé API)
      return reply.code(500).send({
        error: "llm_error",
        message:
          "L'assistant est temporairement indisponible. Tu peux explorer les pages du site directement, ou réessayer plus tard.",
      });
    }
  });

  // Endpoint de diagnostic pour savoir si l'assistant est configuré
  app.get("/api/assistant/status", async () => {
    return {
      enabled: Boolean(process.env.ANTHROPIC_API_KEY),
      model: ANTHROPIC_MODEL,
      rateLimit: `${RATE_LIMIT_PER_HOUR} questions/heure/IP`,
    };
  });
}
