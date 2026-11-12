import React, { useState } from 'react'
import { ChevronDown, MapPin, MessageCircle, Send, ShieldCheck, Truck } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatXof } from '../format'
import { usePageMeta } from '../hooks/usePageMeta'

export const ContactPage: React.FC = () => {
  const { showToast, settings, waLink, waDisplay } = useApp()
  usePageMeta('Contact & livraison', 'Contactez NATURE & GRÂCE sur WhatsApp : commandes, conseils, zones et frais de livraison, paiement Wave.')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  const zones = settings.deliveryZones

  const faqs = [
    {
      q: 'Comment se passe une commande ?',
      a: 'Ajoutez vos soins au panier, puis validez sur le site avec vos coordonnées ou envoyez votre panier sur WhatsApp. La boutique vous confirme le total, la livraison et le délai avant tout paiement.',
    },
    { q: 'Comment fonctionne le paiement par Wave ?', a: settings.waveInstructions },
    {
      q: 'Où livrez-vous et à quel prix ?',
      a: `${settings.deliveryCommunes}. ${settings.deliveryInfo}`,
    },
    {
      q: 'Comment utiliser le beurre de cacao brut s’il est solide ?',
      a: 'Le beurre de cacao brut est naturellement compact à température ambiante. Prélevez une petite noisette et frottez-la quelques secondes entre vos mains : elle fond et devient facile à masser.',
    },
    {
      q: 'Les soins conviennent-ils aux peaux sensibles, aux femmes enceintes et aux enfants ?',
      a: 'Faites toujours un essai sur une petite zone de peau avant la première utilisation. Pendant la grossesse, pour un bébé ou en cas de peau très réactive, demandez l’avis d’un professionnel de santé. Nous répondons volontiers à vos questions sur la composition par WhatsApp.',
    },
  ]

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    const text = `Bonjour NATURE & GRÂCE,\n\nJe vous contacte depuis votre site.\nNom : ${name}\nTéléphone : ${phone}\nMessage : ${message}`
    window.open(waLink(text), '_blank', 'noopener,noreferrer')
    setMessage('')
    showToast('WhatsApp s’ouvre avec votre message')
  }

  return (
    <div className="ng-container ng-subpage">
      <header className="ng-page-head">
        <span className="ng-eyebrow">CONTACT & LIVRAISON</span>
        <h1>Une question ? On vous répond.</h1>
        <p>Sur un produit, votre commande ou la livraison : écrivez-nous, nous vous répondons sur WhatsApp.</p>
      </header>

      <section className="ng-info-cards">
        <a className="ng-info-card ng-info-card--wa" href={waLink()} target="_blank" rel="noreferrer">
          <span>
            <MessageCircle size={22} />
          </span>
          <b>WhatsApp</b>
          <p>Conseils et commandes</p>
          <strong>{waDisplay}</strong>
        </a>
        <div className="ng-info-card">
          <span>
            <ShieldCheck size={22} />
          </span>
          <b>Paiement Wave</b>
          <p>{settings.waveInstructions}</p>
          {settings.waveNumber && <strong>Wave : {settings.waveNumber}</strong>}
        </div>
        <div className="ng-info-card">
          <span>
            <Truck size={22} />
          </span>
          <b>Livraison</b>
          <p>{settings.deliveryCommunes}</p>
          <strong>Frais annoncés avant paiement</strong>
        </div>
      </section>

      {zones.length > 0 && (
        <section className="ng-zones">
          <h2 className="ng-h2">Frais et délais de livraison</h2>
          <p className="ng-form-hint">{settings.deliveryInfo}</p>
          <div className="ng-zone-table" role="table" aria-label="Zones de livraison">
            <div role="row" className="ng-zone-head">
              <span role="columnheader">Zone</span>
              <span role="columnheader">Frais</span>
              <span role="columnheader">Délai</span>
            </div>
            {zones.map((z) => (
              <div role="row" key={z.name}>
                <span role="cell">{z.name}</span>
                <span role="cell">{z.feeXof === null ? 'À confirmer' : z.feeXof === 0 ? 'Offerte' : formatXof(z.feeXof)}</span>
                <span role="cell">{z.delay || '—'}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="ng-contact-grid">
        <section>
          <h2 className="ng-h2">Questions fréquentes</h2>
          <div className="ng-faq">
            {faqs.map((faq, idx) => {
              const open = openFaq === idx
              return (
                <div className={`ng-faq-item ${open ? 'open' : ''}`} key={faq.q}>
                  <button type="button" onClick={() => setOpenFaq(open ? null : idx)} aria-expanded={open}>
                    <span>{faq.q}</span>
                    <ChevronDown size={18} />
                  </button>
                  <div className="ng-faq-answer">
                    <div>
                      <p>{faq.a}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="ng-form-card">
          <h2 className="ng-h2">Écrire à la boutique</h2>
          <p className="ng-form-hint">Votre message s’ouvrira dans WhatsApp, prêt à être envoyé.</p>
          <form onSubmit={handleSend} className="ng-form">
            <label>
              Nom complet
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Aminata Koné" autoComplete="name" required />
            </label>
            <label>
              Téléphone
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07 00 00 00 00" autoComplete="tel" required />
            </label>
            <label>
              Message
              <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Votre question, une demande de livraison…" required />
            </label>
            <button type="submit" className="ng-btn ng-btn--primary">
              <Send size={16} /> Envoyer sur WhatsApp
            </button>
          </form>
          <p className="ng-form-foot">
            <MapPin size={15} /> Côte d’Ivoire · {settings.deliveryCommunes}
          </p>
        </section>
      </div>
    </div>
  )
}

export default ContactPage
