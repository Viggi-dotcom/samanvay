import { PrismaClient } from '@prisma/client'
import path from 'path'

// Resolve the SQLite file path absolutely from process.cwd().
// This ensures it works correctly on Vercel serverless (/var/task/db/custom.db),
// local dev, and scripts — regardless of what DATABASE_URL is set to in env.
const dbPath = path.join(process.cwd(), 'db', 'custom.db')
process.env.DATABASE_URL = `file:${dbPath}`

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db