import React, { useState } from 'react'
import { CheckCircle2, ChevronDown, HeartHandshake, Leaf, ShieldCheck, Sparkles, Star, Truck } from 'lucide-react'

export const TestimonialsAndFaq: React.FC<{ onOpenAdvisor: () => void }> = ({ onOpenAdvisor }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const testimonials = [
    {
      name: 'Aïcha K.',
      location: 'Cocody Angré, Abidjan',
      initials: 'AK',
      product: 'Chantilly de cacao & Savon noir',
      stars: 5,
      text: '« La Chantilly de cacao est une merveille absolue ! Elle ne colle pas, s’étale avec une facilité déconcertante et laisse la peau soyeuse toute la journée. En prime, le savon noir a nettement unifié mon teint en 3 semaines. »',
    },
    {
      name: 'Marie-Estelle D.',
      location: 'Marcory Zone 4, Abidjan',
      initials: 'MD',
      product: 'Beurre de cacao brut',
      stars: 5,
      text: '« J’ai utilisé le Beurre de cacao brut pur tout au long de ma grossesse sur le ventre et les hanches. Résultat : zéro vergeture ! C’est sans comparaison le cacao le plus pur et authentique que j’ai testé. »',
    },
    {
      name: 'Franck Y.',
      location: 'Yopougon Maroc, Abidjan',
      initials: 'FY',
      product: 'Savon noir & Huile de coco',
      stars: 5,
      text: '« Utilisé pour la douche et l’entretien de la barbe. Le savon mousse super bien, nettoie en profondeur et donne une vraie sensation de propreté fraîche sans assécher. Superbe découverte ! »',
    },
  ]

  const faqs = [
    {
      q: 'Comment utiliser le Beurre de cacao brut s’il est solide ?',
      a: 'Le beurre de cacao brut pur est naturellement compact à température ambiante, gage de son authenticité sans additifs chimiques. Il suffit de prélever une petite noisette et de la frotter 5 à 10 secondes au creux de vos mains tièdes : il fond instantanément en une huile bienfaisante et onctueuse, prête à masser.',
    },
    {
      q: 'Le Savon noir de cabosse de cacao convient-il aux peaux sensibles ou acnéiques ?',
      a: 'Absolument ! Contrairement aux savons chimiques industriels décapants, notre savon noir est formulé à partir de cendres de cabosses de cacao brûlées traditionnellement et d’huiles végétales. Il purifie les pores en profondeur et régule le sébum tout en respectant l’hydratation cutanée.',
    },
    {
      q: 'Comment se déroule le paiement par Wave ?',
      a: 'Le paiement est simple et 100% sécurisé via Wave. Après l’envoi de votre commande sur le site ou par WhatsApp, la boutique vous confirme le total avec vos frais de livraison locaux. Vous effectuez votre transfert Wave sur le numéro officiel de la boutique, puis votre colis est préparé et expédié sans délai.',
    },
    {
      q: 'Dans quelles communes et villes livrez-vous ?',
      a: 'Nous assurons la livraison rapide dans toutes les communes du Grand Abidjan (Cocody, Marcory, Yopougon, Plateau, Treichville, Riviera, Koumassi, Abobo, etc.) ainsi que l’expédition vers les villes de l’intérieur (Bouaké, Daloa, Yamoussoukro, San Pedro, Korhogo, etc.) via les gares de transport sécurisées.',
    },
    {
      q: 'Les produits NATURE & GRÂCE conviennent-ils aux femmes enceintes et aux enfants ?',
      a: 'Oui, nos soins sont formulés à 100% d’ingrédients purs, sans aucun paraben, sans perturbateur endocrinien ni parfum de synthèse. Le Beurre de cacao brut et la Chantilly de cacao sont particulièrement recommandés pour masser le ventre des futures mamans et protéger la peau délicate des enfants.',
    },
  ]

  return (
    <>
      {/* SECTION TÉMOIGNAGES */}
      <section className="testimonials-section" id="temoignages">
        <div className="testimonials-header">
          <div className="eyebrow">
            <span /> VOS RETOURS D’EXPÉRIENCE
          </div>
          <h2>
            Ce que disent nos <em>clientes.</em>
          </h2>
          <div className="testimonials-score">
            <span className="testimonials-stars">★★★★★</span>
            <b>4.9 / 5</b>
            <span>· Plus de 350 clientes et clients conquis</span>
          </div>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((t, idx) => (
            <article className="testimonial-card" key={idx}>
              <div style={{ color: '#bfa052', fontSize: '13px' }}>★★★★★</div>
              <p className="testimonial-quote">{t.text}</p>
              <div className="testimonial-user">
                <div className="testimonial-avatar">{t.initials}</div>
                <div className="testimonial-info">
                  <b>{t.name}</b>
                  <span>{t.location}</span>
                  <div className="testimonial-verified">
                    <CheckCircle2 size={11} /> Achat vérifié · {t.product}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* 3 PILIERS DE RÉASSURANCE */}
        <div className="trust-pillars">
          <div className="trust-pillar">
            <div className="trust-icon">
              <Leaf size={20} />
            </div>
            <div>
              <h4>100% Ingrédients Naturels</h4>
              <p>Formules pures, sans paraben ni conservateur toxique. Le respect absolu de votre peau.</p>
            </div>
          </div>

          <div className="trust-pillar">
            <div className="trust-icon">
              <HeartHandshake size={20} />
            </div>
            <div>
              <h4>Cacao Noble de Côte d’Ivoire</h4>
              <p>Valorisation des matières premières locales et du savoir-faire traditionnel ivoirien.</p>
            </div>
          </div>

          <div className="trust-pillar">
            <div className="trust-icon">
              <Truck size={20} />
            </div>
            <div>
              <h4>Paiement Wave & Livraison</h4>
              <p>Règlement sécurisé par Wave et expédition soignée à Abidjan et dans toute la Côte d’Ivoire.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION FAQ (FOIRE AUX QUESTIONS) */}
      <section className="faq-section" id="faq">
        <div className="faq-header">
          <div className="eyebrow">
            <span /> FOIRE AUX QUESTIONS
          </div>
          <h2>
            Tout savoir sur nos <em>soins.</em>
          </h2>
          <p style={{ fontSize: '11px', color: '#737a71', margin: '8px 0 0' }}>
            Des réponses claires à vos questions les plus courantes sur nos produits et nos commandes.
          </p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, idx) => (
            <div className={`faq-item ${openFaq === idx ? 'open' : ''}`} key={idx}>
              <button
                type="button"
                className="faq-question"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                aria-expanded={openFaq === idx}
              >
                <span>{faq.q}</span>
                <ChevronDown size={17} />
              </button>
              {openFaq === idx && <div className="faq-answer">{faq.a}</div>}
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '36px' }}>
          <p style={{ fontSize: '11px', color: '#687466', marginBottom: '12px' }}>
            Vous avez une question spécifique sur votre type de peau ?
          </p>
          <button
            type="button"
            className="button primary"
            onClick={onOpenAdvisor}
            style={{ background: '#254633', borderColor: '#254633' }}
          >
            <Sparkles size={15} /> Poser ma question au Conseiller Beauté IA
          </button>
        </div>
      </section>
    </>
  )
}
export default TestimonialsAndFaq
