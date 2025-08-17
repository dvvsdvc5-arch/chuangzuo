/**
 * server/routes/withdrawals.ts
 * Withdrawal submission and listing.
 */

import { Router } from 'express'
import { authRequired } from '../middleware/auth'
import { getDB, uid } from '../db'
import { WithdrawalCreateSchema } from '../schemas'

const router = Router()

/** POST /withdrawals */
router.post('/', authRequired, (req, res) => {
  const parsed = WithdrawalCreateSchema.safeParse({
    network: req.body?.network,
    address: req.body?.address,
    symbol: req.body?.symbol,
    amountMinor: req.body?.amountMinor ? Number(req.body.amountMinor) : undefined,
    amountCrypto: req.body?.amountCrypto ? Number(req.body.amountCrypto) : undefined,
  })
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' })
  const { network, address, symbol, amountMinor, amountCrypto } = parsed.data

  const db = getDB()
  const id = uid('wd')
  const now = new Date().toISOString()

  db.prepare(
    'INSERT INTO withdrawals (id,userId,network,address,symbol,amountMinor,amountCrypto,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?)',
  ).run(id, req.user!.uid, network, address, symbol, amountMinor || null, amountCrypto || null, 'PENDING', now)

  res.json({ ok: true, id, status: 'PENDING' })
})

/** GET /withdrawals */
router.get('/', authRequired, (req, res) => {
  const db = getDB()
  const list = db.prepare('SELECT * FROM withdrawals WHERE userId=? ORDER BY createdAt DESC').all(req.user!.uid)
  res.json({ items: list })
})

export default router
