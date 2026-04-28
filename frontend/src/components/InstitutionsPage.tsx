// ============================================================================
// InstitutionsPage — qui décide, exécute et contrôle le budget de l'État
// ============================================================================
//
// Page pédagogique listant les 7 phases du cycle budgétaire français et les
// institutions impliquées dans chacune. Termine par un schéma synthétique
// SVG qui montre les interactions et le calendrier annuel.
//
// Sources : Constitution de la République française (art. 34, 39, 47),
// LOLF du 1er août 2001, site economie.gouv.fr, vie-publique.fr.
// ============================================================================

import { DownloadableCard } from "./DownloadableCard";
import { ChartCitizenImpact } from "./ChartCitizenImpact";
import { objectsToCsv } from "../lib/csvExport";

// ----------------------------------------------------------------------------
// Données structurées des institutions et de leurs rôles
// ----------------------------------------------------------------------------

interface Institution {
  name: string;
  abbr?: string;
  role: string;
  details: string;
  url?: string;
}

interface Phase {
  id: string;
  num: number;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  monthsRange: string;
  description: string;
  institutions: Institution[];
}

const PHASES: Phase[] = [
  {
    id: "preparer",
    num: 1,
    title: "Préparer",
    subtitle: "Le gouvernement rédige le projet",
    icon: "📝",
    color: "text-brand",
    bgColor: "bg-brand-soft/40",
    borderColor: "border-brand/30",
    monthsRange: "mars → septembre",
    description:
      "Chaque printemps, le gouvernement commence à rédiger le Projet de Loi de Finances (PLF) pour l'année suivante. Les lettres de cadrage sont envoyées aux ministères qui négocient leurs enveloppes avec Bercy.",
    institutions: [
      {
        name: "Premier ministre + Gouvernement",
        role: "Décideur politique",
        details:
          "Fixe les grandes orientations économiques et budgétaires lors du débat d'orientation des finances publiques (DOFP) en juin. Arbitre les conflits entre ministères.",
      },
      {
        name: "Ministère de l'Économie et des Finances (Bercy)",
        role: "Pilote la rédaction",
        details:
          "Le ministre du Budget négocie ligne par ligne avec chaque ministère. Le projet est présenté au Conseil des ministres fin septembre.",
        url: "https://www.economie.gouv.fr",
      },
      {
        name: "Direction du Budget",
        abbr: "DB",
        role: "Cheville ouvrière technique",
        details:
          "Direction de Bercy qui coordonne la rédaction technique du PLF avec les ~1 200 unités budgétaires. Maintient le suivi de l'exécution toute l'année.",
        url: "https://www.budget.gouv.fr",
      },
      {
        name: "Direction Générale du Trésor",
        abbr: "DG Trésor",
        role: "Conseiller économique",
        details:
          "Fournit les prévisions macroéconomiques (croissance, inflation, déficit) sur lesquelles le PLF est calibré. Coordonne aussi les relations financières internationales.",
        url: "https://www.tresor.economie.gouv.fr",
      },
    ],
  },
  {
    id: "valider-prevoir",
    num: 2,
    title: "Valider les prévisions",
    subtitle: "Le HCFP donne son avis indépendant",
    icon: "🔍",
    color: "text-amber-700",
    bgColor: "bg-amber-50/60",
    borderColor: "border-amber-300",
    monthsRange: "septembre",
    description:
      "Avant que le PLF parte au Parlement, un organe indépendant doit certifier que les prévisions économiques du gouvernement sont réalistes. Ce contrôle a été créé en 2012 après la crise des dettes souveraines.",
    institutions: [
      {
        name: "Haut Conseil des Finances Publiques",
        abbr: "HCFP",
        role: "Gendarme indépendant des prévisions",
        details:
          "Organe consultatif rattaché à la Cour des comptes, présidé par le Premier président de la Cour. Composé de magistrats et économistes indépendants. Donne un avis public sur la cohérence du PLF avec les engagements européens et la trajectoire pluriannuelle.",
        url: "https://www.hcfp.fr",
      },
    ],
  },
  {
    id: "voter",
    num: 3,
    title: "Voter",
    subtitle: "Le Parlement décide démocratiquement",
    icon: "🗳️",
    color: "text-brand",
    bgColor: "bg-brand-soft/40",
    borderColor: "border-brand/30",
    monthsRange: "octobre → décembre",
    description:
      "Le PLF est déposé sur le bureau de l'Assemblée nationale début octobre. Le Parlement a 70 jours pour le voter (procédure spéciale, art. 47 Constitution). Sans accord, le gouvernement peut le promulguer par ordonnance — mais c'est rarissime.",
    institutions: [
      {
        name: "Assemblée nationale",
        abbr: "AN",
        role: "1ère lecture, vote en premier",
        details:
          "577 députés. La commission des finances examine le texte article par article, propose des amendements. Vote solennel en novembre généralement.",
        url: "https://www.assemblee-nationale.fr",
      },
      {
        name: "Sénat",
        role: "2ème lecture, chambre haute",
        details:
          "348 sénateurs (élus indirectement par les grands électeurs locaux). Examine le texte voté par l'AN, peut le modifier. Représente les collectivités territoriales.",
        url: "https://www.senat.fr",
      },
      {
        name: "Commission Mixte Paritaire",
        abbr: "CMP",
        role: "Résolution des désaccords",
        details:
          "7 députés + 7 sénateurs réunis pour trouver un compromis si AN et Sénat ne sont pas d'accord. En cas d'échec, l'AN a le dernier mot (art. 45 Constitution).",
      },
      {
        name: "Cour des comptes",
        role: "Avis et certification annexe",
        details:
          "Donne aussi un avis sur le PLF et certifie chaque année les comptes de l'État (rapport annuel public).",
        url: "https://www.ccomptes.fr",
      },
    ],
  },
  {
    id: "controler-conformite",
    num: 4,
    title: "Contrôler la conformité",
    subtitle: "Le Conseil constitutionnel peut censurer",
    icon: "⚖️",
    color: "text-flag-red",
    bgColor: "bg-red-50/40",
    borderColor: "border-flag-red/30",
    monthsRange: "fin décembre",
    description:
      "Avant promulgation par le Président de la République, la loi peut être déférée au Conseil constitutionnel par le PR, le PM, les présidents des chambres, ou par 60 députés ou 60 sénateurs. Le Conseil vérifie la conformité à la Constitution.",
    institutions: [
      {
        name: "Conseil constitutionnel",
        role: "Juge constitutionnel",
        details:
          "9 membres nommés pour 9 ans (3 par le PR, 3 par le président de l'AN, 3 par le président du Sénat) + les anciens présidents de la République. Examine la loi en moins d'un mois. Peut censurer des articles ou la loi entière. Sa décision a force de loi.",
        url: "https://www.conseil-constitutionnel.fr",
      },
    ],
  },
  {
    id: "executer",
    num: 5,
    title: "Exécuter",
    subtitle: "L'administration encaisse, paie, emprunte",
    icon: "⚙️",
    color: "text-money",
    bgColor: "bg-green-50/40",
    borderColor: "border-money/30",
    monthsRange: "1er janvier → 31 décembre",
    description:
      "Une fois la loi promulguée, l'État commence à exécuter. L'année budgétaire est calée sur l'année civile. Chaque ministère reçoit ses crédits via la Direction du budget, et les comptables publics vérifient chaque dépense.",
    institutions: [
      {
        name: "Direction Générale des Finances Publiques",
        abbr: "DGFiP",
        role: "Recettes + comptes publics",
        details:
          "100 000 agents. Collecte tous les impôts (IR, IS, TVA, taxes locales), tient la comptabilité de l'État, contrôle fiscalement les contribuables. Publie chaque mois la SMB (Situation Mensuelle Budgétaire) qui détaille l'exécution.",
        url: "https://www.impots.gouv.fr",
      },
      {
        name: "Direction du Budget",
        abbr: "DB",
        role: "Allocation et suivi des dépenses",
        details:
          "Décompose les crédits votés en programmes et missions (LOLF). Contrôle les engagements et autorisations d'engagement. Pilote le suivi mensuel.",
      },
      {
        name: "Agence France Trésor",
        abbr: "AFT",
        role: "Gère la dette publique",
        details:
          "Émet les OAT (Obligations Assimilables du Trésor) sur les marchés financiers pour couvrir le déficit et refinancer la dette arrivant à échéance. ~250 Md€ d'émissions par an. Dirige une cinquantaine de personnes.",
        url: "https://www.aft.gouv.fr",
      },
      {
        name: "Comptables publics",
        role: "Contrôleurs de légalité des paiements",
        details:
          "Avant tout paiement, vérifient que la dépense est régulière (crédit disponible, signature, pièces justificatives). Principe historique de la séparation ordonnateur/comptable.",
      },
      {
        name: "DGCL — Collectivités",
        role: "Verse les dotations aux communes",
        details:
          "Direction Générale des Collectivités Locales (Bercy) calcule et verse chaque année la DGF (Dotation Globale de Fonctionnement) aux ~35 000 communes, départements et régions. ~26 Md€/an.",
      },
    ],
  },
  {
    id: "surveiller-continu",
    num: 6,
    title: "Surveiller en continu",
    subtitle: "Détecter les dérives en cours d'année",
    icon: "📊",
    color: "text-purple-700",
    bgColor: "bg-purple-50/40",
    borderColor: "border-purple-300",
    monthsRange: "tout au long de l'année",
    description:
      "Pendant l'exécution, plusieurs organes vérifient que tout reste sur les rails et alertent en cas de dérive. La surveillance est à la fois nationale (Parlement, HCFP) et européenne (Commission, Eurostat).",
    institutions: [
      {
        name: "Commission des finances de l'AN et du Sénat",
        role: "Suivi parlementaire mensuel",
        details:
          "Auditionnent régulièrement les ministres, demandent des explications sur les écarts entre prévu et réel. Les rapporteurs spéciaux suivent chacun une ou plusieurs missions budgétaires.",
      },
      {
        name: "HCFP",
        role: "Avis sur les LFR (lois de finances rectificatives)",
        details:
          "Si le gouvernement modifie le budget en cours d'année (LFR), le HCFP donne un nouvel avis sur les prévisions actualisées.",
      },
      {
        name: "Commission européenne (DG ECFIN)",
        role: "Pacte de stabilité et de croissance",
        details:
          "Surveille les engagements pris par la France auprès de l'UE (déficit < 3 % du PIB, dette < 60 %). Peut ouvrir une « procédure pour déficit excessif » (en cours pour la France depuis juillet 2024).",
        url: "https://commission.europa.eu",
      },
      {
        name: "Eurostat",
        role: "Statisticien européen",
        details:
          "Harmonise les statistiques de finances publiques pour permettre les comparaisons entre les 27 États membres (norme SEC 2010 Maastricht).",
        url: "https://ec.europa.eu/eurostat",
      },
    ],
  },
  {
    id: "auditer-certifier",
    num: 7,
    title: "Auditer / certifier",
    subtitle: "La Cour des comptes vérifie a posteriori",
    icon: "🔬",
    color: "text-flag-red",
    bgColor: "bg-red-50/40",
    borderColor: "border-flag-red/30",
    monthsRange: "année N+1 et N+2",
    description:
      "Une fois l'exercice clos, des organes d'audit indépendants vérifient que tout a été exécuté correctement. Les rapports sont publics et alimentent le débat démocratique.",
    institutions: [
      {
        name: "Cour des comptes",
        role: "Juge financier suprême",
        details:
          "Magistrats indépendants. Certifie les comptes de l'État (depuis 2006), publie le rapport public annuel (RPA, février), des rapports thématiques (santé, défense, retraites…), et le « Rapport sur l'exécution du budget » qui sert de base à la loi de règlement.",
        url: "https://www.ccomptes.fr",
      },
      {
        name: "Inspection Générale des Finances",
        abbr: "IGF",
        role: "Audit ad-hoc Bercy",
        details:
          "Corps d'inspection rattaché au ministre de l'Économie. Réalise des missions ponctuelles (audit d'un dispositif, évaluation d'une réforme). Recrute parmi les meilleurs ENA/INSP.",
      },
      {
        name: "Chambres régionales et territoriales des comptes",
        abbr: "CRTC",
        role: "Cour des comptes pour les collectivités",
        details:
          "Une CRC par région. Contrôlent les communes, départements, régions, hôpitaux, EPCI. Publient des rapports d'observation publics qui peuvent influencer le débat local.",
      },
    ],
  },
  {
    id: "analyser-conseiller",
    num: 8,
    title: "Analyser / conseiller",
    subtitle: "Recommander des évolutions à long terme",
    icon: "💡",
    color: "text-brand",
    bgColor: "bg-brand-soft/40",
    borderColor: "border-brand/30",
    monthsRange: "permanent",
    description:
      "En parallèle du cycle annuel, plusieurs organes d'expertise produisent des analyses et recommandations qui nourrissent les réformes structurelles. Certains sont publics, d'autres semi-publics ou indépendants.",
    institutions: [
      {
        name: "Conseil des Prélèvements Obligatoires",
        abbr: "CPO",
        role: "Analyse des impôts et cotisations",
        details:
          "Adossé à la Cour des comptes. Publie chaque année un rapport thématique sur un aspect du système fiscal (impôt sur les sociétés, fraude fiscale, fiscalité du capital, etc.).",
        url: "https://www.ccomptes.fr/fr/cpo",
      },
      {
        name: "France Stratégie",
        role: "Think tank du Premier ministre",
        details:
          "Service rattaché à Matignon. Évalue les politiques publiques, prospective à 10-20 ans. Publié les évaluations des aides publiques aux entreprises (CICE, etc.).",
        url: "https://www.strategie.gouv.fr",
      },
      {
        name: "Conseil d'Analyse Économique",
        abbr: "CAE",
        role: "Économistes universitaires conseils",
        details:
          "12 économistes nommés par le PM. Notes courtes (~10 pages) sur des sujets de politique publique : retraites, taxation du carbone, immobilier, etc. Indépendants.",
        url: "https://www.cae-eco.fr",
      },
      {
        name: "Observatoire Français des Conjonctures Économiques",
        abbr: "OFCE",
        role: "Centre de recherche indépendant",
        details:
          "Rattaché à Sciences Po. Produit des prévisions économiques et des analyses macroéconomiques. Voix souvent critique des choix gouvernementaux.",
        url: "https://www.ofce.sciences-po.fr",
      },
      {
        name: "INSEE",
        role: "Statisticien national",
        details:
          "Produit le PIB, l'inflation, les comptes nationaux, les comptes des APU. Source de référence pour toutes les analyses macro et budgétaires.",
        url: "https://www.insee.fr",
      },
      {
        name: "Banque de France",
        role: "Statistiques monétaires + dette",
        details:
          "Indépendante de l'État. Produit les statistiques de dette publique, taux OAT historiques, et coordonne avec la BCE. Ses prévisions économiques sont très scrutées.",
        url: "https://www.banque-france.fr",
      },
    ],
  },
];

