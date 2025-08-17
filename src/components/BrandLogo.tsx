/**
 * components/BrandLogo.tsx
 * 轻量品牌图标组件：不依赖任何远程接口，使用渐变圆形作为默认 Logo。
 * 可选通过 props.src 覆盖为图片；未提供时为纯渐变占位，稳定无网络报错。
 */

import React from 'react'

/** BrandLogoProps
 * 控制大小与样式的基础 Props；可选 src 覆盖为图片 Logo。
 */
export interface BrandLogoProps {
  /** 直径像素 */
  size?: number
  /** 额外 className */
  className?: string
  /** 可选图片地址；若提供则覆盖渐变背景 */
  src?: string
  /** 图片 alt 文本 */
  alt?: string
}

/** BrandLogo
 * 渲染圆形品牌图标（渐变背景 + 可选图片覆盖）。
 */
export default function BrandLogo({
  size = 32,
  className = '',
  src,
  alt = 'Brand',
}: BrandLogoProps): JSX.Element {
  return (
    <div
      className={[
        'relative shrink-0 rounded-full overflow-hidden',
        className,
      ].join(' ')}
      style={{ width: size, height: size }}
      aria-label="brand logo"
      role="img"
    >
      {/* 默认渐变底色（亮/暗模式皆可读） */}
      <div
        className="
          absolute inset-0
          bg-gradient-to-br from-indigo-500 via-sky-500 to-cyan-500
          dark:from-indigo-400 dark:via-sky-400 dark:to-cyan-400
        "
      />
      {/* 可选图片覆盖（若提供） */}
      {src ? (
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      ) : null}
    </div>
  )
}
