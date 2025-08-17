/**
 * server/routes/deposits.ts
 * Deposit submission and listing. Supports optional screenshot upload ('proof').
 */

import { Router } from 'express'
import { authRequired } from '../middleware/auth'
import { getDB, uid } from '../db'
import { DepositCreateSchema } from '../schemas'
import { upload, publicUrl } from '../storage'

const router = Router()

/** POST /deposits (multipart or JSON) */
router.post('/', authRequired, upload.single('proof'), (req, res) => {
  const body = {
    network: req.body?.network,
    address: req.body?.address,
    txHash: req.body?.txHash || undefined,
    amountMinor: req.body?.amountMinor ? Number(req.body.amountMinor) : undefined,
  }
  const parsed = DepositCreateSchema.safeParse(body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' })

  const { network, address, txHash, amountMinor } = parsed.data
  const file = (req as any).file as Express.Multer.File | undefined
  const proofUrl = file ? publicUrl(file.filename) : undefined

  const db = getDB()
  const id = uid('dep')
  const now = new Date().toISOString()

  db.prepare(
    'INSERT INTO deposits (id,userId,network,address,txHash,proofUrl,amountMinor,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?)',
  ).run(id, req.user!.uid, network, address, txHash || null, proofUrl || null, amountMinor || 0, 'PENDING', now)

  res.json({ ok: true, id, status: 'PENDING', proofUrl })
})

/** GET /deposits */
router.get('/', authRequired, (req, res) => {
  const db = getDB()
  const list = db.prepare('SELECT * FROM deposits WHERE userId=? ORDER BY createdAt DESC').all(req.user!.uid)
  res.json({ items: list })
})

export default router
