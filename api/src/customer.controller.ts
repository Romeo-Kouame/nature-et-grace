import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Patch, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { Request, Response } from 'express'
import * as bcrypt from 'bcryptjs'
import { Customer, Prisma } from './generated/prisma/client'
import { CustomerGuard, checkPassword, customerSessionVersion } from './auth'
import { PrismaService } from './prisma.service'
import { RateLimit, accountLimiter } from './rate-limit'
import { assertConsent, assertHuman, orderReference, sessionCookieBase } from './images'
import { assertCaptcha } from './captcha'

const MINUTE = 60_000
const COOKIE = 'ng_customer'
const ACCOUNT_MAX_FAILURES = 10

class RegisterDto {
  @IsString() @MinLength(2) @MaxLength(80) name!: string
  @IsString() @MinLength(8) @MaxLength(25) phone!: string
  @IsOptional() @IsEmail() @MaxLength(120) email?: string
  @IsString() @MinLength(8) @MaxLength(200) password!: string
  /** Case « J'accepte les CGV et la politique de confidentialité » */
  @IsOptional() @IsBoolean() acceptTerms?: boolean
  /** Champ piège anti-robots, toujours vide pour un humain */
  @IsOptional() @IsString() @MaxLength(200) website?: string
  @IsOptional() @IsString() @MaxLength(2048) captchaToken?: string
}
class DeleteAccountDto {
  @IsString() @MinLength(1) @MaxLength(200) password!: string
}
class LoginDto {
  /** Numéro de téléphone ou adresse e-mail */
  @IsString() @MinLength(3) @MaxLength(120) identifier!: string
  @IsString() @MinLength(1) @MaxLength(200) password!: string
  @IsOptional() @IsString() @MaxLength(2048) captchaToken?: string
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

export const publicCustomer = (c: Customer) => ({
  id: c.id, name: c.name, phone: c.phone, email: c.email, commune: c.commune, address: c.address, deliveryZone: c.deliveryZone,
  /** Faux pour un compte créé avec Google : pas de mot de passe à changer */
  hasPassword: Boolean(c.passwordHash),
  google: Boolean(c.googleId),
})

/** Ouvre la session client (cookie `ng_customer`, 30 jours). */
export async function startCustomerSession(jwt: JwtService, customer: Customer, response: Response) {
  const token = await jwt.signAsync({ sub: customer.id, kind: 'customer', version: customerSessionVersion(customer) }, { expiresIn: '30d' })
  response.cookie(COOKIE, token, customerCookieOptions())
}

export const customerCookieOptions = () => ({ ...sessionCookieBase(), maxAge: 30 * 24 * 60 * 60 * 1000 })

/** Mot à taper pour supprimer un compte Google (qui n'a pas de mot de passe) */
export const DELETE_CONFIRMATION = 'SUPPRIMER'

type CustomerRequest = Request & { customerId: string }

@Controller('customer')
export class CustomerController {
  constructor(private readonly db: PrismaService, private readonly jwt: JwtService) {}

  @Post('register')
  @RateLimit('register', 5, 60 * MINUTE)
  async register(@Req() request: Request, @Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    assertHuman(dto.website)
    await assertCaptcha(dto.captchaToken, request, 'signup')
    assertConsent(dto.acceptTerms)
    const phone = normalizePhone(dto.phone)
    const email = dto.email?.trim().toLowerCase() || null
    if (await this.db.customer.findUnique({ where: { phone } })) throw new BadRequestException('Un compte existe déjà avec ce numéro. Connectez-vous.')
    if (email && (await this.db.customer.findUnique({ where: { email } }))) throw new BadRequestException('Un compte existe déjà avec cette adresse e-mail.')
    const customer = await this.db.customer.create({
      data: { name: dto.name.trim(), phone, email, passwordHash: await bcrypt.hash(dto.password, 12), termsAcceptedAt: new Date() },
    })
    await this.startSession(customer, response)
    return publicCustomer(customer)
  }

