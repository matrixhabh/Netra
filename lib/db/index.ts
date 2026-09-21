import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

function getNeonConnectionString() {
  const connectionString = process.env.DATABASE_URL
    ?? process.env.POSTGRES_URL
    ?? process.env.POSTGRES_PRISMA_URL
    ?? process.env.DATABASE_URL_UNPOOLED
    ?? process.env.POSTGRES_URL_NON_POOLING

  if (!connectionString) {
    // Keep static builds importable, but make a missing runtime configuration fail
    // against a non-local host instead of allowing pg to default to localhost:5432.
    return 'postgresql://neon-config-missing.invalid/neondb'
  }

  let parsed: URL
  try {
    parsed = new URL(connectionString)
  } catch {
    throw new Error('Neon database configuration is invalid. DATABASE_URL must be a PostgreSQL connection URL.')
  }

  if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '::1') {
    throw new Error('Neon database configuration resolved to localhost. Refusing to connect to a local PostgreSQL server; check DATABASE_URL.')
  }

  return connectionString
}

export const pool = new Pool({ connectionString: getNeonConnectionString() })
pool.on('connect', (client) => { void client.query('SET search_path TO neon_auth, public') })

export const db = drizzle(pool)
