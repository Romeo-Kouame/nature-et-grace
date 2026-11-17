import 'dotenv/config'
import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import cookieParser from 'cookie-parser'
import { NextFunction, Request, Response } from 'express'
import { AppModule } from './app.module'
import { AllErrorsFilter } from './errors.filter'

async function bootstrap() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set to a random value of at least 32 characters.')
  }
  // Les photos produits et preuves Wave transitent en base64 : on relève la limite par défaut (100 ko)
  const production = process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true'
  // En production : journaux sans le niveau « debug/verbose »
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: production ? ['error', 'warn', 'log'] : undefined })
  app.disable('x-powered-by')
  app.useBodyParser('json', { limit: '7mb' })
  // Derrière un hébergeur (proxy), l'IP réelle du visiteur sert aux limites anti-abus
  if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1)
  const allowedOrigins = (process.env.WEB_ORIGIN ?? 'http://localhost:5173').split(',').map((item) => item.trim()).filter(Boolean)
  app.enableCors({ origin: allowedOrigins, credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] })
  app.use((request: Request, response: Response, next: NextFunction) => {
    const writes = ['POST', 'PATCH', 'PUT', 'DELETE']
    if (writes.includes(request.method) && request.headers.origin && !allowedOrigins.includes(request.headers.origin)) {
      response.status(403).json({ message: 'Origine interdite.' })
      return
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
  app.use(cookieParser())
  app.useGlobalFilters(new AllErrorsFilter())
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))
  app.setGlobalPrefix('api')
  await app.listen(Number(process.env.PORT ?? 3001), '0.0.0.0')
}

void bootstrap()
