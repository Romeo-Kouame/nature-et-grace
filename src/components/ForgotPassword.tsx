import React, { useRef, useState } from 'react'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../api'
import Captcha, { CaptchaHandle, requireCaptcha } from './Captcha'

/**
 * « Mot de passe oublié », sans intervention de la boutique :
 * 1. la cliente donne son téléphone ou son e-mail → un code à 6 chiffres lui est envoyé (e-mail ou SMS) ;
 * 2. elle saisit le code et son nouveau mot de passe → elle est connectée, ses autres appareils sont déconnectés.
 */
export const ForgotPassword: React.FC<{ onBack: () => void; helpLink: string }> = ({ onBack, helpLink }) => {
  const { resetPassword } = useApp()
  const [step, setStep] = useState<'ask' | 'code'>('ask')
  const [identifier, setIdentifier] = useState('')
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [visible, setVisible] = useState(false)
  const captcha = useRef<CaptchaHandle>(null)

  const failMessage = (err: unknown) => (err instanceof TypeError ? 'Connexion au serveur impossible. Réessayez dans un instant.' : (err as Error).message)

  const askCode = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (busy || !identifier.trim()) return
    setBusy(true)
    setError('')
    try {
      const res = await api<{ message: string }>('/customer/password/forgot', {
        method: 'POST',
        body: JSON.stringify({ identifier: identifier.trim(), captchaToken: requireCaptcha(captcha.current) }),
      })
      setInfo(res.message)
      setStep('code')
    } catch (err) {
      setError(failMessage(err))
      captcha.current?.reset()
    } finally {
      setBusy(false)
    }
  }

  const submitCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (busy) return
    const data = new FormData(e.currentTarget)
    const password = String(data.get('password'))
    if (password !== data.get('confirm')) return setError('Les deux mots de passe ne sont pas identiques.')
    setBusy(true)
    setError('')
    try {
      await resetPassword(identifier.trim(), String(data.get('code')).replace(/\D/g, ''), password)
    } catch (err) {
      setError(failMessage(err))
      setBusy(false)
    }
  }

  return step === 'ask' ? (
    <form className="ng-login-form" onSubmit={askCode} key="forgot-ask">
      <input
        name="identifier"
        aria-label="Numéro de téléphone ou e-mail du compte"
        autoComplete="username"
        placeholder="Numéro de téléphone ou e-mail"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        required
        minLength={3}
        maxLength={120}
        autoFocus
      />
      <Captcha ref={captcha} action="reset" />
      {error && <p className="ng-form-error" role="alert">{error}</p>}
      <button type="submit" className="ng-login-primary" disabled={busy}>
        {busy ? 'Envoi…' : 'Recevoir un code'}
      </button>
      <button type="button" className="ng-login-back-link" onClick={onBack}>
        <ArrowLeft size={16} /> Retour à la connexion
      </button>
      <p className="ng-login-legal">
        Pas d’e-mail enregistré sur votre compte, ou pas d’accès à votre e-mail ?{' '}
        <a href={helpLink} target="_blank" rel="noreferrer">Écrivez-nous sur WhatsApp</a>.
      </p>
    </form>
  ) : (
    <form className="ng-login-form" onSubmit={submitCode} key="forgot-code">
      {info && <p className="ng-auth-reason" role="status"><span>{info}</span></p>}
      <input
        name="code"
        aria-label="Code à 6 chiffres"
        placeholder="Code à 6 chiffres"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]{6,7}"
        maxLength={7}
        required
        autoFocus
      />
      <span className="ng-password">
        <input name="password" aria-label="Nouveau mot de passe, 8 caractères minimum" type={visible ? 'text' : 'password'} autoComplete="new-password" placeholder="Nouveau mot de passe (8 caractères minimum)" minLength={8} maxLength={200} required />
        <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
      <input name="confirm" aria-label="Confirmation du nouveau mot de passe" type={visible ? 'text' : 'password'} autoComplete="new-password" placeholder="Confirmez le nouveau mot de passe" minLength={8} maxLength={200} required />
      {error && <p className="ng-form-error" role="alert">{error}</p>}
      <button type="submit" className="ng-login-primary" disabled={busy}>
        {busy ? 'Enregistrement…' : 'Changer mon mot de passe'}
      </button>
      <button type="button" className="ng-login-back-link" onClick={() => { setStep('ask'); setError(''); setInfo('') }}>
        Je n’ai pas reçu de code
      </button>
    </form>
  )
}

export default ForgotPassword
