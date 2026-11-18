import React, { useEffect, useRef, useState } from 'react'
import { ArrowUp, MessageCircle, RotateCcw, ShoppingCart, Sparkles, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api } from '../api'
import { formatXof } from '../format'
import ProductVisual from './ProductVisual'

type Message = { role: 'user' | 'assistant'; text: string; productIds?: string[]; error?: boolean }
type ChatReply = { reply: string; productIds: string[]; demo: boolean }

const STORAGE_KEY = 'ng_chat'
const MAX_LENGTH = 1000
const WELCOME: Message = {
  role: 'assistant',
  text: 'Bonjour ! Je suis la conseillère de Nature & Grâce. Posez-moi vos questions sur nos soins, leur utilisation, les prix, la livraison ou le paiement Wave.',
}

function readStored(): Message[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Message[]) : []
    return Array.isArray(parsed) ? parsed.filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string') : []
  } catch {
    return []
  }
}

/** Texte de l'IA : paragraphes, et listes pour les lignes qui commencent par « - » (aucun HTML injecté) */
const RichText: React.FC<{ text: string }> = ({ text }) => {
  const blocks: React.ReactNode[] = []
  let list: string[] = []
  const flush = () => {
    if (list.length) blocks.push(<ul key={`l${blocks.length}`}>{list.map((item, i) => <li key={i}>{item}</li>)}</ul>)
    list = []
  }
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (/^[-•*]\s+/.test(trimmed)) list.push(trimmed.replace(/^[-•*]\s+/, ''))
    else {
      flush()
      if (trimmed) blocks.push(<p key={`p${blocks.length}`}>{trimmed.replace(/\*\*/g, '')}</p>)
    }
  }
  flush()
  return <>{blocks}</>
}

/**
 * Chat de la conseillère IA, ouvert par la bulle en bas à droite ou par les boutons « Conseil IA ».
 * La conversation est gardée le temps de l'onglet (sessionStorage) ; les réponses viennent de l'API,
 * qui s'appuie uniquement sur le catalogue et les réglages réels de la boutique.
 */
