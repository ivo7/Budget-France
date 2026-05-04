# Budget France — Roadmap des paramètres manquants

> Document de référence : ce qui pourrait être ajouté à Budget France pour
> élargir la couverture, segmenté par public cible. Classé par priorité
> d'impact selon mon analyse, à arbitrer en fonction de la stratégie
> (audience grand public vs monétisation B2B vs profondeur éditoriale).

## Contexte

Budget France couvre aujourd'hui :

- **National** : dette publique, déficit, OAT, taux directeur, recettes/dépenses État, LFI, ratings souverains, mes-impôts, Sécu/collectivités macro
- **Local** : 34 931 communes avec leurs comptes 2023 (OFGL/DGFiP), 3 métriques de dette distinctes, comparateur multi-villes
- **Pédagogie** : glossaire ~95 termes, événements historiques, page État de la donnée publique

Cette roadmap liste ce qui manque pour devenir LA référence française des
finances publiques.

---

## Pour les citoyens (priorité haute — public principal)

### 1. « Mon impôt va où ? » personnalisé ⭐ priorité 1
Tu as déjà la composition macro des dépenses. Manque le simulateur :
*je gagne 35 K€/an, je paie 4 200 € d'impôts, voici comment ça se répartit
en € (pas en %).* Très viral, parfait sur réseaux sociaux. Bercy a fait ce
calculateur en 2014 mais l'a abandonné, l'angle mort est béant.

### 2. Niches fiscales ⭐ priorité 1
~95 Md€/an de manque à gagner pour l'État. C'est l'éléphant dans le couloir
des finances publiques que personne ne montre. Liste des 470 niches
recensées, top 30 par coût (CIR 7 Md€, taux réduit TVA restauration 3 Md€,
donations exonérées, demi-part fiscale parents isolés…). Pédagogique et
politiquement clivant — donc à manier en chiffres bruts sans commentaire.

### 3. Sécurité sociale en détail
Tu as DGF / collectivités côté ASSO / APUL, mais la **branche maladie
250 Md€**, **retraite 380 Md€**, **famille 50 Md€**, **AT/MP**,
**autonomie** et **Unédic** méritent chacune leur page avec leur
déficit / excédent et l'évolution depuis 2000. Les Français paient 30 % de
leur salaire à la Sécu et n'ont aucune visibilité sur où ça part.

### 4. Comparaison « ma commune vs voisines / vs strate »
Tu fais le ranking 11 indicateurs, mais l'utilisateur veut un sous-ensemble
très simple : *« Ma commune Vénissieux dépense X €/hab en culture, voici
les 5 communes voisines et la moyenne strate. »* Une page pour chaque
indicateur, à benchmarker en cliquant.

### 5. Police / Justice / Prisons
Données budgétaires par mission régalienne : 14 Md€ police-gendarmerie,
9 Md€ justice, 4 Md€ prisons. Sujets très médiatisés, données rarement
contextualisées.

---

## Pour les entreprises (segment B2B sous-exploité)

### 1. Marchés publics (BOAMP / DECP) ⭐ priorité 1
~120 Md€ d'achats publics par an, données ouvertes sur data.gouv.fr.
Tu peux faire :

- *« Cette commune a passé X marchés ce mois-ci, top fournisseurs :
  ABC SARL, XYZ Construction… »*
- *« Top 100 entreprises bénéficiaires de la commande publique 2024 »*

C'est massivement consulté par les TPE/PME (qui veulent décrocher des
marchés) et les commerciaux qui prospectent les collectivités. Énorme
potentiel d'audience pro.

### 2. Aides publiques aux entreprises
France 2030, France Relance, BPI, CIR, JEI, MaPrimeRénov entreprises.
Estimé 100 Md€/an cumulés mais éparpillé sur 30 sites. Une page synthèse
aurait beaucoup de valeur (et serait très partagée par les CCI,
fédérations pro).

### 3. Fiscalité comparée par secteur
Taux d'IS effectif moyen par secteur (les CAC 40 paient en moyenne 17,8 %,
les PME 28 %), poids cotisations patronales par taille d'entreprise.
Très lu par DAF, dirigeants, conseils.

