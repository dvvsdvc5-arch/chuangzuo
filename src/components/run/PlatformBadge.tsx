/**
 * components/run/PlatformBadge.tsx
 * 小平台徽章：以品牌感颜色区分不同来源平台（Binance / OKX / Bybit）。
 * 深浅模式均可读。
 */

import React from 'react'

/**
 * PlatformBadgeProps
 * 平台徽章入参。
 */
export interface PlatformBadgeProps {
  /** 平台名（受支持的三种） */
  platform: 'Binance' | 'OKX' | 'Bybit'
  /** 额外类名 */
  className?: string
}

/**
 * palette
 * 预设平台颜色映射（兼容深色模式）。
 */
const palette: Record<PlatformBadgeProps['platform'], string> = {
  Binance: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800',
  OKX: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-700',
  Bybit: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-200 dark:border-indigo-800',
}

/**
 * PlatformBadge
 * 小圆角徽章，展示订单来源平台。
 */
export default function PlatformBadge({ platform, className = '' }: PlatformBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs whitespace-nowrap ${palette[platform]} ${className}`}
      aria-label={`Platform ${platform}`}
      title={platform}
    >
      {platform}
    </span>
  )
}
