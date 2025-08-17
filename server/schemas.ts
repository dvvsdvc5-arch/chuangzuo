/**
 * server/schemas.ts
 * Zod schemas for request validation.
 */

import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
})

export const KycSubmitSchema = z.object({
  docType: z.enum(['PASSPORT', 'ID_CARD', 'DRIVER_LICENSE']),
  fullName: z.string().min(1),
  idNumber: z.string().min(1),
  // photo handled by multer
})

export const DepositCreateSchema = z.object({
  network: z.string().min(1),
  address: z.string().min(1),
  txHash: z.string().optional(),
  amountMinor: z.number().int().nonnegative().optional(),
})

export const WithdrawalCreateSchema = z.object({
  network: z.string().min(1),
  address: z.string().min(1),
  symbol: z.enum(['USDT', 'BTC', 'ETH']),
  amountMinor: z.number().int().positive().optional(),
  amountCrypto: z.number().positive().optional(),
})

export const ExchangeCreateSchema = z.object({
  direction: z.enum(['CRYPTO_TO_USDT', 'USDT_TO_CRYPTO']),
  symbol: z.enum(['BTC', 'ETH']),
  priceUsdtPerCrypto: z.number().positive(),
  amountCrypto: z.number().positive().optional(),
  amountUsdtMinor: z.number().int().positive().optional(),
})

export const TransferCreateSchema = z.object({
  toAccountId: z.string().min(1),
  amountMinor: z.number().int().positive(),
})
