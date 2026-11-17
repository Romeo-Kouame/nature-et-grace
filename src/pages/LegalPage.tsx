import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Breadcrumb from '../components/Breadcrumb'
import { usePageMeta } from '../hooks/usePageMeta'
import { PHOTO_CREDITS } from '../data/photoCredits'
import { ANALYTICS_ENABLED, reopenConsent } from '../analytics'

export type LegalKind = 'mentions' | 'cgv' | 'confidentialite' | 'remboursement' | 'cookies'

const TITLES: Record<LegalKind, string> = {
  mentions: 'Mentions légales',
  cgv: 'Conditions générales de vente',
  confidentialite: 'Politique de confidentialité',
  remboursement: 'Politique de retour et de remboursement',
  cookies: 'Politique cookies',
}

const DESCRIPTIONS: Record<LegalKind, string> = {
  mentions: 'Mentions légales de NATURE & GRÂCE : éditeur du site, hébergement, propriété intellectuelle et crédits photos.',
  cgv: 'Conditions générales de vente de NATURE & GRÂCE : commande, prix, livraison, paiement Wave et réclamations.',
  confidentialite: 'Politique de confidentialité de NATURE & GRÂCE : données collectées, utilisation, conservation et vos droits.',
  remboursement: 'Retours, échanges et remboursements chez NATURE & GRÂCE : délais, conditions et démarche sur WhatsApp.',
  cookies: 'Cookies et stockage utilisés par le site NATURE & GRÂCE, et comment modifier votre choix.',
}

/**
 * Textes de base rédigés pour une petite boutique en ligne ivoirienne payée par Wave.
 * À faire relire avant la mise en ligne commerciale : ils ne remplacent pas un conseil juridique.
 */
