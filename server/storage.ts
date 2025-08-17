/**
 * server/storage.ts
 * Multer storage engine for uploaded images (proofs, KYC photos).
 */

import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'

const uploadDir = path.resolve(process.cwd(), 'server', 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

/** Use disk storage with unique filenames */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '')
    const name = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`
    cb(null, name)
  },
})

/** Accept basic images only (mime guarding) */
function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (file.mimetype.startsWith('image/')) return cb(null, true)
  cb(new Error('Only image uploads are allowed'))
}

/** Exported multer instance */
export const upload = multer({ storage, fileFilter })

/** Build public URL for a stored file */
export function publicUrl(filename: string): string {
  return `/uploads/${filename}`
}
