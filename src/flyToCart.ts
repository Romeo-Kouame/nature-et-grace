/**
 * Petite animation d'ajout au panier : la photo du produit « vole » jusqu'au bouton Panier visible
 * (en-tête sur ordinateur, barre d'onglets sur téléphone), puis le bouton rebondit.
 * Rien ne se passe si l'utilisateur a demandé à réduire les animations.
 */
export function flyToCart(source: Element | null | undefined) {
  const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-cart-target]'))
  // Le bouton visible le plus bas à l'écran (onglet du bas sur téléphone, sinon l'en-tête)
  const target = targets
    .filter((el) => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
    })
    .sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top)[0]
  if (!target) return

  const bump = () => {
    target.classList.remove('ng-bump')
    void target.offsetWidth // relance l'animation
    target.classList.add('ng-bump')
    window.setTimeout(() => target.classList.remove('ng-bump'), 600)
  }

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const image = source?.querySelector('img, svg') as HTMLElement | null
  if (reduce || !image || typeof image.animate !== 'function') return bump()

  const from = image.getBoundingClientRect()
  const to = target.getBoundingClientRect()
  const size = Math.min(84, from.width)
  const ghost = image.cloneNode(true) as HTMLElement
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${from.left + from.width / 2 - size / 2}px`,
    top: `${from.top + from.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: 'cover',
    borderRadius: '50%',
    zIndex: '9999',
    pointerEvents: 'none',
    boxShadow: '0 10px 30px rgba(0,0,0,.25)',
    transform: 'none',
  })
  document.body.appendChild(ghost)
  const dx = to.left + to.width / 2 - (from.left + from.width / 2)
  const dy = to.top + to.height / 2 - (from.top + from.height / 2)
  const animation = ghost.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.35 - 60}px) scale(0.75)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0.4 },
    ],
    { duration: 700, easing: 'cubic-bezier(0.5, 0, 0.3, 1)' },
  )
  animation.onfinish = () => {
    ghost.remove()
    bump()
  }
}
