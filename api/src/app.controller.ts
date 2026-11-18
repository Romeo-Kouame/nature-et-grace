import {
  Body, Controller, Delete, Get, Header, HttpCode, Param, Patch, Post, Query, Req, Res, UseGuards,
  BadRequestException, Logger, NotFoundException, ServiceUnavailableException, UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import {
  ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsEnum, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { Request, Response } from 'express'
import * as bcrypt from 'bcryptjs'
import { OrderStatus, Prisma } from './generated/prisma/client'
import { AdminGuard, CustomerGuard, checkPassword } from './auth'
import { PrismaService } from './prisma.service'
import { GeminiService } from './gemini.service'
import { RateLimit, accountLimiter } from './rate-limit'
import { assertConsent, assertHuman, decodeImage, orderReference, sessionCookieBase } from './images'
import { assertCaptcha } from './captcha'
import { alertNewOrder, notifyOrderStatus } from './notify'
import { normalizePhone } from './customer.controller'

const MINUTE = 60_000

class GenerateDescriptionDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string
  @IsOptional() @IsString() @MaxLength(80) category?: string
  @IsOptional() @IsString() @MaxLength(40) size?: string
  @IsOptional() @IsString() @MaxLength(300) keyIngredients?: string
}

class LoginDto {
  @IsEmail() email!: string
  @IsString() @MinLength(1) @MaxLength(200) password!: string
}
class PasswordDto {
  @IsString() @MinLength(1) currentPassword!: string
  @IsString() @MinLength(12) @MaxLength(200) newPassword!: string
}
class OrderLineDto {
  @IsString() productId!: string
  @IsInt() @Min(1) @Max(100) quantity!: number
}
class CreateOrderDto {
  @IsString() @MinLength(2) @MaxLength(80) customerName!: string
  @IsString() @MinLength(8) @MaxLength(25) phone!: string
  @IsString() @MinLength(2) @MaxLength(80) commune!: string
  @IsString() @MinLength(5) @MaxLength(400) address!: string
  @IsOptional() @IsString() @MaxLength(80) deliveryZone?: string
  @IsOptional() @IsString() @MaxLength(400) deliveryNote?: string
  /** Enregistrer cette adresse comme adresse par défaut du compte */
  @IsOptional() @IsBoolean() saveAddress?: boolean
  @IsArray() @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => OrderLineDto) items!: OrderLineDto[]
  /** Case « J'accepte les conditions générales de vente » */
  @IsOptional() @IsBoolean() acceptTerms?: boolean
  /** Identifiant unique de cet envoi (généré par le navigateur) : un double envoi renvoie la même commande */
  @IsOptional() @IsString() @Matches(/^[A-Za-z0-9-]{8,64}$/) clientKey?: string
  /** Champ piège anti-robots */
  @IsOptional() @IsString() @MaxLength(200) website?: string
}
class ImageDto {
  @IsString() @MaxLength(6_000_000) image!: string
}
class ProductDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string
  @IsString() @MinLength(2) @MaxLength(80) slug!: string
  @IsString() @MinLength(2) @MaxLength(80) category!: string
  @IsString() @MinLength(2) @MaxLength(2000) description!: string
  @IsString() @MinLength(1) @MaxLength(40) size!: string
  @IsOptional() @IsInt() @Min(0) priceXof?: number | null
  @IsOptional() @IsString() @MaxLength(500) imageUrl?: string | null
  @IsOptional() @IsArray() @ArrayMaxSize(6) @IsString({ each: true }) @MaxLength(500, { each: true }) gallery?: string[]
  @IsOptional() @IsIn(['bestseller', 'new']) badge?: string | null
  @IsInt() @Min(0) stock!: number
  @IsOptional() @IsBoolean() active?: boolean
  /** Fiche détaillée : une entrée = un point (bienfait, étape d'utilisation) */
  @IsOptional() @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) @MaxLength(300, { each: true }) benefits?: string[]
  @IsOptional() @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) @MaxLength(300, { each: true }) howToUse?: string[]
  @IsOptional() @IsString() @MaxLength(1000) ingredients?: string
  @IsOptional() @IsString() @MaxLength(300) origin?: string
}

