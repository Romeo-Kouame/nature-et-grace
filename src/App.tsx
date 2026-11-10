import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowRight, Check, ChevronDown, Leaf, Menu, Minus, Plus, ShoppingBag, Sparkles, X } from 'lucide-react'
import { api, ApiProduct } from './api'

type Product = { id: string; name: string; category: string; size: string; price: number | null; description: string; tone: string; imageUrl?: string | null; badge?: string }
const products: Product[] = [
  { id: 'beurre-de-cacao-brut', name: 'Beurre de cacao brut', category: 'Beurre de cacao', size: '100 g', price: 1500, description: 'Un soin riche et nourrissant, idéal pour les peaux en quête de douceur.', tone: 'cocoa', badge: 'Le favori' },
  { id: 'chantilly-beurre-cacao', name: 'Chantilly de cacao', category: 'Beurre de cacao', size: '100 g', price: 2000, description: 'Une texture légère et onctueuse pour un rituel de soin tout en douceur.', tone: 'whip' },
  { id: 'savon-noir-cabosse-cacao', name: 'Savon noir de cabosse', category: 'Savons naturels', size: '100 g', price: 2000, description: 'Un savon inspiré du cacao, pour une peau propre et délicatement fraîche.', tone: 'soap' },
  { id: 'huile-de-coco', name: 'Huile de coco', category: 'Huiles naturelles', size: '100 ml', price: null, description: 'Une huile polyvalente pour nourrir la peau et prendre soin des cheveux.', tone: 'coconut', badge: 'Naturel' },
  { id: 'huile-de-neem', name: 'Huile de neem', category: 'Huiles naturelles', size: '100 ml', price: null, description: 'Une huile végétale appréciée dans les routines de soin traditionnelles.', tone: 'neem' },
  { id: 'huile-de-karite', name: 'Huile de karité', category: 'Huiles naturelles', size: '100 ml', price: null, description: 'La douceur du karité dans une huile facile à intégrer à votre rituel.', tone: 'shea' },
]
const defaultSettings = {
  whatsappNumber: '2250717684751',
  deliveryCommunes: 'Abidjan, Bouaké, Daloa et autres communes sur demande',
  deliveryInfo: 'Frais et délais communiqués avant la validation définitive.',
  waveInstructions: 'Les modalités de paiement Wave sont confirmées par la boutique.',
}
const money = (value: number | null) => value === null ? 'Prix à confirmer' : `${value.toLocaleString('fr-FR')} FCFA`

