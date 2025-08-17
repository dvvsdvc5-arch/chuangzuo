/**
 * pages/About.tsx
 * About page: introduce platform investment logic and company profile with i18n.
 * Uses simple, readable typography and light illustrations.
 * Update:
 * - Make BulletList robust to non-array inputs (string/null/undefined), preventing runtime errors.
 * - Add defaultValue for i18n array to ensure it's always an array when keys are missing.
 */

import React from 'react'
import { useTranslation } from 'react-i18next'

/**
 * BulletListProps
 * Props for bullet list with localized items.
 */
interface BulletListProps {
  /** Items can be an array of strings, a single string, null, or undefined */
  items: string[] | string | null | undefined
}

/**
 * normalizeItems
 * Normalize different input types to a string array for safe rendering.
 */
function normalizeItems(items: BulletListProps['items']): string[] {
  if (Array.isArray(items)) return items
  if (typeof items === 'string' && items.trim().length > 0) return [items]
  return []
}

/**
 * BulletList
 * Render a simple list of bullets with good spacing and readability.
 * Handles non-array inputs defensively.
 */
function BulletList({ items }: BulletListProps): JSX.Element | null {
  const arr = normalizeItems(items)
  if (arr.length === 0) return null
  return (
    <ul className="mt-2 space-y-2 list-disc pl-5 text-sm text-slate-700 dark:text-slate-300">
      {arr.map((it, idx) => (
        <li key={idx}>{it}</li>
      ))}
    </ul>
  )
}

/**
 * AboutPage
 * Renders platform investment logic and company introduction.
 */
export default function AboutPage(): JSX.Element {
  const { t } = useTranslation()

  // Get bullet points as array from i18n; provide defaults to ensure array type.
  const logicPoints = t('aboutPage.logic.points', {
    returnObjects: true,
    defaultValue: [
      'Transparent strategy with diversified channels.',
      'Strict risk management and continuous monitoring.',
      '24/7 support and clear SLAs.',
      'Compliance-first operations and privacy protection.',
    ],
  }) as unknown as string[] | string

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border bg-white/70 p-6 md:p-8 backdrop-blur dark:bg-slate-900/70 dark:border-slate-800">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div>
            <h1
              className="
                text-2xl md:text-3xl font-semibold tracking-tight
                bg-clip-text text-transparent
                bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600
                dark:from-indigo-400 dark:via-blue-400 dark:to-cyan-400
              "
            >
              {t('aboutPage.heroTitle', { defaultValue: 'About the Platform' })}
            </h1>
            <p className="mt-2 text-sm md:text-base text-slate-600 dark:text-slate-300">
              {t('aboutPage.heroSubtitle', {
                defaultValue: 'Learn how our investment logic works and our commitment to compliance.',
              })}
            </p>
          </div>

          {/* Illustration */}
          <div className="relative h-40 md:h-44 w-full overflow-hidden rounded-xl border dark:border-slate-800">
            <img src="https://pub-cdn.sider.ai/u/U05XH90O53X/web-coder/689bf295a616cfbf067042a3/resource/47580eb4-e96b-463b-8bf0-beeab4c39522.jpg" className="object-cover" />
          </div>
        </div>
      </section>

      {/* Investment logic */}
      <section className="rounded-2xl border bg-white/70 p-6 md:p-8 backdrop-blur dark:bg-slate-900/70 dark:border-slate-800">
        <h2 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {t('aboutPage.logic.title', { defaultValue: 'Investment logic' })}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t('aboutPage.logic.lead', {
            defaultValue:
              'Our approach focuses on transparent strategies, risk control, and steady growth driven by data.',
          })}
        </p>
        <BulletList items={logicPoints} />
      </section>

      {/* Company intro */}
      <section className="rounded-2xl border bg-white/70 p-6 md:p-8 backdrop-blur dark:bg-slate-900/70 dark:border-slate-800">
        <div className="grid gap-6 md:grid-cols-3 md:items-start">
          <div className="md:col-span-2">
            <h2 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {t('aboutPage.company.title', { defaultValue: 'Company profile' })}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {t('aboutPage.company.body', {
                defaultValue:
                  'We are a globally distributed team with expertise in operations, risk management, and product design. We comply with industry standards and local regulations.',
              })}
            </p>
            <div className="mt-4 rounded-lg border bg-slate-50 p-4 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700">
              <div className="font-medium text-slate-800 dark:text-slate-100">
                {t('aboutPage.compliance.title', { defaultValue: 'Compliance' })}
              </div>
              <p className="mt-1">
                {t('aboutPage.compliance.body', {
                  defaultValue:
                    'We follow compliance-first principles and protect user privacy. If requested by platforms or regulators, we take immediate actions accordingly.',
                })}
              </p>
            </div>
            <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium">{t('aboutPage.contact.title', { defaultValue: 'Contact' })}:</span>{' '}
              <a href="mailto:support@example.com" className="text-indigo-600 hover:underline dark:text-indigo-400">
                {t('aboutPage.contact.email', { defaultValue: 'support@example.com' })}
              </a>
            </div>
          </div>
          <div className="relative h-36 md:h-full w-full overflow-hidden rounded-xl border dark:border-slate-800">
            <img src="https://pub-cdn.sider.ai/u/U05XH90O53X/web-coder/689bf295a616cfbf067042a3/resource/8695e1c5-f3f7-4e51-b3ee-3607b713a7a6.jpg" className="object-cover" />
          </div>
        </div>
      </section>
    </div>
  )
}
