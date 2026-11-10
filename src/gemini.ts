import { GoogleGenAI } from '@google/genai'
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
 * Demande un diagnostic et une routine personnalisée au Conseiller Beauté Gemini
 */
export async function requestBeautyAdvice(dto: {
  message: string
  skinType?: string
  catalogProducts?: ClientCatalogProduct[]
}): Promise<BeautyAdvice> {
  // 1. Essai prioritaire via l'API backend sécurisée
  try {
    return await api<BeautyAdvice>('/ai/advisor', {
      method: 'POST',
      body: JSON.stringify(dto),
    })
  } catch (backendErr) {
    // 2. Si le backend n'est pas démarré, tentative directe côté client si VITE_GEMINI_API_KEY est fournie
    const clientKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim()
    if (clientKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: clientKey })
        const catalogText = (dto.catalogProducts || [])
          .map((p) => `- ID: "${p.id}" | ${p.name} (${p.category}, ${p.size}) : ${p.description}`)
          .join('\n')

        const systemInstruction = `Tu es le Conseiller Beauté & Soins Personnalisé officiel de la marque ivoirienne NATURE & GRÂCE (Slogan: "Prenez soin de vous naturellement").
Recommande une routine naturelle en utilisant UNIQUEMENT les identifiants de produits fournis dans "recommendedProductIds".
Produits disponibles :
${catalogText}`

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Type / Préoccupation : ${dto.skinType || 'Non précisé'}\nMessage : "${dto.message}"`,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'object',
              properties: {
                diagnosis: { type: 'string' },
                recommendedProductIds: { type: 'array', items: { type: 'string' } },
                routineMorning: { type: 'array', items: { type: 'string' } },
                routineEvening: { type: 'array', items: { type: 'string' } },
                naturalTips: { type: 'array', items: { type: 'string' } },
                whatsappSummary: { type: 'string' },
              },
              required: ['diagnosis', 'recommendedProductIds', 'routineMorning', 'routineEvening', 'naturalTips', 'whatsappSummary'],
            },
          },
        })

        if (response.text) {
          const parsed = JSON.parse(response.text) as BeautyAdvice
          return { ...parsed, isDemo: false }
        }
      } catch (genaiErr) {
        console.warn('Échec appel client Gemini:', genaiErr)
      }
    }

    // 3. Fallback immédiat et intelligent pour navigation fluide même hors-ligne
    return getOfflineBeautyAdvice(dto.message, dto.skinType, dto.catalogProducts)
  }
}

/**
 * Génération de description marketing par IA pour l'administration
 */
export async function requestProductDescription(dto: {
  name: string
  category?: string
  size?: string
  keyIngredients?: string
}): Promise<ProductDescriptionResult> {
  try {
    return await api<ProductDescriptionResult>('/ai/generate-description', {
      method: 'POST',
      body: JSON.stringify(dto),
    })
  } catch {
    const clientKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim()
    if (clientKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: clientKey })
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Rédige une description poétique, concise (2-3 phrases) et vendeuse pour :
Nom: ${dto.name}
Catégorie: ${dto.category || 'Soin naturel'}
Contenance: ${dto.size || '100 g'}
Ingrédients: ${dto.keyIngredients || 'Naturels'}
Style: NATURE & GRÂCE (naturel, élégant, bienveillant, inspiré de Côte d'Ivoire).`,
        })
        if (response.text) {
          return { description: response.text.trim(), isDemo: false }
        }
      } catch (err) {
        console.warn('Gemini client error:', err)
      }
    }

    return {
      description: `${dto.name} est une création naturelle de NATURE & GRÂCE, pensée pour nourrir intensément et sublimer la peau au quotidien. Texture délicate et actifs bienfaisants pour un rituel réconfortant.`,
      isDemo: true,
    }
  }
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
