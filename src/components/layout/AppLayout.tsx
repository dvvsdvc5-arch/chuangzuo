/**
 * components/layout/AppLayout.tsx
 * Application shell with sidebar navigation and a top bar.
 * Adds a new global floating BottomDock with 4 icons (Home, Referrals, Run, Wallet).
 * Multi-language: uses i18next translations for labels and titles.
 * Arabic switches to RTL via i18n.ts.
 * Dark mode: adds dark: styles across shell elements.
 * Special headers:
 * - Notifications: left back icon + centered title.
 * - Wallet: centered title + right actions (bell, ledger). [Updated: gradient, larger, bold title]
 * - Profile edit: left back icon + centered title.
 * - Ledger: left back icon + centered title (hide brand and right icons).
 * - GA setup: left back icon + centered title.
 * - KYC: left back icon + centered title.
 * - Run: hide brand logo/name, show centered promo text.
 * - Referrals: hide brand logo/name, show centered localized title. [New]
 * - About: hide brand logo/name/right icons; centered title only.
 * - Deposit: left back icon + centered "Deposit" title; right shows "Deposit Records" icon.
 * - Deposit Records: left back icon + centered "Deposit Records" title; no right icons.
 * - Withdrawals: left back icon + centered "Withdrawals" title; right shows "Withdrawal Records" icon.
 * - Withdrawal Records: left back icon + centered "Withdrawal Records" title; no right icons.
 * - Exchange: left back icon + centered "Exchange" title; right shows "Exchange Records" icon. [Updated]
 * - Exchange Records: left back icon + centered "Exchange Records" title; no right icons. [New]
 * - Transfer: left back icon + centered "Internal Transfer" title; no right icons. [New]
 *
 * Update:
 * - Add global Toaster (sonner) at top-center to display ephemeral notifications.
 * - Hide BottomDock on the Notifications, Ledger, GA, KYC, About, Deposit, Deposit Records,
 *   Withdrawals, Withdrawal Records, Exchange, Exchange Records, and Transfer pages.
 *
 * New:
 * - Unread notifications badge is dynamic: reads from notifications service and updates on change.
 * - Logout now uses a confirmation dialog; on confirm, logout and navigate to /login.
 */

