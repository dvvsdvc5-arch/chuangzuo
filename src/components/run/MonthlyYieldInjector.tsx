/**
 * components/run/MonthlyYieldInjector.tsx
 * 在 Run 页面内，以 React Portal 的方式渲染“月收益提示”浮窗（非侵入实现）。
 * - 仅在路径为 /run 时渲染；
 * - 文案使用 i18n：run.monthlyYield.low / run.monthlyYield.high / run.monthlyYield.aria；
 * - 监听 #investAmt 的 input/change 事件，≥10000 高亮“高档”，否则高亮“低档”；
 * - 不再直接向 React 管理的容器插入/删除原生 DOM，避免 NotFoundError。
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'

/**
 * parseAmount
 * 将输入框中的金额字符串解析为数字（去除$、逗号等字符）。
 */
function parseAmount(v: string | null | undefined): number {
  if (!v) return 0
  const n = v.replace(/[^\d.,]/g, '').replace(/,/g, '')
  const num = parseFloat(n)
  return Number.isFinite(num) ? num : 0
}

/**
 * YieldBadge
 * 小圆角标签，根据 active 切换样式。
 */
function YieldBadge({ text, active }: { text: string; active: boolean }) {
  const base =
    'inline-flex items-center rounded-full px-2 py-0.5 ' +
    'bg-white/80 ring-1 ring-emerald-200/70 text-emerald-700 ' +
    'dark:bg-white/5 dark:text-emerald-200 dark:ring-emerald-400/30'
  const on =
    ' bg-emerald-600/10 ring-emerald-400 text-emerald-800 ' +
    'dark:text-emerald-100 dark:bg-emerald-400/10 dark:ring-emerald-400'
  return <span className={base + (active ? on : '')}>{text}</span>
}

/**
 * MonthlyYieldInjector
 * 在 /run 时，通过 Portal 渲染右下角浮窗；监听输入框变化以动态高亮。
 */
export default function MonthlyYieldInjector(): JSX.Element | null {
  const location = useLocation()
  const { t } = useTranslation()
  const enabled = location.pathname === '/run'
  const [isHigh, setIsHigh] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // 监听 investAmt 输入变化（若存在）
  useEffect(() => {
    if (!enabled) return

    function handleInput() {
      if (!inputRef.current) return
      const amt = parseAmount(inputRef.current.value)
      setIsHigh(amt >= 10000)
    }

    inputRef.current = document.getElementById('investAmt') as HTMLInputElement | null
    if (inputRef.current) {
      handleInput()
      inputRef.current.addEventListener('input', handleInput)
      inputRef.current.addEventListener('change', handleInput)
    }

    return () => {
      if (inputRef.current) {
        inputRef.current.removeEventListener('input', handleInput)
        inputRef.current.removeEventListener('change', handleInput)
      }
      inputRef.current = null
    }
  }, [enabled])

  const lowText = useMemo(
    () => (t('run.monthlyYield.low', { defaultValue: '≤ $10k: ≥30%/mo' }) as string),
    [t],
  )
  const highText = useMemo(
    () => (t('run.monthlyYield.high', { defaultValue: '≥ $10k: ≥60%/mo' }) as string),
    [t],
  )
  const aria = useMemo(
    () => (t('run.monthlyYield.aria', { defaultValue: 'Monthly yield note' }) as string),
    [t],
  )

  if (!enabled) return null

  const node = (
    <div
      role="note"
      aria-label={aria}
      className="
        fixed right-3 bottom-24 z-40
        rounded-lg border border-emerald-200/60 bg-emerald-50/80 px-3 py-2
        text-[11px] text-emerald-900 shadow-sm backdrop-blur
        dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200
      "
    >
      <div className="flex items-center gap-2">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
        >
          <path d="M3 3v18h18" />
          <path d="m19 9-6 6-4-4-3 3" />
        </svg>
        <div className="flex flex-wrap items-center gap-1.5">
          <YieldBadge text={lowText} active={!isHigh} />
          <YieldBadge text={highText} active={isHigh} />
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
