/**
 * services/deposits.ts
 * Deposit creation and listing services (multipart supported).
 */

import { apiGet, apiPostForm } from './http'

/** Deposit item returned by backend */
export interface DepositItem {
  id: string
  userId: string
  network: string
  address: string
  txHash?: string | null
  proofUrl?: string | null
  amountMinor: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

/** Create deposit response */
export interface DepositCreateResp {
  ok: boolean
  id: string
  status: 'PENDING'
  proofUrl?: string
}

export interface CreateDepositPayload {
  network: string
  address: string
  txHash?: string
  amountMinor?: number
  proof?: File
}

/**
 * createDeposit
 * Submit a deposit with optional proof image.
 */
export async function createDeposit(payload: CreateDepositPayload): Promise<DepositCreateResp> {
  const form = new FormData()
  form.set('network', payload.network)
  form.set('address', payload.address)
  if (payload.txHash) form.set('txHash', payload.txHash)
  if (typeof payload.amountMinor === 'number') form.set('amountMinor', String(payload.amountMinor))
  if (payload.proof) form.set('proof', payload.proof as any)
  return apiPostForm<DepositCreateResp>('/deposits', form)
}

/**
 * listDeposits
 * Fetch user's deposit records.
 */
export async function listDeposits(): Promise<{ items: DepositItem[] }> {
  return apiGet<{ items: DepositItem[] }>('/deposits')
}