/** Lignes de fiche nettoyées : sans espaces superflus ni lignes vides */
const cleanLines = (lines?: string[]) => (lines ?? []).map((l) => l.trim()).filter(Boolean)
class OrderStatusDto {
  @IsEnum(OrderStatus) status!: OrderStatus
}
class DeliveryZoneDto {
  @IsString() @MinLength(2) @MaxLength(80) name!: string
  @IsOptional() @IsInt() @Min(0) feeXof?: number | null
  @IsOptional() @IsString() @MaxLength(60) delay?: string
}
class StoreSettingsDto {
  @IsString() @MinLength(8) whatsappNumber!: string
  @IsString() @MinLength(2) @MaxLength(300) deliveryCommunes!: string
  @IsString() @MinLength(2) @MaxLength(1000) deliveryInfo!: string
  @IsString() @MinLength(2) @MaxLength(1000) waveInstructions!: string
  @IsOptional() @IsString() @MaxLength(120) waveNumber?: string
  @IsOptional() @IsString() @MaxLength(1500) legalInfo?: string
  @IsOptional() @IsString() @MaxLength(300) storeAddress?: string
  /** E-mail qui reçoit l'alerte de chaque nouvelle commande (vide = pas d'e-mail) */
  @IsOptional() @IsString() @MaxLength(120) alertEmail?: string
  @IsOptional() @IsArray() @ArrayMaxSize(60) @ValidateNested({ each: true }) @Type(() => DeliveryZoneDto) deliveryZones?: DeliveryZoneDto[]
}
class CreateReviewDto {
  @IsString() @MinLength(2) @MaxLength(60) authorName!: string
  @IsString() @MinLength(2) @MaxLength(60) city!: string
  @IsOptional() @IsString() @MaxLength(80) productSlug?: string
  @IsInt() @Min(1) @Max(5) rating!: number
  @IsString() @MinLength(10) @MaxLength(1000) comment!: string
  /** Accord pour publier le prénom, la ville et le texte de l'avis */
  @IsOptional() @IsBoolean() consent?: boolean
  /** Champ piège anti-robots */
  @IsOptional() @IsString() @MaxLength(200) website?: string
  /** Jeton du captcha Cloudflare Turnstile */
  @IsOptional() @IsString() @MaxLength(2048) captchaToken?: string
}
class ClientErrorDto {
  @IsString() @MaxLength(300) message!: string
  @IsString() @MaxLength(200) path!: string
}
class ReviewPublishDto {
  @IsBoolean() published!: boolean
}

type DeliveryZone = { name: string; feeXof: number | null; delay?: string }

const parseZones = (value: Prisma.JsonValue): DeliveryZone[] =>
  Array.isArray(value)
    ? value
        .filter((z): z is Prisma.JsonObject => !!z && typeof z === 'object' && !Array.isArray(z) && typeof z.name === 'string')
        .map((z) => ({ name: String(z.name), feeXof: typeof z.feeXof === 'number' ? z.feeXof : null, delay: typeof z.delay === 'string' ? z.delay : undefined }))
    : []

@Controller()
export class AppController {
  private readonly clientLogger = new Logger('Navigateur')
  constructor(
    private readonly db: PrismaService,
    private readonly jwt: JwtService,
    private readonly gemini: GeminiService,
  ) {}

  // ───────────── IA ─────────────

  @Post('ai/generate-description')
  @UseGuards(AdminGuard)
  generateDescription(@Body() dto: GenerateDescriptionDto) {
    return this.gemini.generateProductDescription(dto)
  }

  // ───────────── Surveillance ─────────────

  /** Pour un service de surveillance (UptimeRobot, Better Stack…) : 200 si l'API et la base répondent. */
  @Get('health')
  @Header('Cache-Control', 'no-store')
  async health() {
    try {
      await this.db.$queryRaw`SELECT 1`
      return { status: 'ok' }
    } catch {
      throw new ServiceUnavailableException({ status: 'error', message: 'Base de données injoignable.' })
    }
  }

