import pg from 'pg';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const folder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../migrations');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 8, connectionTimeoutMillis: 10000 });
export const db = { query: (sql, args = []) => pool.query(sql, args) };
export const storage = {
  async put(key, buffer, contentType) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType) || !buffer || buffer.length > 4 * 1024 * 1024)
      throw new Error('Некорректный файл');
    await db.query('INSERT INTO mm_media(id,mime,body) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [key, contentType, Buffer.from(buffer)]);
    return '/media/' + key;
  },
  async get(key) {
    const result = await db.query('SELECT mime,body FROM mm_media WHERE id=$1', [key]);
    const item = result.rows[0];
    return item && { contentType: item.mime, buffer: item.body };
  }
};
export async function init() {
  if (!process.env.DATABASE_URL) throw new Error('Database configuration missing');
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(723001)');
    await client.query('CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT NOT NULL,email_verified_at TIMESTAMPTZ,visible BOOLEAN DEFAULT FALSE,last_seen TIMESTAMPTZ)');
    await client.query('CREATE TABLE IF NOT EXISTS mm_migrations(name TEXT PRIMARY KEY,applied_at TIMESTAMPTZ DEFAULT NOW())');
    const names = (await fs.readdir(folder)).filter(x => x.endsWith('.sql')).sort();
    for (const name of names) {
      const found = await client.query('SELECT 1 FROM mm_migrations WHERE name=$1', [name]);
      if (found.rows.length) continue;
      await client.query('BEGIN');
      try {
        await client.query(await fs.readFile(path.join(folder, name), 'utf8'));
        await client.query('INSERT INTO mm_migrations(name) VALUES($1)', [name]);
        await client.query('COMMIT');
      } catch (e) { await client.query('ROLLBACK'); throw e; }
    }
    await client.query("INSERT INTO mm_admin_allowlist(email) VALUES ('dshtriters@gmail.com') ON CONFLICT DO NOTHING");
    await client.query('CREATE TABLE IF NOT EXISTS mm_media(id TEXT PRIMARY KEY,mime TEXT NOT NULL,body BYTEA NOT NULL,created_at TIMESTAMPTZ DEFAULT NOW())');
    await client.query('CREATE TABLE IF NOT EXISTS mm_room(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),user_id TEXT NOT NULL,body TEXT NOT NULL,name VARCHAR(100) NOT NULL,created_at TIMESTAMPTZ DEFAULT NOW())');
    await client.query('CREATE TABLE IF NOT EXISTS mm_room_reports(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),message_id UUID NOT NULL,user_id TEXT NOT NULL,reason TEXT NOT NULL,created_at TIMESTAMPTZ DEFAULT NOW())');
  } finally {
    try { await client.query('SELECT pg_advisory_unlock(723001)'); } catch {}
    client.release();
  }
}