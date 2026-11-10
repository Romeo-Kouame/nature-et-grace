import {
  Body, Controller, Get, HttpCode, Patch, Post, Req, Res, UseGuards,
  BadRequestException, NotFoundException, UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { IsArray, IsBoolean, IsEmail, IsEnum, IsInt, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { Request, Response } from 'express'
import * as bcrypt from 'bcryptjs'
import { OrderStatus } from '@prisma/client'
import { AdminGuard } from './auth'
import { PrismaService } from './prisma.service'

class LoginDto {
  @IsEmail() email!: string
  @IsString() @MinLength(1) password!: string
}
class PasswordDto {
  @IsString() @MinLength(1) currentPassword!: string
  @IsString() @MinLength(12) newPassword!: string
}
class OrderLineDto {
  @IsString() productId!: string
  @IsInt() @Min(1) quantity!: number
}
class CreateOrderDto {
  @IsString() @MinLength(2) customerName!: string
  @IsString() @MinLength(8) phone!: string
  @IsString() @MinLength(2) commune!: string
  @IsString() @MinLength(5) address!: string
  @IsOptional() @IsString() deliveryNote?: string
  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderLineDto) items!: OrderLineDto[]
}
class ProductDto {
  @IsString() @MinLength(2) name!: string
  @IsString() @MinLength(2) slug!: string
  @IsString() @MinLength(2) category!: string
  @IsString() @MinLength(2) description!: string
  @IsString() @MinLength(1) size!: string
  @IsOptional() @IsInt() @Min(0) priceXof?: number | null
  @IsOptional() @IsString() imageUrl?: string | null
  @IsInt() @Min(0) stock!: number
  @IsOptional() @IsBoolean() active?: boolean
}
class OrderStatusDto {
  @IsEnum(OrderStatus) status!: OrderStatus
}
class StoreSettingsDto {
  @IsString() @MinLength(8) whatsappNumber!: string
  @IsString() @MinLength(2) deliveryCommunes!: string
  @IsString() @MinLength(2) deliveryInfo!: string
  @IsString() @MinLength(2) waveInstructions!: string
}

@Controller()
export class AppController {
  constructor(private readonly db: PrismaService, private readonly jwt: JwtService) {}

  @Get('products')
  products() {
    return this.db.product.findMany({ where: { active: true }, orderBy: [{ category: 'asc' }, { name: 'asc' }] })
  }

  @Get('store-settings')
  storeSettings() {
    return this.db.storeSettings.upsert({ where: { id: 'store' }, create: { id: 'store' }, update: {} })
  }

  @Post('orders')
  async createOrder(@Body() dto: CreateOrderDto) {
    if (!dto.items?.length || dto.items.length > 30) throw new BadRequestException('Ajoutez au moins un produit à la commande.')
    const uniqueIds = [...new Set(dto.items.map((item) => item.productId))]
    if (uniqueIds.length !== dto.items.length) throw new BadRequestException('Regroupez les quantités d’un même produit.')
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
          customerName: dto.customerName.trim(), phone: dto.phone.trim(), commune: dto.commune.trim(),
          address: dto.address.trim(), deliveryNote: dto.deliveryNote?.trim(), totalXof,
          items: { create: lines.map(({ product, quantity }) => ({
            productId: product.id, productName: product.name, productSize: product.size,
            unitPriceXof: product.priceXof!, quantity,
          })) },
        }, include: { items: true },
      })
      for (const { product, quantity } of lines) {
        const updated = await tx.product.updateMany({ where: { id: product.id, active: true, stock: { gte: quantity } }, data: { stock: { decrement: quantity } } })
        if (updated.count !== 1) throw new BadRequestException(`Stock insuffisant pour ${product.name}.`)
      }
      return { id: order.id, status: order.status, totalXof: order.totalXof }
    })
  }

  @Post('admin/login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const admin = await this.db.admin.findUnique({ where: { email: dto.email.trim().toLowerCase() } })
    if (!admin || !(await bcrypt.compare(dto.password, admin.passwordHash))) throw new UnauthorizedException('Adresse courriel ou mot de passe invalide.')
    const token = await this.jwt.signAsync({ sub: admin.id, version: admin.updatedAt.getTime() })
    response.cookie('ng_admin', token, this.cookieOptions())
    return { email: admin.email }
  }

  @Post('admin/logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response) { response.clearCookie('ng_admin', this.cookieOptions()) }

  @Post('admin/password')
  @UseGuards(AdminGuard)
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
  addProduct(@Body() dto: ProductDto) { return this.db.product.create({ data: { ...dto, priceXof: dto.priceXof ?? null, active: dto.active ?? true } }) }

  @Patch('admin/products/:id')
  @UseGuards(AdminGuard)
  async updateProduct(@Req() request: Request, @Body() dto: ProductDto) {
    const rawId = request.params.id
    const id = Array.isArray(rawId) ? rawId[0] : rawId
    if (!id) throw new NotFoundException('Produit introuvable.')
    try { return await this.db.product.update({ where: { id }, data: dto }) }
    catch { throw new NotFoundException('Produit introuvable.') }
  }

  @Get('admin/orders')
  @UseGuards(AdminGuard)
  adminOrders() { return this.db.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } }) }

  @Patch('admin/store-settings')
  @UseGuards(AdminGuard)
  saveStoreSettings(@Body() dto: StoreSettingsDto) {
    const whatsappNumber = dto.whatsappNumber.replace(/\D/g, '')
    if (!whatsappNumber.startsWith('225') || whatsappNumber.length !== 13) throw new BadRequestException('Saisissez un numéro WhatsApp ivoirien au format +225 suivi de 10 chiffres.')
    return this.db.storeSettings.upsert({
      where: { id: 'store' }, create: { id: 'store', ...dto, whatsappNumber }, update: { ...dto, whatsappNumber },
    })
  }

  @Patch('admin/orders/:id/status')
  @UseGuards(AdminGuard)
  async setOrderStatus(@Req() request: Request, @Body() dto: OrderStatusDto) {
    const rawId = request.params.id
    const id = Array.isArray(rawId) ? rawId[0] : rawId
    if (!id) throw new NotFoundException('Commande introuvable.')
    try { return await this.db.order.update({ where: { id }, data: { status: dto.status } }) }
    catch { throw new NotFoundException('Commande introuvable.') }
  }

  private cookieOptions() {
    const secure = process.env.COOKIE_SECURE === 'true'
    return { httpOnly: true, secure, sameSite: secure ? 'none' as const : 'lax' as const, path: '/', maxAge: 8 * 60 * 60 * 1000 }
  }
}
