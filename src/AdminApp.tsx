import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle, ArrowLeft, Bell, Check, ExternalLink, Eye, EyeOff, ImageUp, KeyRound, LogOut, MessageCircle, Package,
  Phone, Plus, RefreshCw, Save, Search, ShoppingBag, Sparkles, Star, Store, Trash2, X,
} from 'lucide-react'
import {
  api, API_BASE, ApiOrder, ApiProduct, ApiReview, ApiStoreSettings, DeliveryZone, imageFileToDataUrl, OrderStatus, resolveImageUrl,
} from './api'
import { requestProductDescription } from './gemini'
import { formatXof } from './format'
import { DEFAULT_SETTINGS, KNOWN_CATEGORIES } from './data/products'
import ProductVisual from './components/ProductVisual'
import './nature.css'
import './admin.css'

const STATUSES: OrderStatus[] = ['pending', 'payment_review', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled']
const STATUS_NAMES: Record<OrderStatus, string> = {
  pending: 'À confirmer', payment_review: 'Paiement à vérifier', confirmed: 'Confirmée',
  preparing: 'En préparation', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée',
}

type Tab = 'orders' | 'products' | 'reviews' | 'store'

/** « 07 00 00 00 00 » → « 2250700000000 » pour ouvrir WhatsApp vers le client */
function customerWhatsapp(phone: string) {
  const d = phone.replace(/\D/g, '')
  if (d.startsWith('225')) return d
  if (d.length === 10) return `225${d}`
  return d
}

const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const fmtDate = (iso: string) => new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const readSeen = () => {
  try { return localStorage.getItem('ng_admin_seen') || '' } catch { return '' }
}
const writeSeen = (v: string) => {
  try { localStorage.setItem('ng_admin_seen', v) } catch { /* ignoré */ }
}

export default function AdminApp() {
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [tab, setTab] = useState<Tab>('orders')
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [reviews, setReviews] = useState<ApiReview[]>([])
  const [settings, setSettings] = useState<ApiStoreSettings>(DEFAULT_SETTINGS)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [seenAt, setSeenAt] = useState(readSeen)

  useEffect(() => {
    document.title = 'Administration · NATURE & GRÂCE'
  }, [])

  const notify = (msg: string) => {
    setError('')
    setMessage(msg)
    window.setTimeout(() => setMessage((m) => (m === msg ? '' : m)), 4000)
  }
  const fail = (e: unknown, fallback: string) => {
    setMessage('')
    setError(e instanceof Error ? e.message : fallback)
  }

  const load = useCallback(async () => {
    const [items, sales, store, revs] = await Promise.all([
      api<ApiProduct[]>('/admin/products'),
      api<ApiOrder[]>('/admin/orders'),
      api<ApiStoreSettings>('/store-settings'),
      api<ApiReview[]>('/admin/reviews'),
    ])
    setProducts(items)
    setOrders(sales)
    setSettings({ ...DEFAULT_SETTINGS, ...store })
    setReviews(revs)
    setLoggedIn(true)
  }, [])

  useEffect(() => {
    api<{ email: string }>('/admin/me')
      .then(async (me) => {
        setEmail(me.email)
        await load()
      })
      .catch(() => setLoggedIn(false))
      .finally(() => setChecking(false))
  }, [load])

  // Actualisation automatique : les nouvelles commandes apparaissent sans recharger la page
  useEffect(() => {
    if (!loggedIn) return
    const id = window.setInterval(() => void load().catch(() => setLoggedIn(false)), 60_000)
    return () => window.clearInterval(id)
  }, [loggedIn, load])

  // Première visite sur cet appareil : les commandes existantes sont considérées comme déjà vues
  useEffect(() => {
    if (!seenAt && orders.length) {
      setSeenAt(orders[0].createdAt)
      writeSeen(orders[0].createdAt)
    }
  }, [orders, seenAt])
  const newOrders = seenAt ? orders.filter((o) => o.createdAt > seenAt) : []
  useEffect(() => {
    document.title = newOrders.length ? `(${newOrders.length}) Nouvelle commande · Administration` : 'Administration · NATURE & GRÂCE'
  }, [newOrders.length])
  const markSeen = () => {
    const latest = orders[0]?.createdAt ?? new Date().toISOString()
    setSeenAt(latest)
    writeSeen(latest)
  }

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const data = new FormData(event.currentTarget)
    try {
      const result = await api<{ email: string }>('/admin/login', { method: 'POST', body: JSON.stringify({ email: data.get('email'), password: data.get('password') }) })
      setEmail(result.email)
      await load()
    } catch (e) {
      fail(e, 'Connexion impossible.')
    }
  }

  const logout = async () => {
    await api('/admin/logout', { method: 'POST' }).catch(() => undefined)
    setLoggedIn(false)
  }

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    if (data.get('newPassword') !== data.get('confirmPassword')) return fail(new Error('Les deux nouveaux mots de passe ne sont pas identiques.'), '')
    try {
      await api('/admin/password', { method: 'POST', body: JSON.stringify({ currentPassword: data.get('currentPassword'), newPassword: data.get('newPassword') }) })
      notify('Mot de passe modifié.')
      setPasswordOpen(false)
      form.reset()
    } catch (e) {
      fail(e, 'Impossible de modifier le mot de passe.')
    }
  }

  if (checking) return <main className="adm-login"><p className="adm-muted">Chargement…</p></main>

  if (!loggedIn) {
    return (
      <main className="adm-login">
        <a href="/" className="adm-back"><ArrowLeft size={15} /> Retour à la boutique</a>
        <div className="adm-login-card">
          <img src="/logo.jpeg" alt="NATURE & GRÂCE" />
          <span className="adm-kicker">ESPACE BOUTIQUE</span>
          <h1>Bienvenue</h1>
          <p>Connectez-vous pour gérer vos produits et vos commandes.</p>
          <form onSubmit={login} className="adm-form">
            <label>Adresse e-mail<input name="email" type="email" autoComplete="username" required /></label>
            <label>Mot de passe<input name="password" type="password" autoComplete="current-password" required /></label>
            {error && <div className="adm-alert error" role="alert">{error}</div>}
            <button className="adm-btn adm-btn--primary">Se connecter</button>
          </form>
        </div>
      </main>
    )
  }

  const pendingCount = orders.filter((o) => o.status === 'pending' || o.status === 'payment_review').length
  const reviewsToModerate = reviews.filter((r) => !r.published).length
  const lowStock = products.filter((p) => p.active && p.stock <= 3)

  const tabs: { key: Tab; label: string; icon: typeof Package; badge?: number }[] = [
    { key: 'orders', label: 'Commandes', icon: ShoppingBag, badge: pendingCount },
    { key: 'products', label: 'Produits', icon: Package, badge: lowStock.length || undefined },
    { key: 'reviews', label: 'Avis', icon: Star, badge: reviewsToModerate },
    { key: 'store', label: 'Boutique', icon: Store },
  ]

  return (
    <div className="adm-shell">
      <header className="adm-top">
        <a href="/" className="adm-brand" title="Voir la boutique">
          <img src="/logo.jpeg" alt="" />
          <span><b>Nature &amp; Grâce</b><small>Espace boutique</small></span>
        </a>
        <div className="adm-top-actions">
          <span className="adm-user">{email}</span>
          <button className="adm-icon" onClick={() => setPasswordOpen((v) => !v)} aria-label="Changer le mot de passe" title="Mot de passe"><KeyRound size={17} /></button>
          <button className="adm-icon" onClick={() => void load().then(() => notify('Données actualisées.')).catch((e) => fail(e, 'Actualisation impossible.'))} aria-label="Actualiser" title="Actualiser"><RefreshCw size={17} /></button>
          <a className="adm-icon" href="/" aria-label="Voir la boutique" title="Voir la boutique"><ExternalLink size={17} /></a>
          <button className="adm-icon" onClick={logout} aria-label="Se déconnecter" title="Se déconnecter"><LogOut size={17} /></button>
        </div>
      </header>

      <nav className="adm-tabs" aria-label="Rubriques">
        {tabs.map(({ key, label, icon: Icon, badge }) => (
          <button key={key} type="button" className={tab === key ? 'active' : ''} onClick={() => setTab(key)} aria-current={tab === key ? 'page' : undefined}>
            <Icon size={17} /> {label}
            {badge ? <i>{badge}</i> : null}
          </button>
        ))}
      </nav>

      <main className="adm-main">
        {(error || message) && (
          <div className={`adm-alert ${error ? 'error' : 'success'}`} role={error ? 'alert' : 'status'}>
            {error || message}
            <button type="button" onClick={() => { setError(''); setMessage('') }} aria-label="Fermer"><X size={15} /></button>
          </div>
        )}

        {passwordOpen && (
          <form className="adm-card adm-form adm-password" onSubmit={changePassword}>
            <h2>Changer le mot de passe</h2>
            <label>Mot de passe actuel<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
            <label>Nouveau mot de passe (12 caractères minimum)<input name="newPassword" type="password" minLength={12} autoComplete="new-password" required /></label>
            <label>Confirmer le nouveau mot de passe<input name="confirmPassword" type="password" minLength={12} autoComplete="new-password" required /></label>
            <div className="adm-row">
              <button className="adm-btn adm-btn--primary">Enregistrer</button>
              <button type="button" className="adm-btn" onClick={() => setPasswordOpen(false)}>Annuler</button>
            </div>
          </form>
        )}

        {newOrders.length > 0 && tab === 'orders' && (
          <div className="adm-alert info">
            <Bell size={17} /> {newOrders.length === 1 ? 'Une nouvelle commande' : `${newOrders.length} nouvelles commandes`} depuis votre dernière visite.
            <button type="button" className="adm-link" onClick={markSeen}>Marquer comme vues</button>
          </div>
        )}

        {tab === 'orders' && <OrdersPanel orders={orders} newIds={new Set(newOrders.map((o) => o.id))} reload={load} notify={notify} fail={fail} />}
        {tab === 'products' && <ProductsPanel products={products} lowStock={lowStock} reload={load} notify={notify} fail={fail} />}
        {tab === 'reviews' && <ReviewsPanel reviews={reviews} products={products} reload={load} notify={notify} fail={fail} />}
        {tab === 'store' && <StorePanel settings={settings} setSettings={setSettings} notify={notify} fail={fail} />}
      </main>
    </div>
  )
}

