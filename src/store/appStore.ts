/**
 * store/appStore.ts
 * Central Zustand store for session, wallet, ledger, and mock earnings schedule.
 * Update: Withdrawals no longer require KYC; remove KYC gating from requestWithdrawal.
 * Update 2: Add crypto holdings (assets) for BTC/ETH and USDT minor to power multi-balance display.
 * Update 3: Add exchange() to convert between BTC/ETH and USDT, updating assets and wallet.
 * Update 4: Add requestCryptoWithdrawal() to support BTC/ETH withdrawals (deducts crypto assets with 1% fee).
 */
import { create } from 'zustand'

/**
 * User
 * Authenticated user model.
 */
export interface User {
  id: string
  email: string
  name: string
  kycStatus: 'NOT_STARTED' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED'
  roles: string[]
  referralCode: string
}

/**
 * Wallet
 * Wallet state with available and pending balances in minor units.
 */
export interface Wallet {
  availableMinor: number
  pendingMinor: number
  currency: string
  updatedAt: string
}

/**
 * LedgerEntry
 * Financial ledger entry model.
 */
export interface LedgerEntry {
  id: string
  type: 'EARN' | 'PAYOUT' | 'COMMISSION' | 'WITHDRAWAL_REQUEST' | 'WITHDRAWAL_FEE' | 'WITHDRAWAL_PAID' | 'ADJUSTMENT'
  amountMinor: number
  currency: string
  createdAt: string
  refId?: string
  meta?: Record<string, unknown>
}

/**
 * EarningsDay
 * A mock display model for daily earnings schedule.
 */
export interface EarningsDay {
  date: string
  amountMinor: number
  locked: boolean
}

/**
 * AssetBalances
 * Holdings across multiple assets; USDT is tracked in minor units, BTC/ETH in native units.
 */
export interface AssetBalances {
  usdtMinor: number
  btc: number
  eth: number
}

/**
 * AppState
 * Zustand state shape.
 */
interface AppState {
  user: User
  wallet: Wallet
  assets: AssetBalances
  accruedMinor: number
  monthTargetMinor: number
  earningsSchedule: EarningsDay[]
  ledger: LedgerEntry[]
  // Actions
  manualPayout: () => Promise<void>
  requestWithdrawal: (amountMinor: number) => Promise<{ ok: boolean; message?: string }>
  /** 
   * requestCryptoWithdrawal
   * Withdraw BTC or ETH with a 1% fee. Deducts crypto holdings only; does not change USDT wallet balance.
   */
  requestCryptoWithdrawal: (params: { symbol: 'BTC' | 'ETH'; amountCrypto: number }) => Promise<{ ok: boolean; message?: string }>
  submitKYC: (profile: { fullName: string; idNumber: string }) => Promise<void>
  setKYCStatus: (status: User['kycStatus']) => void
  /**
   * exchange
   * Convert between BTC/ETH and USDT.
   * - direction: CRYPTO_TO_USDT or USDT_TO_CRYPTO
   * - symbol: BTC or ETH
   * - priceUsdtPerCrypto: market price (USDT per 1 crypto)
   * - amountCrypto: amount in crypto (for CRYPTO_TO_USDT)
   * - amountUsdtMinor: amount in minor units (for USDT_TO_CRYPTO)
   */
  exchange: (params: {
    direction: 'CRYPTO_TO_USDT' | 'USDT_TO_CRYPTO'
    symbol: 'BTC' | 'ETH'
    priceUsdtPerCrypto: number
    amountCrypto?: number
    amountUsdtMinor?: number
  }) => Promise<{ ok: boolean; message?: string }>
}

/**
 * seedSchedule
 * Generates a simple pseudo-random earnings schedule for display (mock).
 * NOTE: In a real app the server returns this authoritatively.
 */
function seedSchedule(days = 30, seed = 42, dailyAvgMinor = 5000) {
  let x = seed
  const rand = () => {
    x ^= x << 13
    x ^= x >> 17
    x ^= x << 5
    return Math.abs(x) / 0x7fffffff
  }
  const arr: EarningsDay[] = []
  for (let i = 1; i <= days; i++) {
    const noise = (rand() - 0.5) * 0.6 // +/- 30%
    const amount = Math.max(0, Math.round(dailyAvgMinor * (1 + noise)))
    const d = new Date()
    d.setDate(i)
    arr.push({ date: d.toISOString(), amountMinor: amount, locked: i < new Date().getDate() })
  }
  return arr
}

