import React, { useState } from 'react'
import { Check, Lock, LogIn, Phone, Sparkles, User as UserIcon, X } from 'lucide-react'
import { useApp } from '../context/AppContext'

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalReason, closeAuthModal, login } = useApp()
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [commune, setCommune] = useState('Cocody, Abidjan')
  const [password, setPassword] = useState('')

  if (!authModalOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isRegister) {
      if (!name || !phone) return
      login({
        name,
        email: email || `${phone.replace(/\D/g, '')}@client.ci`,
        phone,
        commune,
      })
    } else {
      if (!phone && !email) return
      login({
        name: name || 'Aïcha Koné',
        email: email || 'aicha.kone@example.ci',
        phone: phone || '+225 07 12 34 56 78',
        commune: 'Cocody, Abidjan',
      })
    }
  }

  const handleQuickDemo = () => {
    login({
      name: 'Aïcha Koné',
      email: 'aicha.kone@nature-et-grace.ci',
      phone: '+225 07 45 67 89 10',
      commune: 'Cocody Riviera 2, Abidjan',
    })
  }

  return (
    <div
      className="auth-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeAuthModal()
      }}
    >
      <div className="auth-modal-card" role="dialog" aria-modal="true">
        <button
          type="button"
          className="advisor-close-btn"
          style={{ position: 'absolute', top: 14, right: 14 }}
          onClick={closeAuthModal}
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        <div className="auth-modal-header">
          <div style={{ display: 'inline-flex', padding: '10px', background: '#eef4f0', color: '#1f3f2d', borderRadius: '50%', marginBottom: '8px' }}>
            <UserIcon size={24} />
          </div>
          <h3>{isRegister ? 'Créer mon compte' : 'Bienvenue sur NATURE & GRÂCE'}</h3>
          <p>{isRegister ? 'Rejoignez notre communauté de beauté saine' : 'Connectez-vous pour gérer votre panier et vos rituels'}</p>
        </div>

        {authModalReason && (
          <div className="auth-reason-banner">
            <span>🔒 {authModalReason}</span>
          </div>
        )}

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${!isRegister ? 'active' : ''}`}
            onClick={() => setIsRegister(false)}
          >
            Se connecter
          </button>
          <button
            type="button"
            className={`auth-tab ${isRegister ? 'active' : ''}`}
            onClick={() => setIsRegister(true)}
          >
            Créer un compte
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="auth-field">
              <label>Nom et Prénom(s)</label>
              <input
                type="text"
                placeholder="Ex. Aïcha Koné"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label>Numéro de téléphone / WhatsApp (Côte d’Ivoire)</label>
            <input
              type="tel"
              placeholder="+225 07..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label>Adresse courriel (optionnel)</label>
            <input
              type="email"
              placeholder="votre.email@exemple.ci"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {isRegister && (
            <div className="auth-field">
              <label>Commune habituelle de livraison</label>
              <input
                type="text"
                placeholder="Ex. Cocody, Marcory, Yopougon, Bouaké..."
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
              />
            </div>
          )}

          <div className="auth-field">
            <label>Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-submit-btn">
            {isRegister ? 'Créer mon compte et continuer' : 'Se connecter'}
          </button>

          <button type="button" className="auth-demo-btn" onClick={handleQuickDemo}>
            <Sparkles size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
            Connexion rapide en 1 clic (Compte Démo : Aïcha K.)
          </button>
        </form>
      </div>
    </div>
  )
}
export default AuthModal
