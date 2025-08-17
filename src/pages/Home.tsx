/**
 * pages/Home.tsx
 * 首页：顶部轮播 + 合作平台网格 + 合规说明。
 * - 轮播：展示品牌形象图。
 * - 合作平台网格：展示各平台及“今日已助力数量”统计条。
 * - 合规说明：不可点击的静态说明块，强调平台合作合规合法。
 */

import React from 'react'
import AutoCarousel from '../components/AutoCarousel'
import PartnersGrid, { type Partner } from '../components/partners/PartnersGrid'
import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/**
 * HomePage
 * 渲染首页轮播、合作平台卡片与底部合规说明。
 */
export default function HomePage() {
  const { t } = useTranslation()

  // 轮播图片（可靠地址）
  const heroImages = [
    'https://pub-cdn.sider.ai/u/U05XH90O53X/web-coder/689bf295a616cfbf067042a3/resource/400b8b66-a594-4e14-bcad-32e6fdaef496.jpg',
    'https://pub-cdn.sider.ai/u/U05XH90O53X/web-coder/689bf295a616cfbf067042a3/resource/85889e29-2eab-4dda-bec1-effd9dc2325b.jpg',
    'https://pub-cdn.sider.ai/u/U05XH90O53X/web-coder/689bf295a616cfbf067042a3/resource/3c858649-d5b9-4d25-a045-6899ef5f7fc8.jpg',
  ]

  /**
   * 合作平台数据
   * 使用稳定的 Simple Icons CDN 或可靠图片，避免占位源加载失败。
   * 渐变色根据品牌主色系适配，提升辨识度与美观度。
   */
  const partners: Partner[] = [
    { name: 'Facebook', src: 'https://pub-cdn.sider.ai/u/U05XH90O53X/web-coder/689bf295a616cfbf067042a3/resource/dbc00448-7515-4326-87cf-850aeb2b049e.jpg', gradient: 'from-blue-600 to-indigo-600' },
    { name: 'Instagram', src: 'https://pub-cdn.sider.ai/u/U05XH90O53X/web-coder/689bf295a616cfbf067042a3/resource/4560bb6f-0430-43ae-ae76-d9a429f06810.jpg', gradient: 'from-fuchsia-500 to-orange-400' },
    { name: 'YouTube', src: 'https://pub-cdn.sider.ai/u/U05XH90O53X/web-coder/689bf295a616cfbf067042a3/resource/35f31d4f-5af2-4a43-9251-d274b0faea8c.jpg', gradient: 'from-rose-600 to-red-500' },
    { name: 'TikTok', src: 'https://cdn.simpleicons.org/tiktok/000000', gradient: 'from-slate-800 to-slate-600' },
    { name: 'Twitter/X', src: 'https://pub-cdn.sider.ai/u/U05XH90O53X/web-coder/689bf295a616cfbf067042a3/resource/a734c3b4-ff5a-4acb-823a-0da19100cdd2.jpg', gradient: 'from-sky-500 to-cyan-500' },
    { name: 'Snapchat', src: 'https://cdn.simpleicons.org/snapchat/000000', gradient: 'from-yellow-400 to-amber-500' },
    { name: 'LinkedIn', src: 'https://pub-cdn.sider.ai/u/U05XH90O53X/web-coder/689bf295a616cfbf067042a3/resource/dc00fefc-9fa4-4d30-b59b-c5f7e4f91d08.jpg', gradient: 'from-sky-700 to-blue-600' },
    { name: 'Reddit', src: 'https://cdn.simpleicons.org/reddit/FF4500', gradient: 'from-orange-500 to-rose-500' },
    { name: 'Pinterest', src: 'https://pub-cdn.sider.ai/u/U05XH90O53X/web-coder/689bf295a616cfbf067042a3/resource/604547c5-d19d-4ddc-b1d6-85256e9ef82f.jpg', gradient: 'from-rose-600 to-red-600' },
  ]

  // 合规说明文案（多语言）
  const complianceTitle = t('home.complianceNote.title', { defaultValue: 'Compliance and partnership statement' })
  const compliancePoints: string[] = t('home.complianceNote.points', {
    returnObjects: true,
    defaultValue: [
      'We cooperate strictly under each platform’s Terms of Service and applicable laws.',
      'Assistance only covers compliant, publicly promoted tasks; no fake traffic, manipulation, or abuse.',
      'Data is processed under our privacy policy and used only for matching and settlement needs.',
      'If a platform requests restriction or takedown, related tasks will be stopped immediately.',
    ],
  }) as unknown as string[]

  return (
    <div className="space-y-8">
      {/* 轮播（仅图片） */}
      <div className="h-44 sm:h-56 md:h-72 lg:h-80">
        <AutoCarousel images={heroImages} className="h-full w-full" ariaLabel="hero carousel" />
      </div>

      {/* 合作平台网格 */}
      <PartnersGrid partners={partners} />

      {/* 合规与平台合作说明（不可点击，静态展示） */}
      <section aria-label={complianceTitle}>
        <div
          className="
            mt-2 rounded-lg border border-emerald-200/60 bg-emerald-50/60 p-3
            text-xs text-emerald-900
            dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200
          "
        >
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 mt-0.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <div className="space-y-1">
              <h3 className="font-medium">{complianceTitle}</h3>
              <ul className="list-disc pl-5 space-y-0.5">
                {Array.isArray(compliancePoints) &&
                  compliancePoints.map((line, i) => (
                    <li key={i} className="opacity-90">
                      {line}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
