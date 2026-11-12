import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { PHOTO_CREDITS } from '../data/photoCredits'

export type LegalKind = 'mentions' | 'cgv' | 'confidentialite'

const TITLES: Record<LegalKind, string> = {
  mentions: 'Mentions légales',
  cgv: 'Conditions générales de vente',
  confidentialite: 'Politique de confidentialité',
}

/**
 * Textes de base rédigés pour une petite boutique en ligne ivoirienne payée par Wave.
 * À faire relire avant la mise en ligne commerciale : ils ne remplacent pas un conseil juridique.
 */
export const LegalPage: React.FC<{ kind: LegalKind }> = ({ kind }) => {
  const { settings, waDisplay, navigate } = useApp()
  usePageMeta(TITLES[kind])
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
            d’une photo envoyée par WhatsApp dans les 48 heures suivant la réception.
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

      {kind === 'confidentialite' && (
        <article>
          <h2>Données collectées</h2>
          <p>
            Pour traiter une commande, nous collectons votre nom, votre numéro de téléphone, votre commune et votre adresse
            de livraison, ainsi que la capture de paiement Wave si vous l’envoyez. Pour un avis, nous collectons votre prénom
            et votre ville, qui sont affichés avec l’avis publié.
          </p>
          <h2>Utilisation</h2>
          <p>
            Ces données servent uniquement à préparer, livrer et suivre votre commande, et à vous contacter à son sujet. Elles
            ne sont ni vendues ni cédées. Les échanges WhatsApp sont soumis aux conditions de WhatsApp.
          </p>
          <h2>Conservation</h2>
          <p>Les données de commande sont conservées le temps nécessaire au suivi des ventes et aux obligations comptables.</p>
          <h2>Sur votre appareil</h2>
          <p>
            Le site garde sur votre téléphone ou ordinateur votre panier, vos favoris, votre choix de thème et, si vous
            l’acceptez, vos coordonnées de livraison. Ces informations restent sur votre appareil ; vous pouvez les effacer
            depuis le panier ou les réglages de votre navigateur.
          </p>
          <h2>Conseiller IA</h2>
          <p>
            Le texte que vous saisissez dans le conseiller beauté est transmis au service d’intelligence artificielle Google
            Gemini pour composer la réponse. N’y indiquez pas d’informations personnelles ou médicales sensibles.
          </p>
          <h2>Vos droits</h2>
          <p>
            Conformément à la loi n° 2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel,
            vous pouvez demander l’accès, la correction ou la suppression de vos données en écrivant sur WhatsApp au{' '}
            {waDisplay}. Voir aussi les {link('/cgv', 'conditions de vente')}.
          </p>
        </article>
      )}
    </div>
  )
}

export default LegalPage
