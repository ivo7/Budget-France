# Budget France — Temps réel

Plateforme qui affiche en **temps réel** les finances publiques de l'État français :
dette publique, budget prévisionnel, budget exécuté, taux d'intérêt, ratio dette/PIB.

Les données sont agrégées depuis plusieurs sources officielles (**Eurostat, INSEE,
BCE, Banque de France, data.gouv.fr**) avec une logique de **redondance** : si
une source est indisponible, le pipeline bascule automatiquement sur la suivante.

---

## Pitch investisseur (30 s)

> Chaque seconde, la dette publique française augmente d'environ **5 500 €**.
> Personne ne voit ce chiffre bouger en direct — les ministères publient des
> chiffres figés, parfois plusieurs mois après. **Budget France** rend cette
> réalité tangible avec un compteur en direct, des KPIs macro clairs, et une
> traçabilité complète des sources. Socle open-source, pipeline Node, déploiement
> Docker en une commande.

---

## Démarrage rapide

Prérequis : **Docker Desktop** + **Node ≥ 22** installés sur ta machine.

```bash
# 1. Copie les variables d'environnement et renseigne ton SMTP (voir plus bas)
cp .env.example .env

# 2. Lance tout d'un coup (postgres + backend + pipeline + frontend)
docker compose up --build

# 3. Ouvre le dashboard
open http://localhost:4280
```

Le pipeline ingère les données au démarrage puis les rafraîchit toutes les 6 h.
Le dashboard recharge `data/budget.json` toutes les 5 minutes côté client.

### Exécution manuelle du pipeline

```bash
# ingestion réelle (interroge Eurostat, BCE, etc.)
docker compose run --rm pipeline

# ingestion en mode mock (pas de réseau, seed uniquement)
docker compose run --rm pipeline --mock

# pour une année différente
docker compose run --rm pipeline --annee 2025
```

### Configurer l'envoi d'emails

Le backend envoie des emails transactionnels (confirmation d'inscription, bulletin
mensuel, alertes de seuil). Il faut un fournisseur SMTP. Trois options gratuites
recommandées — choisis-en une, crée un compte, vérifie ton domaine, et renseigne
les 4 variables dans `.env` :

| Provider | Quota gratuit | Vérif. domaine | Où trouver SMTP |
|---|---|---|---|
| **Resend** (recommandé) | 3 000 emails/mois | Oui, rapide | https://resend.com/docs/send-with-smtp |
| **Brevo** (ex-Sendinblue) | 9 000 emails/mois | Oui | https://app.brevo.com/settings/keys/smtp |
| **Mailjet** | 6 000 emails/mois | Oui | https://app.mailjet.com/account/api_keys |

Une fois `.env` rempli, relance `docker compose up` : le backend affiche au
démarrage `email transport: { mode: 'SMTP smtp.xxx:587' }` si la config est OK.
Si tu laisses `SMTP_HOST` vide, les emails sont loggués dans les logs Docker
au lieu d'être envoyés (utile pour tester sans compte provider).

### Simulateur "Où vont mes impôts ?" — hypothèses

La page `#/mes-impots` permet à un visiteur de saisir son salaire mensuel net
et de voir la répartition estimée de sa contribution au budget de l'État.

**Ordre de grandeur, pas un avis d'imposition officiel.** Hypothèses exactes
utilisées (voir `frontend/src/lib/taxSimulator.ts`) :

- **Barème IR 2024** (revenus 2024, payés en 2025) à 5 tranches : 0 %, 11 %, 30 %, 41 %, 45 %
- **1 part fiscale** par défaut (célibataire sans enfant)
- **Abattement forfaitaire** de 10 % sur les salaires, plafonné à 14 171 €
- **TVA** estimée à **7 % du revenu net** (taux effectif moyen pondéré entre 5,5 %, 10 % et 20 %, source : INSEE comptes des ménages)
- **TICPE + autres taxes indirectes** : ~1 % du revenu net

