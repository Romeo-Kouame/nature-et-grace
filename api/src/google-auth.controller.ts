import { BadRequestException, Body, Controller, Get, HttpCode, NotFoundException, Post, Query, Req, Res, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { Request, Response } from 'express'
import { Prisma } from './generated/prisma/client'
import { PrismaService } from './prisma.service'
import { RateLimit } from './rate-limit'
import { assertConsent, assertHuman, sessionCookieBase } from './images'
import { normalizePhone, publicCustomer, startCustomerSession } from './customer.controller'
import { assertCaptcha } from './captcha'

const MINUTE = 60_000
/** État OAuth (anti-CSRF + PKCE), le temps de l'aller-retour chez Google */
const STATE_COOKIE = 'ng_g_state'
const STATE_PATH = '/api/customer/google'
/** Nouveau client Google qui doit encore donner son numéro de téléphone */
const PENDING_COOKIE = 'ng_g_pending'

type GoogleProfile = { sub: string; email: string; name: string }

class GoogleCompleteDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) name?: string
  @IsString() @MinLength(8) @MaxLength(25) phone!: string
  @IsOptional() @IsBoolean() acceptTerms?: boolean
  @IsOptional() @IsString() @MaxLength(200) website?: string
  @IsOptional() @IsString() @MaxLength(2048) captchaToken?: string
}

/**
 * Connexion avec Google (OpenID Connect, flux « code d'autorisation » + PKCE).
 * Aucun script Google n'est chargé sur le site : le visiteur est redirigé vers Google, puis revient sur l'API.
 *
 * - Compte déjà lié à Google → session ouverte.
 * - E-mail déjà utilisé par un compte avec mot de passe → refus (pas de liaison automatique :
 *   l'e-mail de ces comptes n'a jamais été vérifié, quelqu'un aurait pu l'utiliser pour piéger le vrai propriétaire).
 * - Nouveau client → il complète son numéro de téléphone (indispensable pour la livraison et WhatsApp).
 */
@Controller('customer/google')
export class GoogleAuthController {
  constructor(private readonly db: PrismaService, private readonly jwt: JwtService) {}

  /** Le site n'affiche le bouton Google que si l'API est configurée */
  @Get('enabled')
  enabled() {
    return { enabled: Boolean(googleConfig()) }
  }

