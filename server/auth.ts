/**
 * server/auth.ts
 * JWT helpers and password hashing utilities.
 */

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

/** JWT secret with fallback for development */
const SECRET = process.env.JWT_SECRET || 'dev_secret'

/** Token expiration (7 days) */
const EXPIRES_IN = '7d'

/** Claims payload type */
export interface UserClaims {
  uid: string
  email: string
}

/** signToken - create a JWT for a user */
export function signToken(claims: UserClaims): string {
  return jwt.sign(claims, SECRET, { expiresIn: EXPIRES_IN })
}

/** verifyToken - verify and decode JWT */
export function verifyToken(token: string): UserClaims {
  return jwt.verify(token, SECRET) as UserClaims
}

/** hashPassword - bcrypt hash */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/** comparePassword - bcrypt compare */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
