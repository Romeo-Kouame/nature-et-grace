import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client'

/**
 * Connexion PostgreSQL pour Prisma 7 (adaptateur « pg »).
 * Délai de connexion de 5 s : sans lui, une base injoignable bloquerait indéfiniment.
 */
export function pgAdapter() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL manquant (voir .env.example).')
  return new PrismaPg({ connectionString, connectionTimeoutMillis: 5_000 })
}

/** Client Prisma autonome, pour les scripts (seeds, maintenance) */
export const createPrismaClient = () => new PrismaClient({ adapter: pgAdapter() })
