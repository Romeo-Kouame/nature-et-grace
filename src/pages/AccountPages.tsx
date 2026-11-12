import React, { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Heart, ImageUp, KeyRound, LogOut, MessageCircle, Package, Save, ShoppingBag, User as UserIcon } from 'lucide-react'
import { useApp, formatPhone } from '../context/AppContext'
import { api, ApiCustomer, CustomerOrder, imageFileToDataUrl, ORDER_STATUS_LABELS, OrderStatus } from '../api'
import { formatXof } from '../format'
import { usePageMeta } from '../hooks/usePageMeta'

/** Redirige vers la connexion si la personne n'est pas connectée. */
function useRequireLogin(path: string) {
  const { user, authReady, goToLogin } = useApp()
  useEffect(() => {
    if (authReady && !user) goToLogin({ then: path })
  }, [authReady, user, goToLogin, path])
  return authReady && Boolean(user)
}

const AccountNav: React.FC<{ current: 'compte' | 'commandes' }> = ({ current }) => {
  const { navigate, logout, favorites } = useApp()
  return (
    <nav className="ng-account-nav" aria-label="Mon espace">
      <button type="button" className={current === 'compte' ? 'active' : ''} onClick={() => navigate('/compte')}>
        <UserIcon size={18} /> Votre compte
      </button>
      <button type="button" className={current === 'commandes' ? 'active' : ''} onClick={() => navigate('/commandes')}>
        <Package size={18} /> Vos commandes
      </button>
      <button type="button" onClick={() => navigate('/favoris')}>
        <Heart size={18} /> Favoris ({favorites.length})
      </button>
      <button type="button" className="danger" onClick={() => void logout()}>
        <LogOut size={18} /> Se déconnecter
      </button>
    </nav>
  )
}

/* ───────────────────────── VOTRE COMPTE ───────────────────────── */

