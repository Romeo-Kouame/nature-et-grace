import { Injectable, Logger } from '@nestjs/common'
import { GoogleGenAI } from '@google/genai'
import { PrismaService } from './prisma.service'

export interface BeautyAdviceResponse {
  diagnosis: string
  recommendedProductIds: string[]
  routineMorning: string[]
  routineEvening: string[]
  naturalTips: string[]
  whatsappSummary: string
  isDemo?: boolean
}

export interface ProductDescriptionResponse {
  description: string
  suggestedTags?: string[]
  isDemo?: boolean
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name)
  private ai: GoogleGenAI | null = null

  constructor(private readonly db: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey && apiKey.trim() !== '' && !apiKey.includes('replace-with')) {
      this.ai = new GoogleGenAI({ apiKey: apiKey.trim() })
      this.logger.log('GeminiService initialized with GoogleGenAI SDK (model: gemini-3.8-flash)')
    } else {
      this.logger.warn('GEMINI_API_KEY non configurée. Le mode de démonstration interactif est activé.')
    }
  }

  /**
   * Diagnostic et recommandation de soins personnalisés
   */
  async getBeautyAdvice(dto: {
    message: string
    skinType?: string
    history?: { role: 'user' | 'model'; text: string }[]
  }): Promise<BeautyAdviceResponse> {
    // 1. Récupération des produits actifs de la boutique
    let catalog: { id: string; slug: string; name: string; category: string; description: string; priceXof: number | null; size: string }[] = []
    try {
      catalog = await this.db.product.findMany({
        where: { active: true },
        select: { id: true, slug: true, name: true, category: true, description: true, priceXof: true, size: true },
      })
    } catch {
      // Si la base n'est pas encore initialisée
    }

    if (!catalog.length) {
      catalog = [
        { id: 'beurre-de-cacao-brut', slug: 'beurre-de-cacao-brut', name: 'Beurre de cacao brut', category: 'Beurre de cacao', size: '100 g', priceXof: 1500, description: 'Soin pur et riche, cicatrisant, nourrissant, idéal pour peaux sèches, vergetures et lèvres gercées.' },
        { id: 'chantilly-beurre-cacao', slug: 'chantilly-beurre-cacao', name: 'Chantilly de cacao', category: 'Beurre de cacao', size: '100 g', priceXof: 2000, description: 'Texture fouettée, légère et fondante, hydrate le corps et nourrit les cheveux sans effet lourd.' },
        { id: 'savon-noir-cabosse-cacao', slug: 'savon-noir-cabosse-cacao', name: 'Savon noir de cabosse', category: 'Savons naturels', size: '100 g', priceXof: 2000, description: 'Savon traditionnel purifiant et doux, nettoie en profondeur, aide contre acné, boutons et teint terne.' },
        { id: 'huile-de-coco', slug: 'huile-de-coco', name: 'Huile de coco pure', category: 'Huiles naturelles', size: '100 ml', priceXof: 2500, description: 'Huile satinée multi-usage pour hydrater la peau, sceller l’hydratation des cheveux et bain d’huile.' },
        { id: 'huile-de-neem', slug: 'huile-de-neem', name: 'Huile de neem', category: 'Huiles naturelles', size: '100 ml', priceXof: 3000, description: 'Huile végétale protectrice et purifiante, très efficace contre les imperfections, démangeaisons et pellicules.' },
        { id: 'huile-de-karite', slug: 'huile-de-karite', name: 'Huile de karité', category: 'Huiles naturelles', size: '100 ml', priceXof: 2500, description: 'Concentré de douceur végétale réparatrice, répare les zones sèches et protège la barrière cutanée.' },
      ]
    }

    // 2. Si pas de clé d'API, retourner un conseil intelligent basé sur les règles de soin
    if (!this.ai) {
      return this.generateSmartDemoAdvice(dto.message, dto.skinType, catalog)
    }

    // 3. Appel à l'API Gemini 3.8 Flash
    const catalogDescription = catalog.map((p) => `- ID: "${p.id}" | Nom: ${p.name} (${p.category}, ${p.size}) : ${p.description}`).join('\n')

    const systemInstruction = `Tu es le Conseiller Beauté & Soins Personnalisé officiel de la marque ivoirienne NATURE & GRÂCE (Slogan: "Prenez soin de vous naturellement").
Ton rôle est de guider chaleureusement chaque cliente ou client en lui conseillant un rituel de soin naturel adapté à son type de peau ou sa préoccupation.
Tu t'exprimes avec douceur, élégance, bienveillance et expertise en cosmétique naturelle africaine (beurre de cacao brut de Côte d'Ivoire, chantilly de cacao, savon noir de cabosse, huiles pures).

RÈGLES IMPORTANTES :
1. Tu ne recommandes QUE les produits du catalogue ci-dessous en utilisant scrupuleusement leur ID exact dans "recommendedProductIds".
2. Fournis un diagnostic clair expliquant le besoin et les bienfaits des ingrédients naturels choisis.
3. Découpe la recommandation en rituel matin (routineMorning), rituel soir (routineEvening), et quelques conseils naturels du quotidien (naturalTips).
4. Produis un court texte de synthèse pour commande WhatsApp (whatsappSummary).

CATALOGUE DISPONIBLE :
${catalogDescription}
`

    const userPrompt = `Préoccupation / Type de peau : ${dto.skinType || 'Non précisé'}
Message du client : "${dto.message}"`

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              diagnosis: {
                type: 'string',
                description: 'Diagnostic bienveillant et analyse du besoin cutané ou capillaire.',
              },
              recommendedProductIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'IDs des produits NATURE & GRÂCE recommandés correspondant au catalogue.',
              },
              routineMorning: {
                type: 'array',
                items: { type: 'string' },
                description: 'Étapes du rituel du matin détaillées.',
              },
              routineEvening: {
                type: 'array',
                items: { type: 'string' },
                description: 'Étapes du rituel du soir détaillées.',
              },
              naturalTips: {
                type: 'array',
                items: { type: 'string' },
                description: '2 à 3 conseils pratiques et naturels pour optimiser les résultats.',
              },
              whatsappSummary: {
                type: 'string',
                description: 'Court texte résumant la sélection pour envoyer sur WhatsApp.',
              },
            },
            required: ['diagnosis', 'recommendedProductIds', 'routineMorning', 'routineEvening', 'naturalTips', 'whatsappSummary'],
          },
        },
      })

      const text = response.text
      if (!text) throw new Error('Réponse vide de Gemini')
      const parsed = JSON.parse(text) as BeautyAdviceResponse
      return { ...parsed, isDemo: false }
    } catch (error) {
      this.logger.error('Erreur lors de l’appel Gemini:', error)
      // Fallback gracieux en cas d'erreur de quota ou réseau
      return this.generateSmartDemoAdvice(dto.message, dto.skinType, catalog)
    }
  }

  /**
   * Génération de description marketing par IA pour l'espace administrateur
   */
  async generateProductDescription(dto: {
    name: string
    category?: string
    size?: string
    keyIngredients?: string
  }): Promise<ProductDescriptionResponse> {
    if (!this.ai) {
      return {
        description: `Un soin d'exception signé NATURE & GRÂCE, formulé avec des ingrédients purs et naturels pour sublimer votre peau au quotidien. Riche en nutriments essentiels, il apporte douceur, éclat et protection naturelle. [Pour des descriptions rédigées en direct par Gemini 3.8 Flash, configurez GEMINI_API_KEY dans votre fichier .env]`,
        suggestedTags: ['100% Naturel', 'Fait avec soin', 'Beauté saine'],
        isDemo: true,
      }
    }

    const prompt = `Rédige une description commerciale et poétique pour ce produit cosmétique naturel de la boutique NATURE & GRÂCE :
Nom : ${dto.name}
Catégorie : ${dto.category || 'Soin naturel'}
Contenance : ${dto.size || '100 g'}
Ingrédients / Notes : ${dto.keyIngredients || 'Ingrédients naturels purs'}

La description doit être en français, d'environ 2 à 4 phrases percutantes, élégantes, mettant en avant les bienfaits pour la peau ou les cheveux, la sensorialité et le respect du corps. Ne mets pas de guillemets autour du texte.`

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Tu es un rédacteur expert en cosmétiques haut de gamme et naturels pour la marque ivoirienne NATURE & GRÂCE. Ton style est raffiné, authentique, sensoriel et rassurant.',
        },
      })

      return {
        description: response.text?.trim() || '',
        suggestedTags: ['Naturel', 'Éclat', 'Douceur'],
        isDemo: false,
      }
    } catch (error) {
      this.logger.error('Erreur génération description:', error)
      return {
        description: `${dto.name} est un trésor végétal sélectionné par NATURE & GRÂCE pour nourrir et révéler la splendeur naturelle de votre peau.`,
        isDemo: true,
      }
    }
  }

  /**
   * Générateur de conseils experts hors-ligne en mode démonstration
   */
  private generateSmartDemoAdvice(
    message: string,
    skinType: string | undefined,
    catalog: { id: string; name: string }[],
  ): BeautyAdviceResponse {
    const textLower = `${message} ${skinType || ''}`.toLowerCase()

    const findId = (pattern: string) => catalog.find((c) => c.id.includes(pattern) || c.name.toLowerCase().includes(pattern))?.id

    const beurreId = findId('beurre-de-cacao') || 'beurre-de-cacao-brut'
    const chantillyId = findId('chantilly') || 'chantilly-beurre-cacao'
    const savonId = findId('savon') || 'savon-noir-cabosse-cacao'
    const cocoId = findId('coco') || 'huile-de-coco'
    const neemId = findId('neem') || 'huile-de-neem'
    const kariteId = findId('karite') || 'huile-de-karite'

    if (textLower.includes('acné') || textLower.includes('bouton') || textLower.includes('gras') || textLower.includes('imperfection')) {
      return {
        diagnosis: 'Votre peau fait face à un excès de sébum ou à des impuretés passagères. Pour purifier l’épiderme sans l’agresser, nous privilégions le savon noir traditionnel à la cabosse de cacao, combiné aux vertus assainissantes de l’huile de neem et à une hydratation aérienne.',
        recommendedProductIds: [savonId, neemId, chantillyId].filter(Boolean) as string[],
        routineMorning: [
          'Nettoyer le visage en douceur avec le Savon noir de cabosse de cacao et rincer à l’eau tiède.',
          'Appliquer une noisette légère de Chantilly de cacao sur peau légèrement humide pour protéger la barrière cutanée sans boucher les pores.',
        ],
        routineEvening: [
          'Nettoyer soigneusement pour éliminer les impuretés accumulées durant la journée.',
          'Appliquer 2 à 3 gouttes d’Huile de neem localement sur les imperfections pour assainir durant la nuit.',
        ],
        naturalTips: [
          'Évitez de frotter vigoureusement : faites mousser le savon noir dans vos mains avant de l’appliquer.',
          'Hydratez-vous abondamment tout au long de la journée (au moins 1,5 L d’eau).',
        ],
        whatsappSummary: 'Rituel Purifiant & Anti-imperfections (Savon noir, Huile de neem, Chantilly de cacao)',
        isDemo: true,
      }
    }

    if (textLower.includes('vergeture') || textLower.includes('cicatrice') || textLower.includes('grossesse')) {
      return {
        diagnosis: 'Les vergetures et marques cutanées ont besoin d’une régénération intense et d’acides gras protecteurs. Le Beurre de cacao brut est le joyau ivoirien par excellence pour assouplir la peau en profondeur et atténuer visiblement les marques.',
        recommendedProductIds: [beurreId, chantillyId, cocoId].filter(Boolean) as string[],
        routineMorning: [
          'Masser délicatement les zones concernées avec la Chantilly de cacao, facile à étaler avant de s’habiller.',
        ],
        routineEvening: [
          'Faire fondre une noisette de Beurre de cacao brut entre les paumes et masser avec des mouvements circulaires fermes pendant 3 à 5 minutes pour stimuler la micro-circulation.',
        ],
        naturalTips: [
          'La régularité est la clé : appliquez matin et soir pendant au moins 6 à 8 semaines.',
          'Toujours appliquer après la douche lorsque les pores sont ouverts et la peau encore légèrement humide.',
        ],
        whatsappSummary: 'Rituel Anti-vergetures & Fermeté (Beurre de cacao brut, Chantilly de cacao)',
        isDemo: true,
      }
    }

    if (textLower.includes('cheveu') || textLower.includes('barbe') || textLower.includes('cuir chevelu')) {
      return {
        diagnosis: 'Vos cheveux ou votre barbe ont besoin d’un apport en lipides pour gainer la fibre, prévenir la casse et nourrir le bulbe en profondeur.',
        recommendedProductIds: [cocoId, chantillyId, kariteId].filter(Boolean) as string[],
        routineMorning: [
          'Appliquer une petite touche de Chantilly de cacao sur les longueurs ou la barbe pour sceller l’hydratation et discipliner.',
        ],
        routineEvening: [
          'Une à deux fois par semaine, réaliser un bain d’huile tiède avec l’Huile de coco ou de karité avant le lavage.',
        ],
        naturalTips: [
          'Humidifiez toujours légèrement vos cheveux avant d’appliquer un beurre ou une chantilly pour piéger l’eau au cœur de la fibre.',
        ],
        whatsappSummary: 'Rituel Nutrition Capillaire & Barbe (Huile de coco, Chantilly de cacao)',
        isDemo: true,
      }
    }

    // Par défaut : Peau sèche, éclat & douceur
    return {
      diagnosis: 'Votre peau mérite un rituel doux, régénérant et 100% naturel. Le cacao ivoirien regorge d’antioxydants, de vitamine E et de polyphénols qui redonnent souplesse, velouté et éclat naturel au teint.',
      recommendedProductIds: [savonId, chantillyId, beurreId].filter(Boolean) as string[],
      routineMorning: [
        'Nettoyage tout en douceur avec la mousse onctueuse du Savon noir de cabosse.',
        'Hydratation veloutée avec la Chantilly de cacao sur l’ensemble du corps et du visage.',
      ],
      routineEvening: [
        'Application ciblée du Beurre de cacao brut sur les zones les plus sèches (coudes, genoux, talons, lèvres ou visage) pour une réparation nocturne intense.',
      ],
      naturalTips: [
        'Utilisez toujours une eau tiède plutôt que brûlante pour préserver le film hydrolipidique naturel.',
        'La Chantilly s’applique à merveille en sortie de bain sur peau encore perlée d’eau.',
      ],
      whatsappSummary: 'Rituel Douceur & Éclat Naturel (Savon noir, Chantilly de cacao, Beurre de cacao brut)',
      isDemo: true,
    }
  }
}
