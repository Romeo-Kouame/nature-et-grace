import React, { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff, Lock, ShoppingCart, UserPlus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { usePageMeta } from '../hooks/usePageMeta'

function pendingAction(): { then?: string; openCart?: boolean } {
  try {
    return JSON.parse(sessionStorage.getItem('ng_after_login') || '{}')
  } catch {
    return {}
  }
}

const PasswordInput: React.FC<{ name: string; autoComplete: string; minLength?: number; placeholder?: string }> = (props) => {
  const [visible, setVisible] = useState(false)
  return (
    <span className="ng-password">
      <input {...props} type={visible ? 'text' : 'password'} required maxLength={200} />
      <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </span>
  )
}

export const LoginPage: React.FC = () => {
  const { login, register, user, authReady, navigate, waLink, cartCount } = useApp()
  const [mode, setMode] = useState<'login' | 'register'>(() => (window.location.search.includes('inscription') ? 'register' : 'login'))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const pending = useMemo(pendingAction, [])
  usePageMeta(mode === 'login' ? 'Se connecter' : 'Créer un compte')

  // Déjà connecté : inutile de rester ici
  useEffect(() => {
    if (authReady && user && !busy) navigate(pending.then && pending.then !== '/connexion' ? pending.then : '/compte')
  }, [authReady, user, busy, navigate, pending.then])

  const switchMode = (next: 'login' | 'register') => {
    setMode(next)
    setError('')
    window.history.replaceState(null, '', next === 'register' ? '/connexion?inscription' : '/connexion')
  }

  const submitLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    try {
      await login(String(data.get('identifier')), String(data.get('password')))
    } catch (err) {
      setError(err instanceof TypeError ? 'Connexion au serveur impossible. Réessayez dans un instant.' : (err as Error).message)
      setBusy(false)
    }
  }

  const submitRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    if (data.get('password') !== data.get('confirm')) return setError('Les deux mots de passe ne sont pas identiques.')
    setBusy(true)
    setError('')
    try {
      await register({
        name: String(data.get('name')).trim(),
        phone: String(data.get('phone')),
        email: String(data.get('email') || '').trim() || undefined,
        password: String(data.get('password')),
      })
    } catch (err) {
      setError(err instanceof TypeError ? 'Connexion au serveur impossible. Réessayez dans un instant.' : (err as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="ng-container ng-subpage ng-auth-page">
      <div className="ng-auth-card">
        <div className="ng-auth-head">
          <span className="ng-auth-ico">{mode === 'login' ? <Lock size={22} /> : <UserPlus size={22} />}</span>
          <h1>{mode === 'login' ? 'Se connecter' : 'Créer votre compte'}</h1>
          <p>{mode === 'login' ? 'Heureux de vous revoir chez NATURE & GRÂCE.' : 'Commandez plus vite et suivez vos commandes.'}</p>
        </div>

        {pending.openCart && (
          <p className="ng-auth-reason">
            <ShoppingCart size={17} />
            <span>
              Connectez-vous pour accéder à votre panier
              {cartCount > 0 ? ` (${cartCount} article${cartCount > 1 ? 's' : ''} gardé${cartCount > 1 ? 's' : ''})` : ''}.
            </span>
          </p>
        )}

        <div className="ng-auth-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>
            Se connecter
          </button>
          <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>
            Créer un compte
          </button>
        </div>

        {mode === 'login' ? (
          <form className="ng-form" onSubmit={submitLogin} key="login">
            <label>
              Numéro de téléphone ou e-mail
              <input name="identifier" autoComplete="username" placeholder="07 01 02 03 04" required minLength={3} maxLength={120} autoFocus />
            </label>
            <label>
              <span className="ng-label-row">
                Mot de passe
                <a
                  href={waLink('Bonjour NATURE & GRÂCE, j’ai oublié le mot de passe de mon compte client. Pouvez-vous m’aider ?')}
                  target="_blank"
                  rel="noreferrer"
                >
                  Mot de passe oublié ?
                </a>
              </span>
              <PasswordInput name="password" autoComplete="current-password" />
            </label>
            {error && <p className="ng-form-error" role="alert">{error}</p>}
            <button type="submit" className="ng-btn ng-btn--primary ng-btn--block" disabled={busy}>
              {busy ? 'Connexion…' : 'Se connecter'}
            </button>
            <p className="ng-auth-switch">
              Pas encore de compte ?{' '}
              <button type="button" onClick={() => switchMode('register')}>
                Créer un compte
              </button>
            </p>
          </form>
        ) : (
          <form className="ng-form" onSubmit={submitRegister} key="register">
            <label>
              Nom et prénom(s)
              <input name="name" autoComplete="name" placeholder="Ex. Aminata Koné" required minLength={2} maxLength={80} autoFocus />
            </label>
            <label>
              Téléphone (WhatsApp de préférence)
              <input name="phone" type="tel" autoComplete="tel" placeholder="07 01 02 03 04" required minLength={8} maxLength={25} />
            </label>
            <label>
              <span>
                Adresse e-mail <span className="ng-optional">(facultatif)</span>
              </span>
              <input name="email" type="email" autoComplete="email" maxLength={120} />
            </label>
            <div className="ng-form-row">
              <label>
                Mot de passe
                <PasswordInput name="password" autoComplete="new-password" minLength={8} placeholder="8 caractères minimum" />
              </label>
              <label>
                Confirmation
                <PasswordInput name="confirm" autoComplete="new-password" minLength={8} />
              </label>
            </div>
            <label className="ng-check">
              <input type="checkbox" required />
              <span>
                J’accepte les{' '}
                <a href="/cgv" target="_blank" rel="noreferrer">
                  conditions de vente
                </a>{' '}
                et la{' '}
                <a href="/confidentialite" target="_blank" rel="noreferrer">
                  politique de confidentialité
                </a>
                .
              </span>
            </label>
            {error && <p className="ng-form-error" role="alert">{error}</p>}
            <button type="submit" className="ng-btn ng-btn--primary ng-btn--block" disabled={busy}>
              {busy ? 'Création du compte…' : 'Créer mon compte'}
            </button>
            <p className="ng-auth-switch">
              Déjà client ?{' '}
              <button type="button" onClick={() => switchMode('login')}>
                Se connecter
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export default LoginPage
