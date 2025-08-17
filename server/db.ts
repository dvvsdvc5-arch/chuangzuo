/**
 * server/db.ts
 * SQLite (better-sqlite3) connection, migrations, and seed data.
 */

import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'

/** Shared singleton database instance */
let db: Database.Database | null = null

/** Resolve DB file path with default to server/data.db */
function getDbFile(): string {
  const file = process.env.DB_FILE || path.resolve(process.cwd(), 'server', 'data.db')
  const dir = path.dirname(file)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return file
}

/**
 * getDB
 * Initialize and return the database instance, performing migrations on first use.
 */
export function getDB(): Database.Database {
  if (db) return db
  db = new Database(getDbFile())
  db.pragma('foreign_keys = ON')
  migrate(db)
  seedDemo(db)
  return db
}

/**
 * migrate
 * Create tables if not exists.
 */
function migrate(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      name TEXT,
      phone TEXT,
      avatarUrl TEXT,
      kycStatus TEXT DEFAULT 'NOT_STARTED',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wallets (
      userId TEXT PRIMARY KEY,
      availableMinor INTEGER NOT NULL DEFAULT 0,
      pendingMinor INTEGER NOT NULL DEFAULT 0,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assets (
      userId TEXT PRIMARY KEY,
      usdtMinor INTEGER NOT NULL DEFAULT 0,
      btc REAL NOT NULL DEFAULT 0,
      eth REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ledger (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      amountMinor INTEGER NOT NULL,
      currency TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      refId TEXT,
      meta TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS deposits (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      network TEXT NOT NULL,
      address TEXT NOT NULL,
      txHash TEXT,
      proofUrl TEXT,
      amountMinor INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'PENDING',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS withdrawals (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      network TEXT NOT NULL,
      address TEXT NOT NULL,
      symbol TEXT NOT NULL,
      amountMinor INTEGER,
      amountCrypto REAL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exchange_records (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      direction TEXT NOT NULL,
      symbol TEXT NOT NULL,
      priceUsdtPerCrypto REAL NOT NULL,
      amountCrypto REAL,
      amountUsdtMinor INTEGER,
      resultUsdtMinor INTEGER,
      resultCrypto REAL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS kyc_submissions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      docType TEXT NOT NULL,
      fullName TEXT NOT NULL,
      idNumber TEXT NOT NULL,
      photoUrl TEXT,
      status TEXT NOT NULL DEFAULT 'IN_REVIEW',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    /* 应用设置（key-value JSON） */
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}

/**
 * seedDemo
 * Ensure a demo user exists to allow quick login and verification from frontend.
 */
function seedDemo(d: Database.Database) {
  const user = d.prepare('SELECT id FROM users WHERE email=?').get('jane@example.com') as { id: string } | undefined
  if (!user?.id) {
    const id = 'u_1'
    const now = new Date().toISOString()
    const hash = '$2a$10$QwQOeEhv2a4j4hR8fJ7Y4eQJzq1CwYxj4e.EuS7fX3XkQmWq6eV2W' /* demo123 (approx; not route-used) */

    d.prepare(
      'INSERT OR IGNORE INTO users (id,email,passwordHash,name,phone,avatarUrl,kycStatus,createdAt) VALUES (?,?,?,?,?,?,?,?)',
    ).run(id, 'jane@example.com', hash, 'Jane', '', null, 'NOT_STARTED', now)

    d.prepare(
      'INSERT OR IGNORE INTO wallets (userId,availableMinor,pendingMinor,updatedAt) VALUES (?,?,?,?)',
    ).run(id, 125_000, 500_000, now)

    d.prepare(
      'INSERT OR IGNORE INTO assets (userId,usdtMinor,btc,eth) VALUES (?,?,?,?)',
    ).run(id, 125_000, 0.12345678, 1.2345)

    d.prepare(
      'INSERT OR IGNORE INTO notifications (id,userId,title,body,read,createdAt) VALUES (?,?,?,?,?,?)',
    ).run('n_1', id, 'Welcome', 'Your account is ready.', 0, now)
  }

  // 预置基础设置
  const hasBrand = d.prepare('SELECT key FROM app_settings WHERE key=?').get('brand_name') as any
  if (!hasBrand) {
    const stmt = d.prepare(
      'INSERT OR IGNORE INTO app_settings (key,value) VALUES (?,?)',
    )
    stmt.run('brand_name', JSON.stringify('CCRC'))
    stmt.run('brand_logo', JSON.stringify(''))
    stmt.run('theme_default', JSON.stringify('light'))
    stmt.run('hero_images', JSON.stringify([]))
    stmt.run('partners', JSON.stringify([]))
    stmt.run('compliance_title', JSON.stringify('合规与合作声明'))
    stmt.run('compliance_points', JSON.stringify([
      '严格遵守各平台服务条款与当地法律法规。',
      '仅提供合规的公开推广与辅助；拒绝刷量、操纵与滥用行为。',
      '数据仅用于任务匹配与结算，遵循隐私政策处理。',
      '接到平台限制/下架要求将立即停止相关任务。',
    ]))
  }
}

/** Helpers */
export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

/**
 * getSettings
 * 读取全部设置为对象。
 */
export function getSettings(): Record<string, any> {
  const d = getDB()
  const rows = d.prepare('SELECT key,value FROM app_settings').all() as { key: string; value: string }[]
  const out: Record<string, any> = {}
  for (const r of rows) {
    try {
      out[r.key] = JSON.parse(r.value)
    } catch {
      out[r.key] = r.value
    }
  }
  return out
}

/**
 * setSettings
 * 批量写入设置（UPSERT）。
 */
export function setSettings(partial: Record<string, any>): void {
  const d = getDB()
  const stmt = d.prepare(
    'INSERT INTO app_settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
  )
  const trx = d.transaction((obj: Record<string, any>) => {
    for (const k of Object.keys(obj)) {
      const v = JSON.stringify(obj[k] ?? null)
      stmt.run(k, v)
    }
  })
  trx(partial)
}
