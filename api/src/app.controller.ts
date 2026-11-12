import {
  Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req, Res, UseGuards,
  BadRequestException, NotFoundException, UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import {
  ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsEnum, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { Request, Response } from 'express'
import * as bcrypt from 'bcryptjs'
import { OrderStatus, Prisma } from '@prisma/client'
import { AdminGuard, CustomerGuard } from './auth'
import { PrismaService } from './prisma.service'
import { GeminiService } from './gemini.service'
import { RateLimit } from './rate-limit'
import { decodeImage, orderReference } from './images'

const MINUTE = 60_000

class BeautyAdviceDto {
  @IsString() @MinLength(2) @MaxLength(600) message!: string
  @IsOptional() @IsString() @MaxLength(200) skinType?: string
}

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
}
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
  @IsOptional() @IsArray() @ArrayMaxSize(60) @ValidateNested({ each: true }) @Type(() => DeliveryZoneDto) deliveryZones?: DeliveryZoneDto[]
}
class CreateReviewDto {
  @IsString() @MinLength(2) @MaxLength(60) authorName!: string
  @IsString() @MinLength(2) @MaxLength(60) city!: string
  @IsOptional() @IsString() @MaxLength(80) productSlug?: string
  @IsInt() @Min(1) @Max(5) rating!: number
  @IsString() @MinLength(10) @MaxLength(1000) comment!: string
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
  constructor(
    private readonly db: PrismaService,
    private readonly jwt: JwtService,
    private readonly gemini: GeminiService,
  ) {}

  // ───────────── IA ─────────────

  @Post('ai/advisor')
  @RateLimit('advisor', 15, 10 * MINUTE)
  getBeautyAdvice(@Body() dto: BeautyAdviceDto) {
    return this.gemini.getBeautyAdvice(dto)
  }

  @Post('ai/generate-description')
  @UseGuards(AdminGuard)
  generateDescription(@Body() dto: GenerateDescriptionDto) {
    return this.gemini.generateProductDescription(dto)
  }

  // ───────────── Boutique (public) ─────────────

  @Get('products')
  products() {
    return this.db.product.findMany({ where: { active: true }, orderBy: [{ category: 'asc' }, { name: 'asc' }] })
  }

  @Get('store-settings')
  async storeSettings() {
    const settings = await this.db.storeSettings.upsert({ where: { id: 'store' }, create: { id: 'store' }, update: {} })
    return { ...settings, deliveryZones: parseZones(settings.deliveryZones) }
  }

  @Get('reviews')
  reviews() {
    return this.db.review.findMany({ where: { published: true }, orderBy: { createdAt: 'desc' }, take: 100 })
  }