### 4. Dette des entreprises publiques
SNCF Réseau (39 Md€), EDF (54 Md€), RATP (8 Md€). Cette dette « cachée »
n'est pas dans la dette publique au sens Maastricht mais peut être reprise
par l'État (cas SNCF Réseau 35 Md€ repris en 2018-2020). Sujet brûlant et
mal couvert.

---

## Pour les instituts / chercheurs / journalistes (monétisable B2B)

### 1. API publique propre avec docs OpenAPI ⭐ priorité 1
Tu l'as embryonnaire, mais sans rate limit, sans clé API, sans pagination
claire. Premier truc qu'un quanti regarde. Faisable en 2 jours de dev.

### 2. Exports bulk en CSV / Parquet / Excel
Pour chaque page, bouton « télécharger les données » + dataset complet en
téléchargement direct (rate-limité). Les chercheurs INSEE / OFCE / CAE ne
vont pas scraper ton HTML, ils veulent un fichier.

### 3. Inégalités fiscales par décile
Tu as la composition globale, mais les chercheurs en finances publiques
regardent toujours **la distribution** : qui paie l'IR par décile, qui
bénéficie des aides, coefficient de Gini avant/après redistribution.
Données INSEE TAXIPP exploitables.

### 4. Évaluations de politiques publiques
France Stratégie, Cour des comptes, IPP, OFCE publient régulièrement des
évaluations de mesures (CICE, CIR, prime d'activité). Une page
« Évaluations » qui compile = ressource de référence pour journalistes.

### 5. Comparaisons internationales détaillées
Tu as quelques pays en référence. Aller vers une vraie page « benchmark
UE/OCDE » avec Suède, Allemagne, UK, US sur 10-15 indicateurs alignés
Eurostat.

---

## Pour les villes (compléter l'existant)

### 1. Marchés publics communaux
*« Top 10 fournisseurs de Marseille en 2024 »* — ultra-lu localement,
parfait SEO local *« marchés publics Lyon »*.

### 2. Indemnités des élus
Plafond légal vs indemnité réelle votée. Tableau pour les 36 000 maires.
Sujet sensible mais légal et public (DGCL).

### 3. Budget participatif
Combien de communes en ont (~370), combien d'argent (Paris 100 M€,
Rennes 5 M€), exemples de projets votés.

### 4. Coût des services pour l'usager
Cantine, crèche, périscolaire, médiathèque, piscine — tarifs comparés.
*« Combien coûte une place de crèche à Marseille vs Lyon ? »*

### 5. Effectifs municipaux
Nombre d'agents par mille habitants vs strate. Bon proxy d'efficience
(ou de générosité, selon l'angle).

### 6. Investissement écologique communal
Part du budget consacrée à la transition (rénovation énergétique
bâtiments, voirie cyclable, végétalisation). Sujet 2026 par excellence.

---

## Mon avis sur l'ordre à suivre

**Si maximiser l'audience grand public** → priorités 1, 2, 3 du bloc citoyens d'abord (impact viral énorme).

**Si monétiser rapidement** → marchés publics + API publique pour journalistes/consultants. Ce sont les payants probables.

**Si renforcer la profondeur éditoriale** → niches fiscales + Sécu détaillée + dette entreprises publiques. Te positionne comme LA référence indépendante française sur les finances publiques. Personne ne le fait avec ce niveau de transparence aujourd'hui (ni Bercy, ni la Cour des comptes, ni les médias).

**Recommandation finale** : **niches fiscales + simulateur "mon impôt"** en priorité absolue. C'est ~3 jours de dev, énormément de partage, et ça démarque de tout ce qui existe. Les autres peuvent venir progressivement.

---

## Items déjà en file pour plus tard (mentionnés en cours de session)

- Importer les années **2017-2022 et 2024** OFGL pour avoir l'historique complet 8 ans
- Activer le glossaire avec `<GlossaryTerm/>` partout dans MaVillePage pour tooltips inline
- Tâche planifiée mensuelle qui ré-importe automatiquement OFGL dès qu'une nouvelle année est publiée
- Espace de communication payant pour mairies (idée discutée, à creuser en Phase 2 — voir notes session)
