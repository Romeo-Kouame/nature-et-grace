import React from 'react'
import { ArrowRight, HeartHandshake, Leaf, ShieldCheck, Sparkles } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { PHOTOS } from '../data/products'

/** Photos d'ambiance prises en Côte d'Ivoire et au Ghana (à remplacer par celles de la marque). */
const STORY_IMAGE = PHOTOS.plantation
const CRAFT_IMAGE = PHOTOS.kariteFemmes
const MARKET_IMAGE = PHOTOS.cacaoPanier

const VALUES = [
  {
    icon: Leaf,
    title: 'Le cacao ivoirien',
    text: 'Premier producteur mondial de cacao, la Côte d’Ivoire offre un beurre riche et nourrissant, utilisé depuis toujours pour prendre soin de la peau.',
  },
  {
    icon: HeartHandshake,
    title: 'Un savoir-faire artisanal',
    text: 'Nos soins sont préparés de façon artisanale, comme le savon noir réalisé selon la recette traditionnelle aux cendres de cabosse.',
  },
  {
    icon: ShieldCheck,
    title: 'Des formules simples',
    text: 'Peu d’ingrédients, faciles à comprendre : des soins pensés pour le quotidien de toute la famille.',
  },
]

export const StoryPage: React.FC = () => {
  const { navigate, setAdvisorOpen } = useApp()
  usePageMeta('Notre histoire', 'NATURE & GRÂCE, des soins naturels au cacao de Côte d’Ivoire : notre histoire et nos valeurs.')

  return (
    <div className="ng-container ng-subpage">
      <section className="ng-story-hero">
        <div>
          <span className="ng-eyebrow">
            <Leaf size={13} /> NOTRE HISTOIRE
          </span>
          <h1>
            Prendre soin de soi, <span>naturellement.</span>
          </h1>
          <p>
            Nature &amp; Grâce est née d’une conviction : la terre de Côte d’Ivoire regorge d’actifs précieux pour la
            peau et les cheveux. Nous avons choisi de revenir à la source : le cacao pur, les cabosses et les huiles de
            première pression.
          </p>
          <div className="ng-hero-actions">
            <button type="button" className="ng-btn ng-btn--primary" onClick={() => navigate('/boutique')}>
              Découvrir nos soins <ArrowRight size={17} />
            </button>
            <button type="button" className="ng-btn ng-btn--ghost" onClick={() => setAdvisorOpen(true)}>
              <Sparkles size={16} color="var(--ng-gold-600)" /> Mon rituel IA
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
            <span>
              <Icon size={22} />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="ng-story-split" data-reveal>
        <div className="ng-story-img ng-story-img--wide">
          <img src={CRAFT_IMAGE} alt="Femmes transportant les noix de karité" loading="lazy" />
        </div>
        <div>
          <h2>Des soins pensés pour toute la famille</h2>
          <p>
            Plutôt que des formules longues et compliquées, nous proposons des soins courts et lisibles, issus du cacao
            et des végétaux de Côte d’Ivoire, pour le corps, le visage et les cheveux.
          </p>
          <p>
            Le karité vient des coopératives de femmes qui le récoltent et le préparent à la main, selon un savoir-faire
            transmis de mère en fille.
          </p>
          <p>Notre promesse tient dans notre slogan : prenez soin de vous, naturellement.</p>
          <button type="button" className="ng-link" onClick={() => navigate('/temoignages')}>
            Lire les avis clients <ArrowRight size={15} />
          </button>
        </div>
      </section>

      <section className="ng-story-split ng-story-split--reverse" data-reveal>
        <div>
          <h2>Le meilleur du cacao ivoirien</h2>
          <p>
            Nous travaillons le cacao de Soubré, de Daloa et des grandes régions productrices. De la cabosse au pot, chaque
            étape est pensée pour garder un beurre brut, sans additif inutile.
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
