/**
 * components/partners/PartnersGrid.tsx
 * 合作平台网格：包含标题与平台卡片列表。
 * 更新：
 * - 接入 i18n：标题/子标题/系统提示根据语言切换。
 * - 网格为单列：每个平台组件独占一行，便于阅读与展示。
 * - 新增：接入 useAssistedCounts，给每个平台注入“今日已助力数量”（按排序递减）。
 */

import React from 'react'
import PartnerCard, { type PartnerCardProps } from './PartnerCard'
import { useTranslation } from 'react-i18next'
import useAssistedCounts from '../../hooks/useAssistedCounts'

/**
 * Partner
 * 合作平台数据结构。
 */
export interface Partner {
  /** 平台名称 */
  name: string
  /** Logo 图片地址（支持 Smart Placeholder） */
  src: string
  /** 自定义渐变（Tailwind from-xxx to-xxx） */
  gradient?: string
  /** 可选描述（若不传使用 i18n 默认描述） */
  description?: string
}

/**
 * PartnersGridProps
 * 网格组件的属性。
 */
export interface PartnersGridProps {
  /** 平台列表 */
  partners: Partner[]
}

/**
 * InfoCallout
 * 用于展示系统级提示信息的轻量提示块。
 */
function InfoCallout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        mt-2 rounded-lg border border-indigo-200/60 bg-indigo-50/60 p-3 text-xs
        text-indigo-900 dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-indigo-200
      "
    >
      {children}
    </div>
  )
}

/**
 * PartnersGrid
 * 渲染标题 + 子标题 + 提示信息 + 单列卡片列表。
 * i18n keys:
 * - home.partners.title
 * - home.partners.subtitle
 * - home.partners.noticeTitle
 * - home.partners.noticeBody
 */
export default function PartnersGrid({ partners }: PartnersGridProps) {
  const { t } = useTranslation()
  const title = t('home.partners.title', { defaultValue: 'Our investment partner platforms' })
  const subtitle = t('home.partners.subtitle', {
    defaultValue:
      'Our company is collaborating with the following platforms. When advertisers publish promotional ads, we provide assistance; complete the assist to earn income.',
  })
  const noticeTitle = t('home.partners.noticeTitle', { defaultValue: 'System tip:' })
  const noticeBody = t('home.partners.noticeBody', {
    defaultValue:
      'Our system monitors the above platforms 24/7. Once an ad is posted, it will automatically assist via each user’s “Run” feature to help you earn. Just deposit and turn on Run, and the system will keep generating income for you.',
  })

  // 新增：根据平台数量生成“今日已助力数量”，每 10 分钟更新一次；首个最多、随后递减。
  const counts = useAssistedCounts(partners.length)

  return (
    <section aria-label={title} className="space-y-4">
      {/* 标题与子标题（多语言） */}
      <header>
        <h2
          className="
            text-lg md:text-xl font-semibold tracking-tight
            bg-clip-text text-transparent
            bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600
            dark:from-indigo-400 dark:via-sky-400 dark:to-cyan-400
          "
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>

        {/* 系统提示说明（多语言） */}
        <InfoCallout>
          <span className="font-medium">{noticeTitle} </span>
          {noticeBody}
        </InfoCallout>
      </header>

      {/* 单列列表：每个平台组件独占一行 */}
      <div className="grid grid-cols-1 gap-3 md:gap-4">
        {partners.map((p, idx) => (
          <PartnerCard
            key={p.name}
            name={p.name}
            src={p.src}
            gradient={p.gradient}
            description={p.description}
            count={counts[idx] ?? 0}
          />
        ))}
      </div>
    </section>
  )
}
