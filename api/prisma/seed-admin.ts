import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_INITIAL_PASSWORD
  if (!email || !password || password.length < 12) {
    throw new Error('Set ADMIN_EMAIL and an ADMIN_INITIAL_PASSWORD of at least 12 characters.')
  }
  const existing = await prisma.admin.findUnique({ where: { email } })
  if (existing) {
    console.log('Admin already exists; no password was changed.')
    return
  }
  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.admin.create({ data: { email, passwordHash } })
  console.log(`Admin account created for ${email}. Change the initial password after first sign-in.`)
}

main().finally(() => prisma.$disconnect())
