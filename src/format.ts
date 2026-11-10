/**
 * Formate un montant en FCFA : « 1 500 FCFA ».
 * On n'utilise pas toLocaleString('fr-FR') : il insère une espace fine (U+202F)
 * que certaines polices n'affichent pas, ce qui donnait « 1500 FCFA ».
 */
export const formatXof = (val: number | null | undefined) =>
  val === null || val === undefined
    ? 'Prix à confirmer'
    : `${Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')}\u00a0FCFA`
