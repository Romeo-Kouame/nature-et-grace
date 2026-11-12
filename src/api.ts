export const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '')

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const message = Array.isArray(body.message) ? body.message[0] : body.message
    throw new Error(message || `La requête a échoué (${response.status}).`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

/** Les photos téléversées sont stockées par l'API (« /images/… ») : on complète leur adresse. */
export function resolveImageUrl(url?: string | null): string | null {
  if (!url) return null
  if (url.startsWith('/images/') || url.startsWith('/admin/images/')) return `${API_BASE}${url}`
  return url
}

/**
 * Prépare une photo avant envoi : redimensionnée (1400 px maximum) et compressée en JPEG.
 * Une photo de téléphone de 5 Mo devient ainsi un fichier d'environ 200 à 400 ko.
 */
export async function imageFileToDataUrl(file: File, maxSize = 1400): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choisissez une image (photo JPEG, PNG ou WebP).')
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Cette image ne peut pas être lue. Essayez une photo JPEG ou PNG.'))
      el.src = url
    })
    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.85)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export type ApiProduct = {
  id: string; slug: string; name: string; category: string; description: string; size: string
  priceXof: number | null; imageUrl: string | null; stock: number; active: boolean
  gallery?: string[]; badge?: 'bestseller' | 'new' | null
}

export type OrderStatus = 'pending' | 'payment_review' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'

export type ApiOrder = {
  id: string; reference: string; customerName: string; phone: string; commune: string; address: string
  deliveryZone: string | null; deliveryFeeXof: number | null; deliveryNote: string | null
  status: OrderStatus; totalXof: number; createdAt: string; paymentProofUrl: string | null
  items: { productName: string; productSize: string; quantity: number; unitPriceXof: number }[]
}

export type CreatedOrder = {
  id: string; reference: string; status: OrderStatus; totalXof: number
  deliveryFeeXof: number | null; deliveryZone: string | null
}

export type DeliveryZone = { name: string; feeXof: number | null; delay?: string }

export type ApiStoreSettings = {
  whatsappNumber: string
  deliveryCommunes: string
  deliveryInfo: string
  waveInstructions: string
  waveNumber: string
  deliveryZones: DeliveryZone[]
  legalInfo: string
}

export type ApiReview = {
  id: string; authorName: string; city: string; productSlug: string | null; productName: string | null
  rating: number; comment: string; published: boolean; createdAt: string
}

export type BeautyAdvice = {
  diagnosis: string
  recommendedProductIds: string[]
  routineMorning: string[]
  routineEvening: string[]
  naturalTips: string[]
  whatsappSummary: string
  isDemo?: boolean
}

export type ProductDescriptionResult = {
  description: string
  suggestedTags?: string[]
  isDemo?: boolean
}

export type ApiCustomer = {
  id: string; name: string; phone: string; email: string | null
  commune: string | null; address: string | null; deliveryZone: string | null
}

export type CustomerOrder = {
  id: string; reference: string; status: OrderStatus; createdAt: string; totalXof: number
  deliveryZone: string | null; deliveryFeeXof: number | null; commune: string; address: string; proofSent: boolean
  items: { productName: string; productSize: string; quantity: number; unitPriceXof: number }[]
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente de confirmation',
  payment_review: 'Paiement en vérification',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}