  @Post('login')
  @HttpCode(200)
  @RateLimit('customer-login', 10, 15 * MINUTE)
  async login(@Req() request: Request, @Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    await assertCaptcha(dto.captchaToken, request, 'login')
    const id = dto.identifier.trim()
    let customer: Customer | null = null
    let accountKey = id.toLowerCase()
    if (id.includes('@')) customer = await this.db.customer.findUnique({ where: { email: accountKey } })
    else {
      try {
        accountKey = normalizePhone(id)
        customer = await this.db.customer.findUnique({ where: { phone: accountKey } })
      } catch { customer = null }
    }
    // Limite par compte visé, en plus de la limite par adresse IP
    const limiterKey = `customer-account:${accountKey}`
    accountLimiter.assertNotBlocked(limiterKey, ACCOUNT_MAX_FAILURES)
    if (!(await checkPassword(dto.password, customer?.passwordHash)) || !customer) {
      accountLimiter.recordFailure(limiterKey, 15 * MINUTE)
      throw new UnauthorizedException('Numéro (ou e-mail) ou mot de passe incorrect.')
    }
    accountLimiter.reset(limiterKey)
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
    if (!customer.passwordHash) throw new BadRequestException('Votre compte utilise la connexion Google : il n’a pas de mot de passe à modifier.')
    if (!(await bcrypt.compare(dto.currentPassword, customer.passwordHash))) throw new UnauthorizedException('Mot de passe actuel incorrect.')
    const updated = await this.db.customer.update({ where: { id: customer.id }, data: { passwordHash: await bcrypt.hash(dto.newPassword, 12) } })
    await this.startSession(updated, response)
    return { message: 'Mot de passe modifié.' }
  }

  /**
   * Suppression du compte à la demande du client (droit à l'effacement).
   * Les commandes passées sont gardées pour la comptabilité, mais vidées de toute donnée personnelle
   * (nom, téléphone, adresse) et les captures de paiement sont supprimées.
   */
  @Delete('me')
  @HttpCode(200)
  @UseGuards(CustomerGuard)
  @RateLimit('customer-delete', 5, 15 * MINUTE)
  async deleteMe(@Req() request: CustomerRequest, @Body() dto: DeleteAccountDto, @Res({ passthrough: true }) response: Response) {
    const customer = await this.db.customer.findUniqueOrThrow({ where: { id: request.customerId } })
    // Compte Google : pas de mot de passe, le client tape « SUPPRIMER » pour confirmer
    const confirmed = customer.passwordHash
      ? await bcrypt.compare(dto.password, customer.passwordHash)
      : dto.password.trim().toUpperCase() === DELETE_CONFIRMATION
    if (!confirmed) throw new UnauthorizedException(customer.passwordHash ? 'Mot de passe incorrect.' : `Tapez ${DELETE_CONFIRMATION} pour confirmer.`)
    const inProgress = await this.db.order.count({
      where: { customerId: customer.id, status: { in: ['pending', 'payment_review', 'confirmed', 'preparing', 'shipped'] } },
    })
    if (inProgress > 0) {
      throw new BadRequestException('Une commande est encore en cours. Vous pourrez supprimer votre compte une fois qu’elle sera livrée ou annulée.')
    }
    await this.db.$transaction(async (tx) => {
      const orders = await tx.order.findMany({ where: { customerId: customer.id }, select: { paymentProofUrl: true } })
      const proofIds = orders.map((o) => o.paymentProofUrl?.split('/').pop()).filter((id): id is string => Boolean(id))
      if (proofIds.length) await tx.image.deleteMany({ where: { id: { in: proofIds }, private: true } })
      await tx.order.updateMany({
        where: { customerId: customer.id },
        data: { customerName: 'Client supprimé', phone: '', commune: '', address: '', deliveryNote: null, paymentProofUrl: null },
      })
      await tx.customer.delete({ where: { id: customer.id } })
    })
    response.clearCookie(COOKIE, this.cookieOptions())
    return { message: 'Votre compte et vos données personnelles ont été supprimés.' }
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

  private startSession(customer: Customer, response: Response) {
    return startCustomerSession(this.jwt, customer, response)
  }

  private cookieOptions() {
    return customerCookieOptions()
  }
}
