import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { PrismaService } from './prisma.service'

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const token = request.cookies?.['ng_admin']
    if (!token) throw new UnauthorizedException('Connexion administrateur requise.')
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; version: number }>(token)
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
      if (!customer || customerSessionVersion(customer.passwordHash) !== payload.version) throw new Error('invalid session')
      ;(request as Request & { customerId: string }).customerId = payload.sub
      return true
    } catch {
      throw new UnauthorizedException('Votre session a expiré. Reconnectez-vous.')
    }
  }
}

/** Empreinte du mot de passe glissée dans la session : changer de mot de passe déconnecte les autres appareils. */
export const customerSessionVersion = (passwordHash: string) => passwordHash.slice(-12)
