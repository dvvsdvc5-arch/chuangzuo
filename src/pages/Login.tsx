/**
 * pages/Login.tsx
 * Standalone login page with email + password, and conditional OTP when GA is bound.
 * Visuals: centered glass card, gradient headline, dark-mode friendly.
 * Update:
 * - Add password visibility toggle (eye icon) to show/hide password.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/button'
import { useTranslation } from 'react-i18next'
import { Toaster, toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import LanguageSwitcher from '../components/LanguageSwitcher'

/** Simple email format check */
function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

/** LoginPage
 * Renders a two-step-aware login form:
 * - Email + password
 * - If GA bound, shows OTP field (6 digits)
 * Update:
 * - Password field now supports visibility toggle with an eye icon.
 */
export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthed, login, probeGA, gaBound } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false) // whether to show password as plain text
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [touchedEmail, setTouchedEmail] = useState(false)

  // If already authed (e.g., navigating back), go home
  useEffect(() => {
    if (isAuthed) {
      navigate('/', { replace: true })
    }
  }, [isAuthed, navigate])

  // 展示“退出成功”提示：若从其他页面退出并重定向到登录页
  useEffect(() => {
    try {
      if (sessionStorage.getItem('just_logged_out') === '1') {
        sessionStorage.removeItem('just_logged_out')
        toast.success(t('logout.success', { defaultValue: 'Logged out' }))
      }
    } catch {
      // ignore storage errors
    }
  }, [t])

  // 预填邮箱：若注册成功后跳转回来，预置邮箱便于直接登录
  useEffect(() => {
    try {
      const prefill = sessionStorage.getItem('prefill_email')
      if (prefill) {
        setEmail(prefill)
        sessionStorage.removeItem('prefill_email')
      }
    } catch {
      // ignore
    }
  }, [])

  /** Handle email change and probe GA binding with tiny debounce */
  useEffect(() => {
    if (!email || !isValidEmail(email)) return
    let alive = true
    setChecking(true)
    const id = setTimeout(() => {
      if (!alive) return
      probeGA(email)
      setChecking(false)
    }, 250)
    return () => {
      alive = false
      clearTimeout(id)
    }
  }, [email, probeGA])

  const emailError = useMemo(() => {
    if (!touchedEmail) return ''
    if (!email) return t('login.errors.required')
    if (!isValidEmail(email)) return t('login.errors.invalidEmail')
    return ''
  }, [email, touchedEmail, t])

  /** handleSubmit
   * Submit the login form with validations and optional OTP.
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouchedEmail(true)
    if (!email || !isValidEmail(email)) return
    if (!password) {
      toast.error(t('login.errors.required'))
      return
    }
    if (gaBound && (!otp || !/^\d{6}$/.test(otp))) {
      toast.error(t('login.errors.otp'))
      return
    }
    try {
      setLoading(true)
      const res = await login({ email, password, otp: gaBound ? otp : undefined })
      if (res.ok) {
        toast.success(t('login.success'))
        // Navigate to home
        navigate('/', { replace: true })
      } else {
        toast.error(res.error || t('login.failed'))
      }
    } finally {
      setLoading(false)
    }
  }

  /** togglePasswordVisibility
   * Toggle password input type with an accessible label.
   */
  function togglePasswordVisibility() {
    setShowPassword((v) => !v)
  }

  return (
    <div className="min-h-screen font-sans relative overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100">
      {/* Subtle background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/20 via-sky-500/20 to-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-gradient-to-br from-cyan-500/20 via-emerald-500/20 to-teal-500/20 blur-3xl" />
      </div>

      {/* Top-right language switcher for login page */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher size="md" />
      </div>

      <div className="relative flex items-center justify-center min-h-screen px-4">
        {/* Card */}
        <section className="w-full max-w-md rounded-2xl border bg-white/70 backdrop-blur-md p-6 shadow-xl dark:bg-slate-900/70 dark:border-slate-800">
          {/* Brand / Title */}
          <div className="text-center mb-6">
            <div
              className="
                text-2xl md:text-3xl font-semibold tracking-tight
                bg-clip-text text-transparent
                bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600
                dark:from-indigo-400 dark:via-sky-400 dark:to-cyan-400
              "
            >
              {t('login.title')}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t('login.subtitle')}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('login.email')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={[
                  'mt-1 w-full rounded-md border bg-white/90 px-3 py-2 text-sm',
                  'outline-none focus:ring-2 focus:ring-indigo-500/40',
                  'dark:bg-slate-900/60 dark:border-slate-700',
                ].join(' ')}
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouchedEmail(true)}
              />
              {emailError ? (
                <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">{emailError}</div>
              ) : null}
              {checking && !emailError ? (
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{t('login.checking')}</div>
              ) : null}
            </div>

            {/* Password with visibility toggle */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('login.password')}
              </label>
              {/* Wrapper to host the eye toggle button on the right */}
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={[
                    'w-full rounded-md border bg-white/90 px-3 py-2 pr-10 text-sm', // pr-10 ensures space for the eye icon
                    'outline-none focus:ring-2 focus:ring-indigo-500/40',
                    'dark:bg-slate-900/60 dark:border-slate-700',
                  ].join(' ')}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {/* Eye toggle button */}
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  aria-label={
                    showPassword
                      ? (t('login.hidePassword', { defaultValue: 'Hide password' }) as string)
                      : (t('login.showPassword', { defaultValue: 'Show password' }) as string)
                  }
                  title={
                    showPassword
                      ? (t('login.hidePassword', { defaultValue: 'Hide password' }) as string)
                      : (t('login.showPassword', { defaultValue: 'Show password' }) as string)
                  }
                  className="absolute inset-y-0 right-2 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {t('login.hintPassword', { defaultValue: 'Demo password: demo123' })}
              </div>
            </div>

            {/* OTP (conditionally visible) */}
            {gaBound ? (
              <div className="transition-all duration-200">
                <label htmlFor="otp" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                  {t('login.otp')}
                </label>
                <input
                  id="otp"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  className={[
                    'mt-1 w-full rounded-md border bg-white/90 px-3 py-2 text-sm tracking-widest',
                    'outline-none focus:ring-2 focus:ring-indigo-500/40',
                    'dark:bg-slate-900/60 dark:border-slate-700',
                  ].join(' ')}
                  placeholder={t('login.otpPlaceholder') as string}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D+/g, '').slice(0, 6))}
                />
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {t('login.hintOtp', { defaultValue: 'Demo OTP: 123456' })}
                </div>
              </div>
            ) : null}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-11 rounded-full text-white font-medium bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-500 hover:from-indigo-500/90 hover:via-sky-500/90 hover:to-cyan-500/90 focus-visible:ring-2 focus-visible:ring-indigo-500/60"
              disabled={loading || checking}
            >
              {loading ? t('login.signingIn') : t('login.signIn')}
            </Button>

            {/* Register link (under the Sign in button) */}
            <div className="text-center text-sm mt-2">
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600 hover:underline dark:from-indigo-400 dark:via-sky-400 dark:to-cyan-400"
              >
                {t('register.link', { defaultValue: 'Create an account' })}
              </button>
            </div>

            {/* Tips */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              {t('login.notice', {
                defaultValue: 'Use jane@example.com for GA-bound demo (OTP required).',
              })}
            </div>
          </form>
        </section>
      </div>

      {/* Local toaster (AppLayout toaster is not mounted on /login) */}
      <Toaster position="top-center" duration={2600} richColors />
    </div>
  )
}
