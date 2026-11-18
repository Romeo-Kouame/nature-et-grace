import { api, ProductDescriptionResult } from './api'

/** Rédaction d'une description produit par l'IA (administration uniquement). */
export async function requestProductDescription(dto: {
  name: string
  category?: string
  size?: string
  keyIngredients?: string
}): Promise<ProductDescriptionResult> {
  return api<ProductDescriptionResult>('/ai/generate-description', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
}
