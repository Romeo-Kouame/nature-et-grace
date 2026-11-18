import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { createHmac } from 'node:crypto'
import { Request } from 'express'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from './prisma.service'

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const token = request.cookies?.['ng_admin']
    if (!token) throw new UnauthorizedException('Connexion administrateur requise.')
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; kind: string; version: number }>(token)
      if (payload.kind !== 'admin') throw new Error('wrong kind')
      const admin = await this.prisma.admin.findUnique({ where: { id: payload.sub } })
      if (!admin || admin.updatedAt.getTime() !== payload.version) throw new Error('invalid session')
      const adminRequest = request as Request & { adminId: string }
      adminRequest.adminId = payload.sub
      return true
    } catch {
      throw new UnauthorizedException('Session expirée. Reconnectez-vous.')
    }
  }
}

/** Session client : cookie `ng_customer`, valable 30 jours, invalidé au changement de mot de passe. */
@Injectable()
export class CustomerGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const token = request.cookies?.['ng_customer']
    if (!token) throw new UnauthorizedException('Connectez-vous pour continuer.')
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; kind: string; version: string }>(token)
      if (payload.kind !== 'customer') throw new Error('wrong kind')
      const customer = await this.prisma.customer.findUnique({ where: { id: payload.sub } })
      if (!customer || customerSessionVersion(customer) !== payload.version) throw new Error('invalid session')
      ;(request as Request & { customerId: string }).customerId = payload.sub
      return true
    } catch {
      throw new UnauthorizedException('Votre session a expiré. Reconnectez-vous.')
    }
  }
}

/**
 * Empreinte du mot de passe glissée dans la session : changer de mot de passe déconnecte les autres appareils.
 * C'est un HMAC du hachage (clé `JWT_SECRET`) : la session ne révèle rien du mot de passe haché.
 */
export const customerSessionVersion = (customer: { passwordHash: string | null; googleId: string | null }) =>
  createHmac('sha256', process.env.JWT_SECRET ?? '')
    // Compte Google sans mot de passe : la session dépend de l'identifiant Google
    .update(customer.passwordHash ?? `google:${customer.googleId ?? ''}`)
    .digest('base64url')
    .slice(0, 22)

/** Hachage factice : la vérification prend le même temps, que le compte existe ou non. */
const DUMMY_HASH = bcrypt.hashSync('compte-inexistant-pour-egaliser-le-temps', 12)

/** Vérifie le mot de passe en temps constant vis-à-vis de l'existence du compte. */
export async function checkPassword(password: string, passwordHash: string | undefined | null): Promise<boolean> {
  const ok = await bcrypt.compare(password, passwordHash ?? DUMMY_HASH)
  return ok && Boolean(passwordHash)
}
