/**
 * server/middleware/auth.ts
 * Express middleware to protect routes with Bearer JWT.
 */

import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../auth'

/** Augment Express Request with user claims */
declare global {
  namespace Express {
    interface Request {
      user?: { uid: string; email: string }
    }
  }
}

/**
 * authRequired
 * Read Authorization: Bearer <token>, verify and attach req.user.
 */
export function authRequired(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || ''
    const m = /^Bearer\s+(.+)$/.exec(header)
    if (!m) return res.status(401).json({ error: 'Unauthorized' })
    const claims = verifyToken(m[1])
    req.user = { uid: claims.uid, email: claims.email }
    next()
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}
