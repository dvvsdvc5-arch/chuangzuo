/**
 * components/BottomNav.tsx
 * 移动端底部固定导航栏（恢复为显示全部 7 个项目、允许标签按需换行）。
 * 使用 i18n 获取标签；高亮当前路由。
 */
import React, { useMemo } from 'react'
import { BarChart2, Receipt, Wallet, ArrowRight, Users, ShieldCheck, Settings } from 'lucide-react'
import { useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'

/**
 * NavItem
 * 底部导航项的数据结构。
 */
interface NavItem {
  key: 'dashboard' | 'ledger' | 'wallet' | 'withdrawals' | 'referrals' | 'kyc' | 'settings'
  href: string
  icon: React.ReactNode
}

/**
 * base
 * 静态底部导航配置（文案从 i18n 获取）。
 */
const base: NavItem[] = [
  { key: 'dashboard', href: '#/', icon: <BarChart2 className="h-5 w-5" /> },
  { key: 'ledger', href: '#/ledger', icon: <Receipt className="h-5 w-5" /> },
  { key: 'wallet', href: '#/wallet', icon: <Wallet className="h-5 w-5" /> },
  { key: 'withdrawals', href: '#/withdrawals', icon: <ArrowRight className="h-5 w-5" /> },
  { key: 'referrals', href: '#/referrals', icon: <Users className="h-5 w-5" /> },
  { key: 'kyc', href: '#/kyc', icon: <ShieldCheck className="h-5 w-5" /> },
  { key: 'settings', href: '#/settings', icon: <Settings className="h-5 w-5" /> },
]

/**
 * BottomNav
 * 移动端固定底栏导航（MD 尺寸隐藏）。
 */
export default function BottomNav() {
  const { t, i18n } = useTranslation()
  const location = useLocation()

  /**
   * 语言变化时翻译一次。
   */
  const items = useMemo(
    () =>
      base.map((n) => ({
        ...n,
        label: t(`nav.${n.key}`),
      })),
    // 依赖语言
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language],
  )

  /**
   * 判断是否当前路由活跃。
   */
  function isActive(href: string) {
    const path = href.replace(/^#/, '')
    return location.pathname === path
  }

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t shadow-sm">
      <ul className="grid grid-cols-7">
        {items.map((it) => {
          const active = isActive(it.href)
          return (
            <li key={it.href}>
              <a
                href={it.href}
                className={[
                  'flex flex-col items-center justify-center py-2.5 text-xs',
                  active ? 'text-indigo-600' : 'text-slate-600',
                ].join(' ')}
                aria-label={it.label}
                title={it.label}
              >
                <span className={active ? 'text-indigo-600' : 'text-slate-500'}>{it.icon}</span>
                {/* 恢复为不强制单行省略，行为与之前一致（不同语言可能导致换行与高度变化） */}
                <span className="mt-1 w-full px-1 text-center leading-tight">{it.label}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