  @Get('start')
  @RateLimit('google-start', 20, 15 * MINUTE)
  async start(@Res() response: Response) {
    const config = googleConfig()
    if (!config) return backToSite(response, 'indisponible')
    const state = randomBytes(24).toString('base64url')
    const verifier = randomBytes(48).toString('base64url')
    const challenge = createHash('sha256').update(verifier).digest('base64url')
    const token = await this.jwt.signAsync({ kind: 'google-state', state, verifier }, { expiresIn: '10m' })
    response.cookie(STATE_COOKIE, token, { ...stateCookieOptions(), maxAge: 10 * MINUTE })
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    url.search = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      prompt: 'select_account',
    }).toString()
    response.redirect(303, url.toString())
  }

  @Get('callback')
  @RateLimit('google-callback', 20, 15 * MINUTE)
  async callback(
    @Query('code') code: unknown,
    @Query('state') state: unknown,
    @Query('error') error: unknown,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const config = googleConfig()
    if (!config) return backToSite(response, 'indisponible')
    const savedToken = request.cookies?.[STATE_COOKIE]
    response.clearCookie(STATE_COOKIE, stateCookieOptions())
    if (error) return backToSite(response, 'annule')

    let saved: { kind?: string; state?: string; verifier?: string }
    try {
      saved = await this.jwt.verifyAsync(String(savedToken ?? ''))
    } catch {
      return backToSite(response, 'erreur')
    }
    if (saved.kind !== 'google-state' || !saved.verifier || typeof state !== 'string' || !sameText(state, saved.state ?? '') || typeof code !== 'string') {
      return backToSite(response, 'erreur')
    }

    let profile: GoogleProfile
    try {
      profile = await exchangeCode(config, code, saved.verifier)
    } catch (err) {
      console.warn('[google] connexion refusée :', (err as Error).message)
      return backToSite(response, 'erreur')
    }

    const linked = await this.db.customer.findUnique({ where: { googleId: profile.sub } })
    if (linked) {
      await startCustomerSession(this.jwt, linked, response)
      return backToSite(response, 'connecte')
    }
    if (await this.db.customer.findUnique({ where: { email: profile.email } })) return backToSite(response, 'email-existant')

    const pending = await this.jwt.signAsync({ kind: 'google-pending', ...profile }, { expiresIn: '20m' })
    response.cookie(PENDING_COOKIE, pending, { ...sessionCookieBase(), maxAge: 20 * MINUTE })
    return backToSite(response, 'finaliser')
  }

  /** Nom et e-mail Google, pour pré-remplir le formulaire de finalisation */
  @Get('pending')
  async pending(@Req() request: Request) {
    const profile = await this.readPending(request)
    if (!profile) throw new NotFoundException('Aucune connexion Google en attente.')
    return { name: profile.name, email: profile.email }
  }

  @Post('complete')
  @HttpCode(200)
  @RateLimit('google-complete', 10, 15 * MINUTE)
  async complete(@Req() request: Request, @Body() dto: GoogleCompleteDto, @Res({ passthrough: true }) response: Response) {
    assertHuman(dto.website)
    await assertCaptcha(dto.captchaToken, request, 'google')
    assertConsent(dto.acceptTerms)
    const profile = await this.readPending(request)
    if (!profile) throw new UnauthorizedException('La connexion Google a expiré. Recommencez avec le bouton Google.')
    const phone = normalizePhone(dto.phone)

    // Double envoi du formulaire : le compte existe déjà, on ouvre simplement la session
    const existing = await this.db.customer.findUnique({ where: { googleId: profile.sub } })
    if (existing) {
      response.clearCookie(PENDING_COOKIE, sessionCookieBase())
      await startCustomerSession(this.jwt, existing, response)
      return publicCustomer(existing)
    }
    if (await this.db.customer.findUnique({ where: { phone } })) {
      throw new BadRequestException('Un compte existe déjà avec ce numéro. Connectez-vous avec votre numéro et votre mot de passe.')
    }
    try {
      const customer = await this.db.customer.create({
        data: { name: dto.name?.trim() || profile.name, phone, email: profile.email, googleId: profile.sub, passwordHash: null, termsAcceptedAt: new Date() },
      })
      response.clearCookie(PENDING_COOKIE, sessionCookieBase())
      await startCustomerSession(this.jwt, customer, response)
      return publicCustomer(customer)
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new BadRequestException('Ce numéro ou cette adresse e-mail est déjà utilisé par un autre compte.')
      }
      throw err
    }
  }

  private async readPending(request: Request): Promise<GoogleProfile | null> {
    const token = request.cookies?.[PENDING_COOKIE]
    if (!token) return null
    try {
      const payload = await this.jwt.verifyAsync<GoogleProfile & { kind: string }>(token)
      if (payload.kind !== 'google-pending' || !payload.sub || !payload.email) return null
      return { sub: payload.sub, email: payload.email, name: payload.name }
    } catch {
      return null
    }
  }
}

function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim()
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim()
  return clientId && clientSecret && redirectUri ? { clientId, clientSecret, redirectUri } : null
}

/** Le cookie d'état doit revenir lors du retour depuis Google (navigation d'un autre site) : SameSite=Lax */
function stateCookieOptions() {
  return { ...sessionCookieBase(), sameSite: 'lax' as const, path: STATE_PATH }
}

function backToSite(response: Response, status: string) {
  const site = (process.env.WEB_ORIGIN ?? 'http://localhost:5173').split(',')[0].trim()
  response.redirect(303, `${site}/connexion?google=${encodeURIComponent(status)}`)
}

function sameText(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

/**
 * Échange le code contre un jeton d'identité. Le jeton arrive directement de Google, en HTTPS,
 * en échange de notre secret client : on vérifie ses champs (émetteur, destinataire, expiration, e-mail vérifié).
 */
async function exchangeCode(config: NonNullable<ReturnType<typeof googleConfig>>, code: string, verifier: string): Promise<GoogleProfile> {
  const result = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!result.ok) throw new Error(`échange du code refusé (${result.status})`)
  const { id_token: idToken } = (await result.json()) as { id_token?: string }
  const part = idToken?.split('.')[1]
  if (!part) throw new Error('jeton d’identité absent')
  const claims = JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(String(claims.iss))) throw new Error('émetteur inattendu')
  if (claims.aud !== config.clientId) throw new Error('destinataire inattendu')
  if (typeof claims.exp !== 'number' || claims.exp * 1000 < Date.now()) throw new Error('jeton expiré')
  if (claims.email_verified !== true || typeof claims.email !== 'string' || typeof claims.sub !== 'string') throw new Error('e-mail Google non vérifié')
  const email = claims.email.trim().toLowerCase()
  const rawName = typeof claims.name === 'string' && claims.name.trim().length >= 2 ? claims.name : email.split('@')[0]
  return { sub: claims.sub, email, name: rawName.trim().slice(0, 80) }
}
