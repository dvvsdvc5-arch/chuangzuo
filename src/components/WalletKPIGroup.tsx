/**
 * components/WalletKPIGroup.tsx
 * Wallet KPIs with i18n labels for balance, running, total, yesterday, today.
 * Dark mode: adds dark variants for grouped container and texts/dividers.
 * Update: Use BalanceCard for the "balance" block in separate layout to also show BTC/ETH quantities.
 * New: Enhanced "yesterday" KPI card to clearly show 20% service fee deduction and payout status badge.
 * New 2: Show yesterday return percentage relative to running capital (wallet.pendingMinor) as a compact pill.
 */

import React from 'react'
import StatCard from './StatCard'
import BalanceCard from './BalanceCard'
import { useAppStore } from '../store/appStore'
import { formatMinorPlain } from '../utils/currency'
import { Wallet as WalletIcon, Activity, Trophy, CalendarMinus2, CalendarPlus2, CheckCircle2, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export type MetricKey = 'balance' | 'running' | 'total' | 'yesterday' | 'today'

export interface WalletKPIGroupProps {
  size?: 'sm' | 'md'
  className?: string
  metrics?: MetricKey[]
  layout?: 'separate' | 'grouped'
}

/**
 * isSameDay
 * Check if an ISO string and a Date are same local day.
 */
function isSameDay(aISO: string, bDate: Date) {
  const a = new Date(aISO)
  return a.getFullYear() === bDate.getFullYear() && a.getMonth() === bDate.getMonth() && a.getDate() === bDate.getDate()
}

/**
 * startOfDay
 * Returns local start of day.
 */
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * getGridCols
 * Choose grid columns by count.
 */
function getGridCols(count: number) {
  if (count <= 2) return 'grid grid-cols-2 gap-3'
  if (count === 3) return 'grid grid-cols-2 md:grid-cols-3 gap-3'
  return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3'
}

/**
 * getInnerCols
 * Inner columns for grouped layout.
 */
function getInnerCols(count: number) {
  if (count <= 1) return 'grid grid-cols-1'
  if (count === 2) return 'grid grid-cols-2'
  if (count === 3) return 'grid grid-cols-3'
  if (count === 4) return 'grid grid-cols-4'
  return 'grid grid-cols-5'
}

const accentGradients: Record<'green' | 'blue' | 'purple' | 'orange', string> = {
  green: 'from-emerald-500 to-teal-400',
  blue: 'from-indigo-500 to-sky-400',
  purple: 'from-fuchsia-500 to-violet-400',
  orange: 'from-amber-500 to-orange-400',
}

/**
 * PayoutStatus
 * Profit payout status for yesterday's earnings.
 */
type PayoutStatus = 'SENT' | 'PARTIAL' | 'PENDING'

/**
 * getYesterdayNumbers
 * Derive yesterday gross earnings (EARN/COMMISSION), 20% fee, and net after fee.
 */
function getYesterdayNumbers(ledger: Array<{ type: string; amountMinor: number; createdAt: string }>) {
  const today = new Date()
  const y = new Date(startOfDay(today).getTime() - 24 * 60 * 60 * 1000)
  const grossMinor = ledger
    .filter((e) => (e.type === 'EARN' || e.type === 'COMMISSION') && isSameDay(e.createdAt, y))
    .reduce((sum, e) => sum + e.amountMinor, 0)
  const feeMinor = Math.round(grossMinor * 0.2)
  const netMinor = Math.max(0, grossMinor - feeMinor)
  return { grossMinor, feeMinor, netMinor, yesterdayDate: y, today }
}

/**
 * getYesterdayPayoutStatus
 * Simple heuristic:
 * - Sum all PAYOUT entries created "today".
 * - Compare to yesterday's net:
 *   >= net => SENT, 0 => PENDING, 0<sum<net => PARTIAL.
 * Note: Replace with backend status field when available.
 */
function getYesterdayPayoutStatus(
  ledger: Array<{ type: string; amountMinor: number; createdAt: string }>,
  today: Date,
  yesterdayNetMinor: number,
): { status: PayoutStatus; paidMinorToday: number } {
  const paidMinorToday = ledger
    .filter((e) => e.type === 'PAYOUT' && isSameDay(e.createdAt, today))
    .reduce((s, e) => s + Math.max(0, e.amountMinor), 0)

  if (paidMinorToday >= yesterdayNetMinor && yesterdayNetMinor > 0) return { status: 'SENT', paidMinorToday }
  if (paidMinorToday > 0 && paidMinorToday < yesterdayNetMinor) return { status: 'PARTIAL', paidMinorToday }
  return { status: 'PENDING', paidMinorToday }
}

/**
 * StatusBadge
 * Small rounded badge indicating payout status (Sent/Partial/Pending).
 */
function StatusBadge({ status }: { status: PayoutStatus }) {
  const { t } = useTranslation()
  const map: Record<PayoutStatus, { text: string; cls: string; Icon: React.ComponentType<any> | null }> = {
    SENT: {
      text: t('yesterdayCard.status.sent'),
      cls:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800',
      Icon: CheckCircle2,
    },
    PARTIAL: {
      text: t('yesterdayCard.status.partial'),
      cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800',
      Icon: Clock,
    },
    PENDING: {
      text: t('yesterdayCard.status.pending'),
      cls: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/30 dark:text-slate-300 dark:border-slate-800',
      Icon: null,
    },
  }
  const { text, cls, Icon } = map[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {text}
    </span>
  )
}

/**
 * formatPercentDynamic
 * Format a percent number with dynamic decimals for high readability.
 * <1% => 2 decimals; 1%~100% => 1 decimal; >=100% => integer.
 */
function formatPercentDynamic(value: number) {
  if (!isFinite(value)) return '—'
  const abs = Math.abs(value)
  if (abs === 0) return '0%'
  if (abs < 1) return `${value.toFixed(2)}%`
  if (abs < 100) return `${value.toFixed(1)}%`
  return `${Math.round(value)}%`
}

/**
 * PercentBadge
 * Compact pill showing yesterday net return ratio relative to running capital.
 * Base capital uses wallet.pendingMinor; when base is 0, show neutral placeholder.
 */
function PercentBadge({ netMinor }: { netMinor: number }) {
  const { wallet } = useAppStore()
  const baseMinor = wallet?.pendingMinor ?? 0

  // Compute rate in percentage; guard divide-by-zero.
  const rate = baseMinor > 0 ? (netMinor / baseMinor) * 100 : NaN

  // Choose visual style by sign
  const kind: 'pos' | 'neg' | 'neutral' =
    !isFinite(rate) ? 'neutral' : rate > 0 ? 'pos' : rate < 0 ? 'neg' : 'neutral'

  const clsMap = {
    pos:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800',
    neg:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-800',
    neutral:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/30 dark:text-slate-300 dark:border-slate-800',
  } as const

  const label = isFinite(rate) ? formatPercentDynamic(rate) : '—'
  const title =
    isFinite(rate)
      ? `Yesterday net / Running capital = ${label}`
      : 'No running capital'

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${clsMap[kind]}`}
      title={title}
      aria-label={title}
    >
      {label}
    </span>
  )
}

/**
 * YesterdayCard
 * Specialized KPI card for yesterday earnings:
 * - Main value: Net after 20% fee.
 * - Sub lines: Gross and Fee (20%).
 * - Right top: payout status badge.
 * - New: right side of main value shows percentage based on running capital (pendingMinor).
 */
function YesterdayCard({
  label,
  grossMinor,
  feeMinor,
  netMinor,
  status,
}: {
  label: string
  grossMinor: number
  feeMinor: number
  netMinor: number
  status: PayoutStatus
}) {
  const { t } = useTranslation()
  return (
    <div className="rounded-lg border bg-white/60 p-3 dark:bg-slate-900/60 dark:border-slate-800">
      <div className="flex items-start justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <span className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-400 opacity-80" />
        </div>
      </div>

      {/* Net after fee as main value with percentage pill on the right */}
      <div className="mt-1 flex items-center justify-between">
        <div className="font-semibold text-amber-600 dark:text-amber-300">{formatMinorPlain(netMinor)}</div>
        <PercentBadge netMinor={netMinor} />
      </div>

      {/* Details: gross and fee */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-md bg-amber-50/60 dark:bg-amber-900/20 px-2 py-1">
          <div className="text-[11px] text-amber-700/80 dark:text-amber-200/80">{t('yesterdayCard.grossLabel')}</div>
          <div className="text-xs font-medium">{formatMinorPlain(grossMinor)}</div>
        </div>
        <div className="rounded-md bg-slate-50 dark:bg-slate-800/50 px-2 py-1">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">{t('yesterdayCard.feeLabel')}</div>
          <div className="text-xs font-medium">{formatMinorPlain(feeMinor)}</div>
        </div>
      </div>

      {/* Help note */}
      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{t('yesterdayCard.note')}</div>
    </div>
  )
}

/**
 * WalletKPIGroup
 * Renders selected KPIs with localized labels.
 */
export default function WalletKPIGroup({
  size = 'sm',
  className = '',
  metrics,
  layout = 'separate',
}: WalletKPIGroupProps) {
  const { t } = useTranslation()
  const { wallet, ledger, accruedMinor, assets } = useAppStore()

  const all: MetricKey[] = ['balance', 'running', 'total', 'yesterday', 'today']
  const visible = metrics && metrics.length ? metrics : all
  const includes = (k: MetricKey) => visible.includes(k)

  const today = new Date()
  const yesterday = new Date(startOfDay(today).getTime() - 24 * 60 * 60 * 1000)

  let totalEarningsMinor = 0
  if (includes('total')) {
    totalEarningsMinor = ledger
      .filter((e) => e.type === 'EARN' || e.type === 'COMMISSION' || e.type === 'PAYOUT')
      .reduce((sum, e) => sum + Math.max(0, e.amountMinor), 0)
  }

  let todayEarningsMinor = 0
  if (includes('today')) {
    todayEarningsMinor = ledger
      .filter((e) => (e.type === 'EARN' || e.type === 'COMMISSION') && isSameDay(e.createdAt, today))
      .reduce((sum, e) => sum + e.amountMinor, 0)
  }

  let yesterdayEarningsMinor = 0
  if (includes('yesterday')) {
    yesterdayEarningsMinor = ledger
      .filter((e) => (e.type === 'EARN' || e.type === 'COMMISSION') && isSameDay(e.createdAt, yesterday))
      .reduce((sum, e) => sum + e.amountMinor, 0)
  }

  const blocks: Array<{
    key: MetricKey
    label: string
    value: string
    sub: string
    icon: React.ReactNode
    accent: keyof typeof accentGradients
  }> = []

  if (includes('balance')) {
    blocks.push({
      key: 'balance',
      label: t('wallet.accountBalance'),
      value: formatMinorPlain(wallet.availableMinor),
      sub: t('wallet.available'),
      icon: <WalletIcon size={16} />,
      accent: 'blue',
    })
  }
  if (includes('running')) {
    blocks.push({
      key: 'running',
      label: t('wallet.runningAmount'),
      value: formatMinorPlain(accruedMinor),
      sub: t('wallet.accruing'),
      icon: <Activity size={16} />,
      accent: 'green',
    })
  }
  if (includes('total')) {
    blocks.push({
      key: 'total',
      label: t('wallet.totalEarnings'),
      value: formatMinorPlain(totalEarningsMinor),
      sub: t('wallet.allTime'),
      icon: <Trophy size={16} />,
      accent: 'purple',
    })
  }
  if (includes('yesterday')) {
    blocks.push({
      key: 'yesterday',
      label: t('wallet.yesterday'),
      value: formatMinorPlain(yesterdayEarningsMinor),
      sub: t('wallet.earnings'),
      icon: <CalendarMinus2 size={16} />,
      accent: 'orange',
    })
  }
  if (includes('today')) {
    blocks.push({
      key: 'today',
      label: t('wallet.today'),
      value: formatMinorPlain(todayEarningsMinor),
      sub: t('wallet.earnings'),
      icon: <CalendarPlus2 size={16} />,
      accent: 'green',
    })
  }

  const labelCls = size === 'sm' ? 'text-xs' : 'text-sm'
  const valueCls = size === 'sm' ? 'text-xl' : 'text-2xl'
  const subCls = size === 'sm' ? 'text-[11px]' : 'text-xs'
  const valueMt = size === 'sm' ? 'mt-1.5' : 'mt-2'

  if (layout === 'grouped') {
    return (
      <div className={className}>
        <div className="rounded-xl border bg-white/70 backdrop-blur overflow-hidden dark:bg-slate-900/70 dark:border-slate-800">
          <div className={`${getInnerCols(blocks.length)} divide-x dark:divide-slate-800`}>
            {blocks.map((b) => (
              <div key={b.key} className="p-4">
                <div className="flex items-start justify-between">
                  <span className={`${labelCls} text-slate-500 dark:text-slate-400`}>{b.label}</span>
                  <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${accentGradients[b.accent]} opacity-80`} />
                </div>
                <div className={`${valueMt} ${valueCls} font-semibold tracking-tight`}>{b.value}</div>
                <div className={`mt-1 ${subCls} text-slate-500 dark:text-slate-400`}>{b.sub}</div>
                <div className="mt-3 text-slate-500 dark:text-slate-400">{b.icon}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Separate cards layout: use a specialized BalanceCard for "balance" to show BTC/ETH amounts
  // and a specialized YesterdayCard for "yesterday" to show fee deduction, payout status, and return percentage.
  return (
    <div className={`${getGridCols(blocks.length)} ${className}`}>
      {blocks.map((b) => {
        if (b.key === 'balance') {
          return (
            <BalanceCard
              key={b.key}
              label={b.label}
              totalMinor={wallet.availableMinor}
              sub={b.sub}
              btc={assets?.btc}
              eth={assets?.eth}
            />
          )
        }
        if (b.key === 'yesterday') {
          const { grossMinor, feeMinor, netMinor, today } = (() => {
            const r = getYesterdayNumbers(ledger)
            return { ...r }
          })()
          const { status } = getYesterdayPayoutStatus(ledger, today, netMinor)
          return (
            <YesterdayCard
              key="yesterday_card"
              label={b.label}
              grossMinor={grossMinor}
              feeMinor={feeMinor}
              netMinor={netMinor}
              status={status}
            />
          )
        }
        return <StatCard key={b.key} label={b.label} value={b.value} sub={b.sub} icon={b.icon} accent={b.accent} size={size} />
      })}
    </div>
  )
}
