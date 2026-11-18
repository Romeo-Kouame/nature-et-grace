import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Eye, EyeOff, Heart, Leaf, Sparkles, Truck } from 'lucide-react'
import CartIcon from '../components/CartIcon'
import { useApp, formatPhone } from '../context/AppContext'
import Honeypot from '../components/Honeypot'
import { usePageMeta } from '../hooks/usePageMeta'
import { PHOTOS } from '../data/products'
import { API_BASE, api } from '../api'
import Captcha, { CaptchaHandle, requireCaptcha } from '../components/Captcha'
import ForgotPassword from '../components/ForgotPassword'

/** Messages affichés au retour de Google (`/connexion?google=…`) */
const GOOGLE_MESSAGES: Record<string, string> = {
  'email-existant': 'Un compte existe déjà avec cette adresse e-mail. Connectez-vous avec votre numéro (ou e-mail) et votre mot de passe.',
  annule: 'Connexion avec Google annulée.',
  erreur: 'La connexion avec Google a échoué. Réessayez, ou utilisez votre numéro et votre mot de passe.',
  indisponible: 'La connexion avec Google n’est pas disponible pour le moment.',
}

/** Logo « G » de Google, tel que le demandent les règles de marque pour les boutons de connexion */
const GoogleLogo: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
)

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
  const { login, register, completeGoogle, finishGoogleLogin, user, authReady, navigate, waLink, cartCount, settings } = useApp()
  const googleStatus = useMemo(() => new URLSearchParams(window.location.search).get('google') ?? '', [])
  const [mode, setMode] = useState<'login' | 'register' | 'google' | 'forgot'>(() => (window.location.search.includes('inscription') ? 'register' : 'login'))
  const [error, setError] = useState(() => GOOGLE_MESSAGES[googleStatus] ?? '')
  // Retour de Google sur un compte déjà lié : on attend la fin de la connexion avant toute redirection
  const [busy, setBusy] = useState(googleStatus === 'connecte')
  const [googleEnabled, setGoogleEnabled] = useState(false)
  const [googleProfile, setGoogleProfile] = useState<{ name: string; email: string } | null>(null)
  const captcha = useRef<CaptchaHandle>(null)
  const pending = useMemo(pendingAction, [])
  usePageMeta(mode === 'login' ? 'Se connecter' : mode === 'forgot' ? 'Mot de passe oublié' : 'Créer un compte', 'Connectez-vous ou créez votre compte Nature & Grâce pour commander et suivre vos commandes.')

  // Déjà connecté : inutile de rester ici
  useEffect(() => {
    if (authReady && user && !busy) navigate(pending.then && pending.then !== '/connexion' ? pending.then : '/compte')
  }, [authReady, user, busy, navigate, pending.then])

  // Le bouton Google n'apparaît que si l'API est configurée pour Google
  useEffect(() => {
    api<{ enabled: boolean }>('/customer/google/enabled')
      .then((r) => setGoogleEnabled(r.enabled))
      .catch(() => setGoogleEnabled(false))
  }, [])

  // Retour de Google : connexion terminée, ou compte à finaliser (numéro de téléphone)
  useEffect(() => {
    if (!googleStatus) return
    window.history.replaceState(null, '', '/connexion')
    if (googleStatus === 'connecte') {
      finishGoogleLogin().catch(() => {
        setError(GOOGLE_MESSAGES.erreur)
        setBusy(false)
      })
    } else if (googleStatus === 'finaliser') {
      api<{ name: string; email: string }>('/customer/google/pending')
        .then((profile) => {
          setGoogleProfile(profile)
          setMode('google')
        })
        .catch(() => setError('La connexion avec Google a expiré. Recommencez avec le bouton Google.'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const switchMode = (next: 'login' | 'register' | 'forgot') => {
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
      await login(String(data.get('identifier')), String(data.get('password')), requireCaptcha(captcha.current))
    } catch (err) {
      setError(failMessage(err))
      captcha.current?.reset()
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
        captchaToken: requireCaptcha(captcha.current),
      })
    } catch (err) {
      setError(failMessage(err))
      captcha.current?.reset()
      setBusy(false)
    }
  }

  const submitGoogle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (busy) return
    const data = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    try {
      await completeGoogle({
        name: String(data.get('name') || '').trim() || undefined,
        phone: String(data.get('phone')),
        acceptTerms: data.get('acceptTerms') === 'on',
        website: String(data.get('website') || ''),
        captchaToken: requireCaptcha(captcha.current),
      })
    } catch (err) {
      setError(failMessage(err))
      captcha.current?.reset()
      setBusy(false)
    }
  }

  const googleButton = googleEnabled && (
    <>
      <a className="ng-login-google" href={`${API_BASE}/customer/google/start`}>
        <GoogleLogo /> Continuer avec Google
      </a>
      <p className="ng-login-or"><span>ou avec votre numéro</span></p>
    </>
  )

  const termsCheckbox = (
    <label className="ng-check ng-login-terms">
      <input type="checkbox" name="acceptTerms" required />
      <span>
        J’accepte les{' '}
        <a href="/cgv" target="_blank" rel="noreferrer">conditions de vente</a>{' '}
        et la{' '}
        <a href="/confidentialite" target="_blank" rel="noreferrer">politique de confidentialité</a>.
      </span>
    </label>
  )

  const forgotLink = waLink('Bonjour Nature & Grâce, j’ai oublié le mot de passe de mon compte client. Pouvez-vous m’aider ?')

  return (
    <div className="ng-login">
      {/* ───── Colonne gauche : l'univers de la marque ───── */}
      <section className="ng-login-brand" aria-label="Nature & Grâce">
        <button type="button" className="ng-login-back" onClick={back}>
          <ArrowLeft size={18} /> Retour à la boutique
        </button>
        <a href="/" className="ng-login-logo" onClick={(e) => { e.preventDefault(); navigate('/') }}>
          <img src="/logo.jpeg" alt="Nature & Grâce, accueil" width={72} height={72} />
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
            <img className="ng-lc ng-lc--main" src={PHOTOS.plantation} alt="" />
            <img className="ng-lc ng-lc--back" src={PHOTOS.beurreCacao} alt="" />
            <img className="ng-lc ng-lc--card" src={PHOTOS.kariteFouette} alt="" />
            <img className="ng-lc ng-lc--round" src={PHOTOS.cabosseOuverte} alt="" />
            <span className="ng-lc-chip ng-lc-chip--leaf"><Leaf size={22} /></span>
            <span className="ng-lc-chip ng-lc-chip--heart"><Heart size={22} fill="currentColor" /></span>
            <span className="ng-lc-pill"><Sparkles size={14} /> Cacao de Côte d’Ivoire</span>
          </div>
        </div>
      </section>

      {/* ───── Colonne droite : le formulaire ───── */}
      <section className="ng-login-panel">
        <div className="ng-login-box">
          <h2>
            {mode === 'login' ? 'Se connecter à Nature & Grâce' : mode === 'google' ? 'Dernière étape' : mode === 'forgot' ? 'Mot de passe oublié' : 'Créer un compte Nature & Grâce'}
          </h2>
          <p className="ng-login-sub">
            {mode === 'login'
              ? 'Avec Google, ou avec votre numéro de téléphone ou votre e-mail.'
              : mode === 'forgot'
                ? 'Recevez un code à 6 chiffres par SMS ou par e-mail, puis choisissez un nouveau mot de passe.'
                : mode === 'google'
                ? 'Votre numéro sert à la livraison et au suivi de commande sur WhatsApp.'
                : 'Commandez plus vite et suivez vos livraisons.'}
          </p>

          {pending.openCart && (
            <p className="ng-auth-reason">
              <CartIcon size={17} />
              <span>
                Connectez-vous ou créez votre compte pour valider votre commande
                {cartCount > 0 ? ` : ${cartCount} article${cartCount > 1 ? 's' : ''} gardé${cartCount > 1 ? 's' : ''} dans votre panier` : ''}.
                {mode === 'login' && (
                  <>
                    {' '}
                    <button type="button" className="ng-auth-reason-link" onClick={() => switchMode('register')}>
                      Nouvelle cliente ? Créer un compte
                    </button>
                  </>
                )}
              </span>
            </p>
          )}

          {mode === 'forgot' ? (
            <ForgotPassword onBack={() => switchMode('login')} helpLink={forgotLink} />
          ) : busy && googleStatus === 'connecte' && !error ? (
            <p className="ng-login-sub" role="status">Connexion avec Google…</p>
          ) : mode === 'google' && googleProfile ? (
            <form className="ng-login-form" onSubmit={submitGoogle} key="google">
              <p className="ng-login-google-as">
                <GoogleLogo /> <span>Connecté avec <b>{googleProfile.email}</b></span>
              </p>
              <input name="name" aria-label="Nom et prénom(s)" autoComplete="name" placeholder="Nom et prénom(s)" defaultValue={googleProfile.name} required minLength={2} maxLength={80} />
              <input name="phone" type="tel" aria-label="Téléphone (WhatsApp de préférence)" autoComplete="tel" placeholder="Téléphone (WhatsApp de préférence)" required minLength={8} maxLength={25} autoFocus />
              <Honeypot />
              {termsCheckbox}
              <Captcha ref={captcha} action="google" />
              {error && <p className="ng-form-error" role="alert">{error}</p>}
              <button type="submit" className="ng-login-primary" disabled={busy}>
                {busy ? 'Création du compte…' : 'Créer mon compte'}
              </button>
              <div className="ng-login-gap" />
              <button type="button" className="ng-login-secondary" onClick={() => { setGoogleProfile(null); switchMode('login') }}>
                Annuler
              </button>
            </form>
          ) : mode === 'login' || mode === 'google' ? (
            <form className="ng-login-form" onSubmit={submitLogin} key="login">
              {googleButton}
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
              <Captcha ref={captcha} action="login" />
              {error && <p className="ng-form-error" role="alert">{error}</p>}
              <button type="submit" className="ng-login-primary" disabled={busy}>
                {busy ? 'Connexion…' : 'Se connecter'}
              </button>
              <button type="button" className="ng-login-forgot" onClick={() => switchMode('forgot')}>
                Mot de passe oublié ?
              </button>
              <div className="ng-login-gap" />
              <button type="button" className="ng-login-secondary" onClick={() => switchMode('register')}>
                Créer un nouveau compte
              </button>
            </form>
          ) : (
            <form className="ng-login-form" onSubmit={submitRegister} key="register">
              {googleButton}
              <input name="name" aria-label="Nom et prénom(s)" autoComplete="name" placeholder="Nom et prénom(s)" required minLength={2} maxLength={80} autoFocus />
              <input name="phone" type="tel" aria-label="Téléphone (WhatsApp de préférence)" autoComplete="tel" placeholder="Téléphone (WhatsApp de préférence)" required minLength={8} maxLength={25} />
              <input name="email" type="email" aria-label="Adresse e-mail (facultatif)" autoComplete="email" placeholder="Adresse e-mail (facultatif)" maxLength={120} />
              <PasswordInput name="password" autoComplete="new-password" minLength={8} placeholder="Mot de passe (8 caractères minimum)" label="Mot de passe, 8 caractères minimum" />
              <PasswordInput name="confirm" autoComplete="new-password" minLength={8} placeholder="Confirmez le mot de passe" label="Confirmation du mot de passe" />
              <Honeypot />
              {termsCheckbox}
              <Captcha ref={captcha} action="signup" />
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
            <Leaf size={15} /> Nature &amp; Grâce
          </p>
        </div>
      </section>
    </div>
  )
}

export default LoginPage
