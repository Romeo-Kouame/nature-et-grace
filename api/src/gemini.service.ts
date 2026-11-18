import { Injectable, Logger } from '@nestjs/common'
import { GoogleGenAI } from '@google/genai'
import { PrismaService } from './prisma.service'

export interface ProductDescriptionResponse {
  description: string
  suggestedTags?: string[]
  isDemo?: boolean
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name)
  ai: GoogleGenAI | null = null
  /**
   * Plafond d'appels Gemini par jour (toutes personnes confondues), pour maîtriser la facture.
   * Au-delà, le site bascule sur les conseils de démonstration jusqu'au lendemain.
   */
  private readonly dailyLimit = Math.max(0, Number(process.env.GEMINI_DAILY_LIMIT ?? 300) || 0)
  private usage = { day: '', count: 0 }

  /** Réserve un appel dans le quota du jour ; false si le plafond est atteint. */
  takeQuota(): boolean {
    const day = new Date().toISOString().slice(0, 10)
    if (this.usage.day !== day) this.usage = { day, count: 0 }
    if (this.usage.count >= this.dailyLimit) {
      if (this.usage.count === this.dailyLimit) this.logger.warn(`Plafond quotidien Gemini atteint (${this.dailyLimit} appels) : mode démonstration jusqu'à demain.`)
      this.usage.count += 1
      return false
    }
    this.usage.count += 1
    return true
  }

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
   * Génération de description marketing par IA pour l'espace administrateur
   */
  async generateProductDescription(dto: {
    name: string
    category?: string
    size?: string
    keyIngredients?: string
  }): Promise<ProductDescriptionResponse> {
    if (!this.ai || !this.takeQuota()) {
      return {
        description: `Un soin d'exception signé Nature & Grâce, formulé avec des ingrédients purs et naturels pour sublimer votre peau au quotidien. Riche en nutriments essentiels, il apporte douceur, éclat et protection naturelle.`,
        suggestedTags: ['100% Naturel', 'Fait avec soin', 'Beauté saine'],
        isDemo: true,
      }
    }

    const prompt = `Rédige une description commerciale et poétique pour ce produit cosmétique naturel de la boutique Nature & Grâce :
Nom : ${dto.name}
Catégorie : ${dto.category || 'Soin naturel'}
Contenance : ${dto.size || '100 g'}
Ingrédients / Notes : ${dto.keyIngredients || 'Ingrédients naturels purs'}

La description doit être en français, d'environ 2 à 4 phrases percutantes, élégantes, mettant en avant les bienfaits pour la peau ou les cheveux, la sensorialité et le respect du corps. Ne mets pas de guillemets autour du texte ni d'emoji. N'invente aucune propriété médicale, aucun chiffre et aucune certification.`

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Tu es un rédacteur expert en cosmétiques haut de gamme et naturels pour la marque ivoirienne Nature & Grâce. Ton style est raffiné, authentique, sensoriel et rassurant.',
        },
      })

      return {
        description: stripEmojis(response.text ?? '').trim(),
        suggestedTags: ['Naturel', 'Éclat', 'Douceur'],
        isDemo: false,
      }
    } catch (error) {
      this.logger.error('Erreur génération description:', error)
      return {
        description: `${dto.name} est un trésor végétal sélectionné par Nature & Grâce pour nourrir et révéler la splendeur naturelle de votre peau.`,
        isDemo: true,
      }
    }
  }

}

/** Retire emojis et pictogrammes : le site affiche ses propres icônes, le texte de l'IA reste sobre. */
const EMOJI = /[\p{Extended_Pictographic}\p{Emoji_Modifier}\p{Regional_Indicator}\u{FE0F}\u{200D}\u{20E3}]/gu
export const stripEmojis = (text: string) => text.replace(EMOJI, '').replace(/[ \t]{2,}/g, ' ')