  @Post('reviews')
  @RateLimit('review', 5, 60 * MINUTE)
  async createReview(@Body() dto: CreateReviewDto) {
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
    if (!dto.items?.length) throw new BadRequestException('Ajoutez au moins un produit à la commande.')
    const uniqueIds = [...new Set(dto.items.map((item) => item.productId))]
    if (uniqueIds.length !== dto.items.length) throw new BadRequestException('Regroupez les quantités d’un même produit.')
    const settings = await this.storeSettings()
    const zone = dto.deliveryZone ? settings.deliveryZones.find((z) => z.name === dto.deliveryZone) : undefined
    return this.db.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where: { id: { in: uniqueIds }, active: true } })
      if (products.length !== uniqueIds.length) throw new BadRequestException('Un produit n’est plus disponible.')
      const lines = dto.items.map((line) => {
        const product = products.find((entry) => entry.id === line.productId)!
        if (product.priceXof === null) throw new BadRequestException(`Le prix de ${product.name} doit être confirmé avant la commande.`)
        if (product.stock < line.quantity) throw new BadRequestException(`Stock insuffisant pour ${product.name}.`)
        return { product, quantity: line.quantity }
      })
      const totalXof = lines.reduce((sum, line) => sum + line.product.priceXof! * line.quantity, 0)
      const order = await tx.order.create({
        data: {
          customerId, customerName: dto.customerName.trim(), phone: dto.phone.trim(), commune: dto.commune.trim(),
          address: dto.address.trim(), deliveryNote: dto.deliveryNote?.trim(), totalXof,
          deliveryZone: zone?.name ?? null, deliveryFeeXof: zone?.feeXof ?? null,
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
    const image = await this.db.image.create({ data: { mime, data, private: true } })
    await this.db.order.update({ where: { id }, data: { paymentProofUrl: `/admin/images/${image.id}`, status: 'payment_review' } })
    return { message: 'Preuve de paiement reçue. La boutique va la vérifier.' }
  }

  // ───────────── Administration ─────────────

  @Post('admin/login')
  @HttpCode(200)
  @RateLimit('login', 8, 15 * MINUTE)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const admin = await this.db.admin.findUnique({ where: { email: dto.email.trim().toLowerCase() } })
    if (!admin || !(await bcrypt.compare(dto.password, admin.passwordHash))) throw new UnauthorizedException('Adresse courriel ou mot de passe invalide.')
    const token = await this.jwt.signAsync({ sub: admin.id, version: admin.updatedAt.getTime() })
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
    const token = await this.jwt.signAsync({ sub: updated.id, version: updated.updatedAt.getTime() })
    response.cookie('ng_admin', token, this.cookieOptions())
    return { message: 'Mot de passe modifié.' }
  }

  @Get('admin/products')
  @UseGuards(AdminGuard)
  adminProducts() { return this.db.product.findMany({ orderBy: { updatedAt: 'desc' } }) }

  @Post('admin/products')
  @UseGuards(AdminGuard)
  async addProduct(@Body() dto: ProductDto) {
    try { return await this.db.product.create({ data: { ...dto, slug: this.cleanSlug(dto.slug), priceXof: dto.priceXof ?? null, badge: dto.badge ?? null, active: dto.active ?? true } }) }
    catch (error) { this.rethrowUniqueSlug(error) }
  }

  @Patch('admin/products/:id')
  @UseGuards(AdminGuard)
  async updateProduct(@Param('id') id: string, @Body() dto: ProductDto) {
    const existing = await this.db.product.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('Produit introuvable.')
    try { return await this.db.product.update({ where: { id }, data: { ...dto, slug: this.cleanSlug(dto.slug), priceXof: dto.priceXof ?? null, badge: dto.badge ?? null } }) }
    catch (error) { this.rethrowUniqueSlug(error) }
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
  async adminOrders() {
    const orders = await this.db.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } })
    return orders.map((order) => ({ ...order, reference: orderReference(order.id) }))
  }

  /** Change le statut ; annuler une commande remet ses produits en stock (et inversement). */
  @Patch('admin/orders/:id/status')
  @UseGuards(AdminGuard)
  async setOrderStatus(@Param('id') id: string, @Body() dto: OrderStatusDto) {
    return this.db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { items: true } })
      if (!order) throw new NotFoundException('Commande introuvable.')
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
      return tx.order.update({ where: { id }, data: { status: dto.status } })
    })
  }

  @Patch('admin/store-settings')
  @UseGuards(AdminGuard)
  async saveStoreSettings(@Body() dto: StoreSettingsDto) {
    const whatsappNumber = dto.whatsappNumber.replace(/\D/g, '')
    if (!whatsappNumber.startsWith('225') || whatsappNumber.length !== 13) throw new BadRequestException('Saisissez un numéro WhatsApp ivoirien au format +225 suivi de 10 chiffres.')
    const deliveryZones = (dto.deliveryZones ?? []).map((z) => ({ name: z.name.trim(), feeXof: z.feeXof ?? null, delay: z.delay?.trim() || undefined }))
    const names = deliveryZones.map((z) => z.name.toLowerCase())
    if (new Set(names).size !== names.length) throw new BadRequestException('Deux zones de livraison portent le même nom.')
    const data = {
      whatsappNumber, deliveryCommunes: dto.deliveryCommunes, deliveryInfo: dto.deliveryInfo, waveInstructions: dto.waveInstructions,
      waveNumber: dto.waveNumber?.trim() ?? '', legalInfo: dto.legalInfo?.trim() ?? '', deliveryZones: deliveryZones as Prisma.InputJsonValue,
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
    const secure = process.env.COOKIE_SECURE === 'true'
    return { httpOnly: true, secure, sameSite: secure ? 'none' as const : 'lax' as const, path: '/', maxAge: 8 * 60 * 60 * 1000 }
  }
}