type PanelProps = { reload: () => Promise<void>; notify: (m: string) => void; fail: (e: unknown, fallback: string) => void }

/* ───────────────────────── COMMANDES ───────────────────────── */

function OrdersPanel({ orders, newIds, reload, notify, fail }: PanelProps & { orders: ApiOrder[]; newIds: Set<string> }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all' | 'todo'>('todo')

  const filtered = orders.filter((order) => {
    const matchesStatus =
      statusFilter === 'all' ? true : statusFilter === 'todo' ? ['pending', 'payment_review', 'confirmed', 'preparing'].includes(order.status) : order.status === statusFilter
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q || [order.customerName, order.phone, order.commune, order.reference, order.deliveryZone ?? ''].some((v) => v.toLowerCase().includes(q))
    return matchesStatus && matchesSearch
  })

  const changeStatus = async (order: ApiOrder, status: OrderStatus) => {
    if (status === 'cancelled' && !window.confirm(`Annuler la commande ${order.reference} ? Les produits seront remis en stock.`)) return
    try {
      await api(`/admin/orders/${order.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      await reload()
      notify(`Commande ${order.reference} : ${STATUS_NAMES[status]}.`)
    } catch (e) {
      fail(e, 'Impossible de modifier la commande.')
    }
  }

  const openProof = async (order: ApiOrder) => {
    const win = window.open('', '_blank')
    try {
      const res = await fetch(`${API_BASE}${order.paymentProofUrl}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Preuve introuvable.')
      const url = URL.createObjectURL(await res.blob())
      if (win) win.location.href = url
      else window.location.href = url
    } catch (e) {
      win?.close()
      fail(e, 'Impossible d’ouvrir la preuve.')
    }
  }

  const today = new Date().toDateString()
  const revenue = orders.filter((o) => ['confirmed', 'preparing', 'shipped', 'delivered'].includes(o.status)).reduce((s, o) => s + o.totalXof, 0)

  return (
    <section>
      <div className="adm-stats">
        <div><span>À traiter</span><b>{orders.filter((o) => o.status === 'pending' || o.status === 'payment_review').length}</b></div>
        <div><span>Aujourd’hui</span><b>{orders.filter((o) => new Date(o.createdAt).toDateString() === today).length}</b></div>
        <div><span>Ventes confirmées</span><b>{formatXof(revenue)}</b><small>produits, hors livraison</small></div>
      </div>

      <div className="adm-toolbar">
        <label className="adm-search"><Search size={16} /><input placeholder="Nom, téléphone, commune ou référence" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
        <div className="adm-pills">
          {(['todo', 'all', ...STATUSES] as const).map((s) => {
            const count = s === 'all' ? orders.length : s === 'todo' ? orders.filter((o) => ['pending', 'payment_review', 'confirmed', 'preparing'].includes(o.status)).length : orders.filter((o) => o.status === s).length
            if (s !== 'all' && s !== 'todo' && count === 0) return null
            return (
              <button key={s} type="button" className={statusFilter === s ? 'active' : ''} onClick={() => setStatusFilter(s)}>
                {s === 'all' ? 'Toutes' : s === 'todo' ? 'En cours' : STATUS_NAMES[s]} <b>{count}</b>
              </button>
            )
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="adm-empty">{orders.length === 0 ? 'Les commandes passées sur le site apparaîtront ici.' : 'Aucune commande ne correspond à ces filtres.'}</p>
      ) : (
        <div className="adm-orders">
          {filtered.map((order) => {
            const fee = order.deliveryFeeXof
            const waText = `Bonjour ${order.customerName.split(' ')[0]}, c’est NATURE & GRÂCE. Merci pour votre commande ${order.reference} (${formatXof(order.totalXof)} de produits${fee !== null ? ` + ${formatXof(fee)} de livraison` : ''}). `
            return (
              <article className={`adm-order status-${order.status} ${newIds.has(order.id) ? 'is-new' : ''}`} key={order.id}>
                <header>
                  <div>
                    <b className="adm-ref">{order.reference}</b>
                    {newIds.has(order.id) && <span className="adm-new">Nouvelle</span>}
                    <small>{fmtDate(order.createdAt)}</small>
                  </div>
                  <select value={order.status} onChange={(e) => void changeStatus(order, e.target.value as OrderStatus)} aria-label={`Statut de la commande ${order.reference}`} className={`adm-status status-${order.status}`}>
                    {STATUSES.map((s) => <option value={s} key={s}>{STATUS_NAMES[s]}</option>)}
                  </select>
                </header>

                <div className="adm-order-grid">
                  <div className="adm-order-customer">
                    <b>{order.customerName}</b>
                    <span>
                      <a href={`tel:${order.phone.replace(/\s/g, '')}`}><Phone size={13} /> {order.phone}</a>
                    </span>
                    <span>{[order.deliveryZone, order.commune].filter(Boolean).join(' — ')}</span>
                    <small>{order.address}</small>
                    {order.deliveryNote && <small className="adm-note">« {order.deliveryNote} »</small>}
                  </div>
                  <div className="adm-order-items">
                    <ul>
                      {order.items.map((item, i) => (
                        <li key={i}><span>{item.quantity} × {item.productName} <small>{item.productSize}</small></span><b>{formatXof(item.unitPriceXof * item.quantity)}</b></li>
                      ))}
                    </ul>
                    <p><span>Livraison</span><b>{fee === null ? 'À confirmer' : fee === 0 ? 'Offerte' : formatXof(fee)}</b></p>
                    <p className="total"><span>Total{fee === null ? ' hors livraison' : ''}</span><b>{formatXof(order.totalXof + (fee ?? 0))}</b></p>
                  </div>
                </div>

                <footer>
                  <a className="adm-btn adm-btn--wa" href={`https://wa.me/${customerWhatsapp(order.phone)}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer">
                    <MessageCircle size={15} /> Écrire au client
                  </a>
                  {order.paymentProofUrl ? (
                    <button type="button" className="adm-btn" onClick={() => void openProof(order)}><Eye size={15} /> Voir la preuve Wave</button>
                  ) : (
                    <span className="adm-muted">Pas de preuve Wave envoyée</span>
                  )}
                </footer>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

/* ───────────────────────── PRODUITS ───────────────────────── */

function ProductsPanel({ products, lowStock, reload, notify, fail }: PanelProps & { products: ApiProduct[]; lowStock: ApiProduct[] }) {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<ApiProduct | 'new' | null>(null)
  const categories = useMemo(() => [...new Set([...KNOWN_CATEGORIES, ...products.map((p) => p.category)])], [products])
  const filtered = products.filter((p) => {
    const q = search.toLowerCase().trim()
    return !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  })

  return (
    <section>
      {lowStock.length > 0 && (
        <div className="adm-alert warn">
          <AlertTriangle size={17} /> Stock faible : {lowStock.map((p) => `${p.name} (${p.stock})`).join(' · ')}
        </div>
      )}
      <div className="adm-toolbar">
        <label className="adm-search"><Search size={16} /><input placeholder="Rechercher un produit" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
        <button type="button" className="adm-btn adm-btn--primary" onClick={() => setEditing('new')}><Plus size={16} /> Ajouter un produit</button>
      </div>

      <div className="adm-products">
        {filtered.map((p) => (
          <button type="button" key={p.id} className={`adm-product ${p.active ? '' : 'is-hidden'}`} onClick={() => setEditing(p)}>
            <span className="adm-product-img"><ProductVisual product={{ id: p.slug, name: p.name, category: p.category, imageUrl: resolveImageUrl(p.imageUrl) }} size="thumb" /></span>
            <span className="adm-product-info">
              <b>{p.name}</b>
              <small>{p.category} · {p.size}</small>
              <span className="adm-product-meta">
                <em>{formatXof(p.priceXof)}</em>
                <em className={p.stock === 0 ? 'out' : p.stock <= 3 ? 'low' : 'ok'}>{p.stock === 0 ? 'Rupture' : `Stock : ${p.stock}`}</em>
                {!p.active && <em className="hidden">Masqué</em>}
              </span>
            </span>
          </button>
        ))}
        {filtered.length === 0 && <p className="adm-empty">Aucun produit.</p>}
      </div>

      {editing && (
        <ProductEditor
          key={editing === 'new' ? 'new' : editing.id}
          product={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          reload={reload}
          notify={notify}
          fail={fail}
        />
      )}
    </section>
  )
}

function ProductEditor({ product, categories, onClose, reload, notify, fail }: PanelProps & { product: ApiProduct | null; categories: string[]; onClose: () => void }) {
  const [name, setName] = useState(product?.name ?? '')
  const [slug, setSlug] = useState(product?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(product))
  const [category, setCategory] = useState(product?.category ?? 'Huiles naturelles')
  const [size, setSize] = useState(product?.size ?? '')
  const [price, setPrice] = useState(product?.priceXof?.toString() ?? '')
  const [stock, setStock] = useState(product?.stock?.toString() ?? '0')
  const [description, setDescription] = useState(product?.description ?? '')
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? '')
  const [gallery, setGallery] = useState<string[]>(product?.gallery ?? [])
  const [badge, setBadge] = useState(product?.badge ?? '')
  const [active, setActive] = useState(product?.active ?? false)
  const [busy, setBusy] = useState<'' | 'save' | 'upload' | 'ai' | 'delete'>('')
  const [localError, setLocalError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const galleryInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const upload = async (file?: File, target: 'main' | 'gallery' = 'main') => {
    if (!file) return
    setBusy('upload')
    setLocalError('')
    try {
      const image = await imageFileToDataUrl(file)
      const res = await api<{ url: string }>('/admin/images', { method: 'POST', body: JSON.stringify({ image }) })
      if (target === 'gallery') setGallery((g) => [...g, res.url].slice(0, 6))
      else setImageUrl(res.url)
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Envoi de la photo impossible.')
    } finally {
      setBusy('')
      if (fileInput.current) fileInput.current.value = ''
      if (galleryInput.current) galleryInput.current.value = ''
    }
  }

  const writeWithAi = async () => {
    if (name.trim().length < 2) return setLocalError('Saisissez d’abord le nom du produit.')
    setBusy('ai')
    setLocalError('')
    try {
      const res = await requestProductDescription({ name, category, size })
      setDescription(res.description)
      if (res.isDemo) setLocalError('Mode démonstration : texte d’exemple. Ajoutez la clé GEMINI_API_KEY sur le serveur pour une vraie rédaction.')
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Rédaction impossible.')
    } finally {
      setBusy('')
    }
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setBusy('save')
    setLocalError('')
    const body = JSON.stringify({
      name: name.trim(), slug: slug.trim() || slugify(name), category: category.trim(), size: size.trim(), description: description.trim(),
      priceXof: price === '' ? null : Number(price), stock: Number(stock || 0), imageUrl: imageUrl || null, gallery, badge: badge || null, active,
    })
    try {
      if (product) await api(`/admin/products/${product.id}`, { method: 'PATCH', body })
      else await api('/admin/products', { method: 'POST', body })
      await reload()
      notify(product ? 'Produit enregistré.' : 'Produit ajouté au catalogue.')
      onClose()
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Enregistrement impossible.')
    } finally {
      setBusy('')
    }
  }

  const remove = async () => {
    if (!product || !window.confirm(`Supprimer « ${product.name} » ? Cette action est définitive.`)) return
    setBusy('delete')
    try {
      const res = await api<{ deleted: boolean; message: string }>(`/admin/products/${product.id}`, { method: 'DELETE' })
      await reload()
      notify(res.message)
      onClose()
    } catch (e) {
      fail(e, 'Suppression impossible.')
      setBusy('')
    }
  }

  const preview = { id: slug || 'nouveau', name: name || 'Nouveau produit', category, imageUrl: resolveImageUrl(imageUrl) }

  return (
    <div className="adm-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="adm-modal adm-form" onSubmit={save} role="dialog" aria-modal="true" aria-label={product ? `Modifier ${product.name}` : 'Nouveau produit'}>
        <header className="adm-modal-head">
          <h2>{product ? 'Modifier le produit' : 'Nouveau produit'}</h2>
          <button type="button" className="adm-icon" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        </header>

        <div className="adm-photo">
          <div className="adm-photo-preview"><ProductVisual product={preview} size="card" /></div>
          <div>
            <b>Photo du produit</b>
            <p className="adm-muted">Une photo nette sur fond clair, prise de face. Elle est redimensionnée automatiquement.</p>
            <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => void upload(e.target.files?.[0])} />
            <div className="adm-row">
              <button type="button" className="adm-btn" onClick={() => fileInput.current?.click()} disabled={busy === 'upload'}>
                <ImageUp size={15} /> {busy === 'upload' ? 'Envoi…' : imageUrl ? 'Changer la photo' : 'Ajouter une photo'}
              </button>
              {imageUrl && <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setImageUrl('')}>Retirer</button>}
            </div>
          </div>
        </div>

        <div className="adm-gallery">
          <b>Autres photos <small className="adm-muted">({gallery.length}/6 · la 1re apparaît au survol de la carte)</small></b>
          <div className="adm-gallery-list">
            {gallery.map((url, i) => (
              <span key={url + i} className="adm-gallery-item">
                <img src={resolveImageUrl(url) ?? ''} alt={`Photo ${i + 2}`} />
                <button type="button" onClick={() => setGallery((g) => g.filter((_, j) => j !== i))} aria-label={`Retirer la photo ${i + 2}`}><X size={13} /></button>
              </span>
            ))}
            {gallery.length < 6 && (
              <button type="button" className="adm-gallery-add" onClick={() => galleryInput.current?.click()} disabled={busy === 'upload'}>
                <ImageUp size={18} /> {busy === 'upload' ? 'Envoi…' : 'Ajouter'}
              </button>
            )}
          </div>
          <input ref={galleryInput} type="file" accept="image/*" hidden onChange={(e) => void upload(e.target.files?.[0], 'gallery')} />
        </div>

        <label>Nom du produit
          <input value={name} onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)) }} minLength={2} maxLength={120} required />
        </label>
        <div className="adm-grid-2">
          <label>Catégorie
            <input value={category} onChange={(e) => setCategory(e.target.value)} list="adm-categories" minLength={2} required />
            <datalist id="adm-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </label>
          <label>Contenance
            <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="100 g, 250 ml…" maxLength={40} required />
          </label>
          <label>Prix (FCFA)
            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="50" placeholder="Vide = à confirmer" />
          </label>
          <label>Stock disponible
            <input value={stock} onChange={(e) => setStock(e.target.value)} type="number" min="0" required />
          </label>
          <label>Pastille sur la carte
            <select value={badge} onChange={(e) => setBadge(e.target.value)}>
              <option value="">Aucune</option>
              <option value="bestseller">Meilleure vente</option>
              <option value="new">Nouveau</option>
            </select>
          </label>
        </div>
        <label>
          <span className="adm-label-row">Description
            <button type="button" className="adm-ai" onClick={() => void writeWithAi()} disabled={busy === 'ai'}><Sparkles size={13} /> {busy === 'ai' ? 'Rédaction…' : 'Rédiger avec l’IA'}</button>
          </span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} minLength={2} maxLength={2000} required />
          <small className="adm-muted">Relisez toujours le texte proposé par l’IA : il ne doit promettre aucun effet médical.</small>
        </label>
        <details className="adm-advanced">
          <summary>Réglage avancé</summary>
          <label>Adresse de la page (identifiant)
            <input value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true) }} minLength={2} maxLength={80} required />
            <small className="adm-muted">/produit/{slug || '…'} — à ne changer que si nécessaire (les anciens liens ne marcheraient plus).</small>
          </label>
        </details>
        <label className="adm-switch">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          <span>{active ? <><Eye size={15} /> Visible sur la boutique</> : <><EyeOff size={15} /> Masqué de la boutique</>}</span>
        </label>

        {localError && <div className="adm-alert error" role="alert">{localError}</div>}

        <footer className="adm-modal-foot">
          {product && <button type="button" className="adm-btn adm-btn--danger" onClick={() => void remove()} disabled={busy === 'delete'}><Trash2 size={15} /> Supprimer</button>}
          <span />
          <button type="button" className="adm-btn" onClick={onClose}>Annuler</button>
          <button className="adm-btn adm-btn--primary" disabled={busy === 'save'}><Save size={15} /> {busy === 'save' ? 'Enregistrement…' : 'Enregistrer'}</button>
        </footer>
      </form>
    </div>
  )
}

/* ───────────────────────── AVIS ───────────────────────── */

function ReviewsPanel({ reviews, products, reload, notify, fail }: PanelProps & { reviews: ApiReview[]; products: ApiProduct[] }) {
  const [adding, setAdding] = useState(false)
  const sorted = [...reviews].sort((a, b) => Number(a.published) - Number(b.published) || b.createdAt.localeCompare(a.createdAt))

  const setPublished = async (r: ApiReview, published: boolean) => {
    try {
      await api(`/admin/reviews/${r.id}`, { method: 'PATCH', body: JSON.stringify({ published }) })
      await reload()
      notify(published ? 'Avis publié sur le site.' : 'Avis retiré du site.')
    } catch (e) {
      fail(e, 'Modification impossible.')
    }
  }
  const remove = async (r: ApiReview) => {
    if (!window.confirm(`Supprimer l’avis de ${r.authorName} ?`)) return
    try {
      await api(`/admin/reviews/${r.id}`, { method: 'DELETE' })
      await reload()
      notify('Avis supprimé.')
    } catch (e) {
      fail(e, 'Suppression impossible.')
    }
  }
  const add = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    try {
      await api('/admin/reviews', {
        method: 'POST',
        body: JSON.stringify({
          authorName: data.get('authorName'), city: data.get('city'), rating: Number(data.get('rating')),
          comment: data.get('comment'), productSlug: data.get('productSlug') || undefined,
        }),
      })
      await reload()
      notify('Avis ajouté et publié.')
      setAdding(false)
    } catch (e) {
      fail(e, 'Ajout impossible.')
    }
  }

  return (
    <section>
      <div className="adm-toolbar">
        <p className="adm-muted">Les avis déposés sur le site attendent votre validation. Vous pouvez aussi saisir un avis reçu sur WhatsApp, avec l’accord de la cliente.</p>
        <button type="button" className="adm-btn adm-btn--primary" onClick={() => setAdding((v) => !v)}><Plus size={16} /> Saisir un avis</button>
      </div>

      {adding && (
        <form className="adm-card adm-form" onSubmit={add}>
          <div className="adm-grid-2">
            <label>Prénom<input name="authorName" minLength={2} maxLength={60} required /></label>
            <label>Ville ou commune<input name="city" minLength={2} maxLength={60} required /></label>
            <label>Produit
              <select name="productSlug" defaultValue="">
                <option value="">Avis général</option>
                {products.map((p) => <option key={p.id} value={p.slug}>{p.name}</option>)}
              </select>
            </label>
            <label>Note
              <select name="rating" defaultValue="5">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} / 5</option>)}</select>
            </label>
          </div>
          <label>Avis (tel que la cliente l’a écrit)<textarea name="comment" minLength={10} maxLength={1000} rows={3} required /></label>
          <div className="adm-row">
            <button className="adm-btn adm-btn--primary">Publier l’avis</button>
            <button type="button" className="adm-btn" onClick={() => setAdding(false)}>Annuler</button>
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <p className="adm-empty">Aucun avis pour le moment.</p>
      ) : (
        <div className="adm-reviews">
          {sorted.map((r) => (
            <article key={r.id} className={`adm-review ${r.published ? '' : 'is-pending'}`}>
              <header>
                <span className="adm-stars" aria-label={`${r.rating} sur 5`}>{'★'.repeat(r.rating)}<i>{'★'.repeat(5 - r.rating)}</i></span>
                {!r.published && <span className="adm-new">À valider</span>}
                <small>{fmtDate(r.createdAt)}</small>
              </header>
              <p>{r.comment}</p>
              <small><b>{r.authorName}</b> · {r.city}{r.productName ? ` · ${r.productName}` : ''}</small>
              <footer>
                {r.published ? (
                  <button type="button" className="adm-btn" onClick={() => void setPublished(r, false)}><EyeOff size={15} /> Retirer du site</button>
                ) : (
                  <button type="button" className="adm-btn adm-btn--primary" onClick={() => void setPublished(r, true)}><Check size={15} /> Publier</button>
                )}
                <button type="button" className="adm-btn adm-btn--ghost" onClick={() => void remove(r)}><Trash2 size={15} /> Supprimer</button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

/* ───────────────────────── BOUTIQUE (RÉGLAGES) ───────────────────────── */

function StorePanel({ settings, setSettings, notify, fail }: Omit<PanelProps, 'reload'> & { settings: ApiStoreSettings; setSettings: (s: ApiStoreSettings) => void }) {
  const [zones, setZones] = useState<(DeliveryZone & { key: number })[]>(() => settings.deliveryZones.map((z, i) => ({ ...z, key: i })))
  const [saving, setSaving] = useState(false)
  const nextKey = useRef(settings.deliveryZones.length)

  const updateZone = (key: number, patch: Partial<DeliveryZone>) => setZones((list) => list.map((z) => (z.key === key ? { ...z, ...patch } : z)))

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setSaving(true)
    try {
      const saved = await api<ApiStoreSettings>('/admin/store-settings', {
        method: 'PATCH',
        body: JSON.stringify({
          whatsappNumber: data.get('whatsappNumber'),
          waveNumber: data.get('waveNumber'),
          waveInstructions: data.get('waveInstructions'),
          deliveryCommunes: data.get('deliveryCommunes'),
          deliveryInfo: data.get('deliveryInfo'),
          legalInfo: data.get('legalInfo'),
          deliveryZones: zones.filter((z) => z.name.trim()).map(({ name, feeXof, delay }) => ({ name: name.trim(), feeXof, delay: delay || undefined })),
        }),
      })
      setSettings({ ...DEFAULT_SETTINGS, ...saved })
      notify('Informations de la boutique enregistrées. Elles s’affichent sur le site.')
    } catch (e) {
      fail(e, 'Enregistrement impossible.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="adm-form adm-store" onSubmit={save}>
      <section className="adm-card">
        <h2><MessageCircle size={18} /> Contact et paiement</h2>
        <div className="adm-grid-2">
          <label>Numéro WhatsApp de la boutique<input name="whatsappNumber" type="tel" defaultValue={`+${settings.whatsappNumber}`} required /><small className="adm-muted">Format +225 suivi de 10 chiffres.</small></label>
          <label>Numéro ou lien Wave<input name="waveNumber" defaultValue={settings.waveNumber} placeholder="+225 07 … ou lien de paiement" maxLength={120} /><small className="adm-muted">Affiché au client après sa commande.</small></label>
        </div>
        <label>Instructions de paiement Wave<textarea name="waveInstructions" defaultValue={settings.waveInstructions} rows={3} required /></label>
      </section>

      <section className="adm-card">
        <h2><ShoppingBag size={18} /> Livraison</h2>
        <label>Zones desservies (texte court)<input name="deliveryCommunes" defaultValue={settings.deliveryCommunes} maxLength={300} required /></label>
        <label>Informations de livraison<textarea name="deliveryInfo" defaultValue={settings.deliveryInfo} rows={2} required /></label>

        <div className="adm-zones">
          <div className="adm-label-row"><b>Frais par zone</b><small className="adm-muted">Laissez le prix vide si les frais sont à confirmer au cas par cas. 0 = livraison offerte.</small></div>
          {zones.length === 0 && <p className="adm-muted">Aucune zone : le client indiquera sa commune et vous lui communiquerez les frais.</p>}
          {zones.map((z) => (
            <div className="adm-zone" key={z.key}>
              <input aria-label="Nom de la zone" placeholder="Ex. Cocody" value={z.name} onChange={(e) => updateZone(z.key, { name: e.target.value })} maxLength={80} />
              <input aria-label="Frais en FCFA" placeholder="Frais (FCFA)" type="number" min="0" step="50" value={z.feeXof ?? ''} onChange={(e) => updateZone(z.key, { feeXof: e.target.value === '' ? null : Number(e.target.value) })} />
              <input aria-label="Délai" placeholder="Délai (ex. 24 h)" value={z.delay ?? ''} onChange={(e) => updateZone(z.key, { delay: e.target.value })} maxLength={60} />
              <button type="button" className="adm-icon" onClick={() => setZones((list) => list.filter((x) => x.key !== z.key))} aria-label={`Supprimer la zone ${z.name}`}><Trash2 size={15} /></button>
            </div>
          ))}
          <button type="button" className="adm-btn" onClick={() => setZones((list) => [...list, { key: nextKey.current++, name: '', feeXof: null, delay: '' }])}><Plus size={15} /> Ajouter une zone</button>
        </div>
      </section>

      <section className="adm-card">
        <h2><Store size={18} /> Informations légales</h2>
        <label>Identité de l’entreprise
          <textarea name="legalInfo" defaultValue={settings.legalInfo} rows={4} maxLength={1500} placeholder={'Raison sociale\nForme juridique et numéro RCCM\nAdresse du siège\nResponsable de la publication'} />
          <small className="adm-muted">Affichée dans les mentions légales du site.</small>
        </label>
      </section>

      <div className="adm-sticky-save">
        <button className="adm-btn adm-btn--primary" disabled={saving}><Save size={16} /> {saving ? 'Enregistrement…' : 'Enregistrer les informations'}</button>
      </div>
    </form>
  )
}
