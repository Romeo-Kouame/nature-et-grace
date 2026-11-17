import 'dotenv/config'
import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import cookieParser from 'cookie-parser'
import { json, NextFunction, Request, Response } from 'express'
import { AppModule } from './app.module'
import { AllErrorsFilter } from './errors.filter'

async function bootstrap() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set to a random value of at least 32 characters.')
  }
  const production = process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true'
  // En production : journaux sans le niveau « debug/verbose »
  // bodyParser: false → on déclare nous-mêmes les lecteurs de requêtes (JSON uniquement, pas de formulaires classiques)
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false, logger: production ? ['error', 'warn', 'log'] : undefined })
  app.disable('x-powered-by')
  // Derrière un hébergeur (proxy), l'IP réelle du visiteur sert aux limites anti-abus.
  // Sans ce réglage, tous les visiteurs auraient l'adresse du proxy et partageraient les mêmes limites.
  if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1)
  else if (production) console.warn('[sécurité] TRUST_PROXY n’est pas activé : si l’API est derrière un hébergeur, les limites anti-abus seront partagées par tous les visiteurs.')
  const allowedOrigins = (process.env.WEB_ORIGIN ?? 'http://localhost:5173').split(',').map((item) => item.trim()).filter(Boolean)
  app.enableCors({ origin: allowedOrigins, credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] })
  app.use((request: Request, response: Response, next: NextFunction) => {
    // Anti-CSRF : toute écriture doit venir du site. Un navigateur envoie toujours Origin (ou à défaut Referer).
    const writes = ['POST', 'PATCH', 'PUT', 'DELETE']
    if (writes.includes(request.method)) {
      const origin = request.headers.origin ?? originOf(request.headers.referer)
      if (!origin || !allowedOrigins.includes(origin)) {
        response.status(403).json({ message: 'Origine interdite.' })
        return
      }
    }
    next()
  })
  app.use((request: Request, response: Response, next: NextFunction) => {
    // HTTPS obligatoire en production (l'hébergeur indique le protocole d'origine dans x-forwarded-proto)
    if (production && request.headers['x-forwarded-proto'] === 'http') {
      response.redirect(308, `https://${request.headers.host}${request.originalUrl}`)
      return
    }
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('X-Frame-Options', 'DENY')
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    if (production) response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    next()
  })
  // Photos (produits, preuves Wave) en base64 : 7 Mo sur ces deux routes seulement, 100 ko partout ailleurs
  const largeJson = json({ limit: '7mb' })
  app.use((request: Request, response: Response, next: NextFunction) => {
    const path = request.path
    if (request.method === 'POST' && (path === '/api/admin/images' || /^\/api\/orders\/[^/]+\/proof$/.test(path))) return largeJson(request, response, next)
    next()
  })
  app.use(json({ limit: '100kb' }))
  app.use(cookieParser())
  app.useGlobalFilters(new AllErrorsFilter())
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))
  app.setGlobalPrefix('api')
  await app.listen(Number(process.env.PORT ?? 3001), '0.0.0.0')
}

function originOf(url?: string) {
  if (!url) return undefined
  try { return new URL(url).origin } catch { return undefined }
}

void bootstrap()
