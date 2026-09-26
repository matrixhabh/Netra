import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  options: '-c search_path=neon_auth,public',
})
export const db = drizzle(pool, { schema })
