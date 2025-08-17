/**
 * components/WalletQuickSettings.tsx
 * Wallet quick settings panel: account, security, platform.
 * Fully localized, supports theme switching, and provides logout confirmation dialog.
 *
 * Update:
 * - Replace 2FA switch with a read-only status icon (green check when bound, grey X when unbound).
 *   The icon itself is non-clickable (pointer-events: none), while the row remains clickable to trigger action.
 * - GA 行点击跳转到绑定页面（#/ga），不在行内直接切换状态。
 * - 新增：平台分区加入“联系客服（Telegram）”，链接由后端配置，图标使用纸飞机。
 */

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAppStore } from '../store/appStore'
import { useAuthStore } from '../store/authStore'
import {
  User as UserIcon,
  Languages,
  KeyRound,
  ShieldCheck,
  Shield,
  Info,
  ChevronRight,
  Moon,
  CheckCircle2,
  XCircle,
  Send,
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'
import { useTheme } from 'next-themes'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { fetchSupportInfo } from '../services/support'

/**
 * SettingsSectionProps
 * Section card props.
 */
interface SettingsSectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

/**
 * SettingsSection
 * Section card with title and divider.
 */
function SettingsSection({ title, children, className = '' }: SettingsSectionProps) {
  return (
    <section className={`rounded-xl border bg-white/70 backdrop-blur dark:bg-slate-900/70 dark:border-slate-800 ${className}`}>
      <div className="px-4 pt-3 pb-2 text-sm font-medium text-slate-700 dark:text-slate-200">{title}</div>
      <div className="divide-y dark:divide-slate-800/60">{children}</div>
    </section>
  )
}

/**
 * SettingsRowProps
 * Row props for quick settings item.
 */
interface SettingsRowProps {
  icon: React.ReactNode
  title: string
  desc?: string
  onClick?: () => void
  href?: string
  right?: React.ReactNode
  disabled?: boolean
  /** If true, place the right node as an overlay at top-right corner. */
  overlayRight?: boolean
}

/**
 * RightNode
 * Small helper to render the right-side content with optional overlay positioning.
 */
function RightNode({
  node,
  overlay,
}: {
  node: React.ReactNode
  overlay?: boolean
}) {
  const content = (
    <div className="ml-3 flex items-center gap-2 text-slate-500 whitespace-nowrap dark:text-slate-400">
      {node}
    </div>
  )
  if (overlay) {
    return (
      <div className="absolute right-3 top-2">
        {content}
      </div>
    )
  }
  return content
}

/**
 * SettingsRow
 * Clickable row with icon/title/desc and right-side addon.
 * Supports overlayRight to pin the right node to the top-right corner.
 */
function SettingsRow({ icon, title, desc, onClick, href, right, disabled, overlayRight }: SettingsRowProps) {
  // Base layout: relative to allow overlay, extra right padding to avoid overlap when overlayRight
  const base =
    'relative w-full flex items-center justify-between px-4 py-3 text-left ' +
    (overlayRight ? 'pr-20' : '')

  const left = (
    <div className="flex items-center gap-3">
      <span className="text-slate-600 dark:text-slate-400">{icon}</span>
      <div>
        <div className="text-sm font-medium">{title}</div>
        {desc && <div className="text-xs text-slate-500 dark:text-slate-400">{desc}</div>}
      </div>
    </div>
  )

  const rightNode = (
    <RightNode node={right ?? <ChevronRight className="h-4 w-4" aria-hidden="true" />} overlay={overlayRight} />
  )

  if (href) {
    return (
      <a
        href={href}
        className={`${base} hover:bg-slate-50 transition-colors dark:hover:bg-slate-800`}
        aria-label={title}
      >
        {left}
        {!overlayRight && rightNode}
        {overlayRight && rightNode}
      </a>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} hover:bg-slate-50 transition-colors disabled:opacity-60 dark:hover:bg-slate-800`}
      aria-label={title}
    >
      {left}
      {!overlayRight && rightNode}
      {overlayRight && rightNode}
    </button>
  )
}

/**
 * ChangePasswordModalProps
 * Password modal control props.
 */
interface ChangePasswordModalProps {
  open: boolean
  onClose: () => void
}

/**
 * ChangePasswordModal
 * Validates old/new passwords locally.
 */
function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  /**
   * 更改密码弹窗
   * 新增谷歌验证（OTP）输入框：未绑定时禁用并提示去绑定；已绑定时必须输入 6 位数字。
   */
  const { t } = useTranslation()
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [otp, setOtp] = useState('')
  const gaOn = React.useMemo(() => {
    try {
      return localStorage.getItem('pref_2fa') === 'on'
    } catch {
      return false
    }
  }, [])
  const [errors, setErrors] = useState<{ old?: string; nw?: string; cf?: string; otp?: string; ga?: string }>({})

  /** 验证并提交（模拟） */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}

    // 基础校验
    if (!oldPwd) next.old = t('settings.changePassword.errors.old')
    if (!newPwd || newPwd.length < 6) next.nw = t('settings.changePassword.errors.len')
    if (confirm !== newPwd) next.cf = t('settings.changePassword.errors.confirm')

    // GA 绑定与 OTP 校验
    if (!gaOn) {
      next.ga = t('settings.changePassword.errors.gaBind')
    } else if (!/^[0-9]{6}$/.test(otp)) {
      next.otp = t('settings.changePassword.errors.otp')
    }

    setErrors(next)

    if (Object.keys(next).length === 0) {
      // 模拟成功
      window.alert(t('settings.changePassword.success'))
      onClose()
      setOldPwd('')
      setNewPwd('')
      setConfirm('')
      setOtp('')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* Content */}
      <div className="relative z-10 w-full max-w-sm rounded-xl border bg-white p-4 shadow-xl dark:bg-slate-900 dark:border-slate-800">
        <div className="text-base font-semibold tracking-tight">{t('settings.changePassword.title')}</div>
        <form className="mt-3 space-y-3" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <Label htmlFor="oldPwd">{t('settings.changePassword.fields.old')}</Label>
            <Input
              id="oldPwd"
              type="password"
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
              placeholder=""
            />
            {errors.old && <span className="text-xs text-rose-600">{errors.old}</span>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="newPwd">{t('settings.changePassword.fields.new')}</Label>
            <Input
              id="newPwd"
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder=""
            />
            {errors.nw && <span className="text-xs text-rose-600">{errors.nw}</span>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirmPwd">{t('settings.changePassword.fields.confirm')}</Label>
            <Input
              id="confirmPwd"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder=""
            />
            {errors.cf && <span className="text-xs text-rose-600">{errors.cf}</span>}
          </div>

          {/* 谷歌验证 OTP */}
          <div className="grid gap-1.5">
            <Label htmlFor="otp">{t('settings.changePassword.fields.otp')}</Label>
            <Input
              id="otp"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              disabled={!gaOn}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D+/g, '').slice(0, 6))}
              placeholder="000000"
            />
            {/* 提示与错误 */}
            {!gaOn ? (
              <div className="text-xs text-amber-600 dark:text-amber-300">
                {t('settings.changePassword.errors.gaBind')}{' '}
                <a href="#/ga" className="text-indigo-600 hover:underline dark:text-indigo-400">
                  {t('settings.ga.title')}
                </a>
              </div>
            ) : errors.otp ? (
              <span className="text-xs text-rose-600">{errors.otp}</span>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('settings.ga.desc')}</p>
            )}
            {errors.ga && <span className="text-xs text-rose-600">{errors.ga}</span>}
          </div>

          <div className="flex gap-2 pt-1">
            {/* outline 按钮需带 bg-transparent */}
            <Button type="button" variant="outline" className="bg-transparent" onClick={onClose}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit">{t('actions.save')}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * GaStatusIconProps
 * Props for the Google Authenticator binding status icon.
 */
interface GaStatusIconProps {
  /** Whether GA has been bound (true: bound, false: not bound). */
  bound: boolean
}

/**
 * GaStatusIcon
 * Read-only small icon that indicates GA state:
 * - bound: green check
 * - unbound: grey X
 * The icon itself is non-interactive to avoid accidental toggles.
 */
function GaStatusIcon({ bound }: GaStatusIconProps) {
  const { t } = useTranslation()
  const title = bound ? t('settings.ga.on') : t('settings.ga.off')
  return (
    <span className="pointer-events-none inline-flex items-center" title={title} aria-label={title}>
      {bound ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />
      ) : (
        <XCircle className="h-5 w-5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
      )}
    </span>
  )
}

/**
 * kycStatusText
 * Map KYC status to localized text.
 */
function kycStatusText(s: import('../store/appStore').User['kycStatus'], t: any) {
  return t(`settings.kyc.status.${s}`)
}

/**
 * StatusPillProps
 * KYC status badge props.
 */
interface StatusPillProps {
  status: import('../store/appStore').User['kycStatus']
}

/**
 * StatusPill
 * Badge for KYC status. Now forces no-wrap to prevent line breaks.
 */
function StatusPill({ status }: StatusPillProps) {
  const { t } = useTranslation()
  const map: Record<StatusPillProps['status'], string> = {
    NOT_STARTED: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
    IN_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800',
    VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-800',
  }
  return (
    <span className={`text-xs rounded-full border px-2 py-0.5 whitespace-nowrap ${map[status]}`}>
      {kycStatusText(status, t)}
    </span>
  )
}

/**
 * WalletQuickSettings
 * Main component with language switching via i18n.
 * Adds theme (light/dark) toggle with next-themes.
 * Update:
 * - Logout confirmation dialog for better UX and accessibility.
 * - Dialog content width tuned for better readability on mobile and desktop.
 * - GA status rendered as read-only icon (non-clickable). Row navigates to GA setup page.
 * - 新增 Telegram 客服入口：优先使用后端与本地覆盖。
 */
export default function WalletQuickSettings() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const { logout } = useAuthStore()

  // GA 状态从本地存储读取（演示），绑定流程在 /ga 页面完成
  const [gaOn] = useState<boolean>(() => localStorage.getItem('pref_2fa') === 'on')
  const [pwdOpen, setPwdOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  /** 支持链接（仅 Telegram） */
  const [telegram, setTelegram] = useState<string>('https://t.me/ccrc_support')

  /** 拉取后端配置或本地覆盖的 Telegram 链接 */
  useEffect(() => {
    let mounted = true
    fetchSupportInfo()
      .then((info) => {
        if (!mounted) return
        if (info.telegram) setTelegram(info.telegram)
      })
      .catch(() => {
        // 保持默认值
      })
    return () => {
      mounted = false
    }
  }, [])

  /** Theme toggle: light &lt;-&gt; dark */
  function handleThemeToggle(v: boolean) {
    // true => dark, false => light
    const next = v ? 'dark' : 'light'
    setTheme(next)
    try {
      localStorage.setItem('pref_theme', next)
    } catch {}
  }

  /**
   * handleLogout
   * Confirmed logout action (mock): navigate to home. Dialog is controlled by state.
   */
  function handleLogout() {
    setLogoutOpen(false)
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
    <div className="space-y-4">
      {/* Account */}
      <SettingsSection title={t('settings.sections.account')}>
        <SettingsRow
          icon={<UserIcon className="h-5 w-5" />}
          title={t('settings.profileEdit.title')}
          desc={t('settings.profileEdit.desc')}
          href="#/profile"
        />
        <SettingsRow
          icon={<Languages className="h-5 w-5" />}
          title={t('settings.language.title')}
          desc={t('settings.language.desc')}
          right={<LanguageSwitcher size="sm" />}
        />
        <SettingsRow
          icon={<KeyRound className="h-5 w-5" />}
          title={t('settings.changePassword.title')}
          desc={t('settings.changePassword.desc')}
          onClick={() => setPwdOpen(true)}
        />
      </SettingsSection>

      {/* Security */}
      <SettingsSection title={t('settings.sections.security')}>
        <SettingsRow
          icon={<ShieldCheck className="h-5 w-5" />}
          title={t('settings.kyc.title')}
          desc={t('settings.kyc.desc')}
          href="#/kyc"
          right={<StatusPill status={user.kycStatus} />}
          overlayRight
        />
        <SettingsRow
          icon={<Shield className="h-5 w-5" />}
          title={t('settings.ga.title')}
          desc={t('settings.ga.desc')}
          // Icon on the right is read-only and cannot be clicked
          right={<GaStatusIcon bound={gaOn} />}
          // 点击跳转至绑定页面
          href="#/ga"
        />
      </SettingsSection>

      {/* Platform */}
      <SettingsSection title={t('settings.sections.platform')}>
        <SettingsRow
          icon={<Moon className="h-5 w-5" />}
          title={t('settings.theme.title')}
          desc={t('settings.theme.desc')}
          right={
            // Keep a compact switch for theme; reuse the minimal tailwind switch
            // to avoid bringing additional dependencies or changing global UI components.
            <span
              role="switch"
              aria-checked={(theme || 'light') === 'dark'}
              aria-label="theme-switch"
              onClick={() => handleThemeToggle((theme || 'light') !== 'dark')}
              className={[
                'inline-flex h-5 w-9 cursor-pointer items-center rounded-full border transition-all',
                (theme || 'light') === 'dark'
                  ? 'bg-emerald-500/90 border-emerald-500'
                  : 'bg-slate-200 border-slate-300 dark:bg-slate-700 dark:border-slate-600',
              ].join(' ')}
            >
              <span
                className={[
                  'h-4 w-4 rounded-full bg-white shadow transform transition-all',
                  (theme || 'light') === 'dark' ? 'translate-x-4' : 'translate-x-0.5',
                ].join(' ')}
              />
            </span>
          }
        />

        {/* 新增：联系客服（Telegram） */}
        <SettingsRow
          icon={<Send className="h-5 w-5" />}
          title={t('settings.support.title')}
          desc={t('settings.support.desc')}
          href={telegram}
        />

        <SettingsRow
          icon={<Info className="h-5 w-5" />}
          title={t('settings.about.title')}
          desc={t('settings.about.desc')}
          href="#/about"
        />
        {/* Logout row triggers confirmation dialog */}
        <SettingsRow
          icon={<KeyRound className="h-5 w-5" />}
          title={t('settings.logout.title')}
          desc={t('settings.logout.desc')}
          onClick={() => setLogoutOpen(true)}
        />
      </SettingsSection>

      {/* Modal: change password */}
      <ChangePasswordModal open={pwdOpen} onClose={() => setPwdOpen(false)} />

      {/* Logout confirmation dialog (centered, not full-width on mobile) */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="w-[92vw] max-w-sm sm:max-w-md md:max-w-lg rounded-xl p-5 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.logout.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.logout.confirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {/* outline 按钮需带 bg-transparent */}
            <AlertDialogCancel className="bg-transparent">{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              {t('actions.logout')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
