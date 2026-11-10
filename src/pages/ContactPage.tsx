import React, { useState } from 'react'
import { ChevronDown, Clock, HelpCircle, MapPin, MessageCircle, Phone, Send, ShieldCheck, Truck } from 'lucide-react'
import { useApp } from '../context/AppContext'

export const ContactPage: React.FC = () => {
  const { showToast } = useApp()
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactMessage, setContactMessage] = useState('')

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    const text = `Bonjour NATURE & GRÂCE,\n\nJe vous contacte depuis votre site Internet.\nNom : ${contactName}\nTéléphone : ${contactPhone}\nMessage : ${contactMessage}`
    window.open(`https://wa.me/2250717684751?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
    setContactMessage('')
    showToast('Message transmis à notre service WhatsApp !')
  }

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
      q: 'Comment fonctionne le paiement par Wave ?',
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
    <div style={{ padding: '30px 4% 70px', maxWidth: '1040px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span style={{ fontSize: '10px', color: 'var(--brand-gold)', letterSpacing: '0.16em', fontWeight: 600 }}>
          SERVICE CLIENT & LIVRAISON
        </span>
        <h1 style={{ font: "500 clamp(30px, 4vw, 44px)/1.15 'Playfair Display', serif", margin: '8px 0 12px', color: 'var(--text-primary)' }}>
          Contactez-nous & <em>Foire aux questions</em>
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto' }}>
          Une question sur un produit, votre commande ou les modalités de livraison ? Notre équipe est à votre écoute tous les jours.
        </p>
      </div>

      {/* Cartes Contact Rapide */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '24px', textAlign: 'center' }}>
          <div style={{ width: '44px', height: '44px', background: '#25d36622', color: '#16a34a', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
            <MessageCircle size={22} />
          </div>
          <b style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>WhatsApp Direct</b>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 14px' }}>Réponse rapide 7j/7 pour conseils & commandes</p>
          <a
            href="https://wa.me/2250717684751"
            target="_blank"
            rel="noopener noreferrer"
            className="button primary"
            style={{ background: '#25d366', borderColor: '#25d366', fontSize: '11px', padding: '10px 16px' }}
          >
            +225 07 17 68 47 51
          </a>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '24px', textAlign: 'center' }}>
          <div style={{ width: '44px', height: '44px', background: '#54b8eb22', color: '#0284c7', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
            <ShieldCheck size={22} />
          </div>
          <b style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Paiement Wave</b>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 14px' }}>Paiement mobile instantané sans frais additionnels</p>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand-gold)' }}>Modalités confirmées à la commande</span>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '24px', textAlign: 'center' }}>
          <div style={{ width: '44px', height: '44px', background: '#f59e0b22', color: '#d97706', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
            <Truck size={22} />
          </div>
          <b style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Zones de Livraison</b>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 14px' }}>Abidjan, Bouaké, Daloa, Yamoussoukro...</p>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Frais communiqués avant validation finale</span>
        </div>
      </div>

      {/* FAQ interactive en accordéon */}
      <section style={{ marginBottom: '50px' }}>
        <h2 style={{ font: "500 26px 'Playfair Display', serif", textAlign: 'center', margin: '0 0 24px', color: 'var(--text-primary)' }}>
          Questions fréquentes sur nos soins
        </h2>

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
      </section>

      {/* Formulaire de Contact */}
      <section style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '30px' }}>
        <h3 style={{ font: "500 22px 'Playfair Display', serif", margin: '0 0 8px', color: 'var(--text-primary)' }}>
          Envoyer un message à la boutique
        </h3>
        <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '0 0 20px' }}>
          Votre message sera automatiquement formaté pour être envoyé sur notre WhatsApp officiel.
        </p>

        <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div className="auth-field">
              <label>Votre nom complet</label>
              <input
                type="text"
                placeholder="Ex. Kouamé Romeo"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label>Votre numéro de téléphone</label>
              <input
                type="tel"
                placeholder="+225 07..."
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label>Votre message</label>
            <textarea
              rows={4}
              placeholder="Posez votre question, formulez votre demande de livraison ou de partenariat..."
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontFamily: 'inherit',
              }}
              required
            />
          </div>

          <button
            type="submit"
            className="button primary"
            style={{ background: 'var(--brand-green)', alignSelf: 'flex-start', fontSize: '12px' }}
          >
            <Send size={15} /> Envoyer sur WhatsApp
          </button>
        </form>
      </section>
    </div>
  )
}
export default ContactPage
