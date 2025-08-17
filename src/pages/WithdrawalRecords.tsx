/**
 * pages/WithdrawalRecords.tsx
 * Display a list/table of withdrawal records with status, amount, time, address, and network.
 * Source: real API via services/withdrawals.ts (listWithdrawals).
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { listWithdrawals, type WithdrawalItem } from '../services/withdrawals'

/**
 * formatCurrencyUsdt
 * Format USDT minor units to currency string.
 */
function formatCurrencyUsdt(minor?: number): string {
  if (typeof minor !== 'number') return '-'
  const value = minor / 100
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
  } catch {
    return `USDT ${value.toFixed(2)}`
  }
}

/**
 * formatCrypto
 * Format crypto amount with fixed precision and symbol.
 */
function formatCrypto(amount?: number | null, symbol?: WithdrawalItem['symbol']): string {
  if (typeof amount !== 'number') return '-'
  const precision = 8
  return `${amount.toFixed(precision)} ${symbol || ''}`.trim()
}

/**
 * deriveAmountDisplay
 * Choose display based on symbol and available amount fields.
 * - USDT: prefer amountMinor
 * - BTC/ETH: prefer amountCrypto
 */
function deriveAmountDisplay(item: WithdrawalItem): string {
  if (item.symbol === 'USDT') {
    return formatCurrencyUsdt(item.amountMinor ?? undefined)
  }
  return formatCrypto(item.amountCrypto ?? undefined, item.symbol)
}

/**
 * maskAddress
 * Reduce long address to a compact head-tail form.
 */
function maskAddress(addr?: string, head = 6, tail = 6): string {
  if (!addr) return '-'
  if (addr.length <= head + tail + 1) return addr
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`
}

/**
 * statusBadgeClass
 * Map backend status to badge classes.
 */
function statusBadgeClass(s: WithdrawalItem['status']): string {
  const map: Record<WithdrawalItem['status'], string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-rose-100 text-rose-700',
  }
  return `px-2 py-0.5 rounded-md text-xs ${map[s]}`
}

/**
 * statusLabel
 * Provide localized labels with sensible defaults.
 */
function statusLabel(s: WithdrawalItem['status'], t: (k: string, o?: any) => string): string {
  const defaults: Record<WithdrawalItem['status'], string> = {
    PENDING: t('withdrawalRecords.status.PENDING', { defaultValue: 'Pending' }),
    APPROVED: t('withdrawalRecords.status.APPROVED', { defaultValue: 'Approved' }),
    REJECTED: t('withdrawalRecords.status.REJECTED', { defaultValue: 'Rejected' }),
  }
  return defaults[s]
}

/**
 * WithdrawalRecordsPage
 * Renders a table of withdrawal records from the service.
 */
export default function WithdrawalRecordsPage(): JSX.Element {
  const { t } = useTranslation()
  const [records, setRecords] = useState<WithdrawalItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  // Load on mount and when update event fires.
  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const res = await listWithdrawals()
        if (mounted) setRecords(res.items || [])
      } catch (e) {
        // Silent fail: keep UX clean; devs check console.
        // eslint-disable-next-line no-console
        console.warn('[withdrawals] list failed:', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()

    const handler = () => load()
    window.addEventListener('withdrawals:update' as any, handler as any)
    return () => {
      mounted = false
      window.removeEventListener('withdrawals:update' as any, handler as any)
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Title card */}
      <section className="rounded-xl border bg-white/70 backdrop-blur p-5 md:p-6 dark:bg-slate-900/70 dark:border-slate-800">
        <h2 className="text-xl font-semibold tracking-tight">{t('withdrawalRecords.title', { defaultValue: 'Withdrawal Records' })}</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t('withdrawalRecords.subtitle', { defaultValue: 'Review your recent withdrawals.' })}
        </p>
      </section>

      {/* Records table */}
      <section className="rounded-xl border bg-white/70 backdrop-blur p-4 md:p-5 dark:bg-slate-900/70 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-3">{t('withdrawalRecords.columns.time', { defaultValue: 'Time' })}</th>
                <th className="py-2 pr-3">{t('withdrawalRecords.columns.network', { defaultValue: 'Network' })}</th>
                <th className="py-2 pr-3">{t('withdrawalRecords.columns.address', { defaultValue: 'Address' })}</th>
                <th className="py-2 pr-3">{t('withdrawalRecords.columns.status', { defaultValue: 'Status' })}</th>
                <th className="py-2 pr-3">{t('withdrawalRecords.columns.amount', { defaultValue: 'Amount' })}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    {t('common.loading', { defaultValue: 'Loading...' })}
                  </td>
                </tr>
              )}
              {!loading &&
                records.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-2 pr-3">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-3 text-slate-700 dark:text-slate-300">{r.network}</td>
                    <td className="py-2 pr-3 text-slate-700 dark:text-slate-300">{maskAddress(r.address)}</td>
                    <td className="py-2 pr-3">
                      <span className={statusBadgeClass(r.status)}>{statusLabel(r.status, t)}</span>
                    </td>
                    <td className="py-2 pr-3 font-medium">{deriveAmountDisplay(r)}</td>
                  </tr>
                ))}
              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    {t('withdrawalRecords.empty', { defaultValue: 'No withdrawal records yet.' })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
