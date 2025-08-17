/**
 * server/routes/ledger.ts
 * Ledger listing (simple pagination by limit).
 */

import { Router } from 'express'
import { authRequired } from '../middleware/auth'
import { getDB } from '../db'

const router = Router()

/** GET /ledger?limit=50 */
router.get('/', authRequired, (req, res) => {
  const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10) || 50, 1), 200)
  const db = getDB()
  const list = db.prepare('SELECT * FROM ledger WHERE userId=? ORDER BY createdAt DESC LIMIT ?')
    .all(req.user!.uid, limit)
  res.json({ items: list })
})

export default router
