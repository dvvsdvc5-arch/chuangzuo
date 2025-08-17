/**
 * components/BrandName.tsx
 * 纯前端品牌名称组件：从 i18n 读取 appName，避免任何远程请求。
 */

import React from 'react'
import { useTranslation } from 'react-i18next'

/**
 * BrandNameProps
 * 自定义样式的 Props。
 */
export interface BrandNameProps {
  className?: string
}

/**
 * BrandName
 * 渲染平台名（多语言）。
 */
export default function BrandName({ className = '' }: BrandNameProps): JSX.Element {
  const { t } = useTranslation()
  return <span className={className}>{t('appName', { defaultValue: 'CCRC AD' })}</span>
}
