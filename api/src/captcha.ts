import { ForbiddenException } from '@nestjs/common'
import { Request } from 'express'

/**
 * Captcha Cloudflare Turnstile, vérifié côté serveur (jamais dans le navigateur).
 *
 * Variables d'environnement :
 * - TURNSTILE_SECRET : clé secrète du widget. Vide = captcha désactivé (avertissement au démarrage en production).
 * - TURNSTILE_HOSTNAMES : domaines du site autorisés, séparés par des virgules (ex. « www.natureetgrace.ci »).
 *   En production, ne pas y mettre localhost.
 *
 * Chaque formulaire a son « action » : un jeton obtenu pour la connexion ne sert pas pour l'inscription.
 * Les jetons sont à usage unique : Cloudflare refuse un jeton déjà vérifié.
 */
export type CaptchaAction = 'login' | 'signup' | 'google' | 'review' | 'reset'

const production = () => process.env.NODE_ENV === 'production'
const REFUSED = 'Vérification anti-robot échouée. Rechargez la page et réessayez.'

export const captchaEnabled = () => Boolean(process.env.TURNSTILE_SECRET?.trim())

if (production() && !captchaEnabled()) {
  console.warn('[sécurité] TURNSTILE_SECRET est vide : le captcha est désactivé sur l’inscription, la connexion et les avis.')
}

export async function assertCaptcha(token: unknown, request: Request, action: CaptchaAction): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET?.trim()
  if (!secret) return
  const hostnames = new Set((process.env.TURNSTILE_HOSTNAMES ?? '').split(',').map((h) => h.trim()).filter(Boolean))
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) throw new ForbiddenException(REFUSED)

  let result: { success?: boolean; action?: string; hostname?: string; metadata?: { result_with_testing_key?: boolean } }
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({ secret, response: token, remoteip: request.ip ?? '' }),
    })
    if (!response.ok) throw new Error(`siteverify ${response.status}`)
    result = await response.json()
  } catch (err) {
    // Cloudflare injoignable : on refuse (fail closed) plutôt que de laisser passer les robots
    console.warn('[captcha] vérification impossible :', (err as Error).message)
    throw new ForbiddenException('Vérification anti-robot momentanément indisponible. Réessayez dans un instant.')
  }

  if (!result.success) throw new ForbiddenException(REFUSED)
  // Clés de test de Cloudflare (développement) : pas d'action ni de vrai domaine dans la réponse
  if (result.metadata?.result_with_testing_key) {
    if (production()) throw new ForbiddenException(REFUSED)
    return
  }
  if (hostnames.size === 0) {
    console.warn('[captcha] TURNSTILE_HOSTNAMES est vide : impossible de vérifier le domaine, envoi refusé.')
    throw new ForbiddenException(REFUSED)
  }
  if (result.action !== action || !result.hostname || !hostnames.has(result.hostname)) throw new ForbiddenException(REFUSED)
}
