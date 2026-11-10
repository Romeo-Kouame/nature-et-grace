import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const examples = [
  { name: 'Beurre de cacao brut', slug: 'beurre-de-cacao-brut', category: 'Beurre de cacao', description: 'Un soin riche et nourrissant, idéal pour les peaux en quête de douceur.', size: '100 g', priceXof: 1500, stock: 0 },
  { name: 'Chantilly de beurre de cacao', slug: 'chantilly-beurre-cacao', category: 'Beurre de cacao', description: 'Une texture légère et onctueuse pour un rituel de soin tout en douceur.', size: '100 g', priceXof: 2000, stock: 0 },
  { name: 'Savon noir de cabosse de cacao', slug: 'savon-noir-cabosse-cacao', category: 'Savons naturels', description: 'Un savon inspiré du cacao, pour une peau propre et délicatement fraîche.', size: '100 g', priceXof: 2000, stock: 0 },
  { name: 'Huile de coco', slug: 'huile-de-coco', category: 'Huiles naturelles', description: 'Exemple à valider avec la boutique : huile polyvalente pour la peau et les cheveux.', size: 'À confirmer', priceXof: null, stock: 0, active: false },
  { name: 'Huile de neem', slug: 'huile-de-neem', category: 'Huiles naturelles', description: 'Exemple à valider avec la boutique : huile végétale appréciée dans les routines traditionnelles.', size: 'À confirmer', priceXof: null, stock: 0, active: false },
  { name: 'Huile de karité', slug: 'huile-de-karite', category: 'Huiles naturelles', description: 'Exemple à valider avec la boutique : huile végétale à intégrer au rituel de soin.', size: 'À confirmer', priceXof: null, stock: 0, active: false },
]

async function main() {
  for (const item of examples) {
    const { slug, ...data } = item
    await prisma.product.upsert({ where: { slug }, create: { slug, ...data }, update: {} })
  }
  console.log('Catalogue de départ ajouté. Les huiles restent désactivées jusqu’à validation.')
}

main().finally(() => prisma.$disconnect())
