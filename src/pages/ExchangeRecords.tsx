/**
 * pages/ExchangeRecords.tsx
 * Read-only list for exchange records. Data is from localStorage via service.
 * Visual: simple card list with direction badges and amounts, responsive and dark-mode friendly.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { getExchangeRecords, ExchangeRecord } from '../services/exchangeRecords'
import { formatMinorPlain } from '../utils/currency'

/**
 * DirBadge
 * Small badge component for direction.
 */
function DirBadge({ d }: { d: ExchangeRecord['direction'] }) {
  const isToUsdt = d === 'CRYPTO_TO_USDT'
  const cls = isToUsdt
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800'
    : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-800'
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${cls}`}>{isToUsdt ? 'To USDT' : 'From USDT'}</span>
}

/**
 * formatCrypto
 * Formats crypto quantity up to 8 decimals, trimming trailing zeros.
 */
function formatCrypto(value: number): string {
  const fixed = value.toFixed(8)
  return fixed.replace(/\.?0+$/, '')
}

/**
 * ExchangeRecordsPage
 * Main page to render exchange records.
 */
export default function ExchangeRecordsPage(): JSX.Element {
  const [list, setList] = useState<ExchangeRecord[]>([])

  // Load & subscribe to updates
  useEffect(() => {
    function load() {
      setList(getExchangeRecords())
    }
    load()
    const onUpdate = () => load()
    window.addEventListener('exchangeRecords:update', onUpdate)
    return () => window.removeEventListener('exchangeRecords:update', onUpdate)
  }, [])

  const isEmpty = useMemo(() => !list || list.length === 0, [list])

  return (
    <div className="space-y-4">
      {/* Title card */}
      <section className="rounded-xl border bg-white/70 backdrop-blur p-5 md:p-6 dark:bg-slate-900/70 dark:border-slate-800">
        <h2 className="text-xl font-semibold tracking-tight">Exchange Records</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          A history of your conversions between BTC/ETH and USDT.
        </p>
      </section>

      {/* List */}
      <section className="rounded-xl border bg-white/70 backdrop-blur p-0 dark:bg-slate-900/70 dark:border-slate-800 overflow-hidden">
        {isEmpty ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No records yet.
          </div>
        ) : (
          <ul className="divide-y dark:divide-slate-800">
            {list.map((r) => {
              const isToUsdt = r.direction === 'CRYPTO_TO_USDT'
              return (
                <li key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <DirBadge d={r.direction} />
                        <span className="text-sm font-medium">{r.symbol}</span>
                        <span className="text-xs text-slate-500">Rate: ${r.priceUsdtPerCrypto.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>

                      <div className="mt-1 text-sm">
                        {isToUsdt ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-slate-600 dark:text-slate-300">
                              {formatCrypto(r.amountCrypto || 0)} {r.symbol}
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="font-medium">{formatMinorPlain(r.resultUsdtMinor || 0)}</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-slate-600 dark:text-slate-300">
                              {formatMinorPlain(r.amountUsdtMinor || 0)}
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="font-medium">
                              {formatCrypto(r.resultCrypto || 0)} {r.symbol}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(r.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {/* Accent dot */}
                    <div className={`h-8 w-8 rounded-full ${isToUsdt ? 'bg-gradient-to-br from-emerald-500 to-teal-400' : 'bg-gradient-to-br from-indigo-500 to-sky-400'} opacity-80`} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