// ----------------------------------------------------------------------------
// Composant principal
// ----------------------------------------------------------------------------

export function InstitutionsPage() {
  return (
    <>
      {/* Hero */}
      <section className="mt-6">
        <div className="text-xs uppercase tracking-widest text-muted">Démocratie financière</div>
        <h1 className="font-display text-3xl font-bold text-slate-900 mt-1">
          Qui décide, exécute et contrôle ton argent ?
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-3xl">
          Le budget de l'État ne tombe pas du ciel : il est rédigé, voté, validé,
          exécuté, surveillé, audité et analysé par une dizaine d'institutions qui
          s'enchaînent au cours d'un cycle annuel. Cette page te présente chacune
          d'elles et leur rôle précis. À la fin, un schéma synthétique te montre
          comment elles interagissent.
        </p>
      </section>

      {/* Vue d'ensemble en 7 actions */}
      <section className="mt-6">
        <DownloadableCard
          filename="budget-france-institutions-cycle"
          shareTitle="Budget France — institutions et cycle budgétaire"
          className="card p-5 md:p-6"
          getCsvData={() =>
            objectsToCsv(
              PHASES.flatMap((p) =>
                p.institutions.map((i) => ({
                  phase_num: p.num,
                  phase: p.title,
                  periode: p.monthsRange,
                  institution: i.name,
                  abreviation: i.abbr ?? "",
                  role: i.role,
                  details: i.details,
                  url: i.url ?? "",
                })),
              ),
            )
          }
        >
          <div className="text-xs uppercase tracking-widest text-muted">
            Vue d'ensemble
          </div>
          <h2 className="font-display text-xl font-semibold text-slate-900 mt-1">
            Le cycle budgétaire en 8 actions
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Le calendrier est précis : un budget annuel met <strong>~24 mois</strong> à
            traverser tout le cycle, de la rédaction (mars N-1) à l'audit final
            (octobre N+1). À tout moment, plusieurs institutions sont en train
            d'agir sur des budgets différents.
          </p>

          <ol className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {PHASES.map((p) => (
              <li
                key={p.id}
                className={`rounded-xl border p-4 ${p.bgColor} ${p.borderColor}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0 leading-none">{p.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className={`font-display text-lg font-bold ${p.color}`}>
                        {p.num}. {p.title}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-slate-500">
                        {p.monthsRange}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-700 mt-0.5">
                      {p.subtitle}
                    </div>
                    <div className="text-xs text-slate-500 mt-1.5">
                      {p.institutions.length} institution
                      {p.institutions.length > 1 ? "s" : ""} impliquée
                      {p.institutions.length > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </DownloadableCard>
      </section>

      {/* Détail de chaque phase */}
      {PHASES.map((p) => (
        <section key={p.id} id={`phase-${p.id}`} className="mt-6">
          <div className={`card p-5 md:p-6 ${p.bgColor} ${p.borderColor} border-l-4`}>
            <div className="flex items-start gap-4 flex-wrap">
              <span className="text-4xl shrink-0 leading-none">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-xs uppercase tracking-widest text-muted">
                    Phase {p.num}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full bg-white/70 border ${p.borderColor} ${p.color} uppercase tracking-wider font-medium`}>
                    {p.monthsRange}
                  </span>
                </div>
                <h2 className={`font-display text-2xl font-bold mt-1 ${p.color}`}>
                  {p.title}
                </h2>
                <p className="text-sm text-slate-700 mt-1 font-medium">{p.subtitle}</p>
                <p className="text-sm text-slate-700 mt-3 leading-relaxed">
                  {p.description}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {p.institutions.map((i) => (
                <div
                  key={i.name}
                  className="rounded-lg bg-white border border-slate-200 p-4"
                >
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h3 className="font-display font-semibold text-slate-900">
                      {i.name}
                    </h3>
                    {i.abbr && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-soft text-brand border border-blue-200 font-mono">
                        {i.abbr}
                      </span>
                    )}
                  </div>
                  <div className={`text-xs mt-1 font-semibold ${p.color}`}>
                    {i.role}
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {i.details}
                  </p>
                  {i.url && (
                    <a
                      href={i.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-[11px] text-brand hover:underline font-medium"
                    >
                      Site officiel →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Schéma synthétique du cycle */}
      <section className="mt-6">
        <DownloadableCard
          filename="budget-france-cycle-schema"
          shareTitle="Budget France — schéma du cycle budgétaire"
          className="card p-5 md:p-6"
        >
          <div className="text-xs uppercase tracking-widest text-muted">Schéma synthétique</div>
          <h2 className="font-display text-2xl font-bold text-slate-900 mt-1">
            Le cycle budgétaire annuel
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
            Voici comment toutes ces institutions s'enchaînent et interagissent. Lis le
            schéma dans le sens horaire en partant du haut. Les flèches indiquent les
            dépendances (qui transmet quoi à qui).
          </p>

          <div className="mt-5 overflow-x-auto">
            <CycleDiagram />
          </div>

          <p className="mt-5 text-xs text-slate-500 leading-relaxed">
            Les 8 phases ne sont pas étanches : pendant l'exécution N (phase 5),
            la rédaction de N+1 (phase 1) et l'audit de N-1 (phase 7) tournent
            <strong> en parallèle</strong>. Au total, à un instant T, ce sont
            ~3 budgets différents qui circulent entre les institutions.
          </p>
        </DownloadableCard>

        <ChartCitizenImpact
          text={
            <>
              <strong>Le système est conçu pour qu'aucune institution n'ait tout le
              pouvoir.</strong> Le gouvernement propose, le Parlement vote, le Conseil
              constitutionnel valide, l'administration exécute, la Cour des comptes audite.
              C'est le principe de séparation des pouvoirs appliqué aux finances publiques
              — héritage de la Révolution française. Tu peux écrire à n'importe laquelle
              de ces institutions : elles sont publiques et te répondent.
            </>
          }
        />
      </section>
    </>
  );
}

// ----------------------------------------------------------------------------
// Diagramme SVG synthétique du cycle budgétaire
// ----------------------------------------------------------------------------

function CycleDiagram() {
  // Coordonnées en pourcentage du viewBox 1000x680
  // 8 nœuds disposés en cercle (octogone) autour d'un centre
  const cx = 500;
  const cy = 340;
  const r = 240;

  const nodes = PHASES.map((p, idx) => {
    // Angle : on commence en haut (-90°) et on tourne dans le sens horaire
    const angle = (-Math.PI / 2) + (idx * 2 * Math.PI) / PHASES.length;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { ...p, x, y };
  });

  return (
    <svg
      viewBox="0 0 1000 680"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-4xl mx-auto"
      style={{ minHeight: "560px" }}
      role="img"
      aria-label="Schéma du cycle budgétaire annuel français en 8 phases"
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#0055A4" />
        </marker>
      </defs>

      {/* Cercle de fond */}
      <circle
        cx={cx}
        cy={cy}
        r={r - 60}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="2"
        strokeDasharray="4 4"
      />

      {/* Centre : titre du cycle */}
      <g>
        <circle cx={cx} cy={cy} r="80" fill="#eff6ff" stroke="#0055A4" strokeWidth="2" />
        <text x={cx} y={cy - 18} textAnchor="middle" fill="#0055A4" fontSize="14" fontWeight="700" fontFamily="Inter, system-ui">
          BUDGET
        </text>
        <text x={cx} y={cy} textAnchor="middle" fill="#0055A4" fontSize="14" fontWeight="700" fontFamily="Inter, system-ui">
          DE L'ÉTAT
        </text>
        <text x={cx} y={cy + 22} textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="Inter, system-ui">
          (~24 mois de cycle)
        </text>
      </g>

      {/* Flèches entre nœuds successifs (cycle) */}
      {nodes.map((node, idx) => {
        const next = nodes[(idx + 1) % nodes.length]!;
        const dx = next.x - node.x;
        const dy = next.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / dist;
        const uy = dy / dist;
        // Décale la flèche pour qu'elle ne touche pas les cercles
        const startX = node.x + ux * 55;
        const startY = node.y + uy * 55;
        const endX = next.x - ux * 55;
        const endY = next.y - uy * 55;

        return (
          <line
            key={`arrow-${idx}`}
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke="#0055A4"
            strokeWidth="2"
            markerEnd="url(#arrow)"
            opacity="0.7"
          />
        );
      })}

      {/* Nœuds (institutions/phases) */}
      {nodes.map((node) => (
        <g key={node.id}>
          {/* Cercle */}
          <circle
            cx={node.x}
            cy={node.y}
            r="50"
            fill="white"
            stroke="#0055A4"
            strokeWidth="2.5"
          />
          {/* Numéro + icône */}
          <text
            x={node.x}
            y={node.y - 14}
            textAnchor="middle"
            fontSize="22"
            fontFamily="Inter, system-ui"
          >
            {node.icon}
          </text>
          <text
            x={node.x}
            y={node.y + 10}
            textAnchor="middle"
            fill="#0055A4"
            fontSize="13"
            fontWeight="700"
            fontFamily="Inter, system-ui"
          >
            {node.num}
          </text>
          <text
            x={node.x}
            y={node.y + 28}
            textAnchor="middle"
            fill="#0f172a"
            fontSize="11"
            fontFamily="Inter, system-ui"
            fontWeight="600"
          >
            {node.title}
          </text>

          {/* Étiquette en dessous du cercle (subtitle court) */}
          <text
            x={node.x}
            y={node.y + 75}
            textAnchor="middle"
            fill="#64748b"
            fontSize="10"
            fontFamily="Inter, system-ui"
          >
            {shortenSubtitle(node.subtitle)}
          </text>
          <text
            x={node.x}
            y={node.y + 90}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="9"
            fontFamily="Inter, system-ui"
            fontStyle="italic"
          >
            {node.monthsRange}
          </text>
        </g>
      ))}
    </svg>
  );
}

function shortenSubtitle(s: string): string {
  // Coupe le subtitle trop long pour qu'il tienne dans le SVG
  if (s.length <= 32) return s;
  return s.slice(0, 30) + "…";
}
