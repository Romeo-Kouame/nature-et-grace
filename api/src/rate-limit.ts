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
const hits = new Map<string, { count: number; resetAt: number }>()
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key)
}, 60_000).unref()

const tooMany = (resetAt: number) => {
  const minutes = Math.max(1, Math.ceil((resetAt - Date.now()) / 60_000))
  const message = `Trop de tentatives. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.`
  return new HttpException({ statusCode: HttpStatus.TOO_MANY_REQUESTS, message }, HttpStatus.TOO_MANY_REQUESTS)
}

/** Compte un appel ; lève une erreur 429 au-delà de `max` dans la fenêtre. */
export function consume(id: string, max: number, windowMs: number) {
  const now = Date.now()
  const entry = hits.get(id)
  if (!entry || entry.resetAt <= now) {
    hits.set(id, { count: 1, resetAt: now + windowMs })
    return
  }
  entry.count += 1
  if (entry.count > max) throw tooMany(entry.resetAt)
}

/**
 * Limite par compte visé (et non par adresse IP) : protège un compte précis contre
 * les essais de mot de passe venant de nombreuses adresses.
 * Seuls les échecs sont comptés ; une connexion réussie remet le compteur à zéro.
 */
export const accountLimiter = {
  assertNotBlocked(id: string, max: number) {
    const entry = hits.get(id)
    if (entry && entry.resetAt > Date.now() && entry.count >= max) throw tooMany(entry.resetAt)
  },
  recordFailure(id: string, windowMs: number) {
    const now = Date.now()
    const entry = hits.get(id)
    if (!entry || entry.resetAt <= now) hits.set(id, { count: 1, resetAt: now + windowMs })
    else entry.count += 1
  },
  reset(id: string) {
    hits.delete(id)
  },
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rule = this.reflector.get<Rule | undefined>(RATE_LIMIT, context.getHandler())
    if (!rule) return true
    const request = context.switchToHttp().getRequest<Request>()
    consume(`${rule.key}:${request.ip ?? 'unknown'}`, rule.max, rule.windowMs)
    return true
  }
}
