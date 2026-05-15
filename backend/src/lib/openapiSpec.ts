// ============================================================================
// openapiSpec.ts — spécification OpenAPI 3.0 de l'API publique Budget France
// ============================================================================
//
// Cette spec est servie par GET /api/openapi.json et affichée via Redoc sur
// la page /api-docs du frontend. Elle documente tous les endpoints publics
// utilisables par les chercheurs, journalistes, développeurs tiers.
//
// L'API est en lecture seule, ouverte (pas d'authentification), avec un
// rate-limit global (30 req/min/IP).
//
// Pour la maintenir : à chaque nouvel endpoint public ajouté, mettre à jour
// la propriété `paths` ci-dessous. Les schémas réutilisables vont dans
// `components.schemas`.
// ============================================================================

export const OPENAPI_SPEC = {
  openapi: "3.0.3",
  info: {
    title: "Budget France — API publique",
    version: "1.0.0",
    description: `API publique en lecture seule pour explorer les finances publiques françaises.

## Public cible

- **Chercheurs** (économie publique, finances locales, sociologie fiscale)
- **Journalistes** économiques et data-journalistes
- **Développeurs** souhaitant intégrer Budget France dans leurs applications
- **Citoyens curieux** voulant les données brutes derrière chaque chiffre du site

## Caractéristiques

- **Lecture seule** : aucune authentification requise
- **Rate-limit** : 30 requêtes/minute/IP (suffisant pour usage normal). Pour des besoins lourds (scraping massif, recherche académique), contacter Budget France.
- **Format** : JSON, sérialisation BigInt → Number (les budgets communaux tiennent dans Number.MAX_SAFE_INTEGER)
- **Mise à jour des données** : annuelle pour OFGL (comptes communes), quotidienne pour les indicateurs marchés (OAT, BCE), mensuelle pour Bercy

## Sources des données

Toutes les sources sont publiques et listées sur [/sources](https://budgetfrance.org/#/sources) et [/donnees-publiques](https://budgetfrance.org/#/donnees-publiques) :

- **OFGL** (Observatoire des Finances et de la Gestion publique Locales) — comptes communaux
- **DGFiP** (Direction Générale des Finances Publiques) — comptabilité publique
- **INSEE** — comptes nationaux, démographie
- **Eurostat** — comparaisons UE harmonisées (norme Maastricht)
- **Banque de France / BCE** — taux et indicateurs monétaires
- **Bercy** (Budget, LFI, Voies et moyens) — budget de l'État
- **Cour des comptes** — évaluations indépendantes

## Licence

Données publiques sous licence ouverte Etalab 2.0. Vous pouvez les réutiliser librement à des fins commerciales et non commerciales, à condition de citer la source : *« Budget France, d'après OFGL/DGFiP/INSEE/Eurostat »*.

## Contact

Pour un usage massif, un partenariat data, ou signaler une erreur :
[contact@budgetfrance.org](mailto:contact@budgetfrance.org)`,
    contact: {
      name: "Budget France",
      url: "https://budgetfrance.org",
      email: "contact@budgetfrance.org",
    },
    license: {
      name: "Licence Ouverte 2.0 (Etalab)",
      url: "https://www.etalab.gouv.fr/licence-ouverte-open-licence/",
    },
  },
  servers: [
    {
      url: "https://budgetfrance.org",
      description: "Production",
    },
  ],
  tags: [
    {
      name: "Communes",
      description:
        "Données budgétaires des 34 932 communes françaises (sources OFGL/DGFiP, mise à jour annuelle).",
    },
    {
      name: "Données nationales",
      description:
        "Séries chronologiques et indicateurs nationaux (dette publique, OAT, déficit, etc.).",
    },
    {
      name: "Système",
      description: "Santé et statistiques de l'API.",
    },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["Système"],
        summary: "État de santé du backend",
        description:
          "Retourne l'état du service : base de données, transport email, snapshot des données nationales.",
        responses: {
          "200": {
            description: "Service opérationnel",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Health" },
              },
            },
          },
        },
      },
    },
    "/api/communes/stats": {
      get: {
        tags: ["Communes"],
        summary: "Statistiques globales communes",
        description:
          "Nombre total de communes en base, communes avec données financières, dernière année disponible.",
        responses: {
          "200": {
            description: "Stats globales",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CommunesStats" },
              },
            },
          },
        },
      },
    },
    "/api/communes/search": {
      get: {
        tags: ["Communes"],
        summary: "Recherche de communes",
        description:
          "Recherche par nom (insensible aux accents et à la casse), code INSEE (5 chiffres) ou code département (2-3 chiffres). Si la requête est vide, retourne les 8 plus peuplées par défaut.",
        parameters: [
          {
            name: "q",
            in: "query",
            description: "Terme de recherche (nom, INSEE ou département)",
            required: false,
            schema: { type: "string" },
            example: "lyon",
          },
          {
            name: "limit",
            in: "query",
            description: "Nombre maximum de résultats (1-50)",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
          },
        ],
        responses: {
          "200": {
            description: "Résultats de recherche",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    results: {
                      type: "array",
                      items: { $ref: "#/components/schemas/CommuneSearchResult" },
                    },
                    total: { type: "integer", example: 12 },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/communes/{code}": {
      get: {
        tags: ["Communes"],
        summary: "Fiche complète d'une commune",
        description:
          "Retourne le référentiel commune + l'historique financier complet (toutes années disponibles). Le `code` peut être un code INSEE (5 chiffres) OU un slug (ex. `paris`, `lyon`, `saint-martin-32`).",
        parameters: [
          {
            name: "code",
            in: "path",
            description: "Code INSEE ou slug",
            required: true,
            schema: { type: "string" },
            example: "lyon",
          },
        ],
        responses: {
          "200": {
            description: "Fiche commune",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CommuneDetail" },
              },
            },
          },
          "404": {
            description: "Commune introuvable",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/communes/{code}/voisines": {
      get: {
        tags: ["Communes"],
        summary: "Communes voisines (département + même strate)",
        description:
          "Retourne les `limit` communes du même département (hors elle-même) + `limit` communes de même classification démographique (strate OFGL) dans d'autres départements. Si la commune est seule dans son département (cas Paris, certaines DROM), élargit automatiquement au niveau régional.",
        parameters: [
          {
            name: "code",
            in: "path",
            description: "Code INSEE ou slug",
            required: true,
            schema: { type: "string" },
            example: "troyes",
          },
          {
            name: "limit",
            in: "query",
            description: "Nombre maximum de voisines par catégorie (1-30)",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 30, default: 12 },
          },
        ],
        responses: {
          "200": {
            description: "Voisines + commune courante",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VoisinsResponse" },
              },
            },
          },
          "404": {
            description: "Commune introuvable",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/communes/rankings": {
      get: {
        tags: ["Communes"],
        summary: "Classement national des communes",
        description:
          "Calcule et retourne le classement national pour un indicateur donné, sur une année donnée. Indicateurs disponibles : budget-hab, dette-hab, investissement-hab, personnel-hab, caf-hab, capacite-desendettement, taux-epargne-brute.",
        parameters: [
          {
            name: "indicator",
            in: "query",
            description: "Indicateur à classer",
            required: false,
            schema: {
              type: "string",
              enum: [
                "budget-hab",
                "dette-hab",
                "investissement-hab",
                "personnel-hab",
                "caf-hab",
                "capacite-desendettement",
                "taux-epargne-brute",
              ],
              default: "dette-hab",
            },
          },
          {
            name: "year",
            in: "query",
            description: "Année du classement",
            required: false,
            schema: { type: "integer", default: 2024 },
          },
          {
            name: "limit",
            in: "query",
            description: "Nombre de résultats (1-500)",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 500, default: 50 },
          },
          {
            name: "dir",
            in: "query",
            description: "Sens du tri",
            required: false,
            schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
          },
        ],
        responses: {
          "200": {
            description: "Classement",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RankingResponse" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Health: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: true },
          db: { type: "boolean", example: true },
          email: {
            type: "object",
            properties: {
              ok: { type: "boolean" },
              mode: { type: "string" },
            },
          },
          snapshot: { type: "boolean", example: true },
          confirmedSubscribers: { type: "integer", example: 3 },
          now: { type: "string", format: "date-time" },
        },
      },
      CommunesStats: {
        type: "object",
        properties: {
          totalCommunes: { type: "integer", example: 34932 },
          communesAvecFinances: { type: "integer", example: 34932 },
          derniereAnnee: { type: "integer", example: 2024 },
        },
      },
      CommuneSearchResult: {
        type: "object",
        properties: {
          codeInsee: { type: "string", example: "69123" },
          nom: { type: "string", example: "Lyon" },
          slug: { type: "string", example: "lyon" },
          departement: { type: "string", example: "Rhône (69)" },
          population: { type: "integer", example: 522228 },
          classification: { type: "string", example: "Très grande ville" },
        },
      },
      CommuneFinances: {
        type: "object",
        description:
          "Comptes annuels d'une commune. Tous les montants en euros (sérialisation BigInt → Number JSON-safe).",
        properties: {
          annee: { type: "integer", example: 2023 },
          recettesTotalesEur: { type: "number", example: 1500000000 },
          recettesFonctionnementEur: { type: "number" },
          recettesInvestEur: { type: "number" },
          depensesTotalesEur: { type: "number" },
          depensesFonctionnementEur: { type: "number" },
          depensesInvestEur: { type: "number" },
          soldeBudgetaireEur: { type: "number" },
          budgetTotalEur: { type: "number" },
          detteEncoursEur: {
            type: "number",
            description: "Encours de dette (stock à la clôture)",
          },
          chargeDetteEur: {
            type: "number",
            description: "Intérêts seuls (compte 661 M14)",
          },
          amortissementCapitalEur: {
            type: "number",
            description: "Remboursement annuel du capital",
          },
          capaciteAutofinancementEur: {
            type: "number",
            description: "CAF = épargne brute",
          },
          depensesPersonnelEur: { type: "number" },
          depensesChargesGeneralesEur: { type: "number" },
          depensesSubventionsEur: { type: "number" },
          recettesImpotsLocauxEur: { type: "number" },
          recettesDotationsEtatEur: { type: "number" },
          recettesSubventionsEur: { type: "number" },
          recettesServicesEur: { type: "number" },
          compoRecettesImpotsPct: { type: "number" },
          compoRecettesDotationsPct: { type: "number" },
          compoRecettesSubvPct: { type: "number" },
          compoRecettesServicesPct: { type: "number" },
          compoRecettesAutresPct: { type: "number" },
          compoDepensesPersonnelPct: { type: "number" },
          compoDepensesGeneralesPct: { type: "number" },
          compoDepensesSubvPct: { type: "number" },
          compoDepensesFinancieresPct: { type: "number" },
          compoDepensesInvestPct: { type: "number" },
          source: {
            type: "string",
            example: "OFGL base communes consolidée 2023",
          },
        },
      },
      CommuneDetail: {
        type: "object",
        properties: {
          commune: {
            type: "object",
            properties: {
              codeInsee: { type: "string" },
              nom: { type: "string" },
              slug: { type: "string" },
              departement: { type: "string" },
              departementCode: { type: "string" },
              region: { type: "string" },
              population: { type: "integer" },
              classification: { type: "string" },
              metropole: {
                type: "string",
                nullable: true,
                description: "Statut métropole le cas échéant (Loi MAPTAM/NOTRe)",
              },
            },
          },
          finances: {
            type: "array",
            items: { $ref: "#/components/schemas/CommuneFinances" },
          },
        },
      },
      CommuneVoisine: {
        type: "object",
        description:
          "Commune avec ses indicateurs clés en €/habitant pour la dernière année.",
        properties: {
          codeInsee: { type: "string" },
          slug: { type: "string" },
          nom: { type: "string" },
          departement: { type: "string" },
          departementCode: { type: "string" },
          population: { type: "integer" },
          classification: { type: "string" },
          annee: { type: "integer" },
          budgetParHab: { type: "number" },
          recettesParHab: { type: "number" },
          depensesParHab: { type: "number" },
          detteParHab: { type: "number" },
          chargeDetteParHab: { type: "number" },
          cafParHab: { type: "number" },
          personnelParHab: { type: "number" },
          investParHab: { type: "number" },
          impotsLocauxParHab: { type: "number" },
          tauxEpargneBrute: {
            type: "number",
            description: "Taux d'épargne brute en % (CAF / recettes totales × 100)",
          },
          capaciteDesendettement: {
            type: "number",
            description:
              "Capacité de désendettement en années (encours / CAF). 999 si CAF ≤ 0.",
          },
        },
      },
      VoisinsResponse: {
        type: "object",
        properties: {
          moi: { $ref: "#/components/schemas/CommuneVoisine" },
          meta: {
            type: "object",
            properties: {
              departement: { type: "string" },
              departementCode: { type: "string" },
              region: { type: "string" },
              classification: { type: "string" },
              voisinageType: {
                type: "string",
                enum: ["departement", "region"],
                description:
                  "Niveau du voisinage géographique. `region` si la commune est seule dans son département (Paris, certaines DROM).",
              },
              voisinageScope: {
                type: "string",
                description: "Libellé du périmètre géographique utilisé",
              },
              nbVoisinesDept: { type: "integer" },
              nbVoisinesStrate: { type: "integer" },
            },
          },
          voisinesDept: {
            type: "array",
            items: { $ref: "#/components/schemas/CommuneVoisine" },
          },
          voisinesStrate: {
            type: "array",
            items: { $ref: "#/components/schemas/CommuneVoisine" },
          },
        },
      },
      RankingRow: {
        type: "object",
        properties: {
          codeInsee: { type: "string" },
          slug: { type: "string" },
          nom: { type: "string" },
          departement: { type: "string" },
          population: { type: "integer" },
          value: {
            type: "number",
            description:
              "Valeur de l'indicateur sélectionné, arrondie à 2 décimales",
          },
        },
      },
      RankingResponse: {
        type: "object",
        properties: {
          indicator: { type: "string" },
          year: { type: "integer" },
          direction: { type: "string", enum: ["asc", "desc"] },
          results: {
            type: "array",
            items: { $ref: "#/components/schemas/RankingRow" },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "not_found" },
          message: { type: "string" },
        },
      },
    },
  },
};
