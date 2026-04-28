// ============================================================================
// DefautSouverainExplainer
// ============================================================================
// Encadré pédagogique sur le dashboard, sous le compteur de dette :
//   « Quand la dette devient-elle "non-remboursable" ? »
//
// Trois sections :
//   1. Quand : seuils techniques et marqueurs concrets
//   2. Qui décide : agences, FMI, créanciers, Etat débiteur
//   3. Conséquences : pour l'État (perte de souveraineté) et pour le citoyen
//      (inflation, austérité, banques, retraites)
// ============================================================================

import { useState } from "react";
import { DownloadableCard } from "./DownloadableCard";
import { objectsToCsv } from "../lib/csvExport";

export function DefautSouverainExplainer() {
  const [openSection, setOpenSection] = useState<string | null>("quand");

  const csv = () =>
    objectsToCsv([
      {
        section: "Quand",
        contenu:
          "Pas de seuil mathématique unique. Marqueurs : charge dette > 25 % recettes, OAT > 8 %, ratio dette/PIB > 130 %, accès aux marchés bloqué.",
      },
      {
        section: "Qui décide",
        contenu:
          "Le pays débiteur reste souverain juridiquement, mais en pratique : agences (S&P/Moody's/Fitch) signalent, marchés exigent des taux insoutenables, FMI propose un programme avec conditions, BCE peut activer ou suspendre OMT/TPI.",
      },
      {
        section: "Conséquences État",
        contenu:
          "Perte d'accès aux marchés, mise sous tutelle FMI (memorandum), réformes imposées (austérité, privatisations), restructuration possible (haircut, allongement maturité, taux réduit).",
      },
      {
        section: "Conséquences citoyen",
        contenu:
          "Hausse fiscalité, baisse retraites/santé, inflation si monétisation, faillites bancaires (banques détenant la dette), gel des dépôts, contrôles capitaux, chute pouvoir d'achat 20-40 %.",
      },
      {
        section: "Précédents",
        contenu:
          "Argentine 2001 (haircut 65%), Grèce 2012 (haircut 53,5%), Russie 1998, Mexique 1982. France n'a jamais fait défaut depuis Napoléon (1812), mais a inflaté en 1945-1958.",
      },
    ]);

  return (
    <DownloadableCard
      filename="budget-france-dette-non-remboursable"
      shareTitle="Budget France — Quand la dette devient non remboursable"
      className="card p-5 md:p-6"
      getCsvData={csv}
    >
      <div className="text-xs uppercase tracking-widest text-muted">
        Concept clé · Soutenabilité de la dette
      </div>
      <h2 className="font-display text-xl md:text-2xl font-semibold text-slate-900 mt-1">
        Quand la dette devient-elle « non remboursable » ?
      </h2>
      <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
        Question fréquente, réponse nuancée. Un État ne fait pas faillite comme une
        entreprise : il garde sa souveraineté juridique. Mais à partir d'un certain
        point, la <strong>soutenabilité</strong> de sa dette n'est plus assurée — les
        marchés refusent de prêter, ou exigent des taux qui rendent toute nouvelle
        émission ruineuse.
      </p>

      <div className="mt-5 space-y-2">
        <Accordion
          id="quand"
          icon="📊"
          title="1. Quand parle-t-on d'insoutenabilité ?"
          open={openSection === "quand"}
          onToggle={(id) => setOpenSection(openSection === id ? null : id)}
        >
          <p>
            Il n'existe <strong>pas de seuil mathématique unique</strong>. Le Japon
            tient avec 250 % de dette/PIB, le Liban a explosé à 150 %. Les économistes
            regardent un faisceau d'indicateurs :
          </p>
          <ul className="list-disc list-inside space-y-1.5 mt-3 ml-1">
            <li>
              <strong>Charge de la dette &gt; 20-25 % des recettes :</strong> chaque euro
              d'impôt qui sert à payer les intérêts ne finance plus aucun service public.
            </li>
            <li>
              <strong>Taux OAT 10 ans &gt; 7-8 %</strong> ou <strong>spread &gt; 600 pb</strong> :
              les marchés signalent une défiance forte (cf. Italie 2011, Grèce 2010-2012).
            </li>
            <li>
              <strong>Croissance &lt; taux d'intérêt réel :</strong> effet « boule de
              neige » — la dette s'auto-alimente même sans nouveaux déficits primaires.
            </li>
            <li>
              <strong>Accès aux marchés gelé :</strong> les investisseurs refusent les
              nouvelles émissions à un taux raisonnable. C'est le déclencheur du défaut.
            </li>
            <li>
              <strong>Ratio dette/PIB &gt; 130-150 %</strong> couplé à un déficit
              primaire structurel : la combinaison est jugée non corrigible sans choc
              externe (FMI, BCE, défaut).
            </li>
          </ul>
          <p className="text-xs text-slate-500 mt-3">
            Pour la France (avril 2026) : ratio ~116 %, charge ~5-7 % des recettes,
            OAT 3,6 %, accès aux marchés normal. La situation est fragile mais
            techniquement soutenable.
          </p>
        </Accordion>

        <Accordion
          id="qui"
          icon="⚖️"
          title="2. Qui décide qu'un État ne peut plus rembourser ?"
          open={openSection === "qui"}
          onToggle={(id) => setOpenSection(openSection === id ? null : id)}
        >
          <p>
            <strong>Personne tout seul.</strong> C'est un processus en chaîne où
            plusieurs acteurs interviennent :
          </p>
          <ul className="list-disc list-inside space-y-1.5 mt-3 ml-1">
            <li>
              <strong>Les agences (S&amp;P, Moody's, Fitch)</strong> dégradent
              progressivement la note souveraine. Sous BBB-, la dette devient
              « spéculative » (junk bond) : beaucoup d'investisseurs institutionnels
              n'ont plus le droit d'en détenir.
            </li>
            <li>
              <strong>Les marchés financiers</strong> sanctionnent en exigeant des taux
              de plus en plus élevés. À un moment, l'État ne peut plus se refinancer.
            </li>
            <li>
              <strong>Le FMI</strong> propose un programme d'aide d'urgence avec
              conditions strictes (austérité, privatisations, réformes structurelles)
              en échange d'une ligne de crédit qui rassure les marchés.
            </li>
            <li>
              <strong>La BCE</strong> peut intervenir pour les pays de la zone euro via
              les programmes <em>OMT</em> (2012) ou <em>TPI</em> (2022) : achats illimités
              de dette si le pays accepte des conditions. <strong>Sans</strong> ce
              filet, l'Italie ou la France auraient pu défauter en 2011-2012.
            </li>
            <li>
              <strong>L'État débiteur lui-même</strong> reste souverain juridiquement.
              C'est lui qui annonce officiellement le défaut (cas Argentine 2001) ou
              négocie une restructuration avec ses créanciers (Grèce 2012).
            </li>
          </ul>
          <p className="text-xs text-slate-500 mt-3">
            En zone euro, défauter implique presque toujours sortir de l'euro
            (Grexit/Frexit) — coût économique estimé à 20-40 % du PIB la première année.
            C'est pourquoi la BCE défend l'euro à tout prix (« whatever it takes »,
            Draghi 2012).
          </p>
        </Accordion>

        <Accordion
          id="etat"
          icon="🏛️"
          title="3. Conséquences pour l'État"
          open={openSection === "etat"}
          onToggle={(id) => setOpenSection(openSection === id ? null : id)}
        >
          <ul className="list-disc list-inside space-y-1.5 ml-1">
            <li>
              <strong>Perte d'accès aux marchés :</strong> impossible d'émettre une
              nouvelle OAT à un taux raisonnable.
            </li>
            <li>
              <strong>Mise sous tutelle FMI</strong> avec mémorandum : la « troïka »
              (FMI + BCE + Commission UE) supervise les finances publiques et impose
              des réformes (cas Grèce 2010-2018, Portugal 2011-2014, Irlande 2010-2013).
            </li>
            <li>
              <strong>Restructuration de la dette :</strong>
              <ul className="list-disc list-inside ml-5 mt-1 space-y-0.5">
                <li><em>Haircut</em> : annulation partielle (Grèce 2012 : -53,5 % sur la dette privée)</li>
                <li><em>Reprofilage</em> : allongement de la maturité (passer de 10 à 30 ans)</li>
                <li><em>Réduction de coupon</em> : passer le taux de 5 % à 1 %</li>
              </ul>
            </li>
            <li>
              <strong>Réformes imposées :</strong> hausse de la TVA, baisse des
              retraites/salaires fonctionnaires, privatisations (ports, électricité),
              suppression des niches fiscales.
            </li>
            <li>
              <strong>Souveraineté économique réduite :</strong> les budgets nationaux
              doivent être validés par les créanciers internationaux pendant la durée
              du programme.
            </li>
          </ul>
        </Accordion>

        <Accordion
          id="citoyen"
          icon="👨‍👩‍👧"
          title="4. Conséquences pour le citoyen"
          open={openSection === "citoyen"}
          onToggle={(id) => setOpenSection(openSection === id ? null : id)}
        >
          <p>
            La théorie est sèche, la réalité est brutale. Voici ce qu'on a observé en
            Grèce (2010-2018), Argentine (2001-2002), Russie (1998) :
          </p>
          <ul className="list-disc list-inside space-y-1.5 mt-3 ml-1">
            <li>
              <strong>Hausse de la fiscalité</strong> immédiate (TVA, CSG, taxes sur
              produits courants) — typiquement +3 à +5 points de TVA en quelques
              semaines.
            </li>
            <li>
              <strong>Baisse des retraites</strong> et des salaires de la fonction
              publique de 15 à 30 % (Grèce : -22 % en 2012-2014).
            </li>
            <li>
              <strong>Coupes massives dans les services publics :</strong> hôpitaux
              fermés, classes surchargées, pensions d'invalidité réduites, aides
              sociales restreintes.
            </li>
            <li>
              <strong>Inflation</strong> si l'État monétise (rare en zone euro, fréquent
              en monnaie nationale) : Argentine 1989 a connu 5 000 % d'inflation en 1
              an. La monnaie perd sa valeur en quelques mois.
            </li>
            <li>
              <strong>Crise bancaire :</strong> les banques détiennent une partie
              importante de la dette publique. Un haircut entraîne souvent leur
              recapitalisation forcée (« bail-in ») ou leur faillite.
            </li>
            <li>
              <strong>Gel temporaire des dépôts</strong> et <strong>contrôles des
              capitaux</strong> : Chypre 2013 a limité les retraits à 300 €/jour
              pendant 2 ans, Grèce 2015 idem.
            </li>
            <li>
              <strong>Chute du pouvoir d'achat</strong> de 20 à 40 % la première année,
              avant un long retour à la normale (10-15 ans).
            </li>
            <li>
              <strong>Émigration massive</strong> des jeunes diplômés vers l'étranger
              (Grèce a perdu 500 000 jeunes entre 2010 et 2018, ~5 % de sa population).
            </li>
          </ul>
          <p className="text-xs text-slate-500 mt-3">
            Le défaut ne fait pas disparaître la dette — il transfère le coût des
            créanciers vers les citoyens du pays débiteur (et parfois vers les
            créanciers étrangers via le haircut). Personne n'y gagne, sauf à très
            long terme.
          </p>
        </Accordion>

        <Accordion
          id="france"
          icon="🇫🇷"
          title="5. Et la France dans tout ça ?"
          open={openSection === "france"}
          onToggle={(id) => setOpenSection(openSection === id ? null : id)}
        >
          <ul className="list-disc list-inside space-y-1.5 ml-1">
            <li>
              <strong>La France n'a pas fait défaut depuis 1812</strong> (Napoléon).
              C'est une exception historique en Europe.
            </li>
            <li>
              <strong>L'inflation post-1945 a effacé 70 % de la dette</strong> en valeur
              réelle entre 1945 et 1958 — c'est techniquement une forme douce de
              défaut, mais sans annulation officielle.
            </li>
            <li>
              <strong>La France emprunte aujourd'hui à des taux modérés</strong>
              (3,6 % à 10 ans) et la demande reste forte aux adjudications AFT —
              accès aux marchés totalement préservé.
            </li>
            <li>
              <strong>Le filet BCE (TPI) protège la zone euro :</strong> en cas de
              hausse violente du spread français, la BCE peut acheter de la dette
              française sans limite de montant, en échange de conditions.
            </li>
            <li>
              <strong>Risques principaux :</strong> dégradation des notations
              souveraines (déjà passées de AAA à AA-), hausse des taux d'intérêt
              (effet boule de neige), perte de confiance des investisseurs étrangers
              (qui détiennent 50 % de la dette).
            </li>
          </ul>
          <p className="text-xs text-slate-500 mt-3">
            Bref : la France n'est <strong>pas</strong> au bord du défaut. Mais elle
            doit garder son ratio dette/PIB sous contrôle pour préserver l'option
            d'emprunter en cas de prochaine crise (COVID, guerre, transition
            énergétique).
          </p>
        </Accordion>
      </div>

      <div className="mt-5 text-[11px] text-slate-500">
        Sources : FMI <em>Sovereign Debt Restructurings</em> (Cruces &amp; Trebesch
        2013), <em>Greek debt crisis chronology</em> (BCE), Cour des comptes
        rapports annuels, AFT — détenteurs de la dette française.
      </div>
    </DownloadableCard>
  );
}

// ----------------------------------------------------------------------------
// Accordéon réutilisable
// ----------------------------------------------------------------------------

function Accordion({
  id,
  icon,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  icon: string;
  title: string;
  open: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-brand-soft/30 transition-colors"
      >
        <span className="text-xl shrink-0">{icon}</span>
        <span className="flex-1 font-display font-semibold text-slate-900">{title}</span>
        <span
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-sm text-slate-700 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}
