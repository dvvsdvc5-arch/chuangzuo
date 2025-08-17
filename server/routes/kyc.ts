/**
 * server/routes/kyc.ts
 * KYC submission and status querying.
 */

import { Router } from 'express'
import { authRequired } from '../middleware/auth'
import { getDB, uid } from '../db'
import { KycSubmitSchema } from '../schemas'
import { upload, publicUrl } from '../storage'

const router = Router()

/** POST /kyc (multipart: photo) */
router.post('/', authRequired, upload.single('photo'), (req, res) => {
  const parsed = KycSubmitSchema.safeParse({
    docType: req.body?.docType,
    fullName: req.body?.fullName,
    idNumber: req.body?.idNumber,
  })
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' })
  const { docType, fullName, idNumber } = parsed.data
  const file = (req as any).file as Express.Multer.File | undefined
  const photoUrl = file ? publicUrl(file.filename) : null

  const db = getDB()
  const id = uid('kyc')
  const now = new Date().toISOString()

  const trx = db.transaction(() => {
    db.prepare(
      'INSERT INTO kyc_submissions (id,userId,docType,fullName,idNumber,photoUrl,status,createdAt) VALUES (?,?,?,?,?,?,?,?)',
    ).run(id, req.user!.uid, docType, fullName, idNumber, photoUrl, 'IN_REVIEW', now)
    db.prepare('UPDATE users SET kycStatus=? WHERE id=?').run('IN_REVIEW', req.user!.uid)
  })
  trx()

  res.json({ ok: true, status: 'IN_REVIEW', photoUrl })
})

/** GET /kyc/status */
router.get('/status', authRequired, (req, res) => {
  const db = getDB()
  const row = db.prepare('SELECT kycStatus FROM users WHERE id=?').get(req.user!.uid) as { kycStatus: string }
  res.json({ status: row?.kycStatus || 'NOT_STARTED' })
})

export default router
