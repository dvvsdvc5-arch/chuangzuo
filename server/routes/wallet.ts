/**
 * server/routes/wallet.ts
 * Wallet balances and assets.
 */

import { Router } from 'express'
import { authRequired } from '../middleware/auth'
import { getDB } from '../db'

const router = Router()

/** GET /wallet */
router.get('/', authRequired, (req, res) => {
  const db = getDB()
  const wallet = db.prepare('SELECT availableMinor,pendingMinor,updatedAt FROM wallets WHERE userId=?').get(req.user!.uid)
  const assets = db.prepare('SELECT usdtMinor,btc,eth FROM assets WHERE userId=?').get(req.user!.uid)
  res.json({ wallet, assets })
})

export default router
