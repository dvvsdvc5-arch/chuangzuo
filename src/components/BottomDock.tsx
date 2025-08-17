/**
 * components/BottomDock.tsx
 * 全局底部浮动 Dock（移动端优先）：Dashboard / Referrals / Run / Wallet。
 * 当前路由高亮，深色模式与毛玻璃背景适配。
 * 更新：将 Run 图标由 Activity 改为 Zap（电击图标）。
 */

import React from 'react'
import { useLocation } from 'react-router'
import { House, Users, Zap, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/**
 * DockItem
 * 底部导航项模型。
 */
interface DockItem {
  key: 'home' | 'referrals' | 'run' | 'wallet'
  href: string
  label: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  isActive: (path: string) => boolean
}

/**
 * isActivePath
 * 判断当前 path 是否匹配。
 */
function isActivePath(current: string, target: string) {
  return current === target
}

/**
 * BottomDock
 * 简洁的 4 栏底部导航。
 */
export default function BottomDock(): JSX.Element {
  const { t } = useTranslation()
  const location = useLocation()
  const path = location.pathname

  const items: DockItem[] = [
    {
      key: 'home',
      href: '#/',
      label: t('nav.dashboard'),
      Icon: House,
      isActive: (p) => isActivePath(p, '/'),
    },
    {
      key: 'referrals',
      href: '#/referrals',
      label: t('nav.referrals'),
      Icon: Users,
      isActive: (p) => isActivePath(p, '/referrals'),
    },
    {
      key: 'run',
      href: '#/run',
      label: t('nav.run'),
      Icon: Zap, // 替换为电击图标
      isActive: (p) => isActivePath(p, '/run'),
    },
    {
      key: 'wallet',
      href: '#/wallet',
      label: t('nav.wallet'),
      Icon: Wallet,
      isActive: (p) => isActivePath(p, '/wallet'),
    },
  ]

  return (
    <nav
      className="
        fixed inset-x-0 bottom-0 z-40 pointer-events-auto
      "
      aria-label="Global dock"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom))' }}
    >
      <div
        className="
          w-full
          border-t border-slate-200/70 dark:border-slate-800/70
          bg-white/80 backdrop-blur-md dark:bg-slate-900/85
          shadow-[0_-12px_24px_-18px_rgba(2,6,23,0.25)]
          supports-[backdrop-filter]:bg-white/75
          dark:supports-[backdrop-filter]:bg-slate-900/80
        "
      >
        <div className="mx-auto max-w-screen-xl">
          <div className="grid grid-cols-4">
            {items.map(({ key, href, label, Icon, isActive }) => {
              const active = isActive(path)
              return (
                <a
                  key={key}
                  href={href}
                  aria-label={label}
                  title={label}
                  className="
                    relative flex items-center justify-center
                    py-2
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
                    transition-colors
                  "
                  aria-current={active ? 'page' : undefined}
                >
                  <span
                    className={`
                      absolute top-0 h-0.5 w-8 rounded-full transition-opacity duration-200
                      ${active ? 'opacity-100 bg-indigo-500/70 dark:bg-indigo-400/70' : 'opacity-0 bg-transparent'}
                    `}
                    aria-hidden="true"
                  />
                  <span
                    className={`
                      flex items-center justify-center h-10 w-10 rounded-full
                      transition-all duration-200 ease-out
                      ${active
                        ? 'bg-indigo-50 ring-1 ring-indigo-500/20 shadow-sm dark:bg-indigo-500/10 dark:ring-indigo-400/20'
                        : 'bg-white/0'}
                    `}
                    aria-hidden="true"
                  >
                    <Icon
                      className={`
                        h-5 w-5 transition-all duration-200 ease-out drop-shadow-sm
                        ${active ? 'text-indigo-600 scale-110 dark:text-indigo-400' : 'text-slate-600 scale-100 dark:text-slate-400'}
                      `}
                      aria-hidden="true"
                    />
                  </span>
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
