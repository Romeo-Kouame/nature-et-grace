import { api, BeautyAdvice, ProductDescriptionResult } from './api'

export type ClientCatalogProduct = {
  id: string
  name: string
  category: string
  description: string
  price: number | null
  size: string
}

/**
 * Demande un diagnostic et une routine personnalisée au Conseiller Beauté.
 * La clé Gemini reste sur le serveur : le navigateur n'appelle jamais Google directement.
 * Si l'API ne répond pas, un conseil de démonstration est composé à partir du catalogue affiché.
 */
export async function requestBeautyAdvice(dto: {
  message: string
  skinType?: string
  catalogProducts: ClientCatalogProduct[]
}): Promise<BeautyAdvice> {
  const available = new Set(dto.catalogProducts.map((p) => p.id))
  try {
    const advice = await api<BeautyAdvice>('/ai/advisor', {
      method: 'POST',
      body: JSON.stringify({ message: dto.message.slice(0, 600), skinType: dto.skinType }),
    })
    return { ...advice, recommendedProductIds: advice.recommendedProductIds.filter((id) => available.has(id)) }
  } catch {
    const advice = getOfflineBeautyAdvice(dto.message, dto.skinType, dto.catalogProducts)
    return { ...advice, recommendedProductIds: advice.recommendedProductIds.filter((id) => available.has(id)) }
  }
}

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

/**
 * Conseils de démonstration intégrés hors-ligne
 */
function getOfflineBeautyAdvice(
  message: string,
  skinType?: string,
  catalog?: ClientCatalogProduct[],
): BeautyAdvice {
  const combined = `${message} ${skinType || ''}`.toLowerCase()
  const findId = (pattern: string) => catalog?.find((p) => p.id.includes(pattern) || p.name.toLowerCase().includes(pattern))?.id

  const savonId = findId('savon') || 'savon-noir-cabosse-cacao'
  const chantillyId = findId('chantilly') || 'chantilly-beurre-cacao'
  const beurreId = findId('beurre-de-cacao') || 'beurre-de-cacao-brut'
  const cocoId = findId('coco') || 'huile-de-coco'
  const neemId = findId('neem') || 'huile-de-neem'
  const kariteId = findId('karite') || 'huile-de-karite'

  if (combined.includes('acné') || combined.includes('bouton') || combined.includes('gras') || combined.includes('imperfection')) {
    return {
      diagnosis: 'Pour les peaux sujettes aux imperfections ou aux excès de sébum, le secret réside dans un nettoyage doux mais assainissant qui préserve l’équilibre naturel de la peau sans la décaper.',
      recommendedProductIds: [savonId, neemId, chantillyId].filter(Boolean) as string[],
      routineMorning: [
        'Nettoyer le visage avec le Savon noir de cabosse de cacao, puis rincer abondamment à l’eau tiède.',
        'Appliquer une fine couche de Chantilly de cacao sur peau humide pour protéger et apaiser.',
      ],
      routineEvening: [
        'Nettoyage purifiant du visage pour retirer la poussière et les impuretés du jour.',
        'Appliquer 2 gouttes d’Huile de neem localement sur les boutons pour purifier pendant la nuit.',
      ],
      naturalTips: [
        'Émulsionnez le savon noir dans vos mains humides avant de masser le visage en gestes circulaires légers.',
        'Buvez au moins 1,5 L d’eau par jour pour soutenir l’élimination naturelle des toxines.',
      ],
      whatsappSummary: 'Rituel Anti-imperfections (Savon noir, Huile de neem, Chantilly de cacao)',
      isDemo: true,
    }
  }

  if (combined.includes('vergeture') || combined.includes('cicatrice') || combined.includes('grossesse')) {
    return {
      diagnosis: 'Les fibres cutanées étirées ont besoin de nutriments relipidants pour regagner en élasticité et souplesse. Le Beurre de cacao brut est le soin traditionnel le plus concentré en vitamine E et polyphénols réparateurs.',
      recommendedProductIds: [beurreId, chantillyId, cocoId].filter(Boolean) as string[],
      routineMorning: [
        'Masser les zones sujettes aux vergetures avec la Chantilly de cacao pour une pénétration douce et rapide.',
      ],
      routineEvening: [
        'Faire fondre une noisette de Beurre de cacao brut au creux des mains et masser 3 à 5 minutes en mouvements circulaires.',
      ],
      naturalTips: [
        'Appliquez toujours le beurre juste après la douche lorsque la peau est encore légèrement humide pour sceller l’hydratation.',
        'La régularité quotidienne est le facteur clé pour des résultats visibles.',
      ],
      whatsappSummary: 'Rituel Anti-vergetures & Fermeté (Beurre de cacao brut, Chantilly de cacao)',
      isDemo: true,
    }
  }

  if (combined.includes('cheveu') || combined.includes('barbe') || combined.includes('sec')) {
    return {
      diagnosis: 'Pour revitaliser la fibre capillaire ou la barbe, les acides gras de l’huile végétale et la richesse du beurre apportent souplesse, brillance et protection contre la casse.',
      recommendedProductIds: [cocoId, chantillyId, kariteId].filter(Boolean) as string[],
      routineMorning: [
        'Appliquer une noisette de Chantilly de cacao sur les longueurs ou la barbe pour nourrir et discipliner.',
      ],
      routineEvening: [
        'Bain d’huile hebdomadaire avec l’Huile de coco ou de karité : laisser poser sous bonnet tiède avant le shampoing.',
      ],
      naturalTips: [
        'Humidifiez toujours vos cheveux avant d’appliquer un beurre pour enfermer l’hydratation.',
      ],
      whatsappSummary: 'Rituel Nutrition Capillaire & Barbe (Huile de coco, Chantilly de cacao)',
      isDemo: true,
    }
  }

  return {
    diagnosis: 'Votre peau mérite un soin enveloppant et protecteur. Le cacao brut d’origine ivoirienne régénère la barrière hydrolipidique et redonne au teint un éclat chaud et velouté.',
    recommendedProductIds: [savonId, chantillyId, beurreId].filter(Boolean) as string[],
    routineMorning: [
      'Nettoyage délicat avec la mousse douce du Savon noir de cabosse de cacao.',
      'Application généreuse de la Chantilly de cacao sur l’ensemble du corps et du visage.',
    ],
    routineEvening: [
      'Soin ciblé réparateur au Beurre de cacao brut sur les zones sèches (coudes, genoux, lèvres, talons).',
    ],
    naturalTips: [
      'Privilégiez l’eau tiède lors de la toilette pour respecter le film protecteur de la peau.',
      'Massez toujours de bas en haut pour favoriser la tonicité de la peau.',
    ],
    whatsappSummary: 'Rituel Douceur & Éclat Naturel (Savon noir, Chantilly de cacao, Beurre de cacao brut)',
    isDemo: true,
  }
}
