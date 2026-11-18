import React from 'react'
import { ArrowRight, HeartHandshake, Leaf, ShieldCheck, Sparkles } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Breadcrumb from '../components/Breadcrumb'
import { usePageMeta } from '../hooks/usePageMeta'
import { PHOTOS } from '../data/products'

/** Photos d'ambiance prises en Côte d'Ivoire (à remplacer par celles des productrices quand la boutique les aura). */
const STORY_IMAGE = PHOTOS.plantation
const CRAFT_IMAGE = PHOTOS.cabosse
const MARKET_IMAGE = PHOTOS.cacaoPanier

const VALUES = [
  {
    icon: Leaf,
    title: 'Le cacao ivoirien',
    text: 'Premier producteur mondial de cacao, la Côte d’Ivoire offre un beurre riche et nourrissant, utilisé depuis toujours pour prendre soin de la peau.',
  },
  {
    icon: HeartHandshake,
    title: 'Des productrices ivoiriennes',
    text: 'Nous ne fabriquons pas nos soins : nous les choisissons auprès de productrices ivoiriennes, qui les préparent selon leur savoir-faire, comme le savon noir aux cendres de cabosse.',
  },
  {
    icon: ShieldCheck,
    title: 'Des formules simples',
    text: 'Peu d’ingrédients, faciles à comprendre : pour chaque soin, nous vous disons ce qu’il contient et comment l’utiliser.',
  },
]

export const StoryPage: React.FC = () => {
  const { navigate, setAdvisorOpen } = useApp()
  usePageMeta('Notre histoire', 'Nature & Grâce, des soins naturels au cacao de Côte d’Ivoire : notre histoire et nos valeurs.')

  return (
    <div className="ng-container ng-subpage">
      <Breadcrumb items={[{ label: 'Notre histoire' }]} />
      <section className="ng-story-hero">
        <div>
          <h1>
            Prendre soin de soi, <span>naturellement.</span>
          </h1>
          <p>
            Nature &amp; Grâce est née d’une conviction : la terre de Côte d’Ivoire offre de quoi prendre soin de la peau et
            des cheveux simplement. Nous sélectionnons auprès de productrices ivoiriennes des soins sans détour : beurre
            de cacao brut, chantilly de cacao, savon noir de cabosse et huiles végétales.
          </p>
          <div className="ng-hero-actions">
            <button type="button" className="ng-btn ng-btn--primary" onClick={() => navigate('/boutique')}>
              Découvrir nos soins <ArrowRight size={17} />
            </button>
            <button type="button" className="ng-btn ng-btn--ghost" onClick={() => setAdvisorOpen(true)}>
              <Sparkles size={16} color="var(--ng-gold-600)" /> Demander à la conseillère
            </button>
          </div>
        </div>
        <div className="ng-story-img">
          <img src={STORY_IMAGE} alt="Récolte des cabosses dans une plantation de cacao en Côte d’Ivoire" />
        </div>
      </section>

      <section className="ng-values">
        {VALUES.map(({ icon: Icon, title, text }, i) => (
          <article key={title} className="ng-value" data-reveal style={{ '--i': i } as React.CSSProperties}>
            <h2>
              <Icon size={18} aria-hidden="true" /> {title}
            </h2>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="ng-story-split" data-reveal>
        <div className="ng-story-img ng-story-img--wide">
          <img src={CRAFT_IMAGE} alt="Cabosse de cacao mûre en Côte d’Ivoire" loading="lazy" />
        </div>
        <div>
          <h2>Choisis auprès de productrices</h2>
          <p>
            Chaque soin de la boutique est préparé par des productrices ivoiriennes, puis sélectionné par Nature &amp; Grâce.
            Plutôt que des formules longues et compliquées, nous proposons des soins courts et lisibles pour le corps, le
            visage et les cheveux.
          </p>
          <p>
            Une question sur la composition ou l’utilisation d’un soin ? Nous vous répondons sur WhatsApp.
          </p>
          <p>Notre promesse tient dans notre slogan : prenez soin de vous, naturellement.</p>
          <button type="button" className="ng-link" onClick={() => navigate('/temoignages')}>
            Lire les avis clients <ArrowRight size={15} />
          </button>
        </div>
      </section>

      <section className="ng-story-split ng-story-split--reverse" data-reveal>
        <div>
          <h2>Le cacao ivoirien, de la cabosse au soin</h2>
          <p>
            Le cacao pousse à Soubré, à Daloa et dans les grandes régions productrices du pays. Les productrices en tirent un
            beurre brut, non raffiné, que nous vous proposons tel quel ou fouetté en chantilly.
          </p>
          <button type="button" className="ng-btn ng-btn--primary" onClick={() => navigate('/boutique')}>
            Voir les soins au cacao <ArrowRight size={16} />
          </button>
        </div>
        <div className="ng-story-img ng-story-img--wide">
          <img src={MARKET_IMAGE} alt="Paniers de cabosses de cacao de Côte d’Ivoire" loading="lazy" />
        </div>
      </section>
    </div>
  )
}

export default StoryPage