export const LegalPage: React.FC<{ kind: LegalKind }> = ({ kind }) => {
  const { settings, waDisplay, navigate } = useApp()
  usePageMeta(TITLES[kind], DESCRIPTIONS[kind])
  const identity = settings.legalInfo.trim()

  const link = (path: string, label: string) => (
    <a
      href={path}
      onClick={(e) => {
        e.preventDefault()
        navigate(path)
      }}
    >
      {label}
    </a>
  )

  return (
    <div className="ng-container ng-subpage ng-legal">
      <Breadcrumb items={[{ label: TITLES[kind] }]} />
      <header className="ng-page-head ng-page-head--left">
        <span className="ng-eyebrow">INFORMATIONS LÉGALES</span>
        <h1>{TITLES[kind]}</h1>
      </header>

      {!identity && (
        <p className="ng-legal-todo" role="note">
          <AlertTriangle size={18} />
          L’identité de l’entreprise (raison sociale, RCCM, adresse) n’est pas encore renseignée. Elle se complète dans
          l’espace boutique, rubrique « Boutique ».
        </p>
      )}

      {kind === 'mentions' && (
        <article>
          <h2>Éditeur du site</h2>
          {identity ? <p className="ng-legal-identity">{identity}</p> : <p>NATURE &amp; GRÂCE — informations à compléter.</p>}
          <p>Contact : WhatsApp et téléphone {waDisplay}.</p>
          <h2>Hébergement</h2>
          <p>Le nom et l’adresse de l’hébergeur du site seront indiqués lors de sa mise en ligne.</p>
          <h2>Propriété intellectuelle</h2>
          <p>
            Le nom NATURE &amp; GRÂCE, le logo et les textes de ce site appartiennent à la marque. Toute reproduction sans
            autorisation est interdite.
          </p>
          <h2 id="credits-photos">Crédits photos</h2>
          <p>
            Les photos d’illustration ont été prises en Côte d’Ivoire, au Ghana et dans d’autres pays d’Afrique de l’Ouest.
            Elles proviennent de Wikimedia Commons, sous licence libre, et ne représentent pas toujours exactement les produits
            vendus. Merci à leurs auteurs :
          </p>
          <ul className="ng-credits">
            {PHOTO_CREDITS.map((c) => (
              <li key={c.file}>
                <a href={c.source} target="_blank" rel="noreferrer">{c.title}</a> — {c.author} ({c.license})
              </li>
            ))}
          </ul>
        </article>
      )}

      {kind === 'cgv' && (
        <article>
          <h2>1. Objet</h2>
          <p>
            Les présentes conditions s’appliquent aux commandes passées auprès de NATURE &amp; GRÂCE sur ce site ou par
            WhatsApp. Passer commande vaut acceptation de ces conditions.
          </p>
          <h2>2. Produits et prix</h2>
          <p>
            Les produits sont décrits avec le plus grand soin. Les prix sont indiqués en francs CFA (FCFA), hors frais de
            livraison. Un produit affiché « Prix à confirmer » ne peut être commandé qu’après confirmation de son prix par la
            boutique.
          </p>
          <h2>3. Commande</h2>
          <p>
            La commande envoyée sur le site est une demande. Elle devient définitive après confirmation par la boutique du
            total, des frais et du délai de livraison, puis réception du paiement. Une référence est communiquée au client à
            l’envoi de sa demande.
          </p>
          <h2>4. Livraison</h2>
          <p>
            Zones desservies : {settings.deliveryCommunes}. {settings.deliveryInfo} Les frais et délais sont toujours
            communiqués au client avant le paiement. Le client vérifie son colis à la réception et signale tout problème
            sous 48 heures.
          </p>
          <h2>5. Paiement</h2>
          <p>
            Le paiement s’effectue uniquement par Wave. {settings.waveInstructions} Le client peut transmettre la capture de
            son paiement depuis le site ou par WhatsApp. La boutique ne demande jamais de code secret.
          </p>
          <h2>6. Retours et réclamations</h2>
          <p>
            Pour des raisons d’hygiène, un produit cosmétique ouvert ou utilisé ne peut être ni repris ni échangé. Un
            produit abîmé à la livraison ou ne correspondant pas à la commande est remplacé ou remboursé, sur présentation
            d’une photo envoyée par WhatsApp dans les 48 heures suivant la réception. Le détail figure dans la{' '}
            {link('/remboursement', 'politique de retour et de remboursement')}.
          </p>
          <h2>7. Utilisation des produits</h2>
          <p>
            Les conseils du site, y compris ceux du conseiller IA, sont indicatifs et ne remplacent pas un avis médical.
            Faites un essai sur une petite zone de peau avant la première utilisation.
          </p>
          <h2>8. Droit applicable</h2>
          <p>
            Les présentes conditions sont soumises au droit ivoirien, notamment la loi n° 2013-546 du 30 juillet 2013 relative
            aux transactions électroniques. En cas de désaccord, une solution amiable est recherchée en priorité.
          </p>
        </article>
      )}

      {kind === 'remboursement' && (
        <article>
          <h2>Produit abîmé ou erreur de commande</h2>
          <p>
            Si un produit arrive abîmé, ouvert, incomplet ou ne correspond pas à votre commande, envoyez-nous une photo sur
            WhatsApp au {waDisplay} dans les 48 heures suivant la réception, avec la référence de votre commande. Selon votre
            choix, nous remplaçons le produit sans frais ou nous vous remboursons.
          </p>
          <h2>Produit ouvert ou utilisé</h2>
          <p>
            Pour des raisons d’hygiène, un produit cosmétique ouvert ou utilisé ne peut être ni repris ni échangé, sauf s’il
            présente un défaut.
          </p>
          <h2>Annulation avant expédition</h2>
          <p>
            Vous pouvez annuler une commande tant qu’elle n’est pas expédiée, en écrivant sur WhatsApp. Si vous avez déjà payé,
            la somme vous est rendue intégralement.
          </p>
          <h2>Comment se passe le remboursement</h2>
          <p>
            Le remboursement est fait par Wave, sur le numéro qui a servi au paiement, dans un délai de 7 jours après accord
            de la boutique. Il comprend le prix des produits concernés et, en cas d’erreur ou de produit abîmé, les frais de
            livraison.
          </p>
          <p>Voir aussi les {link('/cgv', 'conditions générales de vente')}.</p>
        </article>
      )}

      {kind === 'cookies' && (
        <article>
          <h2>Ce que le site enregistre toujours</h2>
          <p>Ces éléments sont indispensables au fonctionnement de la boutique ; ils ne servent ni à la publicité ni au suivi :</p>
          <ul>
            <li>un cookie de connexion à votre compte (30 jours), supprimé à la déconnexion ;</li>
            <li>votre panier, vos favoris et votre choix de thème, gardés sur votre appareil ;</li>
            <li>votre choix concernant la mesure d’audience.</li>
          </ul>
          <h2>Mesure d’audience (seulement avec votre accord)</h2>
          <p>
            {ANALYTICS_ENABLED
              ? 'Avec votre accord, le site utilise Google Analytics pour compter les visites et savoir quelles pages sont consultées. Ces statistiques servent uniquement à améliorer la boutique. Sans votre accord, rien n’est chargé.'
              : 'Le site n’utilise actuellement aucun outil de mesure d’audience ni aucun cookie publicitaire.'}
          </p>
          {ANALYTICS_ENABLED && (
            <p>
              <button type="button" className="ng-btn ng-btn--ghost ng-btn--sm" onClick={reopenConsent}>
                Modifier mon choix
              </button>
            </p>
          )}
          <h2>Services extérieurs</h2>
          <p>
            Les boutons WhatsApp ouvrent l’application WhatsApp, soumise à ses propres règles.
            {settings.storeAddress ? ' La carte de la page Contact est fournie par Google Maps, qui peut déposer ses propres cookies.' : ''}
          </p>
          <p>Voir aussi la {link('/confidentialite', 'politique de confidentialité')}.</p>
        </article>
      )}

      {kind === 'confidentialite' && (
        <article>
          <h2>Données collectées</h2>
          <p>
            Nous ne collectons que ce qui est nécessaire pour vous servir. Pour votre compte : nom, numéro de téléphone,
            adresse e-mail si vous la donnez, mot de passe (enregistré sous forme chiffrée, illisible même pour la boutique)
            et date d’acceptation des conditions. Pour une commande : nom, téléphone, commune et adresse de livraison, ainsi
            que la capture de paiement Wave si vous l’envoyez. Pour un avis, avec votre accord : prénom, ville et texte de
            l’avis, affichés une fois l’avis publié.
          </p>
          <h2>Utilisation</h2>
          <p>
            Ces données servent uniquement à préparer, livrer et suivre votre commande, et à vous contacter à son sujet. Elles
            ne sont ni vendues ni cédées. Les échanges WhatsApp sont soumis aux conditions de WhatsApp.
          </p>
          <h2>Conservation</h2>
          <p>
            Votre compte est conservé tant que vous ne le supprimez pas. Les commandes sont conservées le temps nécessaire au
            suivi des ventes et aux obligations comptables ; si vous supprimez votre compte, elles sont gardées sans votre
            nom, votre téléphone ni votre adresse.
          </p>
          <h2>Sur votre appareil</h2>
          <p>
            Le site garde sur votre téléphone ou ordinateur votre panier, vos favoris et votre choix de thème, ainsi qu’un
            cookie de connexion. Le détail figure dans la {link('/cookies', 'politique cookies')}.
          </p>
          <h2>Conseiller IA</h2>
          <p>
            Le texte que vous saisissez dans le conseiller beauté est transmis au service d’intelligence artificielle Google
            Gemini pour composer la réponse. N’y indiquez pas d’informations personnelles ou médicales sensibles.
          </p>
          <h2>Vos droits</h2>
          <p>
            Conformément à la loi n° 2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel,
            vous pouvez consulter et corriger vos données depuis {link('/compte', 'votre compte')}, et les supprimer
            vous-même avec le bouton « Supprimer mon compte ». Vous pouvez aussi faire ces demandes sur WhatsApp au{' '}
            {waDisplay}. Le site ne s’adresse pas aux enfants : une personne mineure doit obtenir l’accord d’un parent avant
            de créer un compte ou de commander. Voir aussi les {link('/cgv', 'conditions de vente')}.
          </p>
        </article>
      )}
    </div>
  )
}

export default LegalPage
