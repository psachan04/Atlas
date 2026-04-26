import { Pool } from "pg";

/**
 * Smart database routing:
 * - POSTGRES_URL env var → Vercel / production (set in Vercel dashboard)
 * - Fallback → local Docker Postgres at localhost:8000
 */
const connectionString =
  process.env.POSTGRES_URL ||
  "postgresql://atlas_admin:atlas123@localhost:8000/nps_db";

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: connectionString.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : false,
});

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export default pool;
