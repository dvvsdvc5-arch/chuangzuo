/**
 * server/routes/admin.ts
 * 管理后台：登录与设置 CRUD（采用 JWT Bearer）。
 * - POST /admin/login：管理员登录
 * - GET /admin/settings：获取设置（需要管理员鉴权）
 * - PUT /admin/settings：更新设置（需要管理员鉴权）
 */

import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { getDB } from '../db'

/** JWT Secret（与用户端一致） */
const SECRET = process.env.JWT_SECRET || 'dev_secret'

/** 允许管理的设置键（前端可配置项） */
const ALLOWED_KEYS = new Set([
  'brand_name',
  'brand_logo',
  'theme_default',
  'hero_images',
  'partners',
  'compliance_title',
  'compliance_points',
])

/**
 * adminRequired
 * 管理员鉴权中间件：校验 Authorization: Bearer <token> 并要求 payload.admin === true
 */
function adminRequired(req: any, res: any, next: any) {
  try {
    const hdr = String(req.headers?.authorization || '')
    const m = hdr.match(/^Bearer\s+(.+)$/i)
    if (!m) return res.status(401).json({ error: '未登录' })
    const token = m[1]
    const payload = jwt.verify(token, SECRET) as any
    if (!payload?.admin) return res.status(401).json({ error: '无权访问' })
    req.admin = payload
    next()
  } catch {
    return res.status(401).json({ error: '未登录' })
  }
}

/** 将 DB 中 settings 转为对象 */
function readSettingsFromDB(): Record<string, any> {
  const db = getDB()
  const rows = db.prepare('SELECT key,value FROM app_settings').all() as { key: string; value: string }[]
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

/** 批量写入/覆盖设置（仅允许白名单键） */
function writeSettingsToDB(partial: Record<string, any>) {
  const db = getDB()
  const stmt = db.prepare(
    'INSERT INTO app_settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
  )
  const trx = db.transaction((obj: Record<string, any>) => {
    for (const k of Object.keys(obj)) {
      if (!ALLOWED_KEYS.has(k)) continue
      const v = JSON.stringify(obj[k] ?? null)
      stmt.run(k, v)
    }
  })
  trx(partial)
}

const router = Router()

/**
 * POST /admin/login
 * 管理员登录（默认 admin / admin123，可用环境变量覆盖）
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  const U = process.env.ADMIN_USER || 'admin'
  const P = process.env.ADMIN_PASS || 'admin123'
  if (username === U && password === P) {
    const token = jwt.sign({ admin: true, username: U }, SECRET, { expiresIn: '1d' })
    return res.json({ ok: true, token })
  }
  return res.status(401).json({ error: '用户名或密码错误' })
})

/** GET /admin/settings（需管理员） */
router.get('/settings', adminRequired, (_req, res) => {
  const settings = readSettingsFromDB()
  res.json({ settings })
})

/**
 * PUT /admin/settings（需管理员）
 * body: 局部更新，键需在白名单中
 */
router.put('/settings', adminRequired, (req, res) => {
  const incoming = req.body || {}
  // 轻量类型规范：数组字段与字符串字段
  const normalized: Record<string, any> = {}
  for (const k of Object.keys(incoming)) {
    if (!ALLOWED_KEYS.has(k)) continue
    const v = incoming[k]
    // 简单归一化
    if (k === 'hero_images' || k === 'compliance_points') {
      normalized[k] = Array.isArray(v) ? v.filter((s: any) => typeof s === 'string' && s.trim().length > 0) : []
    } else if (k === 'partners') {
      // partners: [{name,src,gradient}]
      normalized[k] = Array.isArray(v)
        ? v
            .map((it: any) => ({
              name: String(it?.name || '').trim(),
              src: String(it?.src || '').trim(),
              gradient: String(it?.gradient || '').trim(),
            }))
            .filter((it: any) => it.name && it.src)
        : []
    } else if (k === 'theme_default') {
      normalized[k] = String(v) === 'dark' ? 'dark' : 'light'
    } else if (k === 'brand_name' || k === 'brand_logo' || k === 'compliance_title') {
      normalized[k] = typeof v === 'string' ? v : ''
    } else {
      normalized[k] = v
    }
  }

  writeSettingsToDB(normalized)
  const settings = readSettingsFromDB()
  res.json({ ok: true, settings })
})

export default router