export const AccountPage: React.FC = () => {
  const ready = useRequireLogin('/compte')
  const { user, setUser, settings, showToast } = useApp()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [pwError, setPwError] = useState('')
  usePageMeta('Votre compte')

  if (!ready || !user) return <div className="ng-container ng-subpage"><p className="ng-form-hint">Chargement…</p></div>

  const saveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    setSaving(true)
    setError('')
    try {
      const updated = await api<ApiCustomer>('/customer/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          deliveryZone: data.get('deliveryZone') || undefined,
          commune: data.get('commune'),
          address: data.get('address'),
        }),
      })
      setUser(updated)
      showToast('Vos informations sont enregistrées')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    if (data.get('newPassword') !== data.get('confirm')) return setPwError('Les deux nouveaux mots de passe ne sont pas identiques.')
    setPwError('')
    try {
      await api('/customer/password', { method: 'POST', body: JSON.stringify({ currentPassword: data.get('currentPassword'), newPassword: data.get('newPassword') }) })
      form.reset()
      showToast('Mot de passe modifié')
    } catch (err) {
      setPwError((err as Error).message)
    }
  }

  return (
    <div className="ng-container ng-subpage">
      <header className="ng-page-head ng-page-head--left">
        <span className="ng-eyebrow">MON ESPACE</span>
        <h1>Bonjour, {user.name.split(' ')[0]}</h1>
      </header>

      <div className="ng-account-layout">
        <AccountNav current="compte" />

        <div className="ng-account-main">
          <form className="ng-form-card ng-form" onSubmit={saveProfile}>
            <h2 className="ng-h2">Vos informations</h2>
            <div className="ng-form-row">
              <label>
                Nom et prénom(s)
                <input name="name" defaultValue={user.name} autoComplete="name" required minLength={2} maxLength={80} />
              </label>
              <label>
                Téléphone
                <input value={formatPhone(user.phone)} readOnly disabled />
              </label>
            </div>
            <label>
              <span>
                Adresse e-mail <span className="ng-optional">(facultatif)</span>
              </span>
              <input name="email" type="email" defaultValue={user.email ?? ''} autoComplete="email" maxLength={120} />
            </label>

            <h3 className="ng-account-sub">Adresse de livraison par défaut</h3>
            {settings.deliveryZones.length > 0 && (
              <label>
                Zone de livraison
                <select name="deliveryZone" defaultValue={user.deliveryZone ?? ''}>
                  <option value="">Choisir au moment de la commande</option>
                  {settings.deliveryZones.map((z) => (
                    <option key={z.name} value={z.name}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Commune et quartier
              <input name="commune" defaultValue={user.commune ?? ''} placeholder="Ex. Cocody Angré" maxLength={80} />
            </label>
            <label>
              Adresse précise
              <textarea name="address" defaultValue={user.address ?? ''} placeholder="Rue, carrefour, repère…" rows={3} maxLength={400} />
            </label>
            {error && <p className="ng-form-error" role="alert">{error}</p>}
            <button type="submit" className="ng-btn ng-btn--primary" disabled={saving}>
              <Save size={16} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <p className="ng-form-hint">Pour changer de numéro de téléphone, écrivez à la boutique sur WhatsApp.</p>
          </form>

          <form className="ng-form-card ng-form" onSubmit={changePassword}>
            <h2 className="ng-h2">
              <KeyRound size={20} /> Mot de passe
            </h2>
            <label>
              Mot de passe actuel
              <input name="currentPassword" type="password" autoComplete="current-password" required />
            </label>
            <div className="ng-form-row">
              <label>
                Nouveau mot de passe
                <input name="newPassword" type="password" autoComplete="new-password" minLength={8} required placeholder="8 caractères minimum" />
              </label>
              <label>
                Confirmation
                <input name="confirm" type="password" autoComplete="new-password" minLength={8} required />
              </label>
            </div>
            {pwError && <p className="ng-form-error" role="alert">{pwError}</p>}
            <button type="submit" className="ng-btn ng-btn--ghost">
              Changer le mot de passe
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── VOS COMMANDES ───────────────────────── */

const STEPS: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered']
const stepIndex = (s: OrderStatus) => (s === 'payment_review' ? 0 : STEPS.indexOf(s))

const OrderCard: React.FC<{ order: CustomerOrder; onProofSent: () => void }> = ({ order, onProofSent }) => {
  const { waLink, settings } = useApp()
  const [state, setState] = useState<'idle' | 'sending' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const fee = order.deliveryFeeXof
  const canSendProof = !order.proofSent && (order.status === 'pending' || order.status === 'payment_review')
  const current = stepIndex(order.status)

  const upload = async (file?: File) => {
    if (!file) return
    setState('sending')
    try {
      const image = await imageFileToDataUrl(file)
      await api(`/orders/${order.id}/proof`, { method: 'POST', body: JSON.stringify({ image }) })
      setState('idle')
      onProofSent()
    } catch (err) {
      setState('error')
      setMessage((err as Error).message)
    } finally {
      if (input.current) input.current.value = ''
    }
  }

  return (
    <article className={`ng-order status-${order.status}`}>
      <header>
        <div>
          <b>Commande {order.reference}</b>
          <small>{new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</small>
        </div>
        <span className={`ng-order-status status-${order.status}`}>{ORDER_STATUS_LABELS[order.status]}</span>
      </header>

      {order.status !== 'cancelled' && (
        <ol className="ng-order-steps" aria-label="Avancement">
          {STEPS.map((s, i) => (
            <li key={s} className={i <= current ? 'done' : ''}>
              <span>{i < current || order.status === 'delivered' ? <Check size={12} /> : i + 1}</span>
              <small>{['Reçue', 'Confirmée', 'Préparée', 'Expédiée', 'Livrée'][i]}</small>
            </li>
          ))}
        </ol>
      )}

      <ul className="ng-order-items">
        {order.items.map((item, i) => (
          <li key={i}>
            <span>
              {item.quantity} × {item.productName} <small>{item.productSize}</small>
            </span>
            <b>{formatXof(item.unitPriceXof * item.quantity)}</b>
          </li>
        ))}
        <li className="muted">
          <span>Livraison{order.deliveryZone ? ` (${order.deliveryZone})` : ''}</span>
          <b>{fee === null ? 'À confirmer' : fee === 0 ? 'Offerte' : formatXof(fee)}</b>
        </li>
        <li className="total">
          <span>Total{fee === null ? ' hors livraison' : ''}</span>
          <b>{formatXof(order.totalXof + (fee ?? 0))}</b>
        </li>
      </ul>

      <footer>
        {order.proofSent && (
          <span className="ng-proof-ok">
            <Check size={15} /> Preuve Wave envoyée
          </span>
        )}
        {canSendProof && (
          <>
            <input ref={input} type="file" accept="image/*" hidden onChange={(e) => void upload(e.target.files?.[0])} />
            <button type="button" className="ng-btn ng-btn--primary ng-btn--sm" onClick={() => input.current?.click()} disabled={state === 'sending'}>
              <ImageUp size={16} /> {state === 'sending' ? 'Envoi…' : 'Envoyer la preuve Wave'}
            </button>
          </>
        )}
        <a className="ng-btn ng-btn--ghost ng-btn--sm" href={waLink(`Bonjour NATURE & GRÂCE, je vous écris au sujet de ma commande ${order.reference}.`)} target="_blank" rel="noreferrer">
          <MessageCircle size={16} /> Une question ?
        </a>
      </footer>
      {canSendProof && settings.waveNumber && <p className="ng-form-hint">Paiement Wave au {settings.waveNumber}, après confirmation de la boutique.</p>}
      {state === 'error' && <p className="ng-form-error" role="alert">{message}</p>}
    </article>
  )
}

export const OrdersPage: React.FC = () => {
  const ready = useRequireLogin('/commandes')
  const { navigate } = useApp()
  const [orders, setOrders] = useState<CustomerOrder[] | null>(null)
  const [error, setError] = useState('')
  usePageMeta('Vos commandes')

  const load = () =>
    api<CustomerOrder[]>('/customer/orders')
      .then(setOrders)
      .catch((err) => setError((err as Error).message))

  useEffect(() => {
    if (ready) void load()
  }, [ready])

  return (
    <div className="ng-container ng-subpage">
      <header className="ng-page-head ng-page-head--left">
        <span className="ng-eyebrow">MON ESPACE</span>
        <h1>Vos commandes</h1>
      </header>
      <div className="ng-account-layout">
        <AccountNav current="commandes" />
        <div className="ng-account-main">
          {error && <p className="ng-form-error">{error}</p>}
          {!orders && !error && <p className="ng-form-hint">Chargement…</p>}
          {orders?.length === 0 && (
            <div className="ng-empty ng-empty--icon">
              <span className="ng-empty-ico">
                <ShoppingBag size={28} />
              </span>
              <h3>Aucune commande pour le moment</h3>
              <p>Vos commandes passées sur le site apparaîtront ici, avec leur suivi.</p>
              <button type="button" className="ng-btn ng-btn--primary" onClick={() => navigate('/boutique')}>
                Découvrir la boutique <ArrowRight size={16} />
              </button>
            </div>
          )}
          {orders?.map((o) => <OrderCard key={o.id} order={o} onProofSent={() => void load()} />)}
        </div>
      </div>
    </div>
  )
}
