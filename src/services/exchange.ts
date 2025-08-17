/**
 * services/exchange.ts
 * Exchange submission and records listing.
 */

import { apiGet, apiPost } from './http'

export type ExchangeDirection = 'CRYPTO_TO_USDT' | 'USDT_TO_CRYPTO'
export type ExchangeSymbol = 'BTC' | 'ETH'

export interface ExchangeRecordItem {
  id: string
  userId: string
  direction: ExchangeDirection
  symbol: ExchangeSymbol
  priceUsdtPerCrypto: number
  amountCrypto?: number | null
  amountUsdtMinor?: number | null
  resultUsdtMinor?: number | null
  resultCrypto?: number | null
  createdAt: string
}

export interface SubmitExchangePayload {
  direction: ExchangeDirection
  symbol: ExchangeSymbol
  priceUsdtPerCrypto: number
  amountCrypto?: number
  amountUsdtMinor?: number
}

/**
 * submitExchange
 * Create a new exchange record.
 */
export async function submitExchange(payload: SubmitExchangePayload): Promise<{ ok: boolean; id: string }> {
  return apiPost<{ ok: boolean; id: string }>('/exchange', payload)
}

/**
 * listExchangeRecords
 * Fetch user's exchange records.
 */
export async function listExchangeRecords(): Promise<{ items: ExchangeRecordItem[] }> {
  return apiGet<{ items: ExchangeRecordItem[] }>('/exchange/records')
}