export const ChatWidget: React.FC = () => {
  const { advisorOpen, setAdvisorOpen, products, currentPath, navigate, addToCart, waLink } = useApp()
  const [messages, setMessages] = useState<Message[]>(readStored)
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const productSlug = currentPath.startsWith('/produit/') ? decodeURIComponent(currentPath.slice('/produit/'.length).split('/')[0]) : undefined
  const currentProduct = products.find((p) => p.id === productSlug)

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)))
    } catch {
      /* stockage indisponible : la conversation reste en mémoire */
    }
  }, [messages])

  // Ouverture : curseur dans le champ, fil en bas ; Échap ferme
  useEffect(() => {
    if (!advisorOpen) return
    const id = window.setTimeout(() => inputRef.current?.focus(), 60)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAdvisorOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('keydown', onKey)
    }
  }, [advisorOpen, setAdvisorOpen])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, pending, advisorOpen])

  const send = async (text: string) => {
    const question = text.trim().slice(0, MAX_LENGTH)
    if (!question || pending) return
    const history: Message[] = [...messages.filter((m) => !m.error), { role: 'user', text: question }]
    setMessages(history)
    setDraft('')
    setPending(true)
    try {
      const res = await api<ChatReply>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: history.map(({ role, text: t }) => ({ role, text: t })), productSlug }),
      })
      setMessages((m) => [...m, { role: 'assistant', text: res.reply, productIds: res.productIds }])
    } catch (err) {
      const offline = err instanceof TypeError
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          error: true,
          text: offline
            ? 'Je n’arrive pas à joindre la boutique pour le moment. Réessayez dans un instant, ou écrivez-nous sur WhatsApp.'
            : (err as Error).message || 'Une erreur est survenue. Réessayez dans un instant.',
        },
      ])
    } finally {
      setPending(false)
    }
  }

  const retry = () => {
    const lastQuestion = [...messages].reverse().find((m) => m.role === 'user')
    if (!lastQuestion) return
    setMessages((m) => m.filter((x) => !x.error).slice(0, -1))
    void send(lastQuestion.text)
  }

  const reset = () => {
    setMessages([])
    setDraft('')
    inputRef.current?.focus()
  }

  const suggestions = currentProduct
    ? [`${currentProduct.name} convient-il à ma peau ?`, 'Comment l’utiliser ?', 'Combien coûte la livraison ?']
    : ['Quel soin pour une peau sèche ?', 'Combien coûte la livraison ?', 'Comment payer avec Wave ?', 'Composez-moi un rituel matin et soir']

  const shown = messages.length ? messages : [WELCOME]

  return (
    <>
      {!advisorOpen && (
        <button type="button" className="ng-chat-launcher" onClick={() => setAdvisorOpen(true)} aria-label="Poser une question à la conseillère IA">
          <Sparkles size={20} />
          <span>Une question ?</span>
        </button>
      )}

      {advisorOpen && (
        <section className="ng-chat" role="dialog" aria-modal="false" aria-label="Conseillère Nature & Grâce">
          <header className="ng-chat-head">
            <span className="ng-chat-avatar" aria-hidden="true">
              <Sparkles size={18} />
            </span>
            <div className="ng-chat-title">
              <b>Conseillère beauté</b>
              <small>
                <i aria-hidden="true" /> Nature &amp; Grâce · assistante IA
              </small>
            </div>
            <a className="ng-chat-icon" href={waLink()} target="_blank" rel="noreferrer" aria-label="Écrire à la boutique sur WhatsApp" title="Parler à la boutique sur WhatsApp">
              <MessageCircle size={18} />
            </a>
            {messages.length > 0 && (
              <button type="button" className="ng-chat-icon" onClick={reset} aria-label="Nouvelle conversation" title="Nouvelle conversation">
                <RotateCcw size={17} />
              </button>
            )}
            <button type="button" className="ng-chat-icon" onClick={() => setAdvisorOpen(false)} aria-label="Fermer le chat">
              <X size={19} />
            </button>
          </header>

          <div className="ng-chat-list" ref={listRef} aria-live="polite">
            {shown.map((m, i) => (
              <div key={i} className={`ng-chat-msg ng-chat-msg--${m.role} ${m.error ? 'is-error' : ''}`}>
                <div className="ng-chat-bubble">
                  {m.role === 'assistant' ? <RichText text={m.text} /> : <p>{m.text}</p>}
                  {m.error && (
                    <button type="button" className="ng-chat-retry" onClick={retry}>
                      <RotateCcw size={14} /> Réessayer
                    </button>
                  )}
                </div>
                {m.productIds && m.productIds.length > 0 && (
                  <div className="ng-chat-products">
                    {m.productIds.map((id) => {
                      const p = products.find((x) => x.id === id)
                      if (!p) return null
                      const canAdd = p.price !== null
                      return (
                        <article key={id} className="ng-chat-product">
                          <button type="button" className="ng-chat-product-main" onClick={() => navigate(`/produit/${p.id}`)}>
                            <span className="ng-chat-product-img">
                              <ProductVisual product={p} />
                            </span>
                            <span>
                              <b>{p.name}</b>
                              <small>{formatXof(p.price)}</small>
                            </span>
                          </button>
                          {canAdd && (
                            <button type="button" className="ng-chat-add" onClick={() => addToCart(p.id, 1)} aria-label={`Ajouter ${p.name} au panier`} title="Ajouter au panier">
                              <ShoppingCart size={16} />
                            </button>
                          )}
                        </article>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
            {pending && (
              <div className="ng-chat-msg ng-chat-msg--assistant">
                <div className="ng-chat-bubble ng-chat-typing" aria-label="La conseillère écrit…">
                  <span /><span /><span />
                </div>
              </div>
            )}
            {!messages.length && (
              <div className="ng-chat-suggest">
                {suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => void send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            className="ng-chat-form"
            onSubmit={(e) => {
              e.preventDefault()
              void send(draft)
            }}
          >
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void send(draft)
                }
              }}
              rows={1}
              placeholder="Écrivez votre question…"
              aria-label="Votre question"
              maxLength={MAX_LENGTH}
            />
            <button type="submit" disabled={pending || !draft.trim()} aria-label="Envoyer">
              <ArrowUp size={18} />
            </button>
          </form>
          <p className="ng-chat-note">Réponses générées par IA à partir des informations de la boutique. Pour une commande, la boutique confirme tout sur WhatsApp.</p>
        </section>
      )}
    </>
  )
}

export default ChatWidget
