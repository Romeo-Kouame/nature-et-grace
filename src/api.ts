const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '')

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.message || `La requête a échoué (${response.status}).`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export type ApiProduct = {
  id: string; slug: string; name: string; category: string; description: string; size: string
  priceXof: number | null; imageUrl: string | null; stock: number; active: boolean
}

export type ApiOrder = {
  id: string; customerName: string; phone: string; commune: string; address: string
  status: 'pending' | 'payment_review' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
  totalXof: number; createdAt: string
  items: { productName: string; productSize: string; quantity: number; unitPriceXof: number }[]
}

export type ApiStoreSettings = {
  whatsappNumber: string
  deliveryCommunes: string
  deliveryInfo: string
  waveInstructions: string
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
