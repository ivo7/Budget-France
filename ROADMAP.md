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
- Roll-out cadres « À retenir » + « Méthodologie » sur les pages historiques (Dashboard, Europe, Historique, Fraudes, Mes impôts, Sécu-Collec, Institutions) — mécanique mais à faire en batch dédié

---

## Marchés publics — feuille de route progressive

Phase 1 livrée (top 100 fournisseurs nationaux statique). Pour aller plus loin :

### Phase 2 — Import DB par commune (~2-3 jours de dev)

Objectif : permettre l'affichage *« Top 10 fournisseurs de Marseille en 2024 »* sur
chaque fiche commune, parmi les 35 000 communes en base.

Étapes techniques :

- Schema Prisma `Marche { id, acheteurSiret, acheteurNom, acheteurInsee, titulaireSiret, titulaireSiren, titulaireNom, montantEur, objet, dateNotification, dureeMois, nature, codeCpv }`
- Table `SiretInsee { siret, codeInsee }` enrichie depuis la base SIRENE de l'INSEE (pour mapper les SIRET acheteurs aux codes INSEE des communes)
- Script d'import mensuel via cron : download DECP fichiers consolidés → parse CSV streamé → UPSERT batché par lots de 1 000
- Endpoint `/api/communes/[slug]/marches` retournant top 10 fournisseurs + 20 derniers marchés
- Section « Marchés publics passés par {commune} » sur la page synthèse de chaque commune
- Bouton « Voir tous les marchés » → page dédiée par commune avec recherche

Volume estimé : ~7 millions de marchés × ~30 colonnes = ~3-5 Go de données en base
après indexation. Postgres encaisse facilement avec les bons index sur (acheteurInsee,
dateNotification) et (titulaireSiren, montantEur).

Difficultés à anticiper :

- SIRET → INSEE n'est pas direct, nécessite une table SIRENE (~10 millions de
  lignes pour les entités juridiques publiques, plus léger à charger)
- Données DECP incomplètes pour certains acheteurs (taux de complétude DECP estimé à
  ~75 % par l'OECP)
- Filiales : les groupes (Vinci, Bouygues…) répondent via des dizaines de SIREN
  différents. Une table de mapping `SIREN → groupeMere` à enrichir manuellement
  améliore la consolidation

### Phase 3 — Plateforme marchés publics complète (~1 semaine)

Une fois la Phase 2 stable :

- **Recherche full-text** sur l'objet du marché (Postgres `tsvector` ou
  Elasticsearch si volume) : « tous les marchés contenant 'rénovation école' »
- **Profil entreprise** : page dédiée par titulaire avec historique complet de ses
  marchés publics gagnés + carte géo des acheteurs
- **Alertes pour TPE/PME** (futur produit Premium) : notification email quand un
  nouveau marché matchant des critères (secteur, géo, montant) est publié — base
  d'un futur plan Pro à 49-99 €/mois
- **Open API** : endpoint authentifié pour les journalistes / consultants /
  associations (Anticor, Transparency International) souhaitant analyser la
  commande publique
- **Comparaisons** : tarifs moyens par CPV (« combien coûte un marché de
  rénovation en moyenne en France ? »), durée moyenne, taux de mise en
  concurrence par strate de commune

Ce module deviendrait un **business à part entière** dans Budget France — équivalent
gratuit/freemium d'outils payants type Direct'INFO ou Vecteur Plus (qui facturent
~200-2 000 €/mois aux entreprises pour la veille marchés publics).

---

## Angles morts & sujets chauds 2025-2026 — perspective budget

Brainstorming structuré des sujets à fort potentiel pédagogique et viral, où
Budget France peut apporter de la transparence factuelle. Organisé par
catégorie, avec ordre de grandeur budgétaire et faisabilité données.

### Sécurité & régalien étendu

- **Immigration (coût budgétaire net)** — ~3-7 Md€/an selon périmètre. AME
  (1,2 Md€), OFII, CRA, MNA (2 Md€ via ASE départements), Sentinelle. Énorme
  angle mort : aucune page grand public ne présente factuellement coûts ET
  recettes (cotisations versées par étrangers en règle ~70 Md€/an). Sources :
  Cour des comptes 2024, INSEE, OFII, OFPRA, IPP, France Stratégie.