function App() {
  const [store, setStore] = useState(defaultSettings)
  const [waNumber, setWaNumber] = useState(defaultSettings.whatsappNumber)
  const [cart, setCart] = useState<Record<string, number>>({})
  const [catalog, setCatalog] = useState<Product[]>(products)
  const [category, setCategory] = useState('Tous')
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [orderMessage, setOrderMessage] = useState('')
  const [orderReference, setOrderReference] = useState('')
  useEffect(() => {
    api<ApiProduct[]>('/products').then((rows) => setCatalog(rows.map((row, index) => ({
      id: row.id, name: row.name, category: row.category, size: row.size, price: row.priceXof,
      description: row.description, imageUrl: row.imageUrl, tone: ['cocoa', 'whip', 'soap', 'coconut', 'neem', 'shea'][index % 6],
    })))).catch(() => undefined)
    api<typeof defaultSettings>('/store-settings').then((settings) => { setStore(settings); setWaNumber(settings.whatsappNumber) }).catch(() => undefined)
  }, [])
  const count = Object.values(cart).reduce((sum, qty) => sum + qty, 0)
  const total = useMemo(() => catalog.reduce((sum, item) => sum + (item.price ?? 0) * (cart[item.id] || 0), 0), [catalog, cart])
  const add = (id: string) => { setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 })); setNotice('Ajouté à votre panier'); window.setTimeout(() => setNotice(''), 1800) }
  const change = (id: string, delta: number) => setCart((prev) => { const next = { ...prev, [id]: (prev[id] || 0) + delta }; if (next[id] <= 0) delete next[id]; return next })
  const selected = catalog.filter((item) => cart[item.id])
  const visibleProducts = category === 'Tous' ? catalog : catalog.filter((item) => item.category === category)
  const whatsappOrder = () => {
    const lines = selected.map((item) => `• ${item.name} (${item.size}) x${cart[item.id]} — ${money(item.price === null ? null : item.price * cart[item.id])}`).join('\n')
    const message = `Bonjour NATURE & GRÂCE, je souhaite commander :\n${lines}\n\nTotal produits : ${money(total)}\nMerci de me préciser les frais et délais de livraison.`
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }
  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setOrderMessage('Envoi de la commande…')
    const form = new FormData(event.currentTarget)
    try {
      const order = await api<{ id: string }>('/orders', { method: 'POST', body: JSON.stringify({
        customerName: form.get('customerName'), phone: form.get('phone'), commune: form.get('commune'),
        address: form.get('address'), items: selected.map(({ id }) => ({ productId: id, quantity: cart[id] })),
      }) })
      const reference = order.id.slice(-6).toUpperCase()
      setOrderReference(reference)
      setOrderMessage(`Demande ${reference} reçue. La boutique confirmera les frais de livraison et le paiement Wave avant validation définitive.`)
      setCart({})
    } catch (error) {
      setOrderMessage(error instanceof Error ? error.message : 'Impossible d’enregistrer la commande. Réessayez sur WhatsApp.')
    }
  }

  return <>
    <div className="announcement"><span>La nature prend soin de vous</span><i /> Livraison disponible à {store.deliveryCommunes}</div>
    <header className="header">
      <button className="icon-button mobile-menu" aria-label="Ouvrir le menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      <a className="brand" href="#accueil" aria-label="Nature et Grâce, accueil"><img src="/logo.jpeg" alt="Logo NATURE & GRÂCE" /></a>
      <nav className={menuOpen ? 'nav open' : 'nav'}><a onClick={() => setMenuOpen(false)} href="#accueil">Accueil</a><a onClick={() => setMenuOpen(false)} href="#boutique">La boutique</a><a onClick={() => setMenuOpen(false)} href="#histoire">Notre histoire</a><a onClick={() => setMenuOpen(false)} href="#contact">Contact</a></nav>
      <button className="cart-button" onClick={() => setCartOpen(true)}><ShoppingBag size={18} /><span>Panier</span><b>{count}</b></button>
    </header>

    <main>
      <section className="hero" id="accueil">
        <div className="hero-copy"><div className="eyebrow"><span /> LE SOIN AU NATUREL, TOUT SIMPLEMENT</div><h1>La beauté<br />de <em>revenir</em><br />à l’essentiel.</h1><p>Des soins inspirés par la nature, pensés avec douceur et fabriqués pour prendre soin de vous.</p><div className="hero-actions"><a className="button primary" href="#boutique">Découvrir la boutique <ArrowRight size={17} /></a><a className="text-link" href="#histoire">Notre philosophie <ArrowDown size={15} /></a></div><div className="hero-proof"><div className="proof-icon"><Leaf size={17} /></div><span>Des ingrédients naturels<br /><b>choisis avec soin</b></span><span className="proof-divider" /><span>Une beauté simple<br /><b>et authentique</b></span></div></div>
        <div className="hero-art"><div className="sun-disc" /><div className="art-caption"><span>RITUEL NATUREL</span><b>Un moment<br />pour vous.</b></div><div className="floating-leaf leaf-one">✳</div><div className="floating-leaf leaf-two">✳</div><div className="product-jar"><div className="jar-lid" /><div className="jar-body"><span>NATURE<br /><small>& GRÂCE</small></span><i>BEURRE DE CACAO</i></div></div><div className="oil-bottle"><div className="bottle-cap" /><div className="bottle-body"><span>N&G</span></div></div><div className="art-stem stem-one"/><div className="art-stem stem-two"/><div className="hero-note"><Sparkles size={14} /> Inspiré par la nature</div></div>
        <a className="scroll-cue" href="#boutique"><span>FAITES DÉFILER</span><i /></a>
      </section>

      <section className="promise"><div><span>01</span><p>Des ingrédients<br /><b>d’origine naturelle</b></p></div><div><span>02</span><p>Le savoir-faire<br /><b>au cœur du soin</b></p></div><div><span>03</span><p>Votre bien-être<br /><b>en toute simplicité</b></p></div><div className="promise-mark"><Leaf size={20} /> NATURE & GRÂCE</div></section>

      <section className="shop-section" id="boutique"><div className="section-heading"><div><div className="eyebrow"><span /> LA BOUTIQUE</div><h2>Les essentiels<br /><em>de votre rituel.</em></h2></div><p>Découvrez nos soins naturels et trouvez les gestes qui vous ressemblent.<a href="#produits">Voir tous les produits <ArrowRight size={15} /></a></p></div>
        <div className="category-row">{[{ value: 'Tous', label: 'TOUS NOS SOINS' }, { value: 'Beurre de cacao', label: 'BEURRE DE CACAO' }, { value: 'Savons naturels', label: 'SAVONS' }, { value: 'Huiles naturelles', label: 'HUILES NATURELLES' }].map((item) => <button className={category === item.value ? 'selected' : ''} key={item.value} onClick={() => setCategory(item.value)}>{item.label}</button>)}<ChevronDown size={15} /></div>
        <div className="product-grid" id="produits">{visibleProducts.map((item, index) => <article className="product-card" key={item.id}><div className={`product-image ${item.tone} ${item.imageUrl ? 'has-photo' : ''}`}><img className="real-product-image" src={item.imageUrl ?? undefined} alt={item.name}/><div className="product-ornament">✳</div><div className="mini-product"><span>{item.category === 'Huiles naturelles' ? 'N&G' : 'NATURE'}<small>{item.category === 'Huiles naturelles' ? item.name.toUpperCase() : '& GRÂCE'}</small></span></div>{item.badge && <span className="badge">{item.badge}</span>}<span className="product-index">0{index + 1}</span></div><div className="product-info"><div><span className="product-category">{item.category}</span><h3>{item.name}</h3><p>{item.description}</p><span className="size">{item.size}</span></div><div className="product-buy"><b>{money(item.price)}</b><button onClick={() => add(item.id)} aria-label={`Ajouter ${item.name} au panier`}><Plus size={18} /></button></div></div></article>)}</div>
      </section>

      <section className="story" id="histoire"><div className="story-image"><div className="story-sun"/><span className="story-label">PRENDRE SOIN DE SOI,<br /><i>naturellement.</i></span><div className="story-leaf">✳</div></div><div className="story-copy"><div className="eyebrow"><span /> NOTRE PHILOSOPHIE</div><h2>La nature a<br />tant à <em>offrir.</em></h2><p>NATURE & GRÂCE est née d’une envie simple : vous proposer des soins inspirés de la richesse des ingrédients naturels, avec une attention particulière portée à la douceur et au bien-être.</p><p>Chaque produit vous invite à ralentir, à vous reconnecter à l’essentiel et à faire de votre routine un vrai moment pour vous.</p><a className="text-link dark" href="#contact">En savoir plus sur la marque <ArrowRight size={16} /></a></div></section>

      <section className="care"><div className="care-leaf"><Leaf size={24}/></div><div><span>VOTRE PROCHAIN RITUEL COMMENCE ICI</span><h2>Offrez à votre peau<br />un peu de <em>nature.</em></h2></div><a className="button light" href="#boutique">Explorer les soins <ArrowRight size={17}/></a><div className="care-flower">✳</div></section>
    </main>
    <footer id="contact"><div className="footer-main"><div className="footer-brand"><img src="/logo.jpeg" alt="NATURE & GRÂCE"/><p>Prenez soin de vous naturellement.</p></div><div><span className="footer-title">DÉCOUVRIR</span><a href="#boutique">La boutique</a><a href="#histoire">Notre histoire</a><a href="#contact">Nous contacter</a></div><div><span className="footer-title">BESOIN D’AIDE ?</span><p>Commandez ou posez vos questions<br />directement sur WhatsApp.</p><a className="footer-wa" href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer">+{waNumber} <ArrowRight size={14}/></a></div><div><span className="footer-title">LIVRAISON</span><p>{store.deliveryCommunes}</p><span className="delivery-note">{store.deliveryInfo}</span></div></div><div className="footer-bottom"><span>© 2026 NATURE & GRÂCE</span><span>FAIT AVEC SOIN EN CÔTE D’IVOIRE <span className="gold">✳</span></span><span>PRENEZ SOIN DE VOUS NATURELLEMENT</span></div></footer>
    {notice && <div className="toast"><Check size={16}/>{notice}</div>}
    {cartOpen && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false) }}><aside className="cart-drawer"><div className="drawer-heading"><div><span>VOTRE SÉLECTION</span><h2>Mon panier <i>({count})</i></h2></div><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Fermer"><X/></button></div>{selected.length === 0 ? <div className="empty-cart"><ShoppingBag size={32}/><p>{orderMessage || 'Votre panier attend ses premiers essentiels.'}</p>{orderReference && <a className="button primary" href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Bonjour, je souhaite transmettre la preuve Wave pour ma demande ${orderReference}.`)}`} target="_blank" rel="noreferrer">Envoyer ma preuve sur WhatsApp <ArrowRight size={16}/></a>}<button className="button secondary-empty" onClick={() => setCartOpen(false)}>Découvrir la boutique</button></div> : <><div className="cart-items">{selected.map((item) => <div className="cart-item" key={item.id}><div className={`cart-thumb ${item.tone}`}><span>N&G</span></div><div className="cart-item-copy"><b>{item.name}</b><small>{item.size} · {money(item.price)}</small><div className="quantity"><button onClick={() => change(item.id, -1)} aria-label="Retirer un article"><Minus size={13}/></button><span>{cart[item.id]}</span><button onClick={() => change(item.id, 1)} aria-label="Ajouter un article"><Plus size={13}/></button></div></div><strong>{money(item.price === null ? null : item.price * cart[item.id])}</strong></div>)}</div><div className="cart-summary"><p><span>Sous-total produits connus</span><b>{money(total)}</b></p><small>Prix des huiles et frais de livraison à confirmer avant validation.</small>{showOrderForm ? <form className="order-form" onSubmit={submitOrder}><label>Nom complet<input name="customerName" minLength={2} required /></label><label>Téléphone<input name="phone" type="tel" minLength={8} required /></label><label>Commune<input name="commune" placeholder="Ex. Cocody, Abidjan" required /></label><label>Adresse de livraison<textarea name="address" minLength={5} required /></label><button className="button primary checkout" type="submit">Envoyer ma demande <ArrowRight size={17}/></button><button className="order-back" type="button" onClick={() => setShowOrderForm(false)}>Retour au panier</button>{orderMessage && <p className="order-message">{orderMessage}</p>}</form> : <><button className="button primary checkout" onClick={() => { setShowOrderForm(true); setOrderMessage('') }}>Commander sur le site <ArrowRight size={17}/></button><button className="button whatsapp-checkout" onClick={whatsappOrder}>Continuer sur WhatsApp</button></>}<div className="wave-note"><span>W</span><p>Paiement par Wave<br /><small>{store.waveInstructions}</small></p></div></div></>}</aside></div>}
    <a className="floating-wa" href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" aria-label="Contacter la boutique sur WhatsApp">WA</a>
  </>
}
export default App