  /** Erreurs survenues dans le navigateur des visiteurs : journalisées pour être corrigées */
  @Post('client-errors')
  @HttpCode(204)
  @RateLimit('client-error', 20, 10 * MINUTE)
  clientError(@Body() dto: ClientErrorDto) {
    this.clientLogger.warn(`Erreur navigateur sur ${dto.path} : ${dto.message}`)
  }

  // ───────────── Boutique (public) ─────────────

  // Les données publiques changent peu : le navigateur peut les garder 1 minute
  @Get('products')
  @Header('Cache-Control', 'public, max-age=60')
  products() {
    return this.db.product.findMany({ where: { active: true }, orderBy: [{ category: 'asc' }, { name: 'asc' }] })
  }

  @Get('store-settings')
  @Header('Cache-Control', 'public, max-age=60')
  async storeSettings() {
    const { alertEmail: _private, ...settings } = await this.loadSettings()
    return { ...settings, deliveryZones: parseZones(settings.deliveryZones) }
  }

  private loadSettings() {
    return this.db.storeSettings.upsert({ where: { id: 'store' }, create: { id: 'store' }, update: {} })
  }

  @Get('reviews')
  @Header('Cache-Control', 'public, max-age=60')
  reviews() {
    return this.db.review.findMany({ where: { published: true }, orderBy: { createdAt: 'desc' }, take: 100 })
  }

  @Post('reviews')
  @RateLimit('review', 5, 60 * MINUTE)
  async createReview(@Req() request: Request, @Body() dto: CreateReviewDto) {
    assertHuman(dto.website)
    await assertCaptcha(dto.captchaToken, request, 'review')
    assertConsent(dto.consent, 'Cochez la case pour accepter la publication de votre prénom, de votre ville et de votre avis.')
    const product = dto.productSlug ? await this.db.product.findUnique({ where: { slug: dto.productSlug } }) : null
    await this.db.review.create({
      data: {
        authorName: dto.authorName.trim(), city: dto.city.trim(), rating: dto.rating, comment: dto.comment.trim(),
        productSlug: product?.slug ?? null, productName: product?.name ?? null, published: false,
      },
    })
    return { message: 'Merci ! Votre avis sera publié après vérification par la boutique.' }
  }

  @Get('images/:id')
  async image(@Param('id') id: string, @Res() response: Response) {
    const image = await this.db.image.findUnique({ where: { id } })
    if (!image || image.private) throw new NotFoundException('Image introuvable.')
    this.sendImage(response, image.mime, image.data, 'public, max-age=31536000, immutable')
  }