- **Trafic de drogue** — ~3 Md€/an répression (police judiciaire stups, prisons
  cocaïne). Plan Mongin 2023, narcotrafic Marseille, saisies douanes. Sources :
  OFDT, Cour des comptes.
- **Délinquance & sentiment d'insécurité** — Coût total ~30 Md€ (police +
  justice + prisons + victimes). Comparaison international : France pas plus
  criminelle qu'avant mais ressenti élevé. Sources : ONDRP, Eurostat crime.
- **Terrorisme** — Sentinelle 5 Md€ depuis 2015, services renseignement
  (DGSI/DGSE) ~2 Md€/an, déradicalisation, FNAT. Sources : SGDSN, LOPSI.
- **Cybersécurité** — ANSSI 200 M€ + cyberattaques coût ~2 Md€/an. Hôpitaux,
  communes, entreprises. Sources : ANSSI, CESIN, Wavestone.
- **Police municipale** — 1,2 Md€/an, +5 %/an. Inégalités territoriales
  fortes. Sources : DGCL, AMF.

### Climat & transition écologique

- **Nouveau nucléaire (EPR2)** — 52 Md€ programmés sur 2024-2050 pour 6
  réacteurs. Financement public/privé débattu. Sources : EDF, COR
  nucléaire, Cour des comptes.
- **Voiture électrique** — 1,3 Md€/an (bonus + leasing social).
  Comparaison Allemagne (qui a stoppé). Sources : Ademe, ministère
  Transition.
- **Adaptation climatique** — 0,5-2 Md€/an actuellement, mais besoin
  estimé ~30 Md€/an d'ici 2030 selon France Stratégie. Sécheresses,
  inondations, irrigation agricole, digues littoral.
- **Taxe carbone gelée depuis 2018** — Aurait rapporté ~8 Md€/an si non
  gelée après Gilets jaunes. Pourquoi politiquement intouchable. Sources :
  I4CE, Conseil des Prélèvements Obligatoires.

### Démographie & société

- **5ᵉ branche Autonomie / EHPAD** — 38 Md€/an, +25 % d'ici 2030.
  Vieillissement, scandale Orpea, dépendance. Sources : DREES, CNSA.
- **Natalité en chute libre** — -20 % naissances depuis 2014. Politique
  familiale 50 Md€/an. Politique nataliste à repenser. Sources : INSEE
  Bilan démographique, CNAF.
- **Logement / crise du neuf** — APL 14 Md€, PTZ, locatif social ~10 Md€.
  Production logements neufs s'effondre. Sources : USH, FFB, ANIL.
- **Pauvreté infantile** — 1 enfant sur 5 sous seuil pauvreté. Aides
  ciblées, repas scolaires. Sources : INSEE, Secours Catholique.
- **Égalité H/F (au-delà des slogans)** — Écart salarial 22 %, retraites
  -40 % pour femmes. Sources : INSEE, Index Egapro.

### Santé en détail

- **Hôpital public en crise** — Urgences fermées, pénuries soignants,
  médecins étrangers. Sources : FHF, Cour des comptes RALFSS.
- **Médicaments — pénuries & dépendance Chine** — Marché 30 Md€, 80 %
  génériques produits hors UE. Souveraineté sanitaire. Sources : LEEM,
  ANSM, mission Bohn.
- **Psychiatrie en effondrement** — ~25 Md€, déserts psy, suicides,
  jeunes en crise post-Covid. Sources : DREES, Santé Publique France.
- **Déserts médicaux** — 1 Français sur 8 sans médecin traitant. CPTS,
  CESP. Sources : DREES, Ordre des médecins.

### Économie & souveraineté

- **Crise agricole (PAC + revenu)** — PAC 9 Md€/an France + retraites
  agricoles. Suicides, manifestations 2024, dépendance importations.
  Sources : MASA, FNSEA, INRAE.
