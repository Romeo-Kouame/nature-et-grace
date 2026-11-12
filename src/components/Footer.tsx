import React from 'react'
import { ArrowUpRight, Leaf, MapPin, MessageCircle, Phone, ShieldCheck, Truck } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ALL_CATEGORIES } from '../types'

const LEGAL_LINKS = [
  { path: '/mentions-legales', label: 'Mentions légales' },
  { path: '/cgv', label: 'Conditions de vente' },
  { path: '/confidentialite', label: 'Confidentialité' },
]

export const Footer: React.FC = () => {
  const { navigate, setSelectedCategory, setSearchTerm, categories, settings, waLink, waDisplay } = useApp()

  const openCategory = (cat: string) => {
    setSearchTerm('')
    setSelectedCategory(cat)
    navigate('/boutique')
  }

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

  const promises = [
    { icon: Truck, title: 'Livraison', text: settings.deliveryCommunes },
    { icon: ShieldCheck, title: 'Paiement Wave', text: 'Après confirmation de la boutique' },
    { icon: Leaf, title: 'Soins naturels', text: 'Cacao et végétaux de Côte d’Ivoire' },
    { icon: MessageCircle, title: 'Conseils WhatsApp', text: waDisplay },
  ]

  return (
    <footer className="ng-footer">
      <div className="ng-container">
        <ul className="ng-promises">
          {promises.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span>
                <Icon size={20} />
              </span>
              <div>
                <b>{title}</b>
                <small>{text}</small>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="ng-footer-main">
        <div className="ng-container">
          <div className="ng-footer-grid">
            <div className="ng-footer-brand">
              <button type="button" className="ng-footer-logo" onClick={() => navigate('/')}>
                <img src="/logo.jpeg" alt="" />
                <span>
                  <b>Nature &amp; Grâce</b>
                  <small>Prenez soin de vous naturellement</small>
                </span>
              </button>
              <p>Des soins au beurre de cacao de Côte d’Ivoire, préparés de façon artisanale pour la peau et les cheveux.</p>
              <a className="ng-footer-cta" href={waLink()} target="_blank" rel="noreferrer">
                <MessageCircle size={18} /> Commander sur WhatsApp
              </a>
            </div>

            <nav aria-label="Boutique">
              <h4>Boutique</h4>
              <ul>
                {categories.map((cat) => (
                  <li key={cat}>
                    <button type="button" onClick={() => openCategory(cat)}>
                      {cat}
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={() => openCategory(ALL_CATEGORIES)}>
                    Tous les produits
                  </button>
                </li>
              </ul>
            </nav>

            <nav aria-label="Informations">
              <h4>La maison</h4>
              <ul>
                <li>{link('/histoire', 'Notre histoire')}</li>
                <li>{link('/temoignages', 'Avis clients')}</li>
                <li>{link('/contact', 'Livraison & contact')}</li>
                <li>{link('/favoris', 'Mes favoris')}</li>
              </ul>
            </nav>

            <div className="ng-footer-contact">
              <h4>Nous joindre</h4>
              <ul>
                <li>
                  <Phone size={16} />
                  <a href={`tel:+${settings.whatsappNumber}`}>{waDisplay}</a>
                </li>
                <li>
                  <MessageCircle size={16} />
                  <a href={waLink()} target="_blank" rel="noreferrer">
                    Écrire sur WhatsApp
                  </a>
                </li>
                <li>
                  <MapPin size={16} />
                  <span>Côte d’Ivoire · {settings.deliveryCommunes}</span>
                </li>
              </ul>
              <div className="ng-pay">
                <span>Paiement accepté</span>
                <b>
                  <i>W</i> Wave
                </b>
              </div>
            </div>
          </div>

          <div className="ng-footer-bottom">
            <span>© {new Date().getFullYear()} Nature &amp; Grâce. Tous droits réservés.</span>
            <nav className="ng-footer-legal" aria-label="Informations légales">
              {LEGAL_LINKS.map((l) => (
                <React.Fragment key={l.path}>{link(l.path, l.label)}</React.Fragment>
              ))}
            </nav>
            <a href="/admin" className="ng-footer-admin">
              Espace boutique <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
