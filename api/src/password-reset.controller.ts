import { BadRequestException, Body, Controller, HttpCode, Post, Req, Res, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { Request, Response } from 'express'
import * as bcrypt from 'bcryptjs'
import { Customer } from './generated/prisma/client'
import { PrismaService } from './prisma.service'
import { RateLimit, accountLimiter } from './rate-limit'
import { assertCaptcha } from './captcha'
import { normalizePhone, publicCustomer, startCustomerSession } from './customer.controller'
import { devConsoleDelivery, emailEnabled, sendEmail, sendSms, smsEnabled } from './notify'

const MINUTE = 60_000
const CODE_TTL_MS = 15 * MINUTE
const MAX_ATTEMPTS = 5
/** Envois de code par compte et par heure (au-delà, la demande est ignorée sans le dire) */
const MAX_SENDS_PER_HOUR = 3
const GENERIC_SENT = 'Si un compte correspond, un code à 6 chiffres vient d’être envoyé. Il est valable 15 minutes.'
const BAD_CODE = 'Code incorrect ou expiré. Demandez un nouveau code.'

class ForgotDto {
  /** Numéro de téléphone ou adresse e-mail du compte */
  @IsString() @MinLength(3) @MaxLength(120) identifier!: string
  @IsOptional() @IsString() @MaxLength(2048) captchaToken?: string
}
class ResetDto {
  @IsString() @MinLength(3) @MaxLength(120) identifier!: string
  @IsString() @MinLength(6) @MaxLength(6) code!: string
  @IsString() @MinLength(8) @MaxLength(200) newPassword!: string
}

/** Empreinte du code : liée au compte et au secret du serveur, le code lui-même n'est jamais stocké */
const codeHash = (customerId: string, code: string) =>
  createHmac('sha256', process.env.JWT_SECRET ?? '').update(`${customerId}:${code}`).digest('base64url')

const sameHash = (a: string, b: string) => {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

/**
 * « Mot de passe oublié » sans intervention de la boutique :
 * 1. la cliente donne son téléphone ou son e-mail → un code à 6 chiffres part par e-mail (si elle a donné son e-mail
 *    et qu'il est configuré) ou par SMS ;
 * 2. elle saisit le code et son nouveau mot de passe → les autres appareils sont déconnectés, elle est connectée.
 * La réponse est la même que le compte existe ou non (pas de fuite sur l'existence d'un compte).
 */
@Controller('customer/password')
export class PasswordResetController {
  constructor(private readonly db: PrismaService, private readonly jwt: JwtService) {}

  @Post('forgot')
  @HttpCode(200)
  @RateLimit('password-forgot', 5, 15 * MINUTE)
  async forgot(@Req() request: Request, @Body() dto: ForgotDto) {
    await assertCaptcha(dto.captchaToken, request, 'reset')
    if (!emailEnabled() && !smsEnabled() && !devConsoleDelivery()) {
      throw new ServiceUnavailableException('L’envoi de code est momentanément indisponible. Écrivez-nous sur WhatsApp, nous vous aidons.')
    }
    const { customer, byEmail } = await this.findAccount(dto.identifier)
    if (!customer) return { message: GENERIC_SENT }

    const since = new Date(Date.now() - 60 * MINUTE)
    const recent = await this.db.passwordReset.count({ where: { customerId: customer.id, createdAt: { gte: since } } })
    if (recent >= MAX_SENDS_PER_HOUR) return { message: GENERIC_SENT }

    // E-mail si la cliente l'a utilisé (ou si le SMS n'est pas disponible), sinon SMS
    const channel = customer.email && (byEmail || !smsEnabled()) && (emailEnabled() || !smsEnabled()) ? 'email' : 'sms'
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
    await this.db.$transaction([
      // Un seul code valable à la fois
      this.db.passwordReset.updateMany({ where: { customerId: customer.id, usedAt: null }, data: { usedAt: new Date() } }),
      this.db.passwordReset.create({ data: { customerId: customer.id, codeHash: codeHash(customer.id, code), channel, expiresAt: new Date(Date.now() + CODE_TTL_MS) } }),
    ])
    const text = `Nature & Grâce : votre code pour choisir un nouveau mot de passe est ${code}. Il est valable 15 minutes. Si vous n’avez rien demandé, ignorez ce message.`
    if (channel === 'email') await sendEmail(customer.email!, `Votre code Nature & Grâce : ${code}`, text)
    else await sendSms(customer.phone, text)
    return { message: GENERIC_SENT }
  }

  @Post('reset')
  @HttpCode(200)
  @RateLimit('password-reset', 10, 15 * MINUTE)
  async reset(@Body() dto: ResetDto, @Res({ passthrough: true }) response: Response) {
    if (!/^\d{6}$/.test(dto.code)) throw new BadRequestException(BAD_CODE)
    const { customer } = await this.findAccount(dto.identifier)
    const limiterKey = `password-reset:${customer?.id ?? dto.identifier.trim().toLowerCase()}`
    accountLimiter.assertNotBlocked(limiterKey, MAX_ATTEMPTS * 2)
    if (!customer) {
      accountLimiter.recordFailure(limiterKey, 15 * MINUTE)
      throw new UnauthorizedException(BAD_CODE)
    }
    const pending = await this.db.passwordReset.findFirst({
      where: { customerId: customer.id, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })
    if (!pending || pending.attempts >= MAX_ATTEMPTS) {
      accountLimiter.recordFailure(limiterKey, 15 * MINUTE)
      throw new UnauthorizedException(BAD_CODE)
    }
    if (!sameHash(pending.codeHash, codeHash(customer.id, dto.code))) {
      await this.db.passwordReset.update({ where: { id: pending.id }, data: { attempts: { increment: 1 } } })
      accountLimiter.recordFailure(limiterKey, 15 * MINUTE)
      throw new UnauthorizedException(BAD_CODE)
    }
    const [, updated] = await this.db.$transaction([
      this.db.passwordReset.updateMany({ where: { customerId: customer.id, usedAt: null }, data: { usedAt: new Date() } }),
      this.db.customer.update({ where: { id: customer.id }, data: { passwordHash: await bcrypt.hash(dto.newPassword, 12) } }),
    ])
    accountLimiter.reset(limiterKey)
    // Nouveau mot de passe = nouvelle empreinte de session : les autres appareils sont déconnectés
    await startCustomerSession(this.jwt, updated, response)
    return publicCustomer(updated)
  }

  private async findAccount(identifier: string): Promise<{ customer: Customer | null; byEmail: boolean }> {
    const id = identifier.trim()
    if (id.includes('@')) return { customer: await this.db.customer.findUnique({ where: { email: id.toLowerCase() } }), byEmail: true }
    try {
      return { customer: await this.db.customer.findUnique({ where: { phone: normalizePhone(id) } }), byEmail: false }
    } catch {
      return { customer: null, byEmail: false }
    }
  }
}
