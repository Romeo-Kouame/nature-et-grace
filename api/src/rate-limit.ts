import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'

type Rule = { key: string; max: number; windowMs: number }
const RATE_LIMIT = 'rate-limit'

/**
 * Limite le nombre d'appels d'une route par adresse IP.
 * Ex. `@RateLimit('login', 8, 15 * 60_000)` : 8 tentatives par quart d'heure.
 */
export const RateLimit = (key: string, max: number, windowMs: number) => SetMetadata(RATE_LIMIT, { key, max, windowMs } satisfies Rule)

/**
 * Compteurs en mémoire : suffisant pour une seule instance de l'API.
 * Si l'API tourne un jour sur plusieurs instances, passer à un stockage partagé (Redis…).
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, { count: number; resetAt: number }>()

  constructor(private readonly reflector: Reflector) {
    setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.hits) if (entry.resetAt <= now) this.hits.delete(key)
    }, 60_000).unref()
  }

  canActivate(context: ExecutionContext): boolean {
    const rule = this.reflector.get<Rule | undefined>(RATE_LIMIT, context.getHandler())
    if (!rule) return true
    const request = context.switchToHttp().getRequest<Request>()
    const id = `${rule.key}:${request.ip ?? 'unknown'}`
    const now = Date.now()
    const entry = this.hits.get(id)
    if (!entry || entry.resetAt <= now) {
      this.hits.set(id, { count: 1, resetAt: now + rule.windowMs })
      return true
    }
    entry.count += 1
    if (entry.count > rule.max) {
      const minutes = Math.max(1, Math.ceil((entry.resetAt - now) / 60_000))
      throw new HttpException(`Trop de tentatives. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.`, HttpStatus.TOO_MANY_REQUESTS)
    }
    return true
  }
}
