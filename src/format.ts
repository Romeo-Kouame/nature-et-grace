/**
 * Formate un montant en FCFA : « 1 500 FCFA ».
 * On n'utilise pas toLocaleString('fr-FR') : il insère une espace fine (U+202F)
 * que certaines polices n'affichent pas, ce qui donnait « 1500 FCFA ».
 */
export const formatXof = (val: number | null | undefined) =>
  val === null || val === undefined
    ? 'Prix à confirmer'
    : `${Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')}\u00a0FCFA`

/** Texte sans accents ni majuscules, pour comparer « Karité » et « karite ». */
export const normalizeText = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/** Vrai si chaque mot de la recherche se trouve dans le texte (ordre libre, accents ignorés). */
export const matchesQuery = (text: string, query: string) => {
  const words = normalizeText(query).split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const haystack = normalizeText(text)
  return words.every((w) => haystack.includes(w))
}
