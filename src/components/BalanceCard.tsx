/**
 * components/BalanceCard.tsx
 * A specialized balance card rendering the total USD balance and native amounts of BTC/ETH.
 * Visual: same container style as StatCard, with compact asset badges at the bottom.
 */

import React from 'react'
import { formatMinorPlain } from '../utils/currency'

/**
 * BalanceCardProps
 * Props for the specialized wallet balance card.
 */
export interface BalanceCardProps {
  /** Main label, e.g., "Account Balance" */
  label: string
  /** Total USD balance in minor units (cents) */
  totalMinor: number
  /** Sub text, e.g., "Available" */
  sub?: string
  /** BTC holdings in native units (optional) */
  btc?: number
  /** ETH holdings in native units (optional) */
  eth?: number
  /** Optional extra className */
  className?: string
}

/**
 * formatCrypto
 * Formats crypto quantity up to 8 decimals, trimming trailing zeros.
 */
function formatCrypto(value?: number): string {
  if (value === undefined || value === null) return '0'
  // Limit to 8 decimals, then trim trailing zeros
  const fixed = value.toFixed(8)
  return fixed.replace(/\.?0+$/, '')
}

/**
 * AssetBadge
 * A small pill badge for displaying a crypto symbol with its quantity.
 */
function AssetBadge({ symbol, amount }: { symbol: 'BTC' | 'ETH'; amount?: number }): JSX.Element {
  const palette =
    symbol === 'BTC'
      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800'
      : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-800'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${palette}`}
      title={`${symbol} ${formatCrypto(amount)}`}
      aria-label={`${symbol} amount`}
    >
      <span className="font-mono">{formatCrypto(amount)}</span>
      <span className="opacity-80">{symbol}</span>
    </span>
  )
}

/**
 * BalanceCard
 * Renders total USD balance and shows BTC/ETH quantities as compact badges.
 */
export default function BalanceCard({ label, totalMinor, sub, btc, eth, className = '' }: BalanceCardProps) {
  return (
    <div className={`rounded-xl border bg-white/70 backdrop-blur p-4 dark:bg-slate-900/70 dark:border-slate-800 ${className}`}>
      {/* Header: label + gradient dot */}
      <div className="flex items-start justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 opacity-80" />
      </div>

      {/* Main value */}
      <div className="mt-1.5 text-xl font-semibold tracking-tight">{formatMinorPlain(totalMinor)}</div>

      {/* Sub text */}
      {sub ? <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{sub}</div> : null}

      {/* Asset badges */}
      {(btc !== undefined || eth !== undefined) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {btc !== undefined && <AssetBadge symbol="BTC" amount={btc} />}
          {eth !== undefined && <AssetBadge symbol="ETH" amount={eth} />}
        </div>
      )}
    </div>
  )
}
