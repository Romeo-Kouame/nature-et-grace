import React from 'react'
import { ArrowUpRight, Leaf, MapPin, MessageCircle, Phone, ShieldCheck, Truck } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { CATEGORIES } from '../data/products'
import { ProductCategory } from '../types'

const WA_NUMBER = '2250717684751'
const WA_DISPLAY = '+225 07 17 68 47 51'

const PROMISES = [
  { icon: Truck, title: 'Livraison en 24 h', text: 'Partout à Abidjan' },
  { icon: ShieldCheck, title: 'Paiement Wave', text: 'Sécurisé, sans frais' },
  { icon: Leaf, title: '100 % naturel', text: 'Sans paraben ni additif' },
  { icon: MessageCircle, title: 'Conseils WhatsApp', text: 'Réponse rapide' },
]

export const Footer: React.FC = () => {
  const { navigate, setSelectedCategory, setSearchTerm } = useApp()

  const openCategory = (cat: ProductCategory) => {
    setSearchTerm('')
    setSelectedCategory(cat)
    navigate('/boutique')
  }

  return (
    <footer className="ng-footer">
      {/* Engagements */}
      <div className="ng-container">
        <ul className="ng-promises">
          {PROMISES.map(({ icon: Icon, title, text }) => (
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
                  <small>Cosmétique naturelle ivoirienne</small>
                </span>
              </button>
              <p>
                Des soins purs au beurre de cacao de Côte d’Ivoire, préparés de façon artisanale pour la peau et les
                cheveux.
              </p>
              <a className="ng-footer-cta" href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer">
                <MessageCircle size={18} /> Commander sur WhatsApp
              </a>
            </div>

            <nav aria-label="Boutique">
              <h4>Boutique</h4>
              <ul>
                {CATEGORIES.filter((c) => c !== 'Toutes les catégories').map((cat) => (
                  <li key={cat}>
                    <button type="button" onClick={() => openCategory(cat)}>
                      {cat}
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={() => openCategory('Toutes les catégories')}>
                    Tous les produits
                  </button>
                </li>
              </ul>
            </nav>

            <nav aria-label="Informations">
              <h4>La maison</h4>
              <ul>
                <li>
                  <button type="button" onClick={() => navigate('/histoire')}>
                    Notre histoire
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/temoignages')}>
                    Avis clients
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/contact')}>
                    Livraison &amp; contact
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => navigate('/favoris')}>
                    Mes favoris
                  </button>
                </li>
              </ul>
            </nav>

            <div className="ng-footer-contact">
              <h4>Nous joindre</h4>
              <ul>
                <li>
                  <Phone size={16} />
                  <a href={`tel:+${WA_NUMBER}`}>{WA_DISPLAY}</a>
                </li>
                <li>
                  <MessageCircle size={16} />
                  <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer">
                    WhatsApp, réponse rapide
                  </a>
                </li>
                <li>
                  <MapPin size={16} />
                  <span>Abidjan, Côte d’Ivoire · expédition vers l’intérieur</span>
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
            <span className="ng-footer-made">Fait avec soin en Côte d’Ivoire</span>
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