- **Aide publique au développement (APD)** — 13 Md€/an, objectif 0,7 %
  PIB non atteint. AFD, ONG, polémique Sahel. Sources : MAEDI, AFD, CAD
  OCDE.
- **Contribution France à l'UE** — 23 Md€/an + retours UE 17 Md€ =
  contribution nette -6 Md€. Sujet sensible (Frexit). Sources : Bercy,
  Commission européenne.
- **Défense (LPM 2024-2030)** — 413 Md€ sur 7 ans. Engagement OTAN 2 %
  atteint, soutien Ukraine. Sources : Ministère Armées, IRSEM, SIPRI.

### Gouvernance & coûts cachés

- **Coût total de la démocratie française** — Élections + partis + Sénat
  + AN ~2 Md€/an. Cumul scrutins, abstention vs coût. Sources : Conseil
  constitutionnel, HATVP, CSA.
- **Opérateurs de l'État (700+ structures)** — ~80 Md€/an consolidés.
  ADEME, BPI, ANR, France Travail… Trop nombreux ? Sources : DB, Cour
  des comptes opérateurs.
- **Patrimoine immobilier État** — 200 Md€ d'actifs, 30 % sous-utilisés.
  Sources : France Domaine, DIE.
- **Fonction publique (5,5 M agents)** — Masse salariale 320 Md€/an
  (État + collec + SS). Effectifs vs missions, comparaisons internationales.
  Sources : DGAFP, Cour des comptes, OCDE.

### Crises & actualité 2024-2026

- **Bouclier tarifaire énergie 2022-2024** — 50 Md€ déboursés (le record
  historique). Comment ça finit, retour à la vérité des prix. Sources :
  Bercy, CRE.
- **JO Paris 2024 — bilan complet** — 8,8 Md€ + héritage. Coûts réels
  vs prévu, retombées éco régionales. Sources : Cojo, Cour des comptes
  2024.
- **Émeutes 2023** — 1 Md€ dégâts directs, ~3 Md€ avec coûts indirects.
  Sources : Insee, MEDEF, France Assureurs.
- **Crise Nouvelle-Calédonie 2024** — 2 Md€ coût direct + reconstructions.
  Fiscalité du nickel. Sources : HCNC, ministère Outre-mer.
- **Soutien Ukraine** — ~5 Md€ cumulés (armement + civil). Comparaison
  pays UE. Sources : Kiel Institute, MINEFI.

### Données dérangeantes sous-traitées

- **Évasion fiscale internationale** — 15-30 Md€/an France. Paradise
  Papers, Pandora Papers. Sources : EU Tax Observatory (Zucman),
  Conseil d'analyse économique.
- **Travail dissimulé** — 8 Md€ cotisations perdues. BTP, restau,
  auto-entrepreneurs. Sources : ACOSS-URSSAF, HCFiPS.
- **Niches fiscales sectorielles** — Cinéma (300 M€), audiovisuel
  (200 M€), jeu vidéo (100 M€), mode, métiers d'art. Maintenues malgré
  bilan mitigé. Sources : Voies et moyens tome II.
- **Subventions associations** — 30 Md€/an total État + collec,
  traçabilité variable. Sources : DJEPVA, ACOSS, Cour des comptes.
- **Frais de fonctionnement État** — 5 Md€/an (locations, véhicules,
  déplacements ministériels). Sources : Direction du budget, IGF.

### Priorité personnelle (mon avis)

Si tu devais choisir 5 sujets à attaquer en priorité, l'ordre selon impact
pédagogique + actualité + faisabilité données :

1. **🚨 Immigration (coût net + démographie)** — angle mort suprême,
   sujet électoralement martelé sans pédagogie. Données INSEE/CdC/IPP
   solides. Énorme valeur transparence.
2. **🌡️ Climat & adaptation** — besoin 30 Md€/an d'ici 2030, peu de
   pédagogie actuellement.
3. **👵 Autonomie / EHPAD** — bombe à retardement démographique, post-Orpea.
4. **🏥 Psychiatrie + déserts médicaux** — crise silencieuse, données
   dispersées.
5. **💵 Bouclier tarifaire + transition énergie** — comment finit le
   cadeau de 50 Md€.
