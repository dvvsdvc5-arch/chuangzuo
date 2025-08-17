/**
 * components/run/OrderItem.tsx
 * 单条订单展示项：时间、平台、交易对、利润金额（正绿负红）。
 * 高级感卡片行风格，适配深色。
 */

import React from 'react'
import PlatformBadge from './PlatformBadge'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

/**
 * OrderItemProps
 * 订单项入参。
 */
export interface OrderItemProps {
  id: string
  /** 时间戳（毫秒） */
  ts: number
  /** 利润（USD，正负） */
  profit: number
  /** 来源平台 */
  platform: 'Binance' | 'OKX' | 'Bybit'
  /** 可选交易对符号 */
  symbol?: string
}

/**
 * formatTime
 * 将时间戳格式化为 HH:mm:ss。
 */
function formatTime(ts: number) {
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

/**
 * formatUSD
 * 简单格式化美元金额，保留2位小数，带千位分隔。
 */
function formatUSD(v: number) {
  const sign = v < 0 ? '-' : '+'
  const n = Math.abs(v)
  const s = n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${sign}$${s}`
}

/**
 * OrderItem
 * 单条订单展示组件。
 */
export default function OrderItem({ id, ts, profit, platform, symbol = 'BTC/USDT' }: OrderItemProps) {
  const positive = profit >= 0
  return (
    <li
      key={id}
      className="flex items-center justify-between rounded-lg border bg-white/70 px-3 py-2.5 shadow-sm dark:bg-slate-900/70 dark:border-slate-800"
      aria-label={`Order ${id}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <PlatformBadge platform={platform} />
          <span className="text-xs text-slate-500 dark:text-slate-400">{formatTime(ts)}</span>
        </div>
        <div className="mt-1 text-sm font-medium truncate">{symbol}</div>
      </div>
      <div className="ml-3 flex items-center gap-1">
        {positive ? (
          <ArrowUpRight className="h-4 w-4 text-emerald-500" aria-hidden="true" />
        ) : (
          <ArrowDownRight className="h-4 w-4 text-rose-500" aria-hidden="true" />
        )}
        <span className={`font-semibold ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {formatUSD(profit)}
        </span>
      </div>
    </li>
  )
}
