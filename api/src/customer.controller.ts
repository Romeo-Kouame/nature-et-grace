import { BadRequestException, Body, Controller, Get, HttpCode, Patch, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { Request, Response } from 'express'
import * as bcrypt from 'bcryptjs'
import { Customer, Prisma } from '@prisma/client'
import { CustomerGuard, customerSessionVersion } from './auth'
import { PrismaService } from './prisma.service'
import { RateLimit } from './rate-limit'
import { orderReference } from './images'

const MINUTE = 60_000
const COOKIE = 'ng_customer'

class RegisterDto {
  @IsString() @MinLength(2) @MaxLength(80) name!: string
  @IsString() @MinLength(8) @MaxLength(25) phone!: string
  @IsOptional() @IsEmail() @MaxLength(120) email?: string
  @IsString() @MinLength(8) @MaxLength(200) password!: string
}
class LoginDto {
  /** Numéro de téléphone ou adresse e-mail */
  @IsString() @MinLength(3) @MaxLength(120) identifier!: string
  @IsString() @MinLength(1) @MaxLength(200) password!: string
}
class ProfileDto {
  @IsString() @MinLength(2) @MaxLength(80) name!: string
  @IsOptional() @IsString() @MaxLength(120) email?: string
  @IsOptional() @IsString() @MaxLength(80) commune?: string
  @IsOptional() @IsString() @MaxLength(400) address?: string
  @IsOptional() @IsString() @MaxLength(80) deliveryZone?: string
}
class PasswordDto {
  @IsString() @MinLength(1) currentPassword!: string
  @IsString() @MinLength(8) @MaxLength(200) newPassword!: string
}

/** « 07 01 02 03 04 », « +225 0701020304 » → « 2250701020304 » */
export function normalizePhone(raw: string): string {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.length === 10) d = `225${d}`
  if (!/^225\d{10}$/.test(d)) throw new BadRequestException('Saisissez un numéro ivoirien à 10 chiffres (ex. 07 01 02 03 04).')
  return d
}

const publicCustomer = (c: Customer) => ({
  id: c.id, name: c.name, phone: c.phone, email: c.email, commune: c.commune, address: c.address, deliveryZone: c.deliveryZone,
})

type CustomerRequest = Request & { customerId: string }

@Controller('customer')
export class CustomerController {
  constructor(private readonly db: PrismaService, private readonly jwt: JwtService) {}

  @Post('register')
  @RateLimit('register', 5, 60 * MINUTE)
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const phone = normalizePhone(dto.phone)
    const email = dto.email?.trim().toLowerCase() || null
    if (await this.db.customer.findUnique({ where: { phone } })) throw new BadRequestException('Un compte existe déjà avec ce numéro. Connectez-vous.')
    if (email && (await this.db.customer.findUnique({ where: { email } }))) throw new BadRequestException('Un compte existe déjà avec cette adresse e-mail.')
    const customer = await this.db.customer.create({
      data: { name: dto.name.trim(), phone, email, passwordHash: await bcrypt.hash(dto.password, 12) },
    })
    await this.startSession(customer, response)
    return publicCustomer(customer)
  }

  @Post('login')
  @HttpCode(200)
  @RateLimit('customer-login', 10, 15 * MINUTE)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const id = dto.identifier.trim()
    let customer: Customer | null = null
    if (id.includes('@')) customer = await this.db.customer.findUnique({ where: { email: id.toLowerCase() } })
    else {
      try { customer = await this.db.customer.findUnique({ where: { phone: normalizePhone(id) } }) } catch { customer = null }
    }
    if (!customer || !(await bcrypt.compare(dto.password, customer.passwordHash))) {
      throw new UnauthorizedException('Numéro (ou e-mail) ou mot de passe incorrect.')
    }
    await this.startSession(customer, response)
    return publicCustomer(customer)
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(COOKIE, this.cookieOptions())
  }

  @Get('me')
  @UseGuards(CustomerGuard)
  async me(@Req() request: CustomerRequest) {
    const customer = await this.db.customer.findUniqueOrThrow({ where: { id: request.customerId } })
    return publicCustomer(customer)
  }

  @Patch('me')
  @UseGuards(CustomerGuard)
  async updateMe(@Req() request: CustomerRequest, @Body() dto: ProfileDto) {
    const email = dto.email?.trim().toLowerCase() || null
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException('Adresse e-mail invalide.')
    try {
      const customer = await this.db.customer.update({
        where: { id: request.customerId },
        data: {
          name: dto.name.trim(), email,
          commune: dto.commune?.trim() || null, address: dto.address?.trim() || null, deliveryZone: dto.deliveryZone?.trim() || null,
        },
      })
      return publicCustomer(customer)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new BadRequestException('Cette adresse e-mail est déjà utilisée par un autre compte.')
      throw error
    }
  }

  @Post('password')
  @UseGuards(CustomerGuard)
  @RateLimit('customer-password', 8, 15 * MINUTE)
  async changePassword(@Req() request: CustomerRequest, @Body() dto: PasswordDto, @Res({ passthrough: true }) response: Response) {
    const customer = await this.db.customer.findUniqueOrThrow({ where: { id: request.customerId } })
    if (!(await bcrypt.compare(dto.currentPassword, customer.passwordHash))) throw new UnauthorizedException('Mot de passe actuel incorrect.')
    const updated = await this.db.customer.update({ where: { id: customer.id }, data: { passwordHash: await bcrypt.hash(dto.newPassword, 12) } })
    await this.startSession(updated, response)
    return { message: 'Mot de passe modifié.' }
  }

  @Get('orders')
  @UseGuards(CustomerGuard)
  async orders(@Req() request: CustomerRequest) {
    const orders = await this.db.order.findMany({
      where: { customerId: request.customerId },
      include: { items: { select: { productName: true, productSize: true, quantity: true, unitPriceXof: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return orders.map(({ paymentProofUrl, customerId: _c, ...order }) => ({ ...order, reference: orderReference(order.id), proofSent: Boolean(paymentProofUrl) }))
  }

  private async startSession(customer: Customer, response: Response) {
    const token = await this.jwt.signAsync({ sub: customer.id, kind: 'customer', version: customerSessionVersion(customer.passwordHash) }, { expiresIn: '30d' })
    response.cookie(COOKIE, token, this.cookieOptions())
  }

  private cookieOptions() {
    const secure = process.env.COOKIE_SECURE === 'true'
    return { httpOnly: true, secure, sameSite: secure ? ('none' as const) : ('lax' as const), path: '/', maxAge: 30 * 24 * 60 * 60 * 1000 }
  }
}
