/**
 * components/partners/PartnerCard.tsx
 * 单个平台展示卡片：显示平台 Logo、名称、助力标识、描述与“今日已助力数量”。
 * - i18n：assist/description 使用已存在的文案键；
 * - 计数条：根据当前语言输出自然语句，数字使用本地化分组；
 * - 可读性优化：徽标容器在深色模式下仍用白底，保证图标对比度。
 */

import React from 'react'
import { ArrowRight, BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/**
 * PartnerCardProps
 * 定义单个平台卡片的属性。
 */
export interface PartnerCardProps {
  /** 平台名称 */
  name: string
  /** 平台 Logo 图片地址（建议使用可靠 CDN 或 Smart Placeholder） */
  src: string
  /** 平台简述（若未提供，将使用 i18n 默认描述） */
  description?: string
  /** 卡片强调用的渐变色（Tailwind from-xxx to-xxx 部分） */
  gradient?: string
  /** 今日已助力广告数量（累计） */
  count?: number
}

/**
 * buildCountText
 * 根据当前语言构造“今日已助力 X 单”的语句，数字按本地化分组显示。
 */
function buildCountText(lng: string, count = 0): string {
  const n = count.toLocaleString()
  switch (lng) {
    case 'zh':
      return `今日已助力 ${n} 单`
    case 'hi':
      return `आज सहायक विज्ञापन ${n}`
    case 'ar':
      return `تمت المساندة اليوم ${n} إعلانًا`
    case 'es':
      return `Asistidos hoy ${n} anuncios`
    case 'pt':
      return `Assistidos hoje ${n} anúncios`
    default:
      return `Assisted today ${n} ads`
  }
}

/**
 * PartnerCard
 * 渲染一个品牌卡片，包含渐变描边容器 + 内层深浅色适配底卡 + 平台 Logo/标题/描述/助力提示/统计条。
 */
export default function PartnerCard({
  name,
  src,
  description,
  gradient = 'from-indigo-500 to-cyan-500',
  count = 0,
}: PartnerCardProps) {
  const { t, i18n } = useTranslation()

  /** 默认描述，允许上层覆盖 */
  const desc =
    description ??
    t('home.partner.description', {
      defaultValue:
        'When advertisers publish promotional ads on the platform, we provide assistance. Complete assistance to earn income.',
    })

  /** 徽标文案（可助力） */
  const assistLabel = t('home.partner.assist', { defaultValue: 'Assist' })

  /** 计数文案（按当前语言） */
  const countLabel = React.useMemo(() => buildCountText(i18n.language, count), [i18n.language, count])

  return (
    <article
      className="
        group relative rounded-xl border bg-white p-4 shadow-sm transition
        hover:shadow-md dark:bg-slate-900 dark:border-slate-800
      "
      aria-label={name}
    >
      {/* 顶部：Logo + 名称 + 可助力标识 */}
      <div className="flex items-center gap-3">
        {/* 渐变描边方形徽标容器 */}
        <div className={`p-[2px] rounded-lg bg-gradient-to-br ${gradient}`}>
          <div
            className="
              rounded-lg bg-white dark:bg-white
              h-10 w-10 flex items-center justify-center
              ring-1 ring-black/5
            "
          >
            {/* 平台 Logo（使用可靠地址），使用 object-cover 规范 */}
            <img src={src} alt={`${name} logo`} className="h-7 w-7 object-cover" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{name}</h3>
          {/* 可助力标识（多语言） */}
          <div
            className={`
              inline-flex items-center gap-1 mt-1
              rounded-full px-2 py-0.5 text-[11px] font-medium
              bg-gradient-to-r ${gradient} text-white
              shadow-sm
            `}
            aria-label={assistLabel}
            title={assistLabel}
          >
            <span>{assistLabel}</span>
          </div>
        </div>

        {/* 轻量“了解”提示（仅装饰，不跳转） */}
        <span
          className="
            hidden md:inline-flex items-center text-slate-400 group-hover:text-slate-600
            transition
          "
          aria-hidden="true"
        >
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>

      {/* 描述文案（多语言） */}
      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{desc}</p>

      {/* 今日已助力数量（小型统计条） */}
      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
        <span
          className="
            inline-flex items-center gap-1.5 rounded-md
            bg-slate-50 px-2 py-1 ring-1 ring-slate-200
            dark:bg-slate-800/60 dark:ring-slate-700
          "
          aria-label={countLabel}
          title={countLabel}
        >
          <BarChart3 className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
          <span className="font-medium">{countLabel}</span>
        </span>
      </div>
    </article>
  )
}
