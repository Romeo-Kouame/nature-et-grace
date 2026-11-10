import { FormEvent, useEffect, useState } from 'react'
import { ArrowLeft, KeyRound, Leaf, LogOut, Package, Plus, RefreshCw, ShoppingBag } from 'lucide-react'
import { api, ApiOrder, ApiProduct, ApiStoreSettings } from './api'
import './admin.css'

const statuses: ApiOrder['status'][] = ['pending', 'payment_review', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled']
const statusNames: Record<ApiOrder['status'], string> = {
  pending: 'À confirmer', payment_review: 'Paiement à vérifier', confirmed: 'Confirmée',
  preparing: 'En préparation', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée',
}
const formatMoney = (value: number) => `${value.toLocaleString('fr-FR')} FCFA`
const defaultStoreSettings: ApiStoreSettings = {
  whatsappNumber: '2250717684751', deliveryCommunes: 'Abidjan, Bouaké, Daloa et autres communes sur demande',
  deliveryInfo: 'Frais et délais communiqués avant la validation définitive.', waveInstructions: 'Les modalités de paiement Wave sont confirmées par la boutique.',
}

export default function AdminApp() {
  const [email, setEmail] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [settings, setSettings] = useState<ApiStoreSettings>(defaultStoreSettings)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [passwordOpen, setPasswordOpen] = useState(false)

  const load = async () => {
    const [items, sales, store] = await Promise.all([api<ApiProduct[]>('/admin/products'), api<ApiOrder[]>('/admin/orders'), api<ApiStoreSettings>('/store-settings')])
    setProducts(items); setOrders(sales); setSettings(store); setLoggedIn(true)
  }
  useEffect(() => { void load().catch(() => setLoggedIn(false)) }, [])

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('')
    const data = new FormData(event.currentTarget)
    try {
      const result = await api<{ email: string }>('/admin/login', { method: 'POST', body: JSON.stringify({ email: data.get('email'), password: data.get('password') }) })
      setEmail(result.email); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Connexion impossible.') }
  }
  const addProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setMessage('')
    const form = event.currentTarget
    const data = new FormData(form)
    const price = data.get('priceXof')
    try {
      await api('/admin/products', { method: 'POST', body: JSON.stringify({
        name: data.get('name'), slug: data.get('slug'), category: data.get('category'), description: data.get('description'), size: data.get('size'),
        priceXof: price ? Number(price) : null, imageUrl: data.get('imageUrl') || null, stock: Number(data.get('stock')), active: data.get('active') === 'on',
      }) })
      setMessage('Produit ajouté.'); form.reset(); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Impossible d’ajouter le produit.') }
  }
  const updateProduct = async (event: FormEvent<HTMLFormElement>, item: ApiProduct) => {
    event.preventDefault(); setError('')
    const data = new FormData(event.currentTarget)
    const price = data.get('priceXof')
    try {
      await api(`/admin/products/${item.id}`, { method: 'PATCH', body: JSON.stringify({
        name: data.get('name'), slug: data.get('slug'), category: data.get('category'), description: data.get('description'), size: data.get('size'),
        priceXof: price ? Number(price) : null, imageUrl: data.get('imageUrl') || null, stock: Number(data.get('stock')), active: data.get('active') === 'on',
      }) })
      setMessage('Produit mis à jour.'); await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Impossible de modifier le produit.') }
  }
  const changeStatus = async (orderId: string, status: ApiOrder['status']) => {
    try { await api(`/admin/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); await load() }
    catch (e) { setError(e instanceof Error ? e.message : 'Impossible de modifier la commande.') }
  }
  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form)
    try {
      await api('/admin/password', { method: 'POST', body: JSON.stringify({ currentPassword: data.get('currentPassword'), newPassword: data.get('newPassword') }) })
      setMessage('Mot de passe modifié.'); setPasswordOpen(false); form.reset()
    } catch (e) { setError(e instanceof Error ? e.message : 'Impossible de modifier le mot de passe.') }
  }
  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setMessage('')
    const data = new FormData(event.currentTarget)
    try {
      const saved = await api<ApiStoreSettings>('/admin/store-settings', { method: 'PATCH', body: JSON.stringify({
        whatsappNumber: data.get('whatsappNumber'), deliveryCommunes: data.get('deliveryCommunes'),
        deliveryInfo: data.get('deliveryInfo'), waveInstructions: data.get('waveInstructions'),
      }) })
      setSettings(saved); setMessage('Coordonnées et modalités mises à jour.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Impossible d’enregistrer les paramètres.') }
  }
  const logout = async () => { await api('/admin/logout', { method: 'POST' }).catch(() => undefined); setLoggedIn(false) }

  if (!loggedIn) return <main className="admin-login"><a href="/" className="admin-back"><ArrowLeft size={15}/> Retour à la boutique</a><div className="admin-login-card"><img src="/logo.jpeg" alt="NATURE & GRÂCE"/><span>ESPACE PRIVÉ</span><h1>Bienvenue.</h1><p>Connectez-vous pour gérer votre boutique.</p><form onSubmit={login}><label>Adresse courriel<input name="email" type="email" autoComplete="username" onChange={(e) => setEmail(e.target.value)} required/></label><label>Mot de passe<input name="password" type="password" autoComplete="current-password" required/></label>{error && <div className="admin-alert error">{error}</div>}<button className="admin-primary">Se connecter</button></form></div></main>

  return <div className="admin-shell"><header className="admin-topbar"><a href="/" className="admin-brand"><img src="/logo.jpeg" alt="NATURE & GRÂCE"/><span>ADMINISTRATION</span></a><div><span className="admin-user">{email}</span><button className="admin-outline" onClick={() => setPasswordOpen(!passwordOpen)}><KeyRound size={15}/> Mot de passe</button><button className="admin-icon" onClick={load} aria-label="Actualiser"><RefreshCw size={16}/></button><button className="admin-icon" onClick={logout} aria-label="Déconnexion"><LogOut size={16}/></button></div></header>
    <main className="admin-content"><div className="admin-welcome"><div><div className="admin-kicker"><Leaf size={14}/> VOTRE BOUTIQUE, EN UN COUP D’ŒIL</div><h1>Bonjour, <em>{email.split('@')[0] || 'Bienvenue'}.</em></h1><p>Gérez les produits et suivez vos commandes NATURE & GRÂCE.</p></div><a href="/" className="admin-back"><ArrowLeft size={15}/> Voir la boutique</a></div>
      {error && <div className="admin-alert error">{error}</div>}{message && <div className="admin-alert success">{message}</div>}
      {passwordOpen && <form className="admin-password" onSubmit={changePassword}><h2>Changer le mot de passe</h2><label>Mot de passe actuel<input name="currentPassword" type="password" required/></label><label>Nouveau mot de passe (12 caractères minimum)<input name="newPassword" type="password" minLength={12} required/></label><button className="admin-primary">Enregistrer le nouveau mot de passe</button></form>}
      <div className="admin-stats"><div><span><Package size={16}/> PRODUITS</span><b>{products.length}</b><small>{products.filter((item) => item.active).length} visibles en boutique</small></div><div><span><ShoppingBag size={16}/> COMMANDES</span><b>{orders.length}</b><small>{orders.filter((order) => order.status === 'pending').length} à confirmer</small></div><div><span><Leaf size={16}/> STOCK</span><b>{products.reduce((sum, item) => sum + item.stock, 0)}</b><small>unités en inventaire</small></div></div>
      <section className="admin-panel"><div className="admin-panel-heading"><div><span>INFORMATIONS DE LA BOUTIQUE</span><h2>Livraison, Wave & contact</h2></div></div><form className="admin-product-form store-settings-form" onSubmit={saveSettings}><label className="wide">WhatsApp (indicatif +225)<input name="whatsappNumber" type="tel" defaultValue={`+${settings.whatsappNumber}`} required/></label><label className="wide">Communes desservies<input name="deliveryCommunes" defaultValue={settings.deliveryCommunes} required/></label><label className="wide">Frais et délais de livraison<textarea name="deliveryInfo" defaultValue={settings.deliveryInfo} required/></label><label className="wide">Instructions de paiement Wave<textarea name="waveInstructions" defaultValue={settings.waveInstructions} required/></label><button className="admin-primary">Enregistrer les informations</button></form></section>
      <section className="admin-panel"><div className="admin-panel-heading"><div><span>CATALOGUE</span><h2>Vos produits</h2></div><a href="#ajouter-produit" className="admin-add"><Plus size={15}/> Ajouter un produit</a></div><div className="admin-product-list">{products.map((item) => <details className="admin-product" key={item.id}><summary><span className={`admin-status ${item.active ? 'active' : ''}`}/><b>{item.name}</b><span>{item.category}</span><span>{item.priceXof === null ? 'Prix à confirmer' : formatMoney(item.priceXof)}</span><span>Stock : {item.stock}</span></summary><form onSubmit={(event) => updateProduct(event, item)} className="admin-product-form"><label>Nom<input name="name" defaultValue={item.name} required/></label><label>Identifiant URL<input name="slug" defaultValue={item.slug} required/></label><label>Catégorie<input name="category" defaultValue={item.category} required/></label><label>Contenance<input name="size" defaultValue={item.size} required/></label><label>Prix (FCFA)<input name="priceXof" type="number" min="0" defaultValue={item.priceXof ?? ''}/></label><label>Stock<input name="stock" type="number" min="0" defaultValue={item.stock} required/></label><label className="wide">Description<textarea name="description" defaultValue={item.description} required/></label><label className="wide">URL de la photo<input name="imageUrl" type="url" defaultValue={item.imageUrl ?? ''} placeholder="https://…"/></label><label className="admin-check"><input name="active" type="checkbox" defaultChecked={item.active}/> Visible sur la boutique</label><button className="admin-primary">Enregistrer</button></form></details>)}</div>
        <form className="admin-new-product" id="ajouter-produit" onSubmit={addProduct}><h3><Plus size={16}/> Ajouter au catalogue</h3><div className="admin-product-form"><label>Nom<input name="name" required/></label><label>Identifiant URL<input name="slug" placeholder="huile-de-coco" required/></label><label>Catégorie<input name="category" placeholder="Huiles naturelles" required/></label><label>Contenance<input name="size" placeholder="100 ml" required/></label><label>Prix (FCFA)<input name="priceXof" type="number" min="0"/></label><label>Stock<input name="stock" type="number" min="0" defaultValue="0" required/></label><label className="wide">Description<textarea name="description" required/></label><label className="wide">URL de la photo<input name="imageUrl" type="url"/></label><label className="admin-check"><input name="active" type="checkbox"/> Visible sur la boutique</label><button className="admin-primary">Ajouter le produit</button></div></form>
      </section>
      <section className="admin-panel"><div className="admin-panel-heading"><div><span>VENTES</span><h2>Commandes récentes</h2></div></div>{orders.length === 0 ? <p className="admin-empty">Les nouvelles commandes apparaîtront ici.</p> : <div className="admin-orders">{orders.map((order) => <article className="admin-order" key={order.id}><div className="order-meta"><b>#{order.id.slice(-7).toUpperCase()}</b><span>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</span><strong>{formatMoney(order.totalXof)}</strong></div><div className="order-customer"><b>{order.customerName}</b><span>{order.phone} · {order.commune}</span><small>{order.address}</small><p>{order.items.map((item) => `${item.productName} × ${item.quantity}`).join(' · ')}</p></div><select aria-label="Statut de commande" value={order.status} onChange={(event) => changeStatus(order.id, event.target.value as ApiOrder['status'])}>{statuses.map((status) => <option value={status} key={status}>{statusNames[status]}</option>)}</select></article>)}</div>}</section>
    </main>
  </div>
}