/**
 * createId
 * Small helper to create an ID string.
 */
function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * formatNowISO
 * Returns current datetime in ISO string.
 */
function formatNowISO() {
  return new Date().toISOString()
}

/**
 * useAppStore
 * Centralized app state with mock actions.
 * Update: requestWithdrawal no longer checks KYC status; KYC is optional.
 * Update 2: Add assets (BTC/ETH/USDT) to support multi-balance display.
 * Update 3: Add exchange() to convert between BTC/ETH and USDT.
 * Update 4: Add requestCryptoWithdrawal() for BTC/ETH withdrawals.
 */
export const useAppStore = create<AppState>((set, get) => ({
  user: {
    id: 'u_1',
    email: 'jane@example.com',
    name: 'Jane Doe',
    kycStatus: 'NOT_STARTED',
    roles: ['USER'],
    referralCode: 'JANE123',
  },
  wallet: {
    availableMinor: 120_00,
    pendingMinor: 0,
    currency: 'USD',
    updatedAt: formatNowISO(),
  },
  // Mock holdings for demo; in production these come from API
  assets: {
    usdtMinor: 120_00, // mirrors wallet.availableMinor for demo; USDT ~= USD
    btc: 0.015423, // sample BTC deposit amount
    eth: 0.4201,   // sample ETH deposit amount
  },
  accruedMinor: 4_235, // accrued earnings not yet paid out
  monthTargetMinor: 150_000, // $1,500.00
  earningsSchedule: seedSchedule(30, 99, 150_000 / 30),
  ledger: [
    { id: createId('l'), type: 'EARN', amountMinor: 3_500, currency: 'USD', createdAt: new Date(Date.now() - 86400000).toISOString(), refId: 'day-12' },
    { id: createId('l'), type: 'PAYOUT', amountMinor: 10_000, currency: 'USD', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), refId: 'payout-1' },
    { id: createId('l'), type: 'COMMISSION', amountMinor: 800, currency: 'USD', createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), refId: 'ref-1' },
  ],
  async manualPayout() {
    const { accruedMinor, wallet } = get()
    if (accruedMinor <= 0) return
    const now = formatNowISO()
    // Update wallet balance and ledger
    set({
      wallet: { ...wallet, availableMinor: wallet.availableMinor + accruedMinor, updatedAt: now },
      accruedMinor: 0,
      ledger: [
        { id: createId('l'), type: 'PAYOUT', amountMinor: accruedMinor, currency: wallet.currency, createdAt: now, refId: createId('payout') },
        ...get().ledger,
      ],
    })
    // Simulate latency
    await new Promise((r) => setTimeout(r, 600))
  },
  /**
   * requestWithdrawal
   * Deduct available balance (plus 1% fee) and mark amount as pending.
   * NOTE: KYC is NOT required; no gating by user.kycStatus.
   */
  async requestWithdrawal(amountMinor: number) {
    const { wallet } = get()
    if (amountMinor <= 0) return { ok: false, message: 'Invalid amount.' }
    if (amountMinor > wallet.availableMinor) return { ok: false, message: 'Insufficient balance.' }
    // Deduct and add ledger entries for request and fee (1% fee mock)
    const feeMinor = Math.round(amountMinor * 0.01)
    const now = formatNowISO()
    set({
      wallet: {
        ...wallet,
        availableMinor: wallet.availableMinor - amountMinor - feeMinor,
        pendingMinor: wallet.pendingMinor + amountMinor,
        updatedAt: now,
      },
      ledger: [
        { id: createId('l'), type: 'WITHDRAWAL_REQUEST', amountMinor: -amountMinor, currency: wallet.currency, createdAt: now, refId: createId('wd') },
        { id: createId('l'), type: 'WITHDRAWAL_FEE', amountMinor: -feeMinor, currency: wallet.currency, createdAt: now, refId: 'fee' },
        ...get().ledger,
      ],
    })
    await new Promise((r) => setTimeout(r, 600))
    return { ok: true }
  },
  async requestCryptoWithdrawal({ symbol, amountCrypto }) {
    const s = get()
    const now = formatNowISO()
    if (!isFinite(amountCrypto) || amountCrypto <= 0) return { ok: false, message: 'Invalid amount.' }

    const assets = { ...s.assets }
    const available = symbol === 'BTC' ? assets.btc : assets.eth
    const fee = amountCrypto * 0.01
    const total = amountCrypto + fee

    if (total > available + 1e-12) return { ok: false, message: `Insufficient ${symbol}.` }

    // Deduct crypto assets (amount + fee)
    if (symbol === 'BTC') {
      assets.btc = Math.max(0, available - total)
    } else {
      assets.eth = Math.max(0, available - total)
    }

    set({
      assets,
      // Optional: push a lightweight ledger adjustment with currency = symbol for traceability.
      ledger: [
        { id: createId('l'), type: 'WITHDRAWAL_REQUEST', amountMinor: 0, currency: symbol, createdAt: now, refId: createId(`wd_${symbol}`), meta: { amountCrypto, fee } },
        ...get().ledger,
      ],
    })

    await new Promise((r) => setTimeout(r, 500))
    return { ok: true }
  },
  async submitKYC(profile: { fullName: string; idNumber: string }) {
    // No-op mock, move to IN_REVIEW
    const _ = profile
    set((s) => ({ user: { ...s.user, kycStatus: 'IN_REVIEW' } }))
    await new Promise((r) => setTimeout(r, 500))
  },
  setKYCStatus(status) {
    set((s) => ({ user: { ...s.user, kycStatus: status } }))
  },
  /**
   * exchange
   * Convert between BTC/ETH and USDT; updates assets and wallet atomically.
   */
  async exchange(params) {
    const { direction, symbol, priceUsdtPerCrypto } = params
    const now = formatNowISO()
    if (!priceUsdtPerCrypto || !isFinite(priceUsdtPerCrypto) || priceUsdtPerCrypto <= 0) {
      return { ok: false, message: 'Invalid price.' }
    }
    const s = get()
    const assets = { ...s.assets }
    const wallet = { ...s.wallet }

    if (direction === 'CRYPTO_TO_USDT') {
      const amt = params.amountCrypto ?? 0
      if (!isFinite(amt) || amt <= 0) return { ok: false, message: 'Invalid amount.' }
      const availableCrypto = symbol === 'BTC' ? assets.btc : assets.eth
      if (amt > availableCrypto + 1e-12) return { ok: false, message: `Insufficient ${symbol}.` }
      // Calculate USDT minor to add
      const usdtToAddMinor = Math.round(amt * priceUsdtPerCrypto * 100)
      // Update holdings
      if (symbol === 'BTC') assets.btc = Math.max(0, availableCrypto - amt)
      else assets.eth = Math.max(0, availableCrypto - amt)
      assets.usdtMinor += usdtToAddMinor
      wallet.availableMinor += usdtToAddMinor
      wallet.updatedAt = now

      set({
        assets,
        wallet,
        ledger: [
          { id: createId('l'), type: 'ADJUSTMENT', amountMinor: usdtToAddMinor, currency: 'USD', createdAt: now, refId: `EX_${symbol}_TO_USDT` },
          ...get().ledger,
        ],
      })
      await new Promise((r) => setTimeout(r, 150))
      return { ok: true }
    } else {
      const amtMinor = params.amountUsdtMinor ?? 0
      if (!isFinite(amtMinor) || amtMinor <= 0) return { ok: false, message: 'Invalid amount.' }
      if (amtMinor > assets.usdtMinor || amtMinor > wallet.availableMinor) return { ok: false, message: 'Insufficient USDT.' }
      // Crypto to add = USDT / price
      const cryptoToAdd = amtMinor / 100 / priceUsdtPerCrypto
      // Update holdings
      assets.usdtMinor -= amtMinor
      wallet.availableMinor -= amtMinor
      wallet.updatedAt = now
      if (symbol === 'BTC') assets.btc += cryptoToAdd
      else assets.eth += cryptoToAdd

      set({
        assets,
        wallet,
        ledger: [
          { id: createId('l'), type: 'ADJUSTMENT', amountMinor: -amtMinor, currency: 'USD', createdAt: now, refId: `EX_USDT_TO_${symbol}` },
          ...get().ledger,
        ],
      })
      await new Promise((r) => setTimeout(r, 150))
      return { ok: true }
    }
  },
}))