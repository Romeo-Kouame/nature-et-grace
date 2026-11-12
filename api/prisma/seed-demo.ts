import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { DEMO_PRODUCTS, REAL_PRODUCT_PHOTOS } from './demo-catalog'

const prisma = new PrismaClient()

async function main() {
  for (const { slug, ...data } of DEMO_PRODUCTS) {
    const values = { ...data, gallery: data.gallery ?? [], badge: data.badge ?? null, active: true }
    await prisma.product.upsert({ where: { slug }, create: { slug, ...values }, update: values })
  }
  // Produits réels : on ajoute seulement une photo d'illustration s'ils n'en ont pas.
  for (const [slug, photos] of Object.entries(REAL_PRODUCT_PHOTOS)) {
    const product = await prisma.product.findUnique({ where: { slug } })
    if (product && !product.imageUrl) {
      await prisma.product.update({ where: { slug }, data: { imageUrl: photos.imageUrl, gallery: photos.gallery } })
    }
  }
  console.log(`${DEMO_PRODUCTS.length} produits de démonstration ajoutés. Pour les retirer : npm run prisma:remove-demo`)
}

main().finally(() => prisma.$disconnect())
