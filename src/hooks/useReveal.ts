import { useEffect } from 'react'

/**
 * Anime en fondu/glissement chaque élément portant l'attribut `data-reveal`
 * lorsqu'il entre dans l'écran. Observe aussi les éléments ajoutés après coup
 * (changement de page, filtres…). 100 % CSS côté rendu, aucune dépendance.
 */
export function useReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.08 },
    )

    const watch = (root: ParentNode) => {
      root.querySelectorAll?.('[data-reveal]:not(.is-visible)').forEach((el) => io.observe(el))
    }
    watch(document)

    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) =>
        m.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return
          if (node.matches('[data-reveal]:not(.is-visible)')) io.observe(node)
          watch(node)
        }),
      )
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])
}
