import { useEffect, useMemo, useState } from "react";

export interface Entry {
  terme: string;
  abbr?: string;
  definition: string;
  exemple?: string;
}

export interface Categorie {
  titre: string;
  description: string;
  entrees: Entry[];
}

export const GLOSSAIRE: Categorie[] = [
  {
    titre: "Indicateurs macroéconomiques",
    description: "Les grandes grandeurs qui résument la santé financière du pays.",
    entrees: [
      {
        terme: "Produit Intérieur Brut",
        abbr: "PIB",
        definition:
          "Valeur totale des biens et services produits en France sur un an. C'est la taille de l'économie. Toutes les comparaisons (dette, déficit, dépenses publiques) sont ramenées en pourcentage du PIB pour être comparables dans le temps et entre pays.",
        exemple: "PIB France 2025 : environ 2 900 Md€.",
      },
      {
        terme: "Dette publique",
        definition:
          "Total de ce que doit l'État, la Sécurité sociale et les collectivités locales (les administrations publiques, ou APU). On la mesure au sens de Maastricht (norme européenne) pour pouvoir comparer entre pays de l'UE.",
        exemple: "Dette publique française fin 2025 : ~3 400 Md€, soit ~115 % du PIB.",
      },
      {
        terme: "Ratio dette / PIB",
        definition:
          "Dette publique divisée par le PIB. C'est la mesure la plus utilisée pour jauger la soutenabilité de la dette. Les traités européens fixent un seuil symbolique à 60 %.",
        exemple: "France ~115 %, Allemagne ~65 %, Italie ~135 %.",
      },
      {
        terme: "Solde budgétaire",
        definition:
          "Différence entre les recettes et les dépenses de l'État sur une année. Négatif = déficit, positif = excédent.",
        exemple: "LFI 2026 : solde prévu de -175 Md€ (déficit).",
      },
      {
        terme: "Déficit public",
        definition:
          "Solde négatif des administrations publiques (État + Sécu + collectivités). Les traités européens fixent un seuil à 3 % du PIB.",
        exemple: "France 2024 : déficit public ~5,5 % du PIB.",
      },
    ],
  },
  {
    titre: "Taux et coût de la dette",
    description: "Le prix auquel l'État emprunte, et à quelle vitesse sa dette s'accumule.",
    entrees: [
      {
        terme: "Obligation Assimilable du Trésor",
        abbr: "OAT",
        definition:
          "Titre de dette émis par l'État français à moyen et long terme (2 à 50 ans). Les investisseurs qui les achètent prêtent de l'argent à la France en échange d'un taux d'intérêt fixe.",
        exemple: "Stock OAT en circulation : ~2 200 Md€.",
      },
      {
        terme: "Taux OAT 10 ans",
        definition:
          "Rendement exigé par les marchés pour prêter 10 ans à la France. C'est l'indicateur N°1 du coût de la dette. Plus il monte, plus les nouveaux emprunts coûtent cher.",
        exemple: "OAT 10 ans avril 2026 : ~3,6 %. Sommet historique 1981 : 15,8 %.",
      },
      {
        terme: "Taux directeur de la BCE",
        abbr: "MRO",
        definition:
          "Taux auquel la Banque centrale européenne prête aux banques commerciales. Quand il monte, tous les autres taux tendent à monter — y compris l'OAT 10 ans.",
        exemple: "Taux directeur actuel : ~2,5 %.",
      },
      {
        terme: "Bons du Trésor à taux fixe",
        abbr: "BTF",
        definition:
          "Dette à très court terme (moins d'un an) de l'État. Utilisés pour gérer la trésorerie quotidienne. Représentent ~5-10 % du stock de dette.",
      },
      {
        terme: "Vitesse d'endettement",
        definition:
          "Combien de dette publique s'ajoute par seconde. Calculé en divisant le déficit annuel par le nombre de secondes dans une année (≈ 31,5 millions).",
        exemple: "Avril 2026 : environ +5 700 € par seconde.",
      },
    ],
  },
  {
    titre: "Contexte européen et marchés souverains",
    description: "Les indicateurs utilisés quotidiennement par les rédactions économiques et les desks de marché.",
    entrees: [
      {
        terme: "Bundesanleihe",
        abbr: "Bund",
        definition:
          "Obligation souveraine allemande. Le Bund 10 ans est considéré comme l'actif sans risque de référence en zone euro — les autres pays sont comparés à lui.",
        exemple: "Bund 10 ans avril 2026 : ~2,80 %. C'est le benchmark sur lequel se calibrent les marchés européens.",
      },
      {
        terme: "Spread souverain",
        definition:
          "Écart de rendement entre deux obligations d'État de même maturité. En zone euro, on compare typiquement chaque pays au Bund allemand. Un spread qui s'élargit = prime de risque croissante exigée par les investisseurs.",
        exemple: "Spread OAT-Bund 10 ans : 84 pb en mars 2026. Pic historique : ~200 pb fin 2011 (crise zone euro).",
      },
      {
        terme: "Point de base",
        abbr: "pb",
        definition:
          "Unité de mesure des taux d'intérêt. 1 pb = 0,01 %. 100 pb = 1 point de pourcentage. Sert à exprimer des variations fines sur les rendements souverains (ex. « le spread a bougé de 15 pb »).",
      },
      {
        terme: "Règle des 3 %",
        definition:
          "Critère de Maastricht : le déficit public annuel ne doit pas dépasser 3 % du PIB, sauf circonstances exceptionnelles. En cas de dépassement durable, procédure pour déficit excessif ouverte par la Commission européenne.",
        exemple: "France 2024 : déficit ~5,8 % du PIB → procédure déficit excessif ouverte en juillet 2024.",
      },
      {
        terme: "Règle des 60 %",
        definition:
          "Second critère de Maastricht : la dette publique ne doit pas dépasser 60 % du PIB. Très peu respecté : seuls l'Estonie, le Luxembourg, la Suède et la Bulgarie sont sous ce seuil en 2024.",
      },
      {
        terme: "Procédure pour déficit excessif",
        abbr: "PDE",
        definition:
          "Mécanisme de l'UE qui oblige un État à présenter un plan de redressement quand il franchit les seuils (3 % et/ou 60 %). Peut aboutir à des sanctions financières en cas de non-respect.",
      },
      {
        terme: "Dette publique au sens Maastricht",
        definition:
          "Définition harmonisée européenne : dette brute consolidée des administrations publiques, à valeur nominale. C'est le périmètre unique pour les comparaisons UE. Diffère de la « dette nette » (actifs déduits).",
      },
      {
        terme: "OATi",
        definition:
          "Obligation Assimilable du Trésor indexée sur l'inflation française hors tabac. Pendant français des TIPS américains. Protège l'investisseur contre l'inflation — mais coûte plus cher à l'État si l'inflation s'emballe.",
      },
      {
        terme: "Service de la dette",
        definition:
          "Total de ce que l'État verse chaque année pour sa dette : intérêts (« charge de la dette ») + remboursements de capital. Représente un flux financier majeur du budget de l'État.",
        exemple: "France 2026 : ~62 Md€ d'intérêts (mission Engagements financiers) + ~200 Md€ de remboursements refinancés.",
      },
      {
        terme: "Notation souveraine",
        definition:
          "Note attribuée par les trois grandes agences (S&P, Moody's, Fitch) à la dette d'un État. Échelle de AAA (le plus sûr) à D (défaut). Influence le taux auquel l'État emprunte.",
        exemple: "France S&P : AA- (perspective stable) depuis mai 2024 — dégradation d'un cran.",
      },
      {
        terme: "Soutenabilité de la dette",
        definition:
          "Capacité d'un État à stabiliser ou réduire son ratio dette / PIB dans le temps. Dépend de 4 leviers : taux de croissance, taux d'intérêt, solde primaire, inflation.",
      },
    ],
  },
  {
    titre: "Budget de l'État",
    description: "Les documents et concepts qui organisent le budget français chaque année.",
    entrees: [
      {
        terme: "Loi de finances initiale",
        abbr: "LFI",
        definition:
          "Texte voté par le Parlement chaque fin d'année qui fixe les recettes et dépenses de l'État pour l'année suivante. C'est le budget prévisionnel.",
        exemple: "LFI 2026 votée en décembre 2025.",
      },
      {
        terme: "Projet de loi de finances",
        abbr: "PLF",
        definition:
          "La version présentée par le gouvernement avant vote. Devient LFI une fois voté.",
      },
      {
        terme: "Loi de finances rectificative",
        abbr: "LFR",
        definition:
          "Correction de la LFI votée en cours d'année quand les hypothèses changent (crise, plan de relance…).",
      },
      {
        terme: "Budget général de l'État",
        definition:
          "Le périmètre le plus utilisé pour parler du « budget de l'État » : environ 580 Md€ de dépenses en 2026. Ne contient PAS la Sécurité sociale (Assurance maladie, retraites, famille) ni les collectivités locales.",
      },
      {
        terme: "Administrations publiques",
        abbr: "APU",
        definition:
          "Périmètre plus large : État + Sécu + collectivités. Environ 1 550 Md€ de dépenses totales, soit 57 % du PIB.",
      },
      {
        terme: "Mission budgétaire",
        definition:
          "Unité de regroupement des dépenses dans la LFI, par politique publique. Ex : « Défense », « Enseignement scolaire », « Justice ». Il y en a ~34 au total.",
      },
      {
        terme: "Crédits de paiement",
        abbr: "CP",
        definition:
          "Montant que l'État peut effectivement dépenser (payer) dans l'année, mission par mission. À distinguer des autorisations d'engagement (AE) qui couvrent les engagements pluriannuels.",
      },
    ],
  },
  {
    titre: "Comprendre ses impôts au quotidien",
    description: "Les notions utilisées par le simulateur « Où vont mes impôts ? ».",
    entrees: [
      {
        terme: "Revenu mensuel net",
        definition:
          "Ce qui est versé sur ton compte bancaire chaque mois par ton employeur, après les prélèvements sociaux (Sécurité sociale, retraite, chômage, CSG/CRDS). N'inclut pas l'impôt sur le revenu, qui est prélevé à la source séparément en France depuis 2019.",
      },
      {
        terme: "Barème de l'impôt sur le revenu",
        definition:
          "Progressif par tranches. 5 tranches en 2024 : 0 % (jusqu'à 11 294 €), 11 % (jusqu'à 28 797 €), 30 % (jusqu'à 82 341 €), 41 % (jusqu'à 177 106 €), 45 % (au-delà). Attention : on applique le taux à CHAQUE tranche, pas au revenu total.",
        exemple: "Un salaire net de 40 000 €/an paie environ 2 800 € d'IR (barème progressif, 1 part fiscale).",
      },
      {
        terme: "Part fiscale",
        definition:
          "Unité du quotient familial. Un célibataire = 1 part. Un couple marié ou pacsé = 2 parts. Chaque enfant apporte 0,5 part (1 part à partir du 3ᵉ). Le revenu est divisé par le nombre de parts avant application du barème — c'est pourquoi une famille paie moins qu'un célibataire à revenus équivalents.",
      },
      {
        terme: "Abattement forfaitaire de 10 %",
        definition:
          "Déduction automatique appliquée sur les salaires avant calcul de l'IR, censée couvrir les frais professionnels (transport, repas, vêtements). Plafonnée à 14 171 € en 2024. Peut être remplacée par une déduction des frais réels si plus avantageuse.",
      },
      {
        terme: "Taux effectif (d'imposition)",
        definition:
          "Total d'impôt payé divisé par le revenu net. Différent du « taux marginal » (taux appliqué sur la dernière tranche). Sur le simulateur, on utilise le taux effectif pour mesurer la pression fiscale réelle.",
        exemple: "Un taux marginal de 30 % ne veut pas dire que 30 % du salaire part aux impôts — le taux effectif est souvent autour de 10-15 %.",
      },
      {
        terme: "TVA effective payée",
        definition:
          "La TVA n'est pas payée « directement » (comme l'IR) mais à chaque achat. Elle finit par représenter environ 6 à 8 % du revenu net d'un ménage moyen selon ses habitudes de consommation. Les ménages modestes paient proportionnellement plus de TVA (dépensent une plus grande part de leur revenu).",
      },
      {
        terme: "CSG / CRDS",
        definition:
          "Contributions prélevées à la source sur les revenus (salaires, pensions, placements). Elles financent la Sécurité sociale (CSG) et le remboursement de la dette sociale (CRDS). **Pas de l'impôt d'État** — c'est pour ça que le simulateur ne les compte pas.",
      },
      {
        terme: "Population de la France",
        definition:
          "~68,5 millions d'habitants au 1er janvier 2026 (estimation INSEE). Référence pour tous les calculs « par habitant » du dashboard.",
        exemple: "Dette publique 3 482 Md€ ÷ 68,5 M = ~50 830 € de dette par Français.",
      },
    ],
  },
  {
    titre: "Recettes et impôts",
    description: "D'où vient l'argent que l'État encaisse chaque année.",
    entrees: [
      {
        terme: "Taxe sur la valeur ajoutée",
        abbr: "TVA",
        definition:
          "Impôt sur la consommation, payé sur la quasi-totalité des achats. Taux principal 20 %, taux réduits 5,5 % et 10 %. Première recette de l'État.",
        exemple: "Part TVA revenant à l'État en 2026 : ~103 Md€ (une autre part finance la Sécu).",
      },
      {
        terme: "Impôt sur le revenu",
        abbr: "IR",
        definition:
          "Impôt payé par les ménages sur leurs revenus. Progressif (5 tranches de 0 % à 45 %). Environ 40 % des foyers français le paient.",
        exemple: "Recette IR 2026 : ~95 Md€.",
      },
      {
        terme: "Impôt sur les sociétés",
        abbr: "IS",
        definition:
          "Impôt payé par les entreprises sur leurs bénéfices. Taux normal 25 % depuis 2022 (contre 33,3 % il y a 10 ans).",
        exemple: "Recette IS 2026 : ~70 Md€.",
      },
      {
        terme: "Taxe intérieure sur les produits énergétiques",
        abbr: "TICPE",
        definition:
          "Taxe sur les carburants (essence, diesel). Représente ~60 % du prix à la pompe avec la TVA.",
        exemple: "Recette TICPE 2026 : ~18 Md€.",
      },
      {
        terme: "Recettes non fiscales",
        definition:
          "Revenus de l'État qui ne sont pas des impôts : dividendes des entreprises publiques (EDF, La Poste…), amendes, revenus du domaine, intérêts sur prêts.",
        exemple: "Environ 22 Md€ en 2026.",
      },
    ],
  },
  {
    titre: "Fraudes et contrôles",
    description: "Ce qui échappe aux caisses de l'État et comment on l'estime.",
    entrees: [
      {
        terme: "Fraude fiscale",
        definition:
          "Manque à gagner d'impôts dû à la dissimulation volontaire de matière imposable : revenus non déclarés, TVA éludée, fausses factures, domiciliation fictive à l'étranger. Exclut l'optimisation fiscale légale (niches, schémas validés).",
        exemple: "Fourchette Cour des comptes pour 2024 : 80 à 100 Md€ par an, soit 15 à 25 % des recettes fiscales de l'État.",
      },
      {
        terme: "Fraude sociale",
        definition:
          "Fraudes aux prestations sociales (RSA, chômage, pensions, AAH) + travail non déclaré + fraudes aux cotisations URSSAF. Deux sous-ensembles : côté prestations (bénéficier indûment) et côté cotisations (ne pas les verser).",
        exemple: "Estimation Cour des comptes 2023 : ~13 Md€ dont ~8 Md€ côté cotisations et ~5 Md€ côté prestations.",
      },
      {
        terme: "Évasion fiscale",
        definition:
          "Déplacement artificiel de revenus ou de patrimoine vers des juridictions moins taxées. À la limite entre optimisation (légale) et fraude (illégale). Souvent via montages transfrontaliers (prix de transfert, paradis fiscaux).",
      },
      {
        terme: "Optimisation fiscale",
        definition:
          "Réduction de l'impôt en utilisant les règles existantes (niches, crédits d'impôt, choix de statut). **Légale**. Ne rentre pas dans la fraude même si certains montages sont qualifiés d'« agressifs ».",
      },
      {
        terme: "Cour des comptes",
        definition:
          "Juridiction financière qui audite les comptes publics (État, Sécurité sociale, collectivités, entreprises publiques). Publie des rapports annuels dont celui sur la fraude aux prélèvements obligatoires. Source principale pour les chiffres de fraude en France.",
        exemple: "Rapport 2023 sur la fraude aux prélèvements obligatoires — référence de ce dashboard.",
      },
      {
        terme: "Conseil des Prélèvements Obligatoires",
        abbr: "CPO",
        definition:
          "Organe consultatif rattaché à la Cour des comptes qui étudie les impôts et cotisations. A publié en 2020 et 2022 des estimations de la fraude à l'impôt sur les sociétés et à la TVA.",
      },
      {
        terme: "Audit aléatoire",
        definition:
          "Méthode de contrôle statistique : on sélectionne au hasard un échantillon de déclarations, on les contrôle à fond, et on extrapole le taux de fraude à la population entière. C'est ainsi que la DGFiP estime le niveau de fraude depuis les années 2000.",
      },
    ],
  },
  {
    titre: "Sources officielles utilisées",
    description: "Qui produit les chiffres affichés sur le dashboard.",
    entrees: [
      {
        terme: "Eurostat",
        definition:
          "Office statistique de l'Union européenne. Harmonise les données économiques des pays membres. Source principale ici pour la dette publique et le PIB (critères de Maastricht).",
        exemple: "Endpoint utilisé : gov_10q_ggdebt (dette trimestrielle), nama_10_gdp (PIB annuel).",
      },
      {
        terme: "INSEE",
        definition:
          "Institut national français de la statistique. Produit le PIB, l'inflation, les comptes nationaux. API BDM (Banque de Données Macroéconomiques) pour les séries longues.",
      },
      {
        terme: "Banque centrale européenne",
        abbr: "BCE",
        definition:
          "Banque centrale de la zone euro. Fixe les taux directeurs (MRO). Publie les rendements souverains via son portail Data Portal (format SDMX / CSV).",
        exemple: "Série IRS M.FR.L.L40 pour l'OAT 10 ans français.",
      },
      {
        terme: "Banque de France",
        definition:
          "Banque centrale française (intégrée au système BCE). Publie notamment les taux via le portail Webstat et les rapports annuels sur la balance des paiements.",
      },
      {
        terme: "data.gouv.fr",
        definition:
          "Plateforme ouverte de l'administration française. Publie les documents budgétaires (LFI, PLF, LFR), les données d'exécution mensuelle (Situation Mensuelle Budgétaire), les marchés publics, la base SIRENE.",
      },
      {
        terme: "DGFiP",
        abbr: "Direction générale des Finances publiques",
        definition:
          "Administration qui collecte les impôts, gère les comptes de l'État et publie la SMB mensuelle. Source principale pour l'exécution budgétaire.",
      },
      {
        terme: "OFCE",
        abbr: "Observatoire français des conjonctures économiques",
        definition:
          "Centre de recherche en économie (Sciences Po). Publie des études sur les finances publiques en longue période, notamment les séries rétrospectives avant 1970 utilisées ici.",
      },
    ],
  },
  {
    titre: "Notations souveraines et agences",
    description: "Comment les marchés jugent la signature française.",
    entrees: [
      {
        terme: "Standard & Poor's",
        abbr: "S&P",
        definition:
          "Plus grande agence de notation au monde. Note la France depuis les années 1970. Échelle de AAA (prime) à D (défaut). Historique France : AAA jusqu'en 2012, puis AA+, AA, et AA- depuis mai 2024.",
        exemple: "S&P a abaissé la France de AA à AA- le 31 mai 2024, jour après les élections européennes.",
      },
      {
        terme: "Moody's",
        definition:
          "Agence de notation américaine. Son échelle est légèrement différente (Aaa, Aa1, Aa2, Aa3…). Jugée historiquement plus « conservatrice » que S&P.",
        exemple: "Moody's a abaissé la France de Aa2 à Aa3 le 13 décembre 2024, après le refus du budget 2025.",
      },
      {
        terme: "Fitch Ratings",
        definition:
          "Troisième des « Big Three ». Basée à New York et Londres. Moins médiatisée mais ses décisions sont tout aussi suivies par les investisseurs institutionnels.",
        exemple: "Fitch a dégradé la France de AA à AA- le 28 avril 2023.",
      },
      {
        terme: "Perspective (outlook)",
        definition:
          "Indication de l'évolution probable de la note à horizon 12-24 mois. Trois valeurs : « stable », « positive » (amélioration possible), « négative » (dégradation possible). Une perspective négative précède souvent un abaissement.",
      },
      {
        terme: "AAA",
        definition:
          "Plus haute notation possible (« triple A »). Signale une capacité extrêmement forte à honorer ses engagements financiers. Réservée à ~10 pays au monde (Allemagne, Danemark, Luxembourg, Pays-Bas, Suède, Norvège, Suisse…).",
      },
      {
        terme: "Perte du AAA",
        definition:
          "Événement majeur pour une dette souveraine. La France l'a perdu auprès de S&P en janvier 2012 (crise zone euro), de Moody's en novembre 2012 et de Fitch en juillet 2013.",
      },
    ],
  },
  {
    titre: "API publique et intégrations développeurs",
    description: "Pour les journalistes, chercheurs et développeurs qui veulent consommer les données.",
    entrees: [
      {
        terme: "API publique Budget France",
        definition:
          "Ensemble d'endpoints REST en lecture seule (GET) qui exposent toutes les séries chronologiques, les répartitions LFI et les glossaires. Réponses en JSON, CORS ouvert, aucun token requis pour 30 req/min.",
        exemple: "GET http://localhost:4280/api/v1/docs pour la documentation complète.",
      },
      {
        terme: "Rate limit",
        definition:
          "Nombre maximum de requêtes autorisées par fenêtre de temps. Budget France limite à 30 requêtes par minute par IP (sans clé). Au-delà, code HTTP 429 (Too Many Requests). Les partenaires peuvent demander une clé API pour une limite plus élevée.",
      },
      {
        terme: "Webhook",
        definition:
          "URL HTTP sur laquelle un système externe est notifié quand un événement se produit. Budget France peut pinger Slack, Discord ou un endpoint personnalisé à chaque mise à jour publiée.",
        exemple: "Configuration : SLACK_WEBHOOK_URL=https://hooks.slack.com/services/... dans .env",
      },
      {
        terme: "CORS",
        definition:
          "Cross-Origin Resource Sharing. Politique qui autorise (ou non) un site web à appeler une API depuis un autre domaine. Les endpoints /api/* publics de Budget France ont CORS ouvert pour simplifier l'intégration côté navigateur.",
      },
    ],
  },
  {
    titre: "Sécurité sociale et collectivités",
    description: "Les 2 sphères publiques qui s'ajoutent au budget de l'État (et représentent 2/3 de la dépense publique totale).",
    entrees: [
      {
        terme: "Administrations publiques",
        abbr: "APU",
        definition:
          "Regroupement comptable de 3 sphères : l'État central (APUC), les administrations de sécurité sociale (ASSO), et les administrations publiques locales (APUL = collectivités). Total ~1 500 Md€/an en France, soit ~57 % du PIB.",
      },
      {
        terme: "Loi de financement de la Sécurité sociale",
        abbr: "LFSS",
        definition:
          "Pendant de la LFI pour la Sécu : texte voté chaque automne qui fixe les recettes et dépenses prévisionnelles des branches pour l'année suivante. Suivi par le PLFSS (projet) qui devient la LFSS une fois voté.",
      },
      {
        terme: "Branches de la Sécurité sociale",
        definition:
          "La Sécu française est organisée en 5 branches + l'Unédic (chômage, géré paritairement) : Maladie, Retraite (vieillesse), Famille, AT/MP (Accidents du travail), Autonomie (créée en 2021).",
      },
      {
        terme: "CSG",
        abbr: "Contribution sociale généralisée",
        definition:
          "Prélèvement proportionnel (9,2 % du salaire brut) qui finance la Sécu — toutes branches confondues. Créé en 1991. Représente ~100 Md€/an, soit la 2ᵉ recette fiscale de France après la TVA.",
      },
      {
        terme: "CRDS",
        abbr: "Contribution au remboursement de la dette sociale",
        definition:
          "Prélèvement de 0,5 % sur les revenus, affecté à la CADES (Caisse d'amortissement de la dette sociale). Créée en 1996 pour apurer la dette de la Sécu.",
      },
      {
        terme: "URSSAF",
        definition:
          "Union de recouvrement des cotisations de Sécurité sociale et d'allocations familiales. Collecte toutes les cotisations sociales auprès des employeurs et des indépendants. ~550 Md€ collectés par an.",
      },
      {
        terme: "Cotisations salariales",
        definition:
          "Part des cotisations sociales directement déduite du salaire brut pour obtenir le salaire net. Environ 20-22 % du brut pour un non-cadre (retraite, chômage, CSG/CRDS).",
      },
      {
        terme: "Cotisations patronales",
        definition:
          "Part des cotisations sociales payée EN PLUS par l'employeur, au-dessus du salaire brut. Environ 30-42 % du brut selon la taille de l'entreprise et le secteur. Base : le super-brut (brut + patronales).",
      },
      {
        terme: "ONDAM",
        abbr: "Objectif National des Dépenses d'Assurance Maladie",
        definition:
          "Enveloppe votée chaque année pour cadrer les dépenses de l'Assurance maladie (ville + hôpital + médicaments). Contrainte forte sur la politique de santé publique.",
      },
      {
        terme: "Dotation Globale de Fonctionnement",
        abbr: "DGF",
        definition:
          "Transfert annuel de l'État aux collectivités locales (~27 Md€). Aide à équilibrer les budgets communaux, départementaux et régionaux. Elle a beaucoup baissé dans les années 2010 (politique de maîtrise).",
      },
      {
        terme: "Taxe foncière",
        definition:
          "Impôt local payé par les propriétaires de biens immobiliers. Revenu principal des communes et départements (~37 Md€/an). A remplacé en partie la taxe d'habitation (supprimée en 2023).",
      },
      {
        terme: "CFE / CVAE",
        abbr: "Cotisation Foncière des Entreprises / CVAE",
        definition:
          "Impôts locaux des entreprises. La CFE (ex-taxe professionnelle partie foncière) finance les communes et intercos. La CVAE (sur la valeur ajoutée) finançait départements et régions — en cours de suppression progressive (fin prévue 2027).",
      },
      {
        terme: "EPCI",
        abbr: "Établissement Public de Coopération Intercommunale",
        definition:
          "Regroupement de communes pour gérer ensemble certains services : transports, déchets, eau. 4 niveaux : communauté de communes, d'agglomération, urbaine, métropole. Il en existe ~1 250 en France.",
      },
      {
        terme: "Unédic",
        definition:
          "Organisme qui gère l'assurance chômage. Géré paritairement par les partenaires sociaux (syndicats + patronat). Délègue le versement des allocations à France Travail (ex-Pôle emploi). ~45 Md€ de dépenses/an.",
      },
    ],
  },
  {
    titre: "Finances communales (votre ville)",
    description:
      "Les indicateurs et concepts qui apparaissent dans la fiche budgétaire de chaque commune. 35 062 communes françaises sont couvertes par notre base de données OFGL/DGFiP.",
    entrees: [
      // ----- Sections comptables M14 -----
      {
        terme: "Section de fonctionnement",
        definition:
          "Première moitié du budget communal : les charges courantes (salaires, énergie, fournitures, intérêts d'emprunt) et les recettes courantes (impôts, dotations, redevances de services). Doit être votée à l'équilibre, idéalement avec un excédent — c'est ce qu'on appelle l'épargne brute, qui finance les investissements.",
      },
      {
        terme: "Section d'investissement",
        definition:
          "Seconde moitié du budget : les dépenses durables (école, gymnase, voirie, achat de matériel) et leurs financements (subventions, FCTVA, emprunt, autofinancement venant de la section de fonctionnement). C'est ici que se construit la ville pour 30-50 ans.",
      },
      {
        terme: "Recettes Réelles de Fonctionnement",
        abbr: "RRF",
        definition:
          "Total des recettes courantes d'une commune : impôts locaux, DGF, redevances de services (cantine, crèche, piscine), produits de gestion. Ne contient pas les emprunts ni les ventes de biens.",
        exemple:
          "RRF Lyon 2023 : ~700 M€. Pour une commune de 5 000 habitants, compter ~5-8 M€.",
      },
      {
        terme: "Dépenses Réelles de Fonctionnement",
        abbr: "DRF",
        definition:
          "Total des charges courantes : personnel (souvent 50-60 % des DRF), achats et charges externes (énergie, fournitures, prestations), subventions versées (associations, CCAS), charges financières (intérêts d'emprunt). Ne contient pas le remboursement du capital.",
      },
      {
        terme: "Budget Primitif",
        abbr: "BP",
        definition:
          "Budget prévisionnel voté avant le 15 avril de chaque année par le conseil municipal. Doit être équilibré section par section. C'est l'autorisation officielle de dépenser pour l'année. Peut être amendé par décisions modificatives ou budget supplémentaire en cours d'exercice.",
      },
      {
        terme: "Compte Administratif",
        abbr: "CA",
        definition:
          "Document qui retrace ce qui a été RÉELLEMENT dépensé et encaissé sur l'année écoulée. Voté avant le 30 juin de l'année suivante. C'est lui qu'OFGL collecte et que Budget France affiche — pas le budget primitif (qui est juste prévisionnel).",
      },

      // ----- Épargne / autofinancement -----
      {
        terme: "Épargne brute",
        abbr: "CAF — capacité d'autofinancement",
        definition:
          "Différence entre les recettes courantes (RRF) et les dépenses courantes (DRF). Représente ce que la commune dégage d'elle-même pour investir et rembourser sa dette. Indicateur N°1 de la santé financière.",
        exemple:
          "Une commune avec 10 M€ de RRF et 8 M€ de DRF dégage 2 M€ d'épargne brute (taux d'épargne brute = 20 %, très bon).",
      },
      {
        terme: "Épargne nette",
        definition:
          "Épargne brute moins le remboursement du capital de la dette. C'est ce qui reste réellement disponible pour de NOUVEAUX investissements. Si elle devient négative, la commune doit s'endetter pour rembourser ses anciens emprunts (signal d'alerte).",
      },
      {
        terme: "Taux d'épargne brute",
        definition:
          "Épargne brute divisée par les recettes de fonctionnement, exprimée en pourcentage. Indicateur synthétique le plus utilisé pour juger de la santé d'une commune. Cibles : > 15 % = solide, 10 à 15 % = correct, < 10 % = la commune vit au jour le jour.",
      },

      // ----- Dette communale (3 métriques distinctes) -----
      {
        terme: "Encours de dette",
        definition:
          "Stock total de ce que la commune doit à ses créanciers (banques, Caisse des Dépôts, marchés obligataires) à un instant T. C'est la dette « accumulée », à rembourser sur 15-30 ans. À ne pas confondre avec les intérêts annuels ni l'annuité.",
        exemple:
          "Encours commune moyenne : ~900 €/hab. Au-dessus de 1 500 €/hab = surveillance. Au-dessus de 2 000 €/hab = signal d'alerte.",
      },
      {
        terme: "Charges financières",
        definition:
          "INTÉRÊTS payés chaque année sur la dette (compte 661 de la M14). Ne contient pas le remboursement du capital. C'est la « location » de l'argent emprunté, pas le remboursement lui-même.",
        exemple:
          "Sur un encours de 10 M€ à 3 %, les charges financières sont d'environ 300 000 €/an.",
      },
      {
        terme: "Annuité de la dette",
        definition:
          "Montant TOTAL versé chaque année aux créanciers : intérêts (charges financières) + capital remboursé. C'est le service de la dette au sens large. Plus utile que les seuls intérêts pour comprendre la pression réelle sur le budget.",
        exemple:
          "Sur un emprunt de 10 M€ sur 15 ans à 3 %, l'annuité est d'environ 840 000 €/an (≈ 670 K€ de capital + 170 K€ d'intérêts en moyenne).",
      },
      {
        terme: "Capacité de désendettement",
        definition:
          "Ratio Encours de dette / Épargne brute. Mesure en COMBIEN D'ANNÉES la commune pourrait rembourser sa dette si elle y consacrait toute son épargne. Plafond légal d'alerte : 12 ans. Au-dessus, la préfecture peut saisir la Chambre régionale des comptes.",
        exemple:
          "Encours 10 M€, épargne brute 1 M€ → capacité de désendettement = 10 ans (zone d'attention).",
      },

      // ----- Recettes locales -----
      {
        terme: "Taxe foncière sur les propriétés bâties",
        abbr: "TFPB",
        definition:
          "Impôt local payé par les propriétaires de logements et de locaux. Recette principale des communes depuis la suppression de la taxe d'habitation. Le conseil municipal vote chaque année le taux, appliqué à une « valeur locative cadastrale » fixée par la DGFiP.",
      },
      {
        terme: "Taxe d'habitation",
        definition:
          "Impôt local payé par les occupants de logements (propriétaires ou locataires). Supprimée pour les résidences principales en 2023, encore due pour les résidences secondaires et les locaux vacants. Compensée par l'État pour les communes via une fraction de TVA.",
      },
      {
        terme: "FCTVA",
        abbr: "Fonds de Compensation pour la TVA",
        definition:
          "Remboursement par l'État d'une partie de la TVA payée par les communes sur leurs investissements. Taux unique : 16,404 % du montant TTC investi. Versé l'année N+2 (en 2026, on touche le FCTVA des dépenses 2024). Recette d'investissement majeure.",
      },
      {
        terme: "Concours de l'État",
        definition:
          "Ensemble des transferts financiers de l'État vers une commune : DGF, dotations spécifiques (DETR, DSIL), compensations d'exonérations fiscales, fraction de TVA. Représente en moyenne 20-30 % des recettes communales.",
      },
      {
        terme: "DETR",
        abbr: "Dotation d'Équipement des Territoires Ruraux",
        definition:
          "Aide de l'État à l'investissement, ciblée sur les communes rurales et petites villes. Allouée par le préfet sur dossier (école, voirie, équipement sportif). Enveloppe nationale : ~1 Md€/an.",
      },
      {
        terme: "Fiscalité reversée",
        definition:
          "Sommes versées à la commune par son intercommunalité (EPCI) pour compenser les ressources fiscales transférées : attribution de compensation, dotation de solidarité communautaire. Lien financier indispensable entre la commune et son EPCI.",
      },

      // ----- Classification et cadre -----
      {
        terme: "Strate démographique",
        definition:
          "Classification utilisée par OFGL et la DGCL pour comparer les communes entre elles : très petite (<500 hab.), petite (<2 000), moyenne (<10 000), grande (<20 000), très grande (<50 000), petite ville (<100 000), grande ville (<200 000), très grande ville (<500 000), métropole démographique (≥500 000). Comparer une ville à sa strate, pas en absolu.",
      },
      {
        terme: "Métropole statutaire",
        definition:
          "Ville-centre dotée par la loi MAPTAM (2014) puis NOTRe (2015) du statut de « métropole », avec des compétences élargies (urbanisme, transports, déchets, développement économique). Il existe 22 métropoles en France, dont 3 à statut particulier (Grand Paris, Lyon, Aix-Marseille-Provence).",
      },
      {
        terme: "M14",
        definition:
          "Instruction comptable et budgétaire applicable aux communes et à leurs établissements publics depuis 1997. Définit le plan de comptes, les règles de comptabilisation et la dualité section de fonctionnement / section d'investissement. Remplacée progressivement par la M57 (à terme commune à toutes les collectivités).",
      },

      // ----- Sources et acteurs -----
      {
        terme: "OFGL",
        abbr: "Observatoire des Finances et de la Gestion publique Locales",
        definition:
          "Organisme officiel rattaché au Comité des finances locales (CFL) et à la DGCL. Diffuse les comptes individuels de toutes les collectivités françaises (35 062 communes, ~1 250 EPCI, 101 départements, 18 régions) sur une plateforme open data. Source des données affichées sur Budget France.",
      },
      {
        terme: "DGFiP",
        abbr: "Direction Générale des Finances Publiques",
        definition:
          "Administration de Bercy chargée de collecter les impôts ET de tenir la comptabilité de l'État et des collectivités. Pour chaque commune, le comptable public DGFiP (trésorerie locale) tient le « compte de gestion » qui sert de base aux comptes administratifs et aux statistiques OFGL.",
      },
      {
        terme: "Chambre régionale des comptes",
        abbr: "CRC",
        definition:
          "Juridiction financière régionale qui contrôle les comptes des collectivités, examine leur gestion (rapport d'observations définitives) et peut être saisie par le préfet en cas de difficultés graves (capacité de désendettement > 12 ans, déficit récurrent). 17 CRC en France métropolitaine + 5 en Outre-mer.",
      },
      {
        terme: "Réseau d'alerte",
        definition:
          "Procédure de surveillance des communes en difficulté financière, déclenchée quand certains seuils sont franchis (taux d'épargne brute < 7 %, capacité de désendettement > 12 ans, déficit du compte administratif). La préfecture met alors en place un suivi renforcé avec la DGFiP et la CRC.",
      },
    ],
  },
  {
    titre: "Pour les élèves — notions de finance publique",
    description: "Concepts clés des cours de SES, prépa HEC, Sciences Po et fac d'économie.",
    entrees: [
      {
        terme: "Solde budgétaire primaire",
        definition:
          "Solde du budget de l'État calculé HORS charge de la dette (intérêts). C'est l'indicateur le plus pertinent pour juger la politique budgétaire « hors héritage du passé ». Si le solde primaire est positif, l'État dégage assez de recettes pour couvrir ses dépenses courantes.",
        exemple: "France 2024 : solde budgétaire −169 Md€, dont 55 Md€ d'intérêts → solde primaire ≈ −114 Md€.",
      },
      {
        terme: "Effet boule de neige",
        definition:
          "Mécanisme auto-entretenu : quand le taux d'intérêt (r) dépasse le taux de croissance nominale du PIB (g), le ratio dette/PIB augmente mécaniquement, même sans déficit primaire. Seul un excédent primaire permet de stabiliser le ratio.",
        exemple: "Si r = 3,5 % et g = 2 %, la dette augmente spontanément de 1,5 pt de PIB/an sans action budgétaire.",
      },
      {
        terme: "r > g",
        definition:
          "Inégalité qui résume la soutenabilité dynamique de la dette. Si le taux d'intérêt apparent de la dette est supérieur à la croissance économique nominale, il faut un excédent primaire structurel pour empêcher le ratio de dériver.",
      },
      {
        terme: "Multiplicateur budgétaire",
        definition:
          "Rapport entre l'effet d'une dépense publique supplémentaire et l'augmentation du PIB qui en résulte. Varie entre 0,3 (faible) et 1,5 (élevé) selon la conjoncture, l'ouverture commerciale, la politique monétaire et le type de dépense.",
        exemple: "FMI 2012 : multiplicateur estimé à ~1,5 en récession, ~0,5 en période normale.",
      },
      {
        terme: "Stabilisateurs automatiques",
        definition:
          "Recettes et dépenses qui varient spontanément avec le cycle économique, sans décision politique. En récession : recettes fiscales baissent (moins d'impôts collectés), prestations sociales augmentent (chômage, RSA) → le déficit se creuse automatiquement, ce qui soutient l'activité.",
      },
      {
        terme: "Politique keynésienne",
        definition:
          "Politique qui utilise la dépense publique pour soutenir l'activité en période de récession (relance). Théorisée par John Maynard Keynes dans les années 1930. L'exemple français emblématique est la relance Mitterrand 1981, abandonnée en 1983 (« tournant de la rigueur »).",
      },
      {
        terme: "Consolidation budgétaire",
        definition:
          "Politique visant à réduire le déficit par une hausse des recettes, une baisse des dépenses, ou les deux. Peut freiner la croissance à court terme (effet multiplicateur négatif) mais améliore la soutenabilité à long terme.",
      },
      {
        terme: "Dette nette vs dette brute",
        definition:
          "La dette brute (Maastricht) compte l'ensemble des engagements de l'État. La dette nette soustrait les actifs financiers détenus (participations, trésorerie). La dette nette France ~95 % PIB, brute ~115 %.",
      },
      {
        terme: "Procédure pour déficit excessif",
        abbr: "PDE",
        definition:
          "Procédure prévue par le Traité sur le fonctionnement de l'UE (article 126) contre les États dont le déficit ou la dette dépassent les seuils (3 % et 60 % du PIB). La France a été placée en PDE en juillet 2024, avec l'obligation de présenter un plan d'ajustement.",
      },
      {
        terme: "Quantitative Easing",
        abbr: "QE",
        definition:
          "Politique monétaire non conventionnelle : la banque centrale achète massivement des obligations d'État et privées pour injecter des liquidités et faire baisser les taux longs. La BCE l'a pratiqué de 2015 à 2022, avec un stock d'actifs qui a atteint 5 000 Md€.",
      },
      {
        terme: "Excess Deficit Procedure",
        definition:
          "Version anglaise du PDE. Critère utilisé par Eurostat : déficit public > 3 % ou dette > 60 % du PIB. Ouvre une obligation de plan de redressement et potentiellement des sanctions (amendes).",
      },
      {
        terme: "Relance vs rigueur",
        definition:
          "Les deux grandes options de politique budgétaire. La relance augmente la dépense publique (ou baisse les impôts) pour soutenir la demande. La rigueur fait l'inverse. Depuis 40 ans, la France oscille entre ces deux orientations selon les conjonctures et les gouvernements.",
      },
    ],
  },
  {
    titre: "Comment lit-on ce dashboard",
    description: "Les concepts propres à Budget France.",
    entrees: [
      {
        terme: "Compteur temps réel",
        definition:
          "La dette publique affichée défile en direct. Calculée en partant de la dernière valeur officielle (Eurostat) + la vitesse d'endettement × le temps écoulé. Ce n'est pas une mesure instantanée — personne n'a cette donnée à la seconde — mais une projection fondée sur le déficit courant.",
      },
      {
        terme: "Source « live »",
        definition:
          "Badge vert : la valeur vient d'être tirée d'une API officielle (Eurostat, BCE). C'est la donnée la plus à jour disponible.",
      },
      {
        terme: "Source « secours »",
        definition:
          "Badge jaune : l'API n'a pas répondu ou n'est pas encore câblée. Le pipeline a utilisé une valeur de référence statique (« seed ») pour ne pas casser l'affichage.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers de lookup : utilisés par <GlossaryTerm /> pour afficher un popover
// quand on clique sur un terme dans le reste de l'app.
// ---------------------------------------------------------------------------

/** Slug stable utilisé dans les URLs (#/glossaire?term=oat). */
export function termeSlug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Cherche une entrée dans le glossaire à partir du terme, de son abréviation
 * ou du slug. Renvoie la première correspondance, sinon null.
 */
export function findGlossaryEntry(query: string): { entry: Entry; categorie: string } | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const slugQ = termeSlug(query);
  for (const cat of GLOSSAIRE) {
    for (const e of cat.entrees) {
      if (
        e.terme.toLowerCase() === q ||
        (e.abbr && e.abbr.toLowerCase() === q) ||
        termeSlug(e.terme) === slugQ ||
        (e.abbr && termeSlug(e.abbr) === slugQ)
      ) {
        return { entry: e, categorie: cat.titre };
      }
    }
  }
  return null;
}

export function Glossary() {
  const [query, setQuery] = useState("");
  const [highlightedSlug, setHighlightedSlug] = useState<string | null>(null);

  // Lit le paramètre ?term=xxx dans l'URL (#/glossaire?term=oat) pour scroller
  // automatiquement vers la fiche correspondante et la mettre en surbrillance.
  // ⚠ ne JAMAIS pré-remplir le champ de recherche avec le slug : un slug
  // comme "obligation-assimilable-du-tresor" ne matche pas la chaîne complète
  // "Obligation Assimilable du Trésor" car le filtre lit termes/définitions
  // sans normaliser les tirets ↔ espaces. Résultat : page vide. Bug corrigé.
  useEffect(() => {
    function readTermFromHash() {
      const hash = window.location.hash;
      const idx = hash.indexOf("?");
      if (idx < 0) return;
      const params = new URLSearchParams(hash.slice(idx + 1));
      const term = params.get("term");
      if (term) {
        // On garde la recherche vide pour afficher le glossaire complet,
        // et on flag le terme à mettre en surbrillance + scroller.
        setQuery("");
        setHighlightedSlug(term);
      }
    }
    readTermFromHash();
    window.addEventListener("hashchange", readTermFromHash);
    return () => window.removeEventListener("hashchange", readTermFromHash);
  }, []);

  // Scroll vers la fiche après le rendu
  useEffect(() => {
    if (!highlightedSlug) return;
    const el = document.getElementById(`glossary-entry-${highlightedSlug}`);
    if (el) {
      // Décalage pour ne pas être collé au header sticky
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
    // On efface l'effet visuel après quelques secondes
    const t = setTimeout(() => setHighlightedSlug(null), 4000);
    return () => clearTimeout(t);
  }, [highlightedSlug, query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSAIRE;
    return GLOSSAIRE.map((cat) => ({
      ...cat,
      entrees: cat.entrees.filter((e) =>
        [e.terme, e.abbr ?? "", e.definition, e.exemple ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q),
      ),
    })).filter((cat) => cat.entrees.length > 0);
  }, [query]);

  const totalEntries = GLOSSAIRE.reduce((a, c) => a + c.entrees.length, 0);

  return (
    <div>
      <div className="mt-6">
        <div className="text-xs uppercase tracking-widest text-muted">Fiches pédagogiques</div>
        <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">
          Glossaire — comprendre les chiffres du dashboard
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl">
          {totalEntries} définitions organisées par thème. Ce glossaire suit les périmètres
          officiels utilisés par l'INSEE, Eurostat et la Direction générale des Finances publiques.
        </p>
      </div>

      <div className="mt-6 card p-4 flex items-center gap-3">
        <span className="text-muted text-sm shrink-0">Rechercher :</span>
        <input
          type="search"
          placeholder="OAT, dette, TVA…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            effacer
          </button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="mt-6 card p-8 text-center text-slate-500">
          Aucun terme ne correspond à « {query} ». Essaie un autre mot-clé.
        </div>
      )}

      {filtered.map((cat) => (
        <section key={cat.titre} className="mt-6">
          <div className="mb-3">
            <h2 className="font-display text-xl font-semibold text-slate-900">{cat.titre}</h2>
            <p className="text-sm text-slate-500">{cat.description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cat.entrees.map((e) => {
              const slug = termeSlug(e.terme);
              const slugAbbr = e.abbr ? termeSlug(e.abbr) : "";
              const isHighlighted =
                highlightedSlug && (slug === termeSlug(highlightedSlug) || slugAbbr === termeSlug(highlightedSlug));
              return (
                <article
                  key={e.terme}
                  id={`glossary-entry-${slug}`}
                  className={`card p-5 transition-all ${
                    isHighlighted ? "ring-2 ring-brand shadow-lg bg-brand-soft/30" : ""
                  }`}
                >
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h3 className="font-display text-lg font-semibold text-slate-900">{e.terme}</h3>
                    {e.abbr && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-soft text-brand border border-blue-200 font-mono">
                        {e.abbr}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed mt-2">{e.definition}</p>
                  {e.exemple && (
                    <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                      <span className="font-semibold text-slate-700">Exemple : </span>
                      {e.exemple}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
