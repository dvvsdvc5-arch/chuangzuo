/**
 * server/routes/notifications.ts
 * List and mark-as-read.
 */

import { Router } from 'express'
import { authRequired } from '../middleware/auth'
import { getDB } from '../db'

const router = Router()

/** GET /notifications */
router.get('/', authRequired, (req, res) => {
  const db = getDB()
  const items = db.prepare('SELECT * FROM notifications WHERE userId=? ORDER BY createdAt DESC').all(req.user!.uid)
  res.json({ items })
})

/** PATCH /notifications/:id/read */
router.patch('/:id/read', authRequired, (req, res) => {
  const db = getDB()
  db.prepare('UPDATE notifications SET read=1 WHERE id=? AND userId=?').run(req.params.id, req.user!.uid)
  res.json({ ok: true })
})

export default router
