import 'dotenv/config'
import { defineConfig } from 'prisma/config'

/** Configuration de Prisma 7 : schéma, migrations et adresse de la base (lue dans .env). */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Vide autorisé pour `prisma generate` (installation, CI) ; obligatoire pour les migrations
    url: process.env.DATABASE_URL ?? '',
  },
})
