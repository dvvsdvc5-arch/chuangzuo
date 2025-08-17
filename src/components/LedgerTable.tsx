/**
 * components/LedgerTable.tsx
 * Filterable ledger table for financial entries.
 */
import { useMemo, useState } from 'react'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'

/**
 * LedgerEntry
 * Strongly typed ledger entry model for display.
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
 * LedgerTableProps
 * Props for the LedgerTable component.
 */
interface LedgerTableProps {
  entries: LedgerEntry[]
}

/**
 * formatMinor
 * Converts minor units to formatted currency.
 */
function formatMinor(minor: number, currency: string): string {
  const value = minor / 100
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

/**
 * typeBadge
 * Returns a colored badge based on entry type.
 */
function typeBadge(type: LedgerEntry['type']) {
  const map: Record<LedgerEntry['type'], string> = {
    EARN: 'bg-emerald-100 text-emerald-700',
    PAYOUT: 'bg-indigo-100 text-indigo-700',
    COMMISSION: 'bg-cyan-100 text-cyan-700',
    WITHDRAWAL_REQUEST: 'bg-amber-100 text-amber-700',
    WITHDRAWAL_FEE: 'bg-orange-100 text-orange-700',
    WITHDRAWAL_PAID: 'bg-blue-100 text-blue-700',
    ADJUSTMENT: 'bg-slate-100 text-slate-700',
  }
  return map[type]
}

/**
 * LedgerTable
 * Displays ledger entries with a simple type filter.
 */
export default function LedgerTable({ entries }: LedgerTableProps) {
  const [type, setType] = useState<string>('ALL')

  const filtered = useMemo(() => {
    if (type === 'ALL') return entries
    return entries.filter((e) => e.type === type)
  }, [entries, type])

  return (
    <div className="rounded-xl border bg-white/70 backdrop-blur p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium">Ledger</div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="EARN">Earnings</SelectItem>
            <SelectItem value="PAYOUT">Payouts</SelectItem>
            <SelectItem value="COMMISSION">Commissions</SelectItem>
            <SelectItem value="WITHDRAWAL_REQUEST">Withdrawal Requests</SelectItem>
            <SelectItem value="WITHDRAWAL_FEE">Withdrawal Fees</SelectItem>
            <SelectItem value="WITHDRAWAL_PAID">Withdrawal Paid</SelectItem>
            <SelectItem value="ADJUSTMENT">Adjustments</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Amount</th>
              <th className="py-2 pr-3">Ref</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-t hover:bg-slate-50/60">
                <td className="py-2 pr-3">{new Date(e.createdAt).toLocaleString()}</td>
                <td className="py-2 pr-3">
                  <span className={`px-2 py-0.5 rounded-md text-xs ${typeBadge(e.type)}`}>{e.type}</span>
                </td>
                <td className="py-2 pr-3 font-medium">{formatMinor(e.amountMinor, e.currency)}</td>
                <td className="py-2 pr-3 text-slate-500">{e.refId ?? '-'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="py-6 text-center text-slate-500" colSpan={4}>
                  No entries
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
