/**
 * server/routes/transfer.ts
 * Internal transfer submission (0 fee). Deduct from sender wallet; recipient is mocked.
 */

import { Router } from 'express'
import { authRequired } from '../middleware/auth'
import { getDB, uid } from '../db'
import { TransferCreateSchema } from '../schemas'

const router = Router()

/** POST /transfer */
router.post('/', authRequired, (req, res) => {
  const parsed = TransferCreateSchema.safeParse({
    toAccountId: req.body?.toAccountId,
    amountMinor: req.body?.amountMinor ? Number(req.body.amountMinor) : undefined,
  })
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' })
  const { toAccountId, amountMinor } = parsed.data

  const db = getDB()
  const now = new Date().toISOString()
  const id = uid('l')

  const wallet = db.prepare('SELECT availableMinor FROM wallets WHERE userId=?').get(req.user!.uid) as { availableMinor: number }
  if (!wallet || wallet.availableMinor < amountMinor) {
    return res.status(400).json({ error: 'Insufficient balance' })
  }

  const trx = db.transaction(() => {
    db.prepare('UPDATE wallets SET availableMinor=?, updatedAt=? WHERE userId=?')
      .run(wallet.availableMinor - amountMinor, now, req.user!.uid)
    db.prepare(
      'INSERT INTO ledger (id,userId,type,amountMinor,currency,createdAt,refId,meta) VALUES (?,?,?,?,?,?,?,?)',
    ).run(id, req.user!.uid, 'ADJUSTMENT', -amountMinor, 'USD', now, 'transfer', JSON.stringify({ toUserId: toAccountId }))
  })
  trx()

  res.json({ ok: true })
})

export default router
