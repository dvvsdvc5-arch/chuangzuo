/**
 * components/StatCard.tsx
 * Reusable stat KPI card with optional compact size.
 * Dark mode: adds dark variants for container and texts.
 */
import { ReactNode } from 'react'

/**
 * StatCardProps
 * Props for stat display.
 */
interface StatCardProps {
  /** 指标标签 */
  label: string
  /** 指标主值（已经过格式化的字符串） */
  value: string
  /** 可选副标题/说明 */
  sub?: string
  /** 可选图标 */
  icon?: ReactNode
  /** 色彩强调 */
  accent?: 'green' | 'blue' | 'purple' | 'orange'
  /** 尺寸：sm（紧凑，较小字体）| md（默认） */
  size?: 'sm' | 'md'
}

/**
 * StatCard
 * Displays a key metric with optional icon and subtext.
 */
export default function StatCard({
  label,
  value,
  sub,
  icon,
  accent = 'blue',
  size = 'md',
}: StatCardProps) {
  const accents: Record<NonNullable<StatCardProps['accent']>, string> = {
    green: 'from-emerald-500 to-teal-400',
    blue: 'from-indigo-500 to-sky-400',
    purple: 'from-fuchsia-500 to-violet-400',
    orange: 'from-amber-500 to-orange-400',
  }

  /** 根据尺寸切换文字样式 */
  const labelCls = size === 'sm' ? 'text-xs' : 'text-sm'
  const valueCls = size === 'sm' ? 'text-xl' : 'text-2xl'
  const subCls = size === 'sm' ? 'text-[11px]' : 'text-xs'
  const valueMt = size === 'sm' ? 'mt-1.5' : 'mt-2'

  return (
    <div className="rounded-xl border bg-white/70 backdrop-blur p-4 dark:bg-slate-900/70 dark:border-slate-800">
      <div className="flex items-start justify-between">
        <span className={`${labelCls} text-slate-500 dark:text-slate-400`}>{label}</span>
        <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${accents[accent]} opacity-80`} />
      </div>
      <div className={`${valueMt} ${valueCls} font-semibold tracking-tight`}>{value}</div>
      {sub && <div className={`mt-1 ${subCls} text-slate-500 dark:text-slate-400`}>{sub}</div>}
      {icon && <div className="mt-3 text-slate-500 dark:text-slate-400">{icon}</div>}
    </div>
  )
}
