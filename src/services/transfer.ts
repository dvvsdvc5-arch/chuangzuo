/**
 * services/transfer.ts
 * Internal transfer submission.
 */

import { apiPost } from './http'

export interface TransferPayload {
  toAccountId: string
  amountMinor: number
}

/**
 * submitTransfer
 * Submit a 0-fee internal transfer.
 */
export async function submitTransfer(payload: TransferPayload): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>('/transfer', payload)
}
