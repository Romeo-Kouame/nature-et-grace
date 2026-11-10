import React from 'react'
import { ArrowRight, CheckCircle2, HeartHandshake, Leaf, Sparkles } from 'lucide-react'
import { useApp } from '../context/AppContext'

export const StoryPage: React.FC<{ onOpenAdvisor: () => void }> = ({ onOpenAdvisor }) => {
  const { navigate } = useApp()

  return (
    <div style={{ padding: '30px 4% 70px', maxWidth: '980px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span style={{ fontSize: '10px', color: 'var(--brand-gold)', letterSpacing: '0.16em', fontWeight: 600 }}>
          NOTRE HISTOIRE & NOS VALEURS
        </span>
        <h1 style={{ font: "500 clamp(30px, 4vw, 44px)/1.15 'Playfair Display', serif", margin: '8px 0 12px', color: 'var(--text-primary)' }}>
          Prendre soin de soi, <em>naturellement.</em>
        </h1>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.7 }}>
          NATURE & GRÂCE est née d’une conviction profonde : la terre de Côte d’Ivoire regorge d’actifs précieux d’une efficacité inégalée pour la peau et les cheveux.
        </p>
      </div>

      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '36px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          lineHeight: 1.8,
          fontSize: '12.5px',
          color: 'var(--text-secondary)',
          marginBottom: '35px',
        }}
      >
        <p style={{ margin: 0 }}>
          Dans un monde où les cosmétiques industriels regorgent d’ingrédients de synthèse, d’agents décapants et de perturbateurs endocriniens, nous avons choisi de revenir à la source : le cacao pur, les cabosses traditionnelles et les huiles de première pression.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', margin: '10px 0' }}>
          <div style={{ background: 'var(--bg-subtle)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ margin: '0 0 8px', color: 'var(--brand-gold)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Leaf size={16} /> Le Cacao Ivoirien
            </h4>
            <p style={{ margin: 0, fontSize: '11.5px', lineHeight: 1.6 }}>
              Premier producteur mondial de cacao, la Côte d’Ivoire abrite des fèves d’une richesse exceptionnelle en antioxydants, vitamine E et acides gras protecteurs.
            </p>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ margin: '0 0 8px', color: 'var(--brand-gold)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HeartHandshake size={16} /> Savoir-Faire Artisanal
            </h4>
            <p style={{ margin: 0, fontSize: '11.5px', lineHeight: 1.6 }}>
              Chaque pot de Chantilly de cacao est fouetté avec délicatesse, et chaque savon noir est préparé selon les recettes traditionnelles aux cendres de cabosse.
            </p>
          </div>
        </div>

        <p style={{ margin: 0 }}>
          Nos soins sont conçus pour toute la famille, respectueux des peaux les plus sensibles, des femmes enceintes et des enfants. Notre promesse est simple : vous apporter douceur, éclat et bien-être, sans compromis.
        </p>

        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <button
            type="button"
            className="button primary"
            style={{ background: 'var(--brand-green)' }}
            onClick={() => navigate('/boutique')}
          >
            Découvrir nos créations <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
export default StoryPage
