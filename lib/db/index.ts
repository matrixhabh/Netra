import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

export const pool = new Pool({ connectionString: process.env.DATABASE_URL })
pool.on('connect', (client) => { void client.query('SET search_path TO neon_auth, public') })

export const db = drizzle(pool)
