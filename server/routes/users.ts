/**
 * server/routes/users.ts
 * User profile retrieval and update.
 */

import { Router } from 'express'
import { authRequired } from '../middleware/auth'
import { getDB } from '../db'
import { UpdateProfileSchema } from '../schemas'

const router = Router()

/** GET /users/me */
router.get('/me', authRequired, (req, res) => {
  const db = getDB()
  const u = db.prepare('SELECT id,email,name,phone,avatarUrl,kycStatus,createdAt FROM users WHERE id=?').get(req.user!.uid)
  res.json({ user: u })
})

/** PUT /users/me */
router.put('/me', authRequired, (req, res) => {
  const parsed = UpdateProfileSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' })
  const { name, phone, avatarUrl } = parsed.data

  const db = getDB()
  const curr = db.prepare('SELECT name,phone,avatarUrl FROM users WHERE id=?').get(req.user!.uid) as any
  const next = {
    name: name ?? curr?.name ?? null,
    phone: phone ?? curr?.phone ?? null,
    avatarUrl: avatarUrl ?? curr?.avatarUrl ?? null,
  }
  db.prepare('UPDATE users SET name=?, phone=?, avatarUrl=? WHERE id=?')
    .run(next.name, next.phone, next.avatarUrl, req.user!.uid)

  res.json({ ok: true, user: { id: req.user!.uid, ...next } })
})

export default router
