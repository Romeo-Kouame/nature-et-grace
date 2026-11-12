import React, { FormEvent, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Copy, ImageUp, MessageCircle, Minus, Package, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api, CreatedOrder, imageFileToDataUrl } from '../api'
import { formatXof } from '../format'

type CustomerDetails = { customerName: string; phone: string; deliveryZone: string; commune: string; address: string }
import ProductVisual from './ProductVisual'

type Step = 'cart' | 'details' | 'done'
type LastOrder = CreatedOrder & { customerName: string; createdAt: string; proofSent?: boolean }

const OTHER_ZONE = '__autre__'

export const CartDrawer: React.FC = () => {
  const {
    cartOpen, setCartOpen, products, cart, cartCount, cartTotal, changeQuantity, removeFromCart, clearCart,
    navigate, catalogLive, settings, waLink, user, setUser, goToLogin, showToast, maxQuantity,
  } = useApp()
  const [step, setStep] = useState<Step>('cart')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(null)
  const [proofState, setProofState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [proofMessage, setProofMessage] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const zones = settings.deliveryZones
  const [zone, setZone] = useState<string>(user?.deliveryZone || '')
  useEffect(() => {
    if (!zone && zones.length) setZone(zones[0].name)
  }, [zones, zone])

  const items = products.filter((p) => cart[p.id])
  const selectedZone = zones.find((z) => z.name === zone)
  const deliveryFee = selectedZone ? selectedZone.feeXof : null

  // Après une commande, le panier rouvert affiche d'abord la confirmation
  useEffect(() => {
    if (cartOpen) setStep(items.length === 0 && lastOrder ? 'done' : 'cart')
    setError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartOpen])

  // Le panier est réservé aux clients connectés (sécurité si on l'ouvre autrement que par le bouton)
  useEffect(() => {
    if (cartOpen && !user) goToLogin({ openCart: true })
  }, [cartOpen, user, goToLogin])

  useEffect(() => {
    if (!cartOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCartOpen(false)
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [cartOpen, setCartOpen])

  if (!cartOpen || !user) return null

  const close = () => setCartOpen(false)

  const whatsappOrderText = (details?: Partial<CustomerDetails>) => {
    const lines = items
      .map((item) => `• ${item.name} (${item.size}) x${cart[item.id]} — ${formatXof(item.price === null ? null : item.price * cart[item.id])}`)
      .join('\n')
    const who = details?.customerName
      ? `\nNom : ${details.customerName}\nTéléphone : ${details.phone}\nLivraison : ${[details.deliveryZone, details.commune].filter(Boolean).join(' — ')}\nAdresse : ${details.address}\n`
      : ''
    return `Bonjour NATURE & GRÂCE, je souhaite commander :\n\n${lines}\n\nTotal produits : ${formatXof(cartTotal)}${who}\nMerci de me confirmer les frais et le délai de livraison.`
  }

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const details: CustomerDetails = {
      customerName: String(form.get('customerName') || '').trim(),
      phone: String(form.get('phone') || '').trim(),
      deliveryZone: zone === OTHER_ZONE ? '' : zone,
      commune: String(form.get('commune') || '').trim(),
      address: String(form.get('address') || '').trim(),
    }
    const note = String(form.get('deliveryNote') || '').trim()
    const saveAddress = form.get('saveAddress') === 'on'

    if (!catalogLive || items.some((p) => !p.apiId)) {
      setError('La commande en ligne est momentanément indisponible. Envoyez-la sur WhatsApp : votre panier et vos coordonnées y sont repris.')
      return
    }
    setSending(true)
    setError('')
    try {
      const order = await api<CreatedOrder>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerName: details.customerName,
          phone: details.phone,
          commune: details.commune,
          address: details.address,
          deliveryZone: details.deliveryZone || undefined,
          deliveryNote: note || undefined,
          saveAddress,
          items: items.map((p) => ({ productId: p.apiId, quantity: cart[p.id] })),
        }),
      })
      const saved: LastOrder = { ...order, customerName: details.customerName, createdAt: new Date().toISOString() }
      setLastOrder(saved)
      if (saveAddress) setUser({ ...user, commune: details.commune, address: details.address, deliveryZone: details.deliveryZone || null })
      setProofState('idle')
      setProofMessage('')
      clearCart()
      setStep('done')
    } catch (err) {
      setError(`${err instanceof Error ? err.message : 'La commande n’a pas pu être envoyée.'} Vous pouvez aussi la finaliser sur WhatsApp.`)
    } finally {
      setSending(false)
    }
  }

  const uploadProof = async (file: File | undefined) => {
    if (!file || !lastOrder) return
    setProofState('sending')
    setProofMessage('')
    try {
      const image = await imageFileToDataUrl(file)
      const res = await api<{ message: string }>(`/orders/${lastOrder.id}/proof`, { method: 'POST', body: JSON.stringify({ image }) })
      setProofState('sent')
      setProofMessage(res.message)
      const updated = { ...lastOrder, proofSent: true }
      setLastOrder(updated)
    } catch (err) {
      setProofState('error')
      setProofMessage(err instanceof Error ? err.message : 'L’envoi a échoué.')
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast('Copié')
    } catch {
      /* presse-papiers indisponible */
    }
  }

  const orderTotal = lastOrder ? lastOrder.totalXof + (lastOrder.deliveryFeeXof ?? 0) : 0

  return (
    <div className="ng-cart-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <aside className="ng-cart" role="dialog" aria-modal="true" aria-label="Panier">
        <header className="ng-cart-head">
          {step === 'details' ? (
            <button type="button" className="ng-icon-btn" onClick={() => setStep('cart')} aria-label="Retour au panier">
              <ArrowLeft size={20} />
            </button>
          ) : null}
          <div>
            <span className="ng-eyebrow">{step === 'done' ? 'COMMANDE ENVOYÉE' : step === 'details' ? 'ÉTAPE 2 SUR 2' : 'VOTRE SÉLECTION'}</span>
            <h2>
              {step === 'done' ? 'Merci !' : step === 'details' ? 'Livraison' : 'Mon panier'}
              {step === 'cart' && cartCount > 0 && <small> ({cartCount})</small>}
            </h2>
          </div>
          <button type="button" className="ng-icon-btn" onClick={close} aria-label="Fermer le panier">
            <X size={20} />
          </button>
        </header>

        {/* ÉTAPE 3 : CONFIRMATION */}
        {step === 'done' && lastOrder && (
          <div className="ng-cart-body">
            <div className="ng-cart-success">
              <span className="ng-cart-success-ico">
                <Check size={26} />
              </span>
              <p>
                Votre demande de commande est enregistrée, {lastOrder.customerName.split(' ')[0]}. La boutique vous contacte
                sur WhatsApp pour confirmer la livraison.
              </p>
              <button type="button" className="ng-cart-ref" onClick={() => copy(lastOrder.reference)} title="Copier la référence">
                Référence <b>{lastOrder.reference}</b> <Copy size={14} />
              </button>
            </div>

            <dl className="ng-cart-totals">
              <div>
                <dt>Produits</dt>
                <dd>{formatXof(lastOrder.totalXof)}</dd>
              </div>
              <div>
                <dt>Livraison{lastOrder.deliveryZone ? ` (${lastOrder.deliveryZone})` : ''}</dt>
                <dd>{lastOrder.deliveryFeeXof === null ? 'À confirmer' : lastOrder.deliveryFeeXof === 0 ? 'Offerte' : formatXof(lastOrder.deliveryFeeXof)}</dd>
              </div>
              <div className="total">
                <dt>{lastOrder.deliveryFeeXof === null ? 'Total hors livraison' : 'Total à payer'}</dt>
                <dd>{formatXof(orderTotal)}</dd>
              </div>
            </dl>

            <section className="ng-wave-box">
              <div className="ng-wave-head">
                <span className="ng-wave-logo">W</span>
                <b>Paiement Wave</b>
              </div>
              <p>{settings.waveInstructions}</p>
              {settings.waveNumber && (
                <button type="button" className="ng-wave-number" onClick={() => copy(settings.waveNumber)}>
                  {settings.waveNumber} <Copy size={14} />
                </button>
              )}
              <p className="ng-form-hint">Indiquez la référence {lastOrder.reference} dans votre paiement si possible. La boutique ne vous demandera jamais votre code secret.</p>

              {proofState === 'sent' || lastOrder.proofSent ? (
                <p className="ng-proof-ok" role="status">
                  <Check size={16} /> {proofMessage || 'Preuve de paiement reçue.'}
                </p>
              ) : (
                <>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => void uploadProof(e.target.files?.[0])}
                  />
                  <button type="button" className="ng-btn ng-btn--primary" onClick={() => fileInput.current?.click()} disabled={proofState === 'sending'}>
                    <ImageUp size={17} /> {proofState === 'sending' ? 'Envoi de la capture…' : 'Envoyer la capture du paiement'}
                  </button>
                  {proofState === 'error' && (
                    <p className="ng-form-error" role="alert">
                      {proofMessage}
                    </p>
                  )}
                </>
              )}
              <a
                className="ng-btn ng-btn--wa"
                href={waLink(`Bonjour NATURE & GRÂCE, je vous écris au sujet de ma commande ${lastOrder.reference}.`)}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={17} /> Écrire à la boutique
              </a>
            </section>

            <div className="ng-cart-links">
              <button
                type="button"
                className="ng-btn ng-btn--ghost ng-btn--block"
                onClick={() => {
                  close()
                  navigate('/commandes')
                }}
              >
                <Package size={17} /> Suivre ma commande
              </button>
              <button
                type="button"
                className="ng-cart-link"
                onClick={() => {
                  close()
                  navigate('/boutique')
                }}
              >
                Continuer mes achats
              </button>
              <button
                type="button"
                className="ng-cart-link ng-cart-link--muted"
                onClick={() => {
                  setLastOrder(null)
                  setStep('cart')
                }}
              >
                Masquer ce récapitulatif
              </button>
            </div>
          </div>
        )}

        {/* PANIER VIDE */}
        {step !== 'done' && items.length === 0 && (
          <div className="ng-cart-body ng-cart-empty">
            <span className="ng-empty-ico">
              <ShoppingBag size={28} />
            </span>
            <h3>Votre panier est vide</h3>
            <p>Ajoutez vos soins préférés pour commander sur le site ou par WhatsApp.</p>
            <button
              type="button"
              className="ng-btn ng-btn--primary"
              onClick={() => {
                close()
                navigate('/boutique')
              }}
            >
              Découvrir la boutique <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ÉTAPE 1 : PANIER */}
        {step === 'cart' && items.length > 0 && (
          <>
            <div className="ng-cart-body">
              <ul className="ng-cart-items">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="ng-cart-thumb"
                      onClick={() => {
                        close()
                        navigate(`/produit/${item.id}`)
                      }}
                      aria-label={`Voir ${item.name}`}
                    >
                      <ProductVisual product={item} size="thumb" />
                    </button>
                    <div className="ng-cart-item-info">
                      <b>{item.name}</b>
                      <small>
                        {item.size} · {formatXof(item.price)}
                      </small>
                      <div className="ng-qty ng-qty--sm" role="group" aria-label={`Quantité de ${item.name}`}>
                        <button type="button" onClick={() => changeQuantity(item.id, -1)} aria-label="Retirer un article">
                          <Minus size={14} />
                        </button>
                        <span>{cart[item.id]}</span>
                        <button type="button" onClick={() => changeQuantity(item.id, 1)} aria-label="Ajouter un article" disabled={cart[item.id] >= maxQuantity(item)}>
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="ng-cart-item-end">
                      <strong>{formatXof(item.price === null ? null : item.price * cart[item.id])}</strong>
                      <button type="button" className="ng-cart-remove" onClick={() => removeFromCart(item.id)} aria-label={`Supprimer ${item.name} du panier`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <footer className="ng-cart-foot">
              <p className="ng-cart-subtotal">
                <span>Sous-total produits</span>
                <b>{formatXof(cartTotal)}</b>
              </p>
              <p className="ng-form-hint">Frais de livraison indiqués à l’étape suivante et confirmés par la boutique avant paiement.</p>
              <button type="button" className="ng-btn ng-btn--primary ng-btn--block" onClick={() => setStep('details')}>
                Commander sur le site <ArrowRight size={17} />
              </button>
              <a className="ng-btn ng-btn--wa ng-btn--block" href={waLink(whatsappOrderText())} target="_blank" rel="noreferrer">
                <MessageCircle size={17} /> Envoyer mon panier sur WhatsApp
              </a>
              <div className="ng-wave-note">
                <span className="ng-wave-logo">W</span>
                <span>Paiement par Wave après confirmation de la boutique.</span>
              </div>
            </footer>
          </>
        )}

        {/* ÉTAPE 2 : COORDONNÉES */}
        {step === 'details' && items.length > 0 && (
          <form className="ng-cart-form" onSubmit={submitOrder}>
            <div className="ng-cart-body ng-form">
              <label>
                Nom complet
                <input name="customerName" defaultValue={user.name} autoComplete="name" minLength={2} maxLength={80} required />
              </label>
              <label>
                Téléphone WhatsApp
                <input name="phone" type="tel" defaultValue={user.phone.startsWith('225') ? user.phone.slice(3) : user.phone} placeholder="07 00 00 00 00" autoComplete="tel" minLength={8} maxLength={25} required />
              </label>
              {zones.length > 0 && (
                <label>
                  Zone de livraison
                  <select value={zone} onChange={(e) => setZone(e.target.value)}>
                    {zones.map((z) => (
                      <option key={z.name} value={z.name}>
                        {z.name} — {z.feeXof === null ? 'frais à confirmer' : z.feeXof === 0 ? 'livraison offerte' : formatXof(z.feeXof)}
                        {z.delay ? ` · ${z.delay}` : ''}
                      </option>
                    ))}
                    <option value={OTHER_ZONE}>Autre ville ou commune — frais à confirmer</option>
                  </select>
                </label>
              )}
              <label>
                {zones.length > 0 ? 'Commune et quartier' : 'Commune de livraison'}
                <input name="commune" defaultValue={user.commune ?? ''} placeholder="Ex. Cocody Angré, Yopougon, Bouaké…" minLength={2} maxLength={80} required />
              </label>
              <label>
                Adresse précise
                <textarea name="address" defaultValue={user.address ?? ''} placeholder="Rue, carrefour, repère…" minLength={5} maxLength={400} rows={3} required />
              </label>
              <label>
                <span>
                  Précision pour la livraison <span className="ng-optional">(facultatif)</span>
                </span>
                <input name="deliveryNote" placeholder="Ex. joignable après 17 h" maxLength={400} />
              </label>
              <label className="ng-check">
                <input type="checkbox" name="saveAddress" defaultChecked={!user.address} />
                <span>Enregistrer cette adresse dans mon compte</span>
              </label>
            </div>
            <footer className="ng-cart-foot">
              <dl className="ng-cart-totals">
                <div>
                  <dt>Produits</dt>
                  <dd>{formatXof(cartTotal)}</dd>
                </div>
                <div>
                  <dt>Livraison</dt>
                  <dd>{deliveryFee === null ? 'À confirmer' : deliveryFee === 0 ? 'Offerte' : formatXof(deliveryFee)}</dd>
                </div>
                <div className="total">
                  <dt>{deliveryFee === null ? 'Total hors livraison' : 'Total'}</dt>
                  <dd>{formatXof(cartTotal + (deliveryFee ?? 0))}</dd>
                </div>
              </dl>
              {error && (
                <p className="ng-form-error" role="alert">
                  {error}
                </p>
              )}
              <button className="ng-btn ng-btn--primary ng-btn--block" type="submit" disabled={sending}>
                {sending ? 'Envoi en cours…' : 'Envoyer ma commande'} <ArrowRight size={17} />
              </button>
              {error && (
                <button
                  type="button"
                  className="ng-btn ng-btn--wa ng-btn--block"
                  onClick={(e) => {
                    const form = (e.currentTarget.closest('form') as HTMLFormElement) ?? undefined
                    const data = form ? new FormData(form) : null
                    const details = data
                      ? {
                          customerName: String(data.get('customerName') || ''),
                          phone: String(data.get('phone') || ''),
                          deliveryZone: zone === OTHER_ZONE ? '' : zone,
                          commune: String(data.get('commune') || ''),
                          address: String(data.get('address') || ''),
                        }
                      : undefined
                    window.open(waLink(whatsappOrderText(details)), '_blank', 'noopener,noreferrer')
                  }}
                >
                  <MessageCircle size={17} /> Finaliser sur WhatsApp
                </button>
              )}
              <p className="ng-form-hint">
                En envoyant votre commande, vous acceptez les{' '}
                <a
                  href="/cgv"
                  onClick={(e) => {
                    e.preventDefault()
                    close()
                    navigate('/cgv')
                  }}
                >
                  conditions de vente
                </a>
                .
              </p>
            </footer>
          </form>
        )}
      </aside>
    </div>
  )
}

export default CartDrawer
