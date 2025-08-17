/**
 * server/routes/exchange.ts
 * Exchange submission (asset conversion) and records listing.
 */

import { Router } from 'express'
import { authRequired } from '../middleware/auth'
import { getDB, uid } from '../db'
import { ExchangeCreateSchema } from '../schemas'

const router = Router()

/** POST /exchange */
router.post('/', authRequired, (req, res) => {
  const parsed = ExchangeCreateSchema.safeParse({
    direction: req.body?.direction,
    symbol: req.body?.symbol,
    priceUsdtPerCrypto: Number(req.body?.priceUsdtPerCrypto),
    amountCrypto: req.body?.amountCrypto ? Number(req.body.amountCrypto) : undefined,
    amountUsdtMinor: req.body?.amountUsdtMinor ? Number(req.body.amountUsdtMinor) : undefined,
  })
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' })
  const { direction, symbol, priceUsdtPerCrypto, amountCrypto, amountUsdtMinor } = parsed.data

  const db = getDB()
  const id = uid('ex')
  const now = new Date().toISOString()

  // Record only for MVP; balance mutations can be added when front-end fully integrates
  db.prepare(
    `INSERT INTO exchange_records
      (id,userId,direction,symbol,priceUsdtPerCrypto,amountCrypto,amountUsdtMinor,resultUsdtMinor,resultCrypto,createdAt)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
  ).run(id, req.user!.uid, direction, symbol, priceUsdtPerCrypto, amountCrypto || null, amountUsdtMinor || null, null, null, now)

  res.json({ ok: true, id })
})

/** GET /exchange-records */
router.get('/records', authRequired, (req, res) => {
  const db = getDB()
  const list = db.prepare('SELECT * FROM exchange_records WHERE userId=? ORDER BY createdAt DESC').all(req.user!.uid)
  res.json({ items: list })
})

export default router
