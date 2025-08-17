/**
 * services/withdrawals.ts
 * Withdrawal submission and listing using backend API.
 */

import { apiGet, apiPost } from './http'

/** Withdrawal item returned by backend */
export interface WithdrawalItem {
  id: string
  userId: string
  network: string
  address: string
  symbol: 'USDT' | 'BTC' | 'ETH'
  amountMinor?: number | null
  amountCrypto?: number | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

export interface CreateWithdrawalPayload {
  network: string
  address: string
  symbol: 'USDT' | 'BTC' | 'ETH'
  amountMinor?: number
  amountCrypto?: number
}

/**
 * createWithdrawal
 * Submit withdrawal request.
 */
export async function createWithdrawal(payload: CreateWithdrawalPayload): Promise<{ ok: boolean; id: string; status: 'PENDING' }> {
  return apiPost<{ ok: boolean; id: string; status: 'PENDING' }>('/withdrawals', payload)
}

/**
 * listWithdrawals
 * Fetch user's withdrawal records.
 */
export async function listWithdrawals(): Promise<{ items: WithdrawalItem[] }> {
  return apiGet<{ items: WithdrawalItem[] }>('/withdrawals')
}