**Ce qui n'est PAS compté** :
- CSG / CRDS (alimentent la Sécurité sociale, pas l'État)
- Cotisations salariales (retraite, chômage)
- Niches fiscales, crédits d'impôt, revenus du capital
- Taxes locales (taxe foncière, redevance audiovisuelle)

La contribution totale est ensuite répartie **au prorata de la LFI
des dépenses de l'État par mission** (`data.repartition.depenses`).

### Webhooks sortants — intégration Slack / Discord / générique

À chaque alerte de seuil franchi (dette qui bouge de plus de 50 Md€, OAT qui
saute de plus de 20 pb…), le backend peut notifier des canaux externes en
plus des emails aux abonnés. Trois transports optionnels, indépendants :

| Transport | Format | Doc |
|---|---|---|
| **Slack** | Block Kit (header + fields + bouton) | https://api.slack.com/messaging/webhooks |
| **Discord** | Embed coloré avec fields | Paramètres canal → Intégrations → Webhooks |
| **Générique** | POST JSON brut | n'importe quel endpoint qui accepte `Content-Type: application/json` |

Configuration dans `.env` :

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/TXXXX/BXXXX/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
GENERIC_WEBHOOK_URL=https://ton-serveur.fr/alerts
```

Tu peux configurer les trois simultanément. Les envois sont parallèles et
les échecs de l'un ne bloquent pas les autres.

### API publique — datasets centralisés

Au démarrage, le backend charge en base Postgres **tous les datasets** qui
alimentent les graphiques (séries longues 1945+, composition des recettes et
dépenses, répartition LFI par année). Ces données sont exposées en lecture
seule via l'API REST :

| Endpoint | Ce qu'il renvoie |
|---|---|
| `GET /api/datasets` | Liste de toutes les séries (slug, type, période, source) |
| `GET /api/datasets/:slug` | Une série avec ses points, filtrable par `?from=YYYY-MM-DD&to=YYYY-MM-DD` |
| `GET /api/composition` | Catégories historiques de recettes et dépenses (TVA, IR, IS, Défense…) avec leurs points annuels |
| `GET /api/lfi/:annee` | Répartition LFI pour une année donnée |
| `GET /api/ratings/france` | Historique des notations souveraines S&P / Moody's / Fitch |
| `GET /api/glossary` | Glossaire (si chargé en base) |
| `GET /api/v1/docs` | Documentation et méta-informations de l'API publique |

**Rate limit** : 30 requêtes / minute / IP par défaut. Les partenaires qui
bénéficient d'une clé API (`API_ADMIN_KEY` côté serveur, envoyée dans le
header `X-API-Key`) obtiennent une limite dérogatoire. CORS ouvert pour
tous les endpoints GET.

Exemples :

```bash
curl http://localhost:4280/api/datasets
curl http://localhost:4280/api/datasets/dette-longue-1945
curl "http://localhost:4280/api/datasets/dette-longue-1945?from=2000-01-01"
curl http://localhost:4280/api/composition
curl http://localhost:4280/api/lfi/2026
```

Les tables Postgres correspondantes (voir `backend/prisma/schema.prisma`) :

- `DataSeries` + `DataPoint` → séries chronologiques (dette, PIB, dépenses, recettes, taux)
- `CategoryComposition` + `CompositionPoint` → composition historique par catégorie
- `LfiEntry` → grandes masses LFI par année
- `GlossaryEntry` → glossaire (optionnel)
- `Subscriber` + `NotificationLog` + `KeyValueStore` → abonnements email

Le loader `backend/src/seed/loadDatasets.ts` est idempotent : il tourne au
démarrage si la DB est vide, et peut être forcé avec `DATASETS_FORCE_RELOAD=1`.

### Prévention des captures d'écran — ce qui est et n'est pas possible

Le dashboard inclut des **dissuasions** côté navigateur :

- Sélection de texte et menu contextuel désactivés (sauf formulaires)
- Raccourcis Cmd+S / Cmd+P / Cmd+U interceptés
- Watermark tricolore en arrière-plan → apparaît sur toute capture partagée
- Option de flou au blur (à activer dans `main.tsx`)

**Limites techniques honnêtes** : aucun site web, y compris Netflix pour le
streaming, ne peut bloquer une capture d'écran OS-level (Cmd+Shift+4 sur Mac,
PrintScreen sur Windows, outils natifs, caméra externe). Les dissuasions
ci-dessus augmentent la friction pour 95 % des utilisateurs ; les 5 %
déterminés trouveront un moyen. La vraie protection contre la redistribution
abusive passe par les **conditions générales d'utilisation** (usage libre +
attribution obligatoire).

### Accès direct au backend (base de données)

Trois options, du plus simple au plus technique :

**Option 1 — Adminer** (UI web SQL, interface visuelle) :

```bash
docker compose --profile admin up -d adminer
```

Puis ouvre http://localhost:8081. Connexion :
- Système : **PostgreSQL**
- Serveur : `postgres` (nom du service Docker)
- Utilisateur / mot de passe / base : ceux définis dans ton `.env` (par défaut `budget` / `budget` / `budget`)

Tu peux parcourir toutes les tables (Subscriber, DataSeries, LfiEntry, HistoricalEvent, etc.), faire du SQL libre, exporter en CSV.

**Option 2 — Prisma Studio** (UI web typée sur le schéma Prisma) :

```bash
docker compose --profile admin up -d prisma-studio
```

Puis ouvre http://localhost:5555. Vue type Notion — idéal pour éditer des lignes individuelles (désinscrire un abonné, corriger une série, etc.) sans écrire de SQL.

**Option 3 — psql en ligne de commande** (pour les dev confirmés) :

```bash
docker compose exec postgres psql -U budget -d budget
```

Quelques requêtes utiles :

```sql
-- Tous les abonnés confirmés actifs
SELECT email, type, created_at, pref_monthly, pref_threshold
FROM "Subscriber"
WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NULL;

-- Événements historiques chargés
SELECT date, title, category FROM "HistoricalEvent" ORDER BY date DESC LIMIT 10;

-- Nombre de points par série
SELECT s.slug, s.kind, COUNT(p.id) AS points
FROM "DataSeries" s LEFT JOIN "DataPoint" p ON p.series_id = s.id
GROUP BY s.slug, s.kind ORDER BY points DESC;

-- Volume du log de notifications
SELECT type, COUNT(*) FROM "NotificationLog" GROUP BY type;
```

Pour quitter psql : `\q`.

### Admin & debug

```bash
# Voir qui est inscrit (depuis l'hôte)
docker compose exec postgres psql -U budget -d budget -c \
  "SELECT type, email, confirmed_at IS NOT NULL as confirmed, created_at FROM \"Subscriber\";"

# Déclencher manuellement l'envoi du bulletin mensuel (tests)
curl -X POST http://localhost:4280/api/admin/run/monthly

# Déclencher manuellement une vérification de seuil
curl -X POST http://localhost:4280/api/admin/run/threshold

# État général
curl http://localhost:4280/api/health
```

### Dev local (hot reload)

```bash
docker compose --profile dev up dev
# -> http://localhost:5173
```

Ou sans Docker :

```bash
cd pipeline && npm install && npm run ingest:mock
cd ../frontend && npm install && npm run dev
```

---

## Architecture

```
BudgetFrance/
├── pipeline/                 # Ingestion Node + TypeScript (Eurostat, BCE, INSEE…)
├── backend/                  # API Fastify + Prisma + jobs cron
│   ├── prisma/schema.prisma  # Subscriber, NotificationLog, KeyValueStore
│   └── src/
│       ├── server.ts
│       ├── routes/           # subscribe, confirm, unsubscribe, health
│       ├── jobs/             # threshold (15 min), monthly (1er du mois 9h)
│       ├── templates/        # emails HTML + text
│       └── lib/              # db, email, config, tokens, snapshot
├── frontend/                 # Dashboard Vite + React + Tailwind
│   └── src/components/
│       ├── LiveDebtCounter.tsx
│       ├── KPICard.tsx
│       ├── BudgetFlow.tsx
│       ├── DebtEvolutionChart.tsx
│       ├── RatesChart.tsx
│       ├── SourcesPanel.tsx
│       └── SubscribeForm.tsx (2 onglets : particulier / entreprise)
├── data/budget.json          # Snapshot produit par le pipeline
├── docker/
│   ├── pipeline.Dockerfile
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── nginx.conf            # proxy /api → backend, /data → volume
├── docker-compose.yml        # 5 services : postgres, backend, pipeline, scheduler, frontend
├── .env.example              # variables SMTP, DB, URL publique
└── .github/workflows/ci.yml
```

### Flux inscription → email

```
Utilisateur → POST /api/subscribe
            → Backend insère Subscriber (confirmedAt=null)
            → Backend envoie email de confirmation (token unique)
            → Utilisateur clique sur le lien → GET /api/confirm?token=…
            → Backend set confirmedAt = now() → page HTML "Inscription confirmée"

Cron "threshold" toutes les 15 min :
  lit data/budget.json
  compare au dernier snapshot stocké en DB
  si delta >= seuil → email à tous les abonnés avec prefThreshold=true

Cron "monthly" le 1er du mois à 09:00 Europe/Paris :
  lit data/budget.json
  calcule les deltas vs mois précédent
  envoie bulletin à tous les abonnés avec prefMonthly=true

Chaque envoi → ligne dans NotificationLog (succès/erreur, métadonnées)
```

### Flux de données

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Eurostat   │    │     BCE      │    │    INSEE     │
│  (SDMX-JSON) │    │   (CSV SDW)  │    │  (SDMX-ML)   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └────────┬──────────┴─────────┬─────────┘
                │                    │
           ┌────▼────────────────────▼────┐
           │   pipeline/aggregator.ts     │
           │   (try → fallback → seed)    │
           └────────────┬─────────────────┘
                        │
                 data/budget.json
                        │
           ┌────────────▼─────────────────┐
           │   frontend (nginx / Vite)    │
           │   dashboard temps réel       │
           └──────────────────────────────┘
```

### Redondance

Chaque métrique déclare une **liste ordonnée** de sources :

| Métrique | Ordre de priorité |
|---|---|
| Dette publique | Eurostat → INSEE → seed |
| PIB | Eurostat → seed |
| OAT 10 ans | BCE → seed |
| Taux directeur | BCE → seed |
| LFI | data.gouv.fr → seed |

Chaque snapshot enregistre la source retenue ET les tentatives échouées, ce qui
permet au dashboard d'afficher un badge `live` / `fallback` / `error`.

---

## Scripts

| Dossier | Commande | Ce qu'elle fait |
|---|---|---|
| `pipeline/` | `npm run ingest` | Ingestion réelle |
| `pipeline/` | `npm run ingest:mock` | Ingestion mock (offline) |
| `pipeline/` | `npm run typecheck` | TypeScript strict |
| `frontend/` | `npm run dev` | Vite en mode dev |
| `frontend/` | `npm run build` | Build de prod |
| `frontend/` | `npm run preview` | Preview du build |
| `frontend/` | `npm run typecheck` | TypeScript strict |

---

## Feuille de route (post-MVP)

- [ ] Vue détaillée par mission budgétaire (budget par ministère)
- [ ] Alertes : notif webhook quand un seuil est franchi
- [ ] Comparaison européenne (Allemagne, Italie, Espagne)
- [ ] Projection paramétrable (What-if scenarios)
- [ ] API publique + embeddable widget
- [ ] Export PDF pour décideurs

---

## Licence & données

Les données sont publiques (open data). Le code est à toi.
Aucune donnée personnelle n'est collectée.
