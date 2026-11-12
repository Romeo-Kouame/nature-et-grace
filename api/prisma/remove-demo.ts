import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { DEMO_PRODUCTS, REAL_PRODUCT_PHOTOS } from './demo-catalog'

const prisma = new PrismaClient()

/** Retire les produits de démonstration ; ceux qui ont déjà été commandés sont masqués pour garder l'historique. */
async function main() {
  let deleted = 0
  let hidden = 0
  for (const { slug } of DEMO_PRODUCTS) {
    const product = await prisma.product.findUnique({ where: { slug }, include: { _count: { select: { orderItems: true } } } })
    if (!product) continue
    if (product._count.orderItems > 0) {
      await prisma.product.update({ where: { slug }, data: { active: false } })
      hidden++
    } else {
      await prisma.product.delete({ where: { slug } })
      deleted++
    }
  }
  // Les photos d'illustration posées sur les produits réels sont retirées si elles n'ont pas été changées depuis.
  for (const [slug, photos] of Object.entries(REAL_PRODUCT_PHOTOS)) {
    await prisma.product.updateMany({ where: { slug, imageUrl: photos.imageUrl }, data: { imageUrl: null, gallery: [] } })
  }
  console.log(`Démonstration retirée : ${deleted} produit(s) supprimé(s), ${hidden} masqué(s) car déjà commandé(s).`)
}

main().finally(() => prisma.$disconnect())
