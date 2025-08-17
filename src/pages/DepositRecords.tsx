/**
 * pages/DepositRecords.tsx
 * Display a simple list/table of deposit records with status and Tx hash suffix.
 * This is a demo page; in production data should come from backend.
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * DepositRecord
 * Model for a deposit record entry.
 */
interface DepositRecord {
  id: string
  createdAt: string
  network: string
  amountMinor?: number
  currency?: string
  txHash?: string
  status: 'PENDING' | 'CONFIRMED' | 'FAILED'
}

/**
 * formatCurrency
 * Format minor units to a currency string; falls back to plain if currency invalid.
 */
function formatCurrency(minor?: number, currency: string = 'USDT'): string {
  if (typeof minor !== 'number') return '-'
  const value = minor / 100
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

/**
 * hashTail
 * Returns the last n characters of a hash, prefixed with ellipsis.
 */
function hashTail(hash?: string, n = 6): string {
  if (!hash || hash.length <= n) return hash || '-'
  return `…${hash.slice(-n)}`
}

/**
 * statusBadgeClass
 * Map status to a colored badge class.
 */
function statusBadgeClass(s: DepositRecord['status']): string {
  const map: Record<DepositRecord['status'], string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-emerald-100 text-emerald-700',
    FAILED: 'bg-rose-100 text-rose-700',
  }
  return `px-2 py-0.5 rounded-md text-xs ${map[s]}`
}

/**
 * DepositRecordsPage
 * Renders a table of deposit records.
 */
export default function DepositRecordsPage(): JSX.Element {
  const { t } = useTranslation()

  // Mock records: replace with API call in production.
  const records: DepositRecord[] = useMemo(
    () => [
      {
        id: 'r1',
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        network: 'TRC20-USDT',
        amountMinor: 500000, // 5,000.00
        currency: 'USDT',
        txHash: 'a4f3bd2f1c6a2e9b7cd8402a1f9c8de34567abcd1234',
        status: 'PENDING',
      },
      {
        id: 'r2',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        network: 'ERC20-USDT',
        amountMinor: 1200000,
        currency: 'USDT',
        txHash: '0x2fce9a7dcb008ad5e61b0b6d2f9a3e8d4b1c2e3f',
        status: 'CONFIRMED',
      },
      {
        id: 'r3',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
        network: 'BTC',
        amountMinor: undefined,
        currency: 'BTC',
        txHash: '00000000000000000001e7a4aa41efb8cdefe098',
        status: 'FAILED',
      },
    ],
    [],
  )

  return (
    <div className="space-y-4">
      {/* Title card */}
      <section className="rounded-xl border bg-white/70 backdrop-blur p-5 md:p-6 dark:bg-slate-900/70 dark:border-slate-800">
        <h2 className="text-xl font-semibold tracking-tight">{t('depositRecords.title')}</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t('depositRecords.subtitle', { defaultValue: 'Review your recent deposits.' })}
        </p>
      </section>

      {/* Records table */}
      <section className="rounded-xl border bg-white/70 backdrop-blur p-4 md:p-5 dark:bg-slate-900/70 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-3">{t('depositRecords.columns.time', { defaultValue: 'Time' })}</th>
                <th className="py-2 pr-3">{t('depositRecords.columns.network', { defaultValue: 'Network' })}</th>
                <th className="py-2 pr-3">{t('depositRecords.columns.status', { defaultValue: 'Status' })}</th>
                <th className="py-2 pr-3">{t('depositRecords.columns.hash', { defaultValue: 'Tx Hash' })}</th>
                <th className="py-2 pr-3">{t('depositRecords.columns.amount', { defaultValue: 'Amount' })}</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-t hover:bg-slate-50/60">
                  <td className="py-2 pr-3">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="py-2 pr-3">{r.network}</td>
                  <td className="py-2 pr-3">
                    <span className={statusBadgeClass(r.status)}>
                      {
                        {
                          PENDING: t('depositRecords.status.PENDING'),
                          CONFIRMED: t('depositRecords.status.CONFIRMED'),
                          FAILED: t('depositRecords.status.FAILED'),
                        }[r.status]
                      }
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-slate-600">
                    {hashTail(r.txHash, 6)}
                  </td>
                  <td className="py-2 pr-3 font-medium">
                    {formatCurrency(r.amountMinor, r.currency)}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    {t('depositRecords.empty')}
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