  @Post('orders')
  @UseGuards(CustomerGuard)
  @RateLimit('order', 10, 60 * MINUTE)
  async createOrder(@Req() request: Request, @Body() dto: CreateOrderDto) {
    const customerId = (request as Request & { customerId: string }).customerId
    assertHuman(dto.website)
    assertConsent(dto.acceptTerms, 'Vous devez accepter les conditions générales de vente pour commander.')
    // Double clic, réseau qui hésite, renvoi : la même clé renvoie la commande déjà créée
    if (dto.clientKey) {
      const existing = await this.db.order.findUnique({ where: { clientKey: dto.clientKey } })
      if (existing) {
        if (existing.customerId !== customerId) throw new BadRequestException('Commande invalide. Rechargez la page.')
        return {
          id: existing.id, reference: orderReference(existing.id), status: existing.status, totalXof: existing.totalXof,
          deliveryFeeXof: existing.deliveryFeeXof, deliveryZone: existing.deliveryZone,
        }
      }
    }
    if (!dto.items?.length) throw new BadRequestException('Ajoutez au moins un produit à la commande.')
    const phone = normalizePhone(dto.phone)
    const uniqueIds = [...new Set(dto.items.map((item) => item.productId))]
    if (uniqueIds.length !== dto.items.length) throw new BadRequestException('Regroupez les quantités d’un même produit.')
    const settings = await this.loadSettings()
    const zones = parseZones(settings.deliveryZones)
    const zone = dto.deliveryZone ? zones.find((z) => z.name === dto.deliveryZone) : undefined
    let alertItems: { name: string; size: string; quantity: number }[] = []
    try {
    const created = await this.db.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where: { id: { in: uniqueIds }, active: true } })
      if (products.length !== uniqueIds.length) throw new BadRequestException('Un produit n’est plus disponible.')
      const lines = dto.items.map((line) => {
        const product = products.find((entry) => entry.id === line.productId)!
        if (product.priceXof === null) throw new BadRequestException(`Le prix de ${product.name} doit être confirmé avant la commande.`)
        if (product.stock < line.quantity) throw new BadRequestException(`Stock insuffisant pour ${product.name}.`)
        return { product, quantity: line.quantity }
      })
      const totalXof = lines.reduce((sum, line) => sum + line.product.priceXof! * line.quantity, 0)
      alertItems = lines.map(({ product, quantity }) => ({ name: product.name, size: product.size, quantity }))
      const order = await tx.order.create({
        data: {
          customerId, customerName: dto.customerName.trim(), phone, commune: dto.commune.trim(),
          address: dto.address.trim(), deliveryNote: dto.deliveryNote?.trim(), totalXof,
          deliveryZone: zone?.name ?? null, deliveryFeeXof: zone?.feeXof ?? null, clientKey: dto.clientKey ?? null,
          items: { create: lines.map(({ product, quantity }) => ({
            productId: product.id, productName: product.name, productSize: product.size,
            unitPriceXof: product.priceXof!, quantity,
          })) },
        },
      })
      for (const { product, quantity } of lines) {
        const updated = await tx.product.updateMany({ where: { id: product.id, active: true, stock: { gte: quantity } }, data: { stock: { decrement: quantity } } })
        if (updated.count !== 1) throw new BadRequestException(`Stock insuffisant pour ${product.name}.`)
      }
      if (dto.saveAddress) {
        await tx.customer.update({
          where: { id: customerId },
          data: { commune: dto.commune.trim(), address: dto.address.trim(), deliveryZone: zone?.name ?? null },
        })
      }
      return {
        id: order.id, reference: orderReference(order.id), status: order.status, totalXof: order.totalXof,
        deliveryFeeXof: order.deliveryFeeXof, deliveryZone: order.deliveryZone,
      }
    })
    // Alerte de la boutique (WhatsApp ou SMS, et e-mail si renseigné), sans retarder ni bloquer la commande
    void alertNewOrder(
      { reference: created.reference, customerName: dto.customerName.trim(), phone, commune: dto.commune.trim(), totalXof: created.totalXof, deliveryZone: created.deliveryZone, deliveryFeeXof: created.deliveryFeeXof },
      alertItems,
      { whatsappNumber: settings.whatsappNumber, alertEmail: settings.alertEmail },
    ).catch(() => undefined)
    return created
    } catch (error) {
      // Deux envois simultanés avec la même clé : le second récupère la commande créée par le premier
      if (dto.clientKey && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.db.order.findUnique({ where: { clientKey: dto.clientKey } })
        if (existing && existing.customerId === customerId) {
          return {
            id: existing.id, reference: orderReference(existing.id), status: existing.status, totalXof: existing.totalXof,
            deliveryFeeXof: existing.deliveryFeeXof, deliveryZone: existing.deliveryZone,
          }
        }
      }
      throw error
    }
  }

  /** Le client joint la capture de son paiement Wave ; elle n'est visible que depuis l'administration. */
  @Post('orders/:id/proof')
  @UseGuards(CustomerGuard)
  @RateLimit('proof', 10, 60 * MINUTE)
  async uploadProof(@Req() request: Request, @Param('id') id: string, @Body() dto: ImageDto) {
    const order = await this.db.order.findUnique({ where: { id } })
    // Un client ne peut joindre une preuve qu'à ses propres commandes
    if (!order || order.customerId !== (request as Request & { customerId: string }).customerId) throw new NotFoundException('Commande introuvable.')
    if (!['pending', 'payment_review'].includes(order.status)) throw new BadRequestException('Cette commande est déjà confirmée : envoyez votre preuve sur WhatsApp.')
    const { mime, data } = decodeImage(dto.image)
    // Une seule capture par commande : la nouvelle remplace l'ancienne, qui est supprimée
    const previousId = order.paymentProofUrl?.split('/').pop()
    await this.db.$transaction(async (tx) => {
      const image = await tx.image.create({ data: { mime, data, private: true } })
      await tx.order.update({ where: { id }, data: { paymentProofUrl: `/admin/images/${image.id}`, status: 'payment_review' } })
      if (previousId) await tx.image.deleteMany({ where: { id: previousId, private: true } })
    })
    return { message: 'Preuve de paiement reçue. La boutique va la vérifier.' }
  }

  // ───────────── Administration ─────────────

  @Post('admin/login')
  @HttpCode(200)
  @RateLimit('login', 8, 15 * MINUTE)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const email = dto.email.trim().toLowerCase()
    const limiterKey = `admin-account:${email}`
    accountLimiter.assertNotBlocked(limiterKey, 8)
    const admin = await this.db.admin.findUnique({ where: { email } })
    if (!(await checkPassword(dto.password, admin?.passwordHash)) || !admin) {
      accountLimiter.recordFailure(limiterKey, 15 * MINUTE)
      throw new UnauthorizedException('Adresse courriel ou mot de passe invalide.')
    }
    accountLimiter.reset(limiterKey)
    const token = await this.jwt.signAsync({ sub: admin.id, kind: 'admin', version: admin.updatedAt.getTime() })
    response.cookie('ng_admin', token, this.cookieOptions())
    return { email: admin.email }
  }

  @Get('admin/me')
  @UseGuards(AdminGuard)
  async me(@Req() request: Request) {
    const admin = await this.db.admin.findUnique({ where: { id: (request as Request & { adminId: string }).adminId } })
    return { email: admin?.email ?? '' }
  }

  @Post('admin/logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response) { response.clearCookie('ng_admin', this.cookieOptions()) }

  @Post('admin/password')
  @UseGuards(AdminGuard)
  @RateLimit('password', 8, 15 * MINUTE)
  async changePassword(@Req() request: Request, @Body() dto: PasswordDto, @Res({ passthrough: true }) response: Response) {
    const adminId = (request as Request & { adminId: string }).adminId
    const admin = await this.db.admin.findUnique({ where: { id: adminId } })
    if (!admin) throw new NotFoundException('Compte administrateur introuvable.')
    if (!(await bcrypt.compare(dto.currentPassword, admin.passwordHash))) throw new UnauthorizedException('Mot de passe actuel incorrect.')
    const updated = await this.db.admin.update({ where: { id: adminId }, data: { passwordHash: await bcrypt.hash(dto.newPassword, 12) } })
    const token = await this.jwt.signAsync({ sub: updated.id, kind: 'admin', version: updated.updatedAt.getTime() })
    response.cookie('ng_admin', token, this.cookieOptions())
    return { message: 'Mot de passe modifié.' }
  }

  @Get('admin/products')
  @UseGuards(AdminGuard)
  adminProducts() { return this.db.product.findMany({ orderBy: { updatedAt: 'desc' } }) }

  @Post('admin/products')
  @UseGuards(AdminGuard)
  async addProduct(@Body() dto: ProductDto) {
    try { return await this.db.product.create({ data: { ...dto, ...this.cleanDetails(dto), slug: this.cleanSlug(dto.slug), priceXof: dto.priceXof ?? null, badge: dto.badge ?? null, active: dto.active ?? true } }) }
    catch (error) { this.rethrowUniqueSlug(error) }
  }

  @Patch('admin/products/:id')
  @UseGuards(AdminGuard)
  async updateProduct(@Param('id') id: string, @Body() dto: ProductDto) {
    const existing = await this.db.product.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('Produit introuvable.')
    try { return await this.db.product.update({ where: { id }, data: { ...dto, ...this.cleanDetails(dto), slug: this.cleanSlug(dto.slug), priceXof: dto.priceXof ?? null, badge: dto.badge ?? null } }) }
    catch (error) { this.rethrowUniqueSlug(error) }
  }

  private cleanDetails(dto: ProductDto) {
    return {
      benefits: cleanLines(dto.benefits), howToUse: cleanLines(dto.howToUse),
      ingredients: dto.ingredients?.trim() ?? '', origin: dto.origin?.trim() ?? '',
    }
  }

  /** Supprime un produit. S'il figure dans d'anciennes commandes, il est masqué pour garder l'historique intact. */
  @Delete('admin/products/:id')
  @UseGuards(AdminGuard)
  async deleteProduct(@Param('id') id: string) {
    const product = await this.db.product.findUnique({ where: { id }, include: { _count: { select: { orderItems: true } } } })
    if (!product) throw new NotFoundException('Produit introuvable.')
    if (product._count.orderItems > 0) {
      await this.db.product.update({ where: { id }, data: { active: false } })
      return { deleted: false, message: 'Ce produit figure dans des commandes : il a été masqué de la boutique au lieu d’être supprimé.' }
    }
    await this.db.product.delete({ where: { id } })
    return { deleted: true, message: 'Produit supprimé.' }
  }

  @Post('admin/images')
  @UseGuards(AdminGuard)
  async uploadImage(@Body() dto: ImageDto) {
    const { mime, data } = decodeImage(dto.image)
    const image = await this.db.image.create({ data: { mime, data } })
    return { url: `/images/${image.id}` }
  }

  @Get('admin/images/:id')
  @UseGuards(AdminGuard)
  async adminImage(@Param('id') id: string, @Res() response: Response) {
    const image = await this.db.image.findUnique({ where: { id } })
    if (!image) throw new NotFoundException('Image introuvable.')
    this.sendImage(response, image.mime, image.data, 'private, no-store')
  }

  @Get('admin/orders')
  @UseGuards(AdminGuard)
  async adminOrders(@Query('all') all?: string) {
    // Par défaut : les commandes en cours + celles des 3 derniers mois, pour garder la liste légère.
    // `?all=1` renvoie tout l'historique (bouton « Afficher aussi les plus anciennes »).
    const since = new Date(Date.now() - 90 * 24 * 60 * MINUTE)
    const where: Prisma.OrderWhereInput = all === '1'
      ? {}
      : { OR: [{ createdAt: { gte: since } }, { status: { in: ['pending', 'payment_review', 'confirmed', 'preparing', 'shipped'] } }] }
    const orders = await this.db.order.findMany({ where, include: { items: true }, orderBy: { createdAt: 'desc' } })
    return orders.map((order) => ({ ...order, reference: orderReference(order.id) }))
  }

  /** Change le statut ; annuler une commande remet ses produits en stock (et inversement). */
  @Patch('admin/orders/:id/status')
  @UseGuards(AdminGuard)
  async setOrderStatus(@Param('id') id: string, @Body() dto: OrderStatusDto) {
    let previousStatus: string | null = null
    return this.db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { items: true } })
      if (!order) throw new NotFoundException('Commande introuvable.')
      previousStatus = order.status
      const wasCancelled = order.status === 'cancelled'
      const willBeCancelled = dto.status === 'cancelled'
      if (!wasCancelled && willBeCancelled) {
        for (const item of order.items) await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } })
      }
      if (wasCancelled && !willBeCancelled) {
        for (const item of order.items) {
          const updated = await tx.product.updateMany({ where: { id: item.productId, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } })
          if (updated.count !== 1) throw new BadRequestException(`Stock insuffisant pour réactiver la commande (${item.productName}).`)
        }
      }
      return tx.order.update({ where: { id }, data: { status: dto.status }, include: { customer: { select: { email: true } } } })
    }).then((updated) => {
      // Suivi envoyé à la cliente (WhatsApp ou SMS si configuré), seulement quand le statut change vraiment
      if (updated.status !== previousStatus) {
        void notifyOrderStatus({ reference: orderReference(updated.id), phone: updated.phone, customerName: updated.customerName, email: updated.customer?.email }, updated.status).catch(() => undefined)
      }
      return updated
    })
  }

  /** Réglages complets, y compris l'e-mail d'alerte qui n'apparaît pas dans la version publique */
  @Get('admin/store-settings')
  @UseGuards(AdminGuard)
  async adminStoreSettings() {
    const settings = await this.loadSettings()
    return { ...settings, deliveryZones: parseZones(settings.deliveryZones) }
  }

  @Patch('admin/store-settings')
  @UseGuards(AdminGuard)
  async saveStoreSettings(@Body() dto: StoreSettingsDto) {
    const whatsappNumber = dto.whatsappNumber.replace(/\D/g, '')
    if (!whatsappNumber.startsWith('225') || whatsappNumber.length !== 13) throw new BadRequestException('Saisissez un numéro WhatsApp ivoirien au format +225 suivi de 10 chiffres.')
    const deliveryZones = (dto.deliveryZones ?? []).map((z) => ({ name: z.name.trim(), feeXof: z.feeXof ?? null, delay: z.delay?.trim() || undefined }))
    const names = deliveryZones.map((z) => z.name.toLowerCase())
    if (new Set(names).size !== names.length) throw new BadRequestException('Deux zones de livraison portent le même nom.')
    const alertEmail = dto.alertEmail?.trim().toLowerCase() ?? ''
    if (alertEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alertEmail)) throw new BadRequestException('Adresse e-mail d’alerte invalide.')
    const data = {
      alertEmail, whatsappNumber, deliveryCommunes: dto.deliveryCommunes, deliveryInfo: dto.deliveryInfo, waveInstructions: dto.waveInstructions,
      waveNumber: dto.waveNumber?.trim() ?? '', legalInfo: dto.legalInfo?.trim() ?? '', storeAddress: dto.storeAddress?.trim() ?? '', deliveryZones: deliveryZones as Prisma.InputJsonValue,
    }
    const saved = await this.db.storeSettings.upsert({ where: { id: 'store' }, create: { id: 'store', ...data }, update: data })
    return { ...saved, deliveryZones: parseZones(saved.deliveryZones) }
  }

  @Get('admin/reviews')
  @UseGuards(AdminGuard)
  adminReviews() { return this.db.review.findMany({ orderBy: { createdAt: 'desc' } }) }

  /** Avis reçu par WhatsApp ou de vive voix, saisi par la boutique : publié directement. */
  @Post('admin/reviews')
  @UseGuards(AdminGuard)
  async addReview(@Body() dto: CreateReviewDto) {
    const product = dto.productSlug ? await this.db.product.findUnique({ where: { slug: dto.productSlug } }) : null
    return this.db.review.create({
      data: {
        authorName: dto.authorName.trim(), city: dto.city.trim(), rating: dto.rating, comment: dto.comment.trim(),
        productSlug: product?.slug ?? null, productName: product?.name ?? null, published: true,
      },
    })
  }

  @Patch('admin/reviews/:id')
  @UseGuards(AdminGuard)
  async publishReview(@Param('id') id: string, @Body() dto: ReviewPublishDto) {
    try { return await this.db.review.update({ where: { id }, data: { published: dto.published } }) }
    catch { throw new NotFoundException('Avis introuvable.') }
  }

  @Delete('admin/reviews/:id')
  @UseGuards(AdminGuard)
  @HttpCode(204)
  async deleteReview(@Param('id') id: string) {
    try { await this.db.review.delete({ where: { id } }) }
    catch { throw new NotFoundException('Avis introuvable.') }
  }

  // ───────────── Outils ─────────────

  private sendImage(response: Response, mime: string, data: Uint8Array, cache: string) {
    response.set({ 'Content-Type': mime, 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff', 'Content-Disposition': 'inline' })
    response.send(Buffer.from(data))
  }

  private cleanSlug(slug: string) {
    const clean = slug.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    if (clean.length < 2) throw new BadRequestException('Identifiant URL invalide.')
    return clean
  }

  private rethrowUniqueSlug(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new BadRequestException('Un autre produit utilise déjà cet identifiant URL.')
    throw error
  }

  private cookieOptions() {
    return { ...sessionCookieBase(), maxAge: 8 * 60 * 60 * 1000 }
  }
}
