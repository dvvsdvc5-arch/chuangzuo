/**
 * server/routes/auth.ts
 * Register, login, and current-user endpoints.
 */

import { Router } from 'express'
import { getDB, uid } from '../db'
import { RegisterSchema, LoginSchema } from '../schemas'
import { comparePassword, hashPassword, signToken } from '../auth'
import { authRequired } from '../middleware/auth'

const router = Router()

/** POST /auth/register */
router.post('/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' })
  const { email, password, name } = parsed.data

  const db = getDB()
  const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email) as { id: string } | undefined
  if (exists?.id) return res.status(409).json({ error: 'Email already registered' })

  const id = uid('u')
  const now = new Date().toISOString()
  const passwordHash = await hashPassword(password)

  const trx = db.transaction(() => {
    db.prepare(
      'INSERT INTO users (id,email,passwordHash,name,kycStatus,createdAt) VALUES (?,?,?,?,?,?)',
    ).run(id, email, passwordHash, name, 'NOT_STARTED', now)
    db.prepare('INSERT INTO wallets (userId,availableMinor,pendingMinor,updatedAt) VALUES (?,?,?,?)')
      .run(id, 0, 0, now)
    db.prepare('INSERT INTO assets (userId,usdtMinor,btc,eth) VALUES (?,?,?,?)')
      .run(id, 0, 0, 0)
  })
  trx()

  const token = signToken({ uid: id, email })
  res.json({
    token,
    user: { id, email, name, kycStatus: 'NOT_STARTED' },
  })
})

/** POST /auth/login */
router.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' })
  const { email, password } = parsed.data

  const db = getDB()
  const row = db.prepare('SELECT id,passwordHash,name,kycStatus FROM users WHERE email=?').get(email) as
    | { id: string; passwordHash: string; name: string; kycStatus: string }
    | undefined
  if (!row) return res.status(401).json({ error: 'Invalid email or password' })

  const ok = await comparePassword(password, row.passwordHash)
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' })

  const token = signToken({ uid: row.id, email })
  res.json({ token, user: { id: row.id, email, name: row.name, kycStatus: row.kycStatus } })
})

/** GET /auth/me */
router.get('/me', authRequired, (req, res) => {
  const db = getDB()
  const u = db.prepare('SELECT id,email,name,phone,avatarUrl,kycStatus,createdAt FROM users WHERE id=?').get(req.user!.uid)
  res.json({ user: u })
})

export default router
