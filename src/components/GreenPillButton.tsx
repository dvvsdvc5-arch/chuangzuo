/**
 * components/GreenPillButton.tsx
 * 品牌主色长圆 pill 按钮组件（支持链接或点击事件），用于突出的主行动按钮。
 * 默认采用全局一致的 indigo/sky/cyan 品牌渐变；可通过 palette 切换其他色系。
 */
import React from 'react'

/**
 * GreenPillButtonProps
 * 控制按钮的显示与行为。
 */
export interface GreenPillButtonProps {
  /** 文案 */
  label: string
  /** 可选图标（建议传入 lucide-react 图标元素） */
  icon?: React.ReactNode
  /** 点击事件（与 href 二选一；同时存在时优先 onClick） */
  onClick?: () => void
  /** 跳转地址（与 onClick 二选一） */
  href?: string
  /** 额外类名 */
  className?: string
  /** 是否占满整行 */
  fullWidth?: boolean
  /**
   * 颜色风格：'brand' | 'emerald'
   * - brand：与全局 UI 主色一致（indigo/sky/cyan）
   * - emerald：保留绿色系作为备选（向后兼容）
   */
  palette?: 'brand' | 'emerald'
}

/**
 * getPaletteClasses
 * 根据 palette 返回渐变、阴影、描边与聚焦态的颜色类名。
 */
function getPaletteClasses(palette: 'brand' | 'emerald') {
  if (palette === 'emerald') {
    return {
      shadow: 'shadow-emerald-500/20',
      border: 'border-emerald-400/30',
      bg: 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500',
      hover: 'hover:from-emerald-500/90 hover:via-green-500/90 hover:to-teal-500/90',
      ring: 'focus-visible:ring-emerald-500/60',
    }
  }
  // 默认 brand：与站点主视觉保持一致
  return {
    shadow: 'shadow-indigo-500/20',
    border: 'border-indigo-400/30',
    bg: 'bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-500',
    hover: 'hover:from-indigo-500/90 hover:via-sky-500/90 hover:to-cyan-500/90',
    ring: 'focus-visible:ring-indigo-500/60',
  }
}

/**
 * GreenPillButton
 * 品牌主色渐变 + 圆角满圆 + 阴影，形成“长半圆”视觉；Hover/Focus 具有细腻的过渡反馈。
 */
export default function GreenPillButton({
  label,
  icon,
  onClick,
  href,
  className = '',
  fullWidth = true,
  palette = 'brand',
}: GreenPillButtonProps) {
  const color = getPaletteClasses(palette)

  // 基础样式：圆角满圆、阴影与状态过渡
  const base =
    'inline-flex items-center justify-center rounded-full text-white font-medium ' +
    `shadow-lg ${color.shadow} border ${color.border} ` +
    `${color.bg} ${color.hover} ` +
    'active:scale-[0.99] transition-all ' +
    'focus-visible:outline-none focus-visible:ring-2 ' +
    `${color.ring}`

  // 尺寸：稍显饱满，符合“长半圆”观感
  const size = 'h-11 md:h-12 px-6 md:px-8 text-sm md:text-base'
  const width = fullWidth ? 'w-full' : ''

  const content = (
    <span className="inline-flex items-center">
      {icon ? <span className="mr-2 -ml-1 [&>*]:size-[18px] md:[&>*]:size-5">{icon}</span> : null}
      {label}
    </span>
  )

  // 若同时提供 onClick 与 href，优先 onClick（避免误跳转）
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} ${size} ${width} ${className}`}>
        {content}
      </button>
    )
  }

  if (href) {
    return (
      <a href={href} className={`${base} ${size} ${width} ${className}`}>
        {content}
      </a>
    )
  }

  // 默认视为按钮（无行为）
  return (
    <button type="button" className={`${base} ${size} ${width} ${className}`}>
      {content}
    </button>
  )
}
