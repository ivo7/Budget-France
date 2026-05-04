// ============================================================================
// DonneesPubliquesPage.tsx — État de la donnée publique en France
// ============================================================================
//
// Page pédagogique qui explique le calendrier de publication des données
// budgétaires françaises (national + local) et pourquoi il y a toujours
// un décalage entre l'année calendaire et les chiffres affichés.
//
// Objectifs :
//   1. Désamorcer la critique « vos chiffres sont vieux » — montrer que ce
//      retard est structurel et identique pour toutes les sources (Bercy,
//      Cour des comptes, OFGL, INSEE…).
//   2. Apprendre aux citoyens / journalistes / chercheurs comment et quand
//      la donnée descend du terrain vers les bases ouvertes.
//   3. Rendre Budget France plus crédible en exposant la méthodologie.
//
// Route : #/donnees-publiques
// Liens entrants depuis : DataLagBanner (MaVillePage), Sources (SourcesPage),
// Footer (à ajouter si pertinent).
// ============================================================================

export function DonneesPubliquesPage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <header className="card p-6 md:p-8 bg-brand-soft/30 border-brand/20">
        <span className="text-xs uppercase tracking-widest text-brand">
          Méthodologie · Transparence
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-2">
          État de la donnée publique en France
        </h1>
        <p className="text-base text-slate-700 mt-3 max-w-3xl leading-relaxed">
          Pourquoi les chiffres budgétaires que vous lisez ici (et partout
          ailleurs) ont toujours <strong>plusieurs mois — voire 18 mois — de
          retard</strong> sur l'actualité. Comment le système comptable
          français produit, contrôle et publie la donnée. Et où Budget
          France se situe dans cette chaîne.
        </p>
      </header>

      {/* Calendrier d'une année comptable */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-3">
          Le calendrier d'une année comptable communale
        </h2>
        <p className="text-sm text-slate-700 mb-4 leading-relaxed">
          Pour comprendre pourquoi les comptes 2025 ne seront disponibles qu'à
          l'automne 2026, il faut suivre le parcours d'une année
          d'argent public, de sa dépense à sa publication open data.
        </p>

        <ol className="space-y-3 text-sm text-slate-800">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <div>
              <strong className="text-slate-900">Année N — exercice budgétaire en cours</strong>
              <p className="text-slate-600 mt-0.5">
                La commune dépense et encaisse au fil de l'année (1ᵉʳ janv. → 31 déc. N).
                Chaque mandat est signé par le maire (ordonnateur), payé par le comptable public
                DGFiP. Aucun chiffre consolidé n'existe encore.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <div>
              <strong className="text-slate-900">Janv–juin N+1 — clôture et vote du compte administratif (CA)</strong>
              <p className="text-slate-600 mt-0.5">
                Le maire présente devant le conseil municipal le bilan
                définitif des recettes et dépenses de l'année N. Le CA
                doit être voté avant le <strong>30 juin N+1</strong>. C'est
                la première fois que les chiffres consolidés existent.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
              3
            </span>
            <div>
              <strong className="text-slate-900">Été N+1 — collecte par la DGFiP</strong>
              <p className="text-slate-600 mt-0.5">
                Les trésoreries locales remontent les comptes de gestion à la
                DGFiP. Les communes en retard ne sont pas comptabilisées
                immédiatement. Sur 35 062 communes, ~95 % sont remontées en
                septembre, le reste s'aligne progressivement.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
              4
            </span>
            <div>
              <strong className="text-slate-900">Automne N+1 / début N+2 — publication open data OFGL</strong>
              <p className="text-slate-600 mt-0.5">
                L'Observatoire des Finances et de la Gestion publique
                Locales (OFGL) agrège, vérifie, harmonise les comptes des
                35 062 communes + 1 250 EPCI + 101 départements + 18 régions,
                puis diffuse en open data. C'est la base utilisée par Budget
                France, les médias économiques et les chercheurs.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
              ✓
            </span>
            <div>
              <strong className="text-slate-900">Au total : 12 à 18 mois de décalage</strong>
              <p className="text-slate-600 mt-0.5">
                C'est inévitable — un compte ne peut pas être publié avant
                d'être clos, voté et certifié. Toutes les sources publiques
                françaises ont ce délai (parfois plus, voir tableau ci-dessous).
              </p>
            </div>
          </li>
        </ol>
      </section>

      {/* Tableau de comparaison : délais par source */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-3">
          Délai de publication par source officielle
        </h2>
        <p className="text-sm text-slate-700 mb-4 leading-relaxed">
          Le délai n'est pas spécifique à Budget France — c'est une caractéristique
          structurelle de la donnée publique en France et dans tous les pays
          européens. Voici le panorama :
        </p>

        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3 font-semibold">Source</th>
                <th className="py-2 pr-3 font-semibold">Donnée</th>
                <th className="py-2 pr-3 font-semibold">Délai typique</th>
                <th className="py-2 pr-3 font-semibold">Mise à jour</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-3 font-medium">OFGL / DGFiP</td>
                <td className="py-2 pr-3">Comptes communes (CA)</td>
                <td className="py-2 pr-3">12-18 mois</td>
                <td className="py-2 pr-3">Annuelle</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-3 font-medium">INSEE</td>
                <td className="py-2 pr-3">PIB définitif</td>
                <td className="py-2 pr-3">9-12 mois</td>
                <td className="py-2 pr-3">Trimestrielle puis révisée</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-3 font-medium">INSEE</td>
                <td className="py-2 pr-3">Comptes nationaux annuels</td>
                <td className="py-2 pr-3">15 mois</td>
                <td className="py-2 pr-3">Mai / révision sept.</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-3 font-medium">Eurostat</td>
                <td className="py-2 pr-3">Dette / déficit notification</td>
                <td className="py-2 pr-3">~4 mois</td>
                <td className="py-2 pr-3">2 fois/an (avril, octobre)</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-3 font-medium">Cour des comptes</td>
                <td className="py-2 pr-3">Rapport sur les finances publiques</td>
                <td className="py-2 pr-3">12-18 mois</td>
                <td className="py-2 pr-3">Annuelle (juin)</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-3 font-medium">Bercy</td>
                <td className="py-2 pr-3">Loi de règlement</td>
                <td className="py-2 pr-3">5-7 mois</td>
                <td className="py-2 pr-3">Annuelle (juin)</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-3 font-medium">Bercy</td>
                <td className="py-2 pr-3">Situation mensuelle du budget</td>
                <td className="py-2 pr-3">~1 mois</td>
                <td className="py-2 pr-3">Mensuelle</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 pr-3 font-medium">Banque de France</td>
                <td className="py-2 pr-3">Taux OAT 10 ans</td>
                <td className="py-2 pr-3">Temps réel</td>
                <td className="py-2 pr-3">Continue (jours ouvrés)</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-medium">DGFiP</td>
                <td className="py-2 pr-3">Recettes IR / IS / TVA</td>
                <td className="py-2 pr-3">2-3 mois</td>
                <td className="py-2 pr-3">Mensuelle</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-500 mt-3 italic leading-relaxed">
          Comparaison internationale : l'Allemagne publie ses comptes locaux avec
          18-24 mois de retard, le Royaume-Uni avec 12-15 mois, l'Italie avec
          18-24 mois. La France n'est pas en retard sur ses voisins.
        </p>
      </section>

      {/* Pourquoi pas de temps réel ? */}
      <section className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-3">
          Pourquoi pas de chiffres en temps réel ?
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          La technologie permettrait, en théorie, de publier les flux comptables
          au jour le jour. Trois raisons concrètes l'empêchent :
        </p>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li className="flex gap-2">
            <span className="text-brand">•</span>
            <span>
              <strong>La norme comptable elle-même</strong> impose des
              écritures de fin d'exercice (rattachements, provisions,
              régularisations) qui ne sont calculables qu'après le 31
              décembre. Un chiffre en cours d'exercice n'a pas encore
              de sens définitif.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand">•</span>
            <span>
              <strong>La séparation ordonnateur / comptable</strong>
              (principe républicain de 1862) implique deux contrôles
              successifs : le maire engage la dépense, la trésorerie DGFiP
              la paie. Les deux comptabilités doivent ensuite être
              rapprochées : le compte administratif (maire) doit
              correspondre au compte de gestion (DGFiP). Ça prend du temps.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand">•</span>
            <span>
              <strong>L'harmonisation entre 35 062 communes</strong> n'est
              pas instantanée. Toutes n'utilisent pas le même logiciel
              comptable, ne ferment pas leurs comptes au même rythme, ne
              transmettent pas leurs fichiers à la même date. OFGL doit
              attendre qu'un seuil suffisant soit atteint pour produire un
              jeu de données représentatif.
            </span>
          </li>
        </ul>
      </section>

      {/* Comment Budget France compense */}
      <section className="card p-5 md:p-6 bg-emerald-50 border-emerald-200">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-3">
          Comment Budget France compense ce délai
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed mb-4">
          On combine plusieurs sources à différents rythmes pour vous offrir
          une vue aussi fraîche que possible :
        </p>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>
              <strong>Indicateurs en quasi temps réel</strong> : taux OAT 10 ans,
              taux Bund, spread OAT-Bund, taux directeur BCE — actualisés
              chaque jour ouvré (~1 jour de retard).
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>
              <strong>Compteur dette en direct</strong> : extrapole en continu
              depuis la dernière publication officielle Eurostat/INSEE, en
              appliquant la dynamique de déficit votée en LFI. Précis à
              l'échelle de la semaine.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>
              <strong>Données mensuelles Bercy</strong> : situation mensuelle du
              budget de l'État (recettes IR, IS, TVA, dépenses par mission)
              ingérée chaque mois.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>
              <strong>Données annuelles définitives</strong> : comptes nationaux
              INSEE, CA des collectivités, rapports de la Cour des comptes
              — intégrés dès leur publication open data.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>
              <strong>Référence au cadre voté en cours</strong> : LFI 2026
              (votée en décembre 2025) sert de scénario de référence pour
              tout l'exercice en cours, en attendant le compte définitif.
            </span>
          </li>
        </ul>
      </section>

      {/* À retenir */}
      <section className="card p-5 md:p-6 bg-slate-900 text-slate-50 border-slate-800">
        <h2 className="font-display text-xl font-semibold mb-3">À retenir</h2>
        <ul className="space-y-2 text-sm leading-relaxed">
          <li>
            • Le décalage de <strong>12 à 18 mois</strong> sur les comptes
            communaux n'est pas une lacune de Budget France — c'est la limite
            de la donnée publique elle-même.
          </li>
          <li>
            • Pour <strong>l'année en cours</strong>, on regarde les
            indicateurs en temps réel (OAT, BCE, déficit live) et le scénario
            voté en LFI.
          </li>
          <li>
            • Pour <strong>les comptes définitifs</strong>, il faut accepter
            d'attendre que les 35 062 communes aient voté, transmis,
            consolidé. C'est le prix d'une donnée vérifiable et certifiée par
            la DGFiP.
          </li>
          <li>
            • Toute source qui prétend afficher des comptes définitifs en
            temps réel (« la commune X dépense Y € en ce moment »)
            <strong> ment ou bricole</strong>.
          </li>
        </ul>
      </section>
    </div>
  );
}
