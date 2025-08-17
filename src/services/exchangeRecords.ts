/**
 * services/exchangeRecords.ts
 * Local exchange records service using localStorage for persistence.
 * Provides create and read helpers and broadcasts updates via a CustomEvent.
 */

export type ExchangeDirection = 'CRYPTO_TO_USDT' | 'USDT_TO_CRYPTO'
export type ExchangeSymbol = 'BTC' | 'ETH'

/**
 * ExchangeRecord
 * A record representing a user exchange operation.
 */
export interface ExchangeRecord {
  /** Unique id */
  id: string
  /** ISO timestamp of creation */
  createdAt: string
  /** Direction of exchange */
  direction: ExchangeDirection
  /** Symbol when crypto is involved */
  symbol: ExchangeSymbol
  /** Price (USDT per 1 symbol) at time of exchange */
  priceUsdtPerCrypto: number
  /** Input crypto amount (for CRYPTO_TO_USDT), undefined otherwise */
  amountCrypto?: number
  /** Input USDT amount in minor units (for USDT_TO_CRYPTO), undefined otherwise */
  amountUsdtMinor?: number
  /** Resulting USDT change in minor (positive when receiving, negative when spending) */
  resultUsdtMinor?: number
  /** Resulting crypto change (positive when receiving, negative when spending) */
  resultCrypto?: number
}

const STORAGE_KEY = 'exchangeRecords'

/**
 * genId
 * Generate a simple unique id for records.
 */
function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * readRecords
 * Read records array from localStorage.
 */
function readRecords(): ExchangeRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as ExchangeRecord[]
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

/**
 * saveRecords
 * Persist and broadcast update event.
 */
function saveRecords(records: ExchangeRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  window.dispatchEvent(new CustomEvent('exchangeRecords:update'))
}

/**
 * createExchangeRecord
 * Append a new exchange record.
 */
export async function createExchangeRecord(
  rec: Omit<ExchangeRecord, 'id' | 'createdAt'>,
): Promise<{ ok: boolean; record?: ExchangeRecord }> {
  // Simulate tiny latency
  await new Promise((r) => setTimeout(r, 100))
  const record: ExchangeRecord = {
    ...rec,
    id: genId(),
    createdAt: new Date().toISOString(),
  }
  const list = readRecords()
  list.unshift(record)
  saveRecords(list)
  return { ok: true, record }
}

/**
 * getExchangeRecords
 * Read all records (latest first).
 */
export function getExchangeRecords(): ExchangeRecord[] {
  return readRecords()
}
