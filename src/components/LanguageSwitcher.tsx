/**
 * components/LanguageSwitcher.tsx
 * A reusable language switcher that drives global i18n language changes.
 * Synchronizes with localStorage and relies on i18n.ts to update html lang/dir.
 */
import React from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Language
 * Supported language codes.
 */
export type Language = 'en' | 'zh' | 'hi' | 'ar' | 'es' | 'pt'

/**
 * LanguageSwitcherProps
 * Props to control size and styling.
 */
export interface LanguageSwitcherProps {
  /** Visual size of the select */
  size?: 'sm' | 'md'
  /** Optional extra className */
  className?: string
  /** Optional aria-label override */
  ariaLabel?: string
}

/**
 * normalizeLng
 * Ensure the current i18n language is one we support. Defaults to 'en'.
 */
function normalizeLng(lng?: string): Language {
  const supported: Language[] = ['en', 'zh', 'hi', 'ar', 'es', 'pt']
  const found = supported.find((l) => l === lng)
  return found || 'en'
}

/**
 * LanguageSwitcher
 * Simple <select> that triggers i18n.changeLanguage and persists to localStorage.
 */
export default function LanguageSwitcher({ size = 'sm', className = '', ariaLabel }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation()
  const value = normalizeLng(i18n.language)

  /** Handle selection change and persist choice */
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Language
    i18n.changeLanguage(next)
    try {
      localStorage.setItem('pref_lang', next)
    } catch {
      // ignore
    }
  }

  const sizeCls =
    size === 'sm'
      ? 'h-7 text-xs px-2 py-1'
      : 'h-8 text-sm px-2.5 py-1.5'

  return (
    <select
      value={value}
      onChange={handleChange}
      aria-label={ariaLabel || t('settings.language.title')}
      title={t('settings.language.title')}
      className={[
        'rounded-md border bg-white',
        'outline-none focus:ring-2 focus:ring-indigo-500/40',
        sizeCls,
        className,
      ].join(' ')}
    >
      <option value="en">{t('lang.en')}</option>
      <option value="zh">{t('lang.zh')}</option>
      <option value="hi">{t('lang.hi')}</option>
      <option value="ar">{t('lang.ar')}</option>
      <option value="es">{t('lang.es')}</option>
      <option value="pt">{t('lang.pt')}</option>
    </select>
  )
}
