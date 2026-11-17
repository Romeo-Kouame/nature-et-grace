import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Eye, EyeOff, Heart, Leaf, ShoppingCart, Sparkles, Truck } from 'lucide-react'
import { useApp, formatPhone } from '../context/AppContext'
import Honeypot from '../components/Honeypot'
import { usePageMeta } from '../hooks/usePageMeta'
import { PHOTOS } from '../data/products'

/**
 * Page de connexion autonome (sans l'en-tête ni le pied de page du site), sur deux colonnes :
 * à gauche l'univers de la marque, à droite le formulaire. Sur téléphone, les deux s'empilent.
 */

function pendingAction(): { then?: string; openCart?: boolean } {
  try {
    return JSON.parse(sessionStorage.getItem('ng_after_login') || '{}')
  } catch {
    return {}
  }
}

const PasswordInput: React.FC<{ name: string; autoComplete: string; minLength?: number; placeholder: string; label: string }> = ({ label, ...props }) => {
  const [visible, setVisible] = useState(false)
  return (
    <span className="ng-password">
      <input {...props} aria-label={label} type={visible ? 'text' : 'password'} required maxLength={200} />
      <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </span>
  )
}

export const LoginPage: React.FC = () => {
  const { login, register, user, authReady, navigate, waLink, cartCount, settings } = useApp()
  const [mode, setMode] = useState<'login' | 'register'>(() => (window.location.search.includes('inscription') ? 'register' : 'login'))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const pending = useMemo(pendingAction, [])
  usePageMeta(mode === 'login' ? 'Se connecter' : 'Créer un compte', 'Connectez-vous ou créez votre compte NATURE & GRÂCE pour commander et suivre vos commandes.')

  // Déjà connecté : inutile de rester ici
  useEffect(() => {
    if (authReady && user && !busy) navigate(pending.then && pending.then !== '/connexion' ? pending.then : '/compte')
  }, [authReady, user, busy, navigate, pending.then])

  const switchMode = (next: 'login' | 'register') => {
    setMode(next)
    setError('')
    window.history.replaceState(null, '', next === 'register' ? '/connexion?inscription' : '/connexion')
    window.scrollTo({ top: 0 })
  }

  const back = () => navigate(pending.then && !pending.then.startsWith('/connexion') && !['/compte', '/commandes'].includes(pending.then) ? pending.then : '/')

  const failMessage = (err: unknown) => (err instanceof TypeError ? 'Connexion au serveur impossible. Réessayez dans un instant.' : (err as Error).message)

  const submitLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (busy) return
    const data = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    try {
      await login(String(data.get('identifier')), String(data.get('password')))
    } catch (err) {
      setError(failMessage(err))
      setBusy(false)
    }
  }

  const submitRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (busy) return
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
        acceptTerms: data.get('acceptTerms') === 'on',
        website: String(data.get('website') || ''),
      })
    } catch (err) {
      setError(failMessage(err))
      setBusy(false)
    }
  }

  const forgotLink = waLink('Bonjour NATURE & GRÂCE, j’ai oublié le mot de passe de mon compte client. Pouvez-vous m’aider ?')

  return (
    <div className="ng-login">
      {/* ───── Colonne gauche : l'univers de la marque ───── */}
      <section className="ng-login-brand" aria-label="NATURE & GRÂCE">
        <button type="button" className="ng-login-back" onClick={back}>
          <ArrowLeft size={18} /> Retour à la boutique
        </button>
        <a href="/" className="ng-login-logo" onClick={(e) => { e.preventDefault(); navigate('/') }}>
          <img src="/logo.jpeg" alt="NATURE & GRÂCE, accueil" width={72} height={72} />
        </a>

        <div className="ng-login-hero">
          <h1 className="ng-login-title">
            Prenez soin{' '}
            <br />
            de vous{' '}
            <br />
            <em>naturellement.</em>
          </h1>

          <div className="ng-login-collage" aria-hidden="true">
            <img className="ng-lc ng-lc--main" src={PHOTOS.kariteFemmes} alt="" />
            <img className="ng-lc ng-lc--back" src={PHOTOS.beurreCacao} alt="" />
            <img className="ng-lc ng-lc--card" src={PHOTOS.kariteFouette} alt="" />
            <img className="ng-lc ng-lc--round" src={PHOTOS.cabosseOuverte} alt="" />
            <span className="ng-lc-chip ng-lc-chip--leaf"><Leaf size={22} /></span>
            <span className="ng-lc-chip ng-lc-chip--heart"><Heart size={22} fill="currentColor" /></span>
            <span className="ng-lc-pill"><Sparkles size={14} /> Cacao &amp; karité ivoiriens</span>
          </div>
        </div>
      </section>

      {/* ───── Colonne droite : le formulaire ───── */}
      <section className="ng-login-panel">
        <div className="ng-login-box">
          <h2>{mode === 'login' ? 'Se connecter à NATURE & GRÂCE' : 'Créer un compte NATURE & GRÂCE'}</h2>
          <p className="ng-login-sub">
            {mode === 'login'
              ? 'Utilisez votre numéro de téléphone ou votre e-mail.'
              : 'Commandez plus vite et suivez vos livraisons.'}
          </p>

          {pending.openCart && (
            <p className="ng-auth-reason">
              <ShoppingCart size={17} />
              <span>
                Connectez-vous pour accéder à votre panier
                {cartCount > 0 ? ` (${cartCount} article${cartCount > 1 ? 's' : ''} gardé${cartCount > 1 ? 's' : ''})` : ''}.
              </span>
            </p>
          )}

          {mode === 'login' ? (
            <form className="ng-login-form" onSubmit={submitLogin} key="login">
              <input
                name="identifier"
                aria-label="Numéro de téléphone ou e-mail"
                autoComplete="username"
                placeholder="Numéro de téléphone ou e-mail"
                required
                minLength={3}
                maxLength={120}
                autoFocus
              />
              <PasswordInput name="password" autoComplete="current-password" placeholder="Mot de passe" label="Mot de passe" />
              {error && <p className="ng-form-error" role="alert">{error}</p>}
              <button type="submit" className="ng-login-primary" disabled={busy}>
                {busy ? 'Connexion…' : 'Se connecter'}
              </button>
              <a className="ng-login-forgot" href={forgotLink} target="_blank" rel="noreferrer">
                Mot de passe oublié ?
              </a>
              <div className="ng-login-gap" />
              <button type="button" className="ng-login-secondary" onClick={() => switchMode('register')}>
                Créer un nouveau compte
              </button>
            </form>
          ) : (
            <form className="ng-login-form" onSubmit={submitRegister} key="register">
              <input name="name" aria-label="Nom et prénom(s)" autoComplete="name" placeholder="Nom et prénom(s)" required minLength={2} maxLength={80} autoFocus />
              <input name="phone" type="tel" aria-label="Téléphone (WhatsApp de préférence)" autoComplete="tel" placeholder="Téléphone (WhatsApp de préférence)" required minLength={8} maxLength={25} />
              <input name="email" type="email" aria-label="Adresse e-mail (facultatif)" autoComplete="email" placeholder="Adresse e-mail (facultatif)" maxLength={120} />
              <PasswordInput name="password" autoComplete="new-password" minLength={8} placeholder="Mot de passe (8 caractères minimum)" label="Mot de passe, 8 caractères minimum" />
              <PasswordInput name="confirm" autoComplete="new-password" minLength={8} placeholder="Confirmez le mot de passe" label="Confirmation du mot de passe" />
              <Honeypot />
              <label className="ng-check ng-login-terms">
                <input type="checkbox" name="acceptTerms" required />
                <span>
                  J’accepte les{' '}
                  <a href="/cgv" target="_blank" rel="noreferrer">conditions de vente</a>{' '}
                  et la{' '}
                  <a href="/confidentialite" target="_blank" rel="noreferrer">politique de confidentialité</a>.
                </span>
              </label>
              {error && <p className="ng-form-error" role="alert">{error}</p>}
              <button type="submit" className="ng-login-primary" disabled={busy}>
                {busy ? 'Création du compte…' : 'Créer mon compte'}
              </button>
              <div className="ng-login-gap" />
              <button type="button" className="ng-login-secondary" onClick={() => switchMode('login')}>
                J’ai déjà un compte
              </button>
            </form>
          )}

          <ul className="ng-login-perks">
            <li><Truck size={16} /> Suivi de vos commandes</li>
            <li><Heart size={16} /> Adresse de livraison enregistrée</li>
          </ul>

          {mode === 'login' && (
            <p className="ng-login-legal">
              En vous connectant, vous acceptez nos{' '}
              <a href="/cgv" target="_blank" rel="noreferrer">conditions de vente</a> et notre{' '}
              <a href="/confidentialite" target="_blank" rel="noreferrer">politique de confidentialité</a>.
            </p>
          )}
          <p className="ng-login-help">
            Besoin d’aide ? Écrivez-nous sur{' '}
            <a href={waLink()} target="_blank" rel="noreferrer">WhatsApp au {formatPhone(settings.whatsappNumber)}</a>
          </p>

          <p className="ng-login-mark">
            <Leaf size={15} /> NATURE &amp; GRÂCE
          </p>
        </div>
      </section>
    </div>
  )
}

export default LoginPage