import { ReactNode, useMemo, useEffect, useState } from 'react'
import { Wallet, BarChart2, Receipt, Users, ShieldCheck, Settings, LogOut, ArrowRight, Bell, ArrowLeft, History } from 'lucide-react'
import { Button } from '../../components/ui/button'
import HeaderIcon from '../HeaderIcon'
import BrandLogo from '../BrandLogo'
import BrandName from '../BrandName'
import { useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../LanguageSwitcher'
import BottomDock from '../BottomDock'
import { Toaster } from 'sonner'
import { getUnreadCount, onNotificationsUpdate } from '../../services/notifications'
import { useAuthStore } from '../../store/authStore'
// shadcn alert dialog for logout confirm
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '../../components/ui/alert-dialog'

/**
 * NavItem
 * Sidebar navigation item.
 */
interface NavItem {
  key: 'dashboard' | 'ledger' | 'wallet' | 'withdrawals' | 'referrals' | 'kyc' | 'settings'
  href: string
  icon: ReactNode
}

/**
 * AppLayoutProps
 * Props for the application shell.
 */
interface AppLayoutProps {
  children: ReactNode
}

/** Base sidebar nav configuration */
const baseNav: NavItem[] = [
  { key: 'dashboard', href: '#/', icon: <BarChart2 size={18} /> },
  { key: 'ledger', href: '#/ledger', icon: <Receipt size={18} /> },
  { key: 'wallet', href: '#/wallet', icon: <Wallet size={18} /> },
  { key: 'withdrawals', href: '#/withdrawals', icon: <ArrowRight size={18} /> },
  { key: 'referrals', href: '#/referrals', icon: <Users size={18} /> },
  { key: 'kyc', href: '#/kyc', icon: <ShieldCheck size={18} /> },
  { key: 'settings', href: '#/settings', icon: <Settings size={18} /> },
]

/**
 * AppLayout
 * Global application shell managing sidebar, header, content area, BottomDock, and Toaster.
 */
export default function AppLayout({ children }: AppLayoutProps) {
  const { t, i18n } = useTranslation()

  /** Unread notifications count; only show badge when > 0 */
  const [unreadCount, setUnreadCount] = useState<number>(0)

  /** Init unread and subscribe to notifications updates */
  useEffect(() => {
    try {
      setUnreadCount(getUnreadCount())
    } catch {
      setUnreadCount(0)
    }
    const off = onNotificationsUpdate(() => {
      try {
        setUnreadCount(getUnreadCount())
      } catch {
        setUnreadCount(0)
      }
    })
    return () => off()
  }, [])

  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const isNotifications = location.pathname === '/notifications'
  const isWallet = location.pathname === '/wallet'
  const isProfile = location.pathname === '/profile'
  const isLedger = location.pathname === '/ledger'
  const isGA = location.pathname === '/ga'
  const isKYC = location.pathname === '/kyc'
  const isRun = location.pathname === '/run'
  const isAbout = location.pathname === '/about'
  const isDeposit = location.pathname === '/deposit'
  const isDepositRecords = location.pathname === '/deposit-records'
  const isWithdrawals = location.pathname === '/withdrawals'
  const isWithdrawalRecords = location.pathname === '/withdrawal-records'
  const isExchange = location.pathname === '/exchange'
  /** Whether current route is Exchange Records page (new) */
  const isExchangeRecords = location.pathname === '/exchange-records'
  /** Whether current route is Referrals page (new) */
  const isReferrals = location.pathname === '/referrals'
  /** Whether current route is Transfer page (new) */
  const isTransfer = location.pathname === '/transfer'

  const navItems = useMemo(
    () =>
      baseNav.map((n) => ({
        ...n,
        label: t(`nav.${n.key}`),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language],
  )

  /**
   * handleConfirmLogout
   * Clear auth state and navigate to /login explicitly.
   */
  function handleConfirmLogout() {
    try {
      logout()
      try {
        // 标记退出成功，登录页挂载后读取并提示
        sessionStorage.setItem('just_logged_out', '1')
      } catch {}
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="min-h-screen font-sans bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex">
        {/* Sidebar: hidden in notifications page */}
        {!isNotifications && (
          <aside className="hidden md:flex w-64 flex-col border-r bg-white sticky top-0 h-screen dark:bg-slate-900 dark:border-slate-800">
            <div className="px-5 py-4 border-b dark:border-slate-800">
              <a href="#/" className="flex items-center gap-2">
                
<div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400" />

                <div className="font-semibold">{t('appName')}</div>
              </a>
            </div>
            <nav className="flex-1 p-3">
              <ul className="space-y-1">
                {navItems.map((it) => (
                  <li key={it.href}>
                    <a
                      href={it.href}
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 text-slate-700 transition-colors dark:hover:bg-slate-800 dark:text-slate-300"
                    >
                      <span className="text-slate-500 dark:text-slate-400">{it.icon}</span>
                      <span>{(it as any).label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="p-3 border-t dark:border-slate-800">
              {/* Logout with confirm dialog; shadcn outline button requires bg-transparent */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full bg-transparent" size="sm">
                    <LogOut className="mr-2 h-4 w-4" /> {t('actions.logout')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('logout.confirmTitle', { defaultValue: 'Log out' })}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('logout.confirmDesc', { defaultValue: 'Are you sure you want to log out? You will return to the sign-in page.' })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent">{t('actions.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmLogout}>{t('actions.logout')}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </aside>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-20 flex items-center gap-3 bg-white border-b px-4 py-3 relative dark:bg-slate-900 dark:border-slate-800">
            {isNotifications ? (
              <>
                {/* Notifications: back icon left */}
                <HeaderIcon
                  label={t('actions.back')}
                  Icon={ArrowLeft}
                  onClick={() => navigate(-1)}
                />
                {/* Notifications title centered */}
                <div className="absolute left-1/2 -translate-x-1/2">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{t('header.notifications')}</span>
                </div>
              </>
            ) : isWallet ? (
              <>
                {/* Invisible spacer to keep header height */}
                <div className="h-9 invisible" aria-hidden="true" />
                {/* Wallet title centered - enhanced typography (larger, bold, gradient) */}
                <div className="absolute left-1/2 -translate-x-1/2">
                  <span
                    className="
                      text-xl md:text-2xl font-semibold tracking-tight
                      bg-clip-text text-transparent
                      bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600
                      dark:from-indigo-400 dark:via-sky-400 dark:to-cyan-400
                    "
                  >
                    {t('nav.wallet')}
                  </span>
                </div>
                {/* Right-side actions: notifications and ledger */}
                <div className="ml-auto flex items-center gap-3">
                  <HeaderIcon label={t('header.notifications')} Icon={Bell} badgeCount={unreadCount} href="#/notifications" />
                  <HeaderIcon label={t('nav.ledger')} Icon={Receipt} href="#/ledger" />
                </div>
              </>
            ) : isProfile ? (
              <>
                {/* Profile: back icon left, title centered */}
                <HeaderIcon
                  label={t('actions.back')}
                  Icon={ArrowLeft}
                  onClick={() => navigate(-1)}
                />
                <div className="absolute left-1/2 -translate-x-1/2">
                  <span className="text-lg md:text-xl font-medium text-slate-900 dark:text-slate-100">
                    {t('settings.profileEdit.title')}
                  </span>
                </div>
              </>
            ) : isLedger ? (
              <>
                {/* Ledger: back icon left, title centered (hide brand and right icons) */}
                <HeaderIcon
                  label={t('actions.back')}
                  Icon={ArrowLeft}
                  onClick={() => navigate(-1)}
                />
                <div className="absolute left-1/2 -translate-x-1/2">
                  <span className="text-lg md:text-xl font-medium text-slate-900 dark:text-slate-100">
                    {t('nav.ledger')}
                  </span>
                </div>
              </>
            ) : isGA ? (
              <>
                {/* GA setup: back icon left, centered title */}
                <HeaderIcon
                  label={t('actions.back')}
                  Icon={ArrowLeft}
                  onClick={() => navigate(-1)}
                />
                <div className="absolute left-1/2 -translate-x-1/2">
                  <span className="text-lg md:text-xl font-medium text-slate-900 dark:text-slate-100">
                    {t('settings.ga.title')}
                  </span>
                </div>
              </>
            ) : isKYC ? (
              <>
                {/* KYC: back icon left, centered title (hide logo/name/right actions) */}
                <HeaderIcon
                  label={t('actions.back')}
                  Icon={ArrowLeft}
                  onClick={() => navigate(-1)}
                />
                <div className="absolute left-1/2 -translate-x-1/2">
                  <span className="text-lg md:text-xl font-medium text-slate-900 dark:text-slate-100">
                    {t('settings.kyc.title')}
                  </span>
                </div>
              </>
            ) : isRun ? (
              <>
                {/* Run page: hide logo/name; show centered "Run" with enhanced styling */}
                <div className="h-9 invisible" aria-hidden="true" />
                <div className="absolute left-1/2 -translate-x-1/2">
                  <span
                    className="
                      text-lg md:text-xl font-semibold tracking-tight
                      bg-clip-text text-transparent
                      bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600
                      dark:from-indigo-400 dark:via-blue-400 dark:to-cyan-400
                    "
                  >
                    {t('nav.run')}
                  </span>
                </div>
                {/* Right-side actions remain (language, notifications, ledger) */}
                <div className="ml-auto flex items-center gap-3">
                  <LanguageSwitcher size="sm" className="hidden md:block" />
                  <HeaderIcon label={t('header.notifications')} Icon={Bell} badgeCount={unreadCount} href="#/notifications" />
                  <HeaderIcon label={t('nav.ledger')} Icon={Receipt} href="#/ledger" />
                </div>
              </>
            ) : isReferrals ? (
              <>
                {/* Referrals page: hide brand logo/name; show centered localized title */}
                <div className="h-9 invisible" aria-hidden="true" />
                <div className="absolute left-1/2 -translate-x-1/2">
                  <span
                    className="
                      text-lg md:text-xl font-semibold tracking-tight
                      bg-clip-text text-transparent
                      bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600
                      dark:from-indigo-400 dark:via-sky-400 dark:to-cyan-400
                    "
                  >
                    {t('nav.referrals')}
                  </span>
                </div>
                {/* Right-side actions (language switcher + quick icons) */}
                <div className="ml-auto flex items-center gap-3">
                  <LanguageSwitcher size="sm" className="hidden md:block" />
                  <HeaderIcon label={t('header.notifications')} Icon={Bell} badgeCount={unreadCount} href="#/notifications" />
                  <HeaderIcon label={t('nav.ledger')} Icon={Receipt} href="#/ledger" />
                </div>
              </>
            ) : isAbout ? (
              <>
                {/* About page: back icon left, centered localized title only */}
                <HeaderIcon
                  label={t('actions.back')}
                  Icon={ArrowLeft}
                  onClick={() => navigate(-1)}
                />
                <div className="absolute left-1/2 -translate-x-1/2">
                  <span className="text-lg md:text-xl font-medium text-slate-900 dark:text-slate-100">
                    {t('settings.about.title')}
                  </span>
                </div>
              </>
            ) : isWithdrawals ? (
              <>
                {/* Withdrawals page: back icon left, centered "Withdrawals"; right shows "Withdrawal Records" */}
                <HeaderIcon
                  label={t('actions.back')}
                  Icon={ArrowLeft}
                  onClick={() => navigate(-1)}
                />
                <div className="absolute left-1/2 -translate-x-1/2">
                  <span
                    className="
                      text-xl md:text-2xl font-semibold tracking-tight
                      bg-clip-text text-transparent
                      bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600
                      dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400
                    "
                  >
                    {t('nav.withdrawals')}
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  {/* Right icon to Withdrawal Records */}
                  <HeaderIcon label={t('withdrawalRecords.title') as string} Icon={History} href="#/withdrawal-records" />
                </div>
              </>
            ) : isWithdrawalRecords ? (
              <>
                {/* Withdrawal Records: back icon left, centered title; no right icons */}
                <HeaderIcon
                  label={t('actions.back')}
                  Icon={ArrowLeft}
                  onClick={() => navigate(-1)}
                />
                <div className="absolute left-1/2 -translate-x-1/2">
                  <span className="text-lg md:text-xl font-medium text-slate-900 dark:text-slate-100">
                    {t('withdrawalRecords.title')}
                  </span>
                </div>
              </>
            ) : isDeposit ? (
              <>
                {/* Deposit page: back icon left, centered "Deposit"; right shows "Deposit Records" */}
                <HeaderIcon
                  label={t('actions.back')}
                  Icon={ArrowLeft}
                  onClick={() => navigate(-1)}
                />
                <div className="absolute left-1/2 -translate-x-1/2">
                  <span
                    className="
                      text-xl md:text-2xl font-semibold tracking-tight
                      bg-clip-text text-transparent
                      bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600
                      dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400
                    "
                  >
                    {t('actions.deposit')}
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  {/* Only deposit records icon on the right */}
                  <HeaderIcon label={t('header.depositRecords') as string} Icon={History} href="#/deposit-records" />
                </div>
              </>
            ) : isDepositRecords ? (
              <>
                {/* Deposit Records: back icon left, centered title; no right icons */}
                <HeaderIcon
                  label={t('actions.back')}
                  Icon={ArrowLeft}
                  onClick={() => navigate(-1)}
                />
                <div className="absolute left-1/2 -translate-x-1/2">
                  <span className="text-lg md:text-xl font-medium text-slate-900 dark:text-slate-100">
                    {t('depositRecords.title')}
                  </span>
                </div>
              </>
            ) : isExchange ? (
              <>
                {/* Exchange page: back icon left, centered "Exchange"; right shows "Exchange Records" */}
                <HeaderIcon
                  label={t('actions.back')}
                  Icon={ArrowLeft}
                  onClick={() => navigate(-1)}
                />
                <div className="absolute left-1/2 -translate-x-1/2">
                  <span
                    className="
                      text-xl md:text-2xl font-semibold tracking-tight
                      bg-clip-text text-transparent
                      bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600
                      dark:from-indigo-400 dark:via-sky-400 dark:to-cyan-400
                    "
                  >
                    {t('exchange.title', { defaultValue: 'Exchange' })}
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <HeaderIcon label={t('exchange.records.title', { defaultValue: 'Exchange Records' }) as string} Icon={History} href="#/exchange-records" />
                </div>
              </>
            ) : isExchangeRecords ? (
              <>
                {/* Exchange Records: back icon left, centered title; no right icons */}
                <HeaderIcon
                  label={t('actions.back')}
                  Icon={ArrowLeft}
                  onClick={() => navigate(-1)}
                />
                <div className="absolute left-1/2 -translate-x-1/2">
                  <span className="text-lg md:text-xl font-medium text-slate-900 dark:text-slate-100">
                    {t('exchange.records.title', { defaultValue: 'Exchange Records' })}
                  </span>
                </div>
              </>
            ) : isTransfer ? (
              <>
                {/* Transfer page: back icon left, centered title */}
                <HeaderIcon
                  label={t('actions.back')}
                  Icon={ArrowLeft}
                  onClick={() => navigate(-1)}
                />
                <div className="absolute left-1/2 -translate-x-1/2">
                  <span className="text-lg md:text-xl font-medium text-slate-900 dark:text-slate-100">
                    {t('transferPage.title', { defaultValue: 'Internal Transfer' })}
                  </span>
                </div>
              </>
            ) : (
              <>
                {/* Mobile: static circle logo */}
                <BrandLogo size={36} className="md:hidden" />
                {/* Brand name */}
                <BrandName className="font-semibold text-lg md:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600 dark:from-indigo-400 dark:via-sky-400 dark:to-cyan-400" />
                {/* Right-side actions */}
                <div className="ml-auto flex items-center gap-3">
                  {/* Desktop quick language switcher */}
                  <LanguageSwitcher size="sm" className="hidden md:block" />
                  <HeaderIcon label={t('header.notifications')} Icon={Bell} badgeCount={unreadCount} href="#/notifications" />
                  <HeaderIcon label={t('nav.ledger')} Icon={Receipt} href="#/ledger" />
                </div>
              </>
            )}
          </header>
          {/* Increase bottom padding to avoid overlap with the floating dock */}
          <main className="p-4 md:p-6 pb-28">{children}</main>
        </div>
      </div>

      
{/* Global floating bottom dock: hide on Notifications, Ledger, GA, KYC, About, Deposit, Deposit Records pages, Withdrawals, Withdrawal Records, Exchange, and Exchange Records */}

      
{!isNotifications && !isLedger && !isGA && !isKYC && !isAbout && !isDeposit && !isDepositRecords && !isWithdrawals && !isWithdrawalRecords && !isExchange && !isExchangeRecords && !isTransfer && <BottomDock />}

      {/* Global Toaster for ephemeral notifications (top-center, 3s, green for success) */}
      <Toaster position="top-center" duration={3000} richColors closeButton={false} />
    </div>
  )
}
