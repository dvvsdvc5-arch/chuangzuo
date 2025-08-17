/**
 * components/UserAvatar.tsx
 * 圆形头像组件：优先展示图片地址，缺省时使用姓名首字母的渐变占位。
 * Dark mode: adjusts border color.
 */
import React from 'react'

/**
 * UserAvatarProps
 * 控制头像显示的参数。
 */
export interface UserAvatarProps {
  /** 姓名，用于生成首字母与无障碍文本 */
  name: string
  /** 可选头像地址 */
  src?: string
  /** 直径像素，默认 56 */
  size?: number
  /** 额外 className */
  className?: string
}

/**
 * getInitial
 * 从姓名中取首字母（英文或中文首字符），大写。
 */
function getInitial(name: string) {
  const ch = (name?.trim?.() || 'U')[0] || 'U'
  return ch.toUpperCase()
}

/**
 * UserAvatar
 * 圆形头像，带边框与阴影；无图时显示首字母渐变底。
 */
export default function UserAvatar({ name, src, size = 56, className = '' }: UserAvatarProps) {
  const initial = getInitial(name)
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full overflow-hidden border border-slate-200 shadow-sm dark:border-slate-800 ${className}`}
      style={{ width: size, height: size }}
      aria-label={`${name} avatar`}
    >
      {src ? (
        <img src={src} alt={`${name} avatar`} className="object-cover w-full h-full" />
      ) : (
        <span className="w-full h-full flex items-center justify-center text-white font-semibold select-none bg-gradient-to-br from-indigo-500 to-cyan-400">
          {initial}
        </span>
      )}
    </span>
  )
}
