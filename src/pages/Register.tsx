/**
 * pages/Register.tsx
 * 邮箱验证码注册页：邮箱 + 用户名 + 密码/确认 + 验证码。
 * - 无后端环境：使用 sessionStorage 模拟验证码，localStorage 存储注册用户（演示）。
 * - 发送验证码后 60s 冷却；验证码 5 分钟有效。
 * - 用户名/邮箱唯一性校验，表单完整校验与提示。
 * - 成功注册后跳转登录页，并预填邮箱；登录页将通过 Toaster 提示成功。
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Toaster, toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '../components/ui/button'

/** 用户对象（演示存储用） */
interface DemoUser {
  /** 唯一用户名 */
  username: string
  /** 唯一邮箱 */
  email: string
  /** 明文密码（仅演示，真实环境不可存明文） */
  password: string
}

/** 简单邮箱校验 */
function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

/** 读取已注册用户（localStorage） */
function readUsers(): DemoUser[] {
  try {
    const raw = localStorage.getItem('registered_users')
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? (arr as DemoUser[]) : []
  } catch {
    return []
  }
}

/** 写入已注册用户 */
function writeUsers(list: DemoUser[]): void {
  try {
    localStorage.setItem('registered_users', JSON.stringify(list))
  } catch {
    // ignore
  }
}

/** 检查用户名是否被占用（忽略大小写） */
function isUsernameTaken(username: string): boolean {
  const list = readUsers()
  const u = username.trim().toLowerCase()
  return list.some((x) => x.username.trim().toLowerCase() === u)
}

/** 检查邮箱是否已注册（忽略大小写） */
function isEmailTaken(email: string): boolean {
  const list = readUsers()
  const e = email.trim().toLowerCase()
  return list.some((x) => x.email.trim().toLowerCase() === e)
}

/** 生成 6 位数字验证码 */
function genCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/** 存验证码（sessionStorage）：key = verify::<email> */
function storeCode(email: string, code: string, ttlMs: number): void {
  const key = `verify::${email.trim().toLowerCase()}`
  const payload = { code, exp: Date.now() + ttlMs }
  try {
    sessionStorage.setItem(key, JSON.stringify(payload))
  } catch {
    // ignore
  }
}

/** 取验证码与有效期 */
function loadCode(email: string): { code: string; exp: number } | null {
  const key = `verify::${email.trim().toLowerCase()}`
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const obj = JSON.parse(raw)
    if (!obj || typeof obj.code !== 'string' || typeof obj.exp !== 'number') return null
    return obj
  } catch {
    return null
  }
}

/** 移除验证码 */
function removeCode(email: string): void {
  const key = `verify::${email.trim().toLowerCase()}`
  try {
    sessionStorage.removeItem(key)
  } catch {
    // ignore
  }
}

/**
 * RegisterPage
 * 邮箱验证码注册，成功后跳回登录页。
 */
export default function RegisterPage(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [code, setCode] = useState('')

  // 发送验证码状态
  const [sending, setSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [lastDemoCode, setLastDemoCode] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)

  // 用户名唯一性即时校验（简约判定）
  const usernameTaken = useMemo(() => {
    const u = username.trim()
    if (!u) return false
    return isUsernameTaken(u)
  }, [username])

  const emailTaken = useMemo(() => {
    const e = email.trim()
    if (!e || !isValidEmail(e)) return false
    return isEmailTaken(e)
  }, [email])

  // 冷却倒计时
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  /** 发送验证码 */
  async function handleSendCode() {
    const e = email.trim()
    if (!e || !isValidEmail(e)) {
      toast.error(t('register.errors.invalidEmail', { defaultValue: 'Please enter a valid email' }))
      return
    }
    if (emailTaken) {
      toast.error(t('register.errors.emailTaken', { defaultValue: 'This email has already been registered' }))
      return
    }
    if (cooldown > 0 || sending) return
    try {
      setSending(true)
      // 模拟发送
      const v = genCode()
      storeCode(e, v, 5 * 60 * 1000) // 5 分钟有效
      setLastDemoCode(v)
      setCooldown(60)
      toast.success(`${t('actions.send', { defaultValue: 'Sent' })}: ${t('register.hints.demoCode', { defaultValue: 'A demo code has been sent (shown in the toast).' })} (${v})`)
    } finally {
      setSending(false)
    }
  }

  /** 提交注册 */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // 基础校验
    if (!email.trim() || !username.trim() || !password || !confirm || !code.trim()) {
      toast.error(t('register.errors.required', { defaultValue: 'This field is required' }))
      return
    }
    if (!isValidEmail(email)) {
      toast.error(t('register.errors.invalidEmail', { defaultValue: 'Please enter a valid email' }))
      return
    }
    if (emailTaken) {
      toast.error(t('register.errors.emailTaken', { defaultValue: 'This email has already been registered' }))
      return
    }
    if (usernameTaken) {
      toast.error(t('register.errors.usernameTaken', { defaultValue: 'This username is already taken' }))
      return
    }
    if (password.length < 6) {
      toast.error(t('register.errors.passwordLength', { defaultValue: 'Password must be at least 6 characters' }))
      return
    }
    if (password !== confirm) {
      toast.error(t('register.errors.passwordMismatch', { defaultValue: 'Passwords do not match' }))
      return
    }
    // 验证码校验
    const payload = loadCode(email)
    if (!payload) {
      toast.error(t('register.errors.codeInvalid', { defaultValue: 'Invalid verification code' }))
      return
    }
    if (Date.now() > payload.exp) {
      toast.error(t('register.errors.codeExpired', { defaultValue: 'Verification code has expired, please resend' }))
      return
    }
    if (code.trim() !== payload.code) {
      toast.error(t('register.errors.codeInvalid', { defaultValue: 'Invalid verification code' }))
      return
    }

    try {
      setSubmitting(true)
      // 写入用户（演示，明文存储）
      const list = readUsers()
      list.push({ username: username.trim(), email: email.trim(), password })
      writeUsers(list)
      removeCode(email)

      // 预填邮箱并去登录页
      try {
        sessionStorage.setItem('prefill_email', email.trim())
      } catch {}
      toast.success(t('register.success', { defaultValue: 'Registration successful. Please sign in.' }))
      navigate('/login', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen font-sans relative overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100">
      {/* 背景点缀 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/20 via-sky-500/20 to-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-gradient-to-br from-cyan-500/20 via-emerald-500/20 to-teal-500/20 blur-3xl" />
      </div>

      <div className="relative flex items-center justify-center min-h-screen px-4">
        <section className="w-full max-w-md rounded-2xl border bg-white/70 backdrop-blur-md p-6 shadow-xl dark:bg-slate-900/70 dark:border-slate-800">
          {/* 标题 */}
          <div className="text-center mb-6">
            <div
              className="
                text-2xl md:text-3xl font-semibold tracking-tight
                bg-clip-text text-transparent
                bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600
                dark:from-indigo-400 dark:via-sky-400 dark:to-cyan-400
              "
            >
              {t('register.title', { defaultValue: 'Create your account' })}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t('register.subtitle', { defaultValue: 'Register with email verification' })}
            </div>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 邮箱 */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('register.fields.email', { defaultValue: 'Email' })}
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
              />
              {email && !isValidEmail(email) ? (
                <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                  {t('register.errors.invalidEmail', { defaultValue: 'Please enter a valid email' })}
                </div>
              ) : null}
              {emailTaken ? (
                <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                  {t('register.errors.emailTaken', { defaultValue: 'This email has already been registered' })}
                </div>
              ) : null}
            </div>

            {/* 用户名 */}
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('register.fields.username', { defaultValue: 'Username' })}
              </label>
              <input
                id="username"
                type="text"
                className={[
                  'mt-1 w-full rounded-md border bg-white/90 px-3 py-2 text-sm',
                  'outline-none focus:ring-2 focus:ring-indigo-500/40',
                  'dark:bg-slate-900/60 dark:border-slate-700',
                ].join(' ')}
                placeholder="yourname"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              {usernameTaken ? (
                <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                  {t('register.errors.usernameTaken', { defaultValue: 'This username is already taken' })}
                </div>
              ) : null}
            </div>

            {/* 密码 */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('register.fields.password', { defaultValue: 'Password' })}
              </label>
              <div className="relative mt-1">
                <input
                  id="reg_password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={[
                    'w-full rounded-md border bg-white/90 px-3 py-2 pr-10 text-sm',
                    'outline-none focus:ring-2 focus:ring-indigo-500/40',
                    'dark:bg-slate-900/60 dark:border-slate-700',
                  ].join(' ')}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
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
              {password && password.length < 6 ? (
                <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                  {t('register.errors.passwordLength', { defaultValue: 'Password must be at least 6 characters' })}
                </div>
              ) : (
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {t('register.hints.passwordRule', { defaultValue: 'At least 6 characters' })}
                </div>
              )}
            </div>

            {/* 确认密码 */}
            <div>
              <label htmlFor="confirm" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('register.fields.confirmPassword', { defaultValue: 'Confirm password' })}
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                className={[
                  'mt-1 w-full rounded-md border bg-white/90 px-3 py-2 text-sm',
                  'outline-none focus:ring-2 focus:ring-indigo-500/40',
                  'dark:bg-slate-900/60 dark:border-slate-700',
                ].join(' ')}
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              {confirm && confirm !== password ? (
                <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                  {t('register.errors.passwordMismatch', { defaultValue: 'Passwords do not match' })}
                </div>
              ) : null}
            </div>

            {/* 验证码 + 发送按钮 */}
            <div>
              <label htmlFor="code" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('register.fields.code', { defaultValue: 'Verification code' })}
              </label>
              <div className="relative mt-1">
                <input
                  id="code"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  className={[
                    'w-full rounded-md border bg-white/90 px-3 py-2 pr-28 text-sm',
                    'outline-none focus:ring-2 focus:ring-indigo-500/40',
                    'dark:bg-slate-900/60 dark:border-slate-700',
                  ].join(' ')}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D+/g, '').slice(0, 6))}
                />
                {/* 发送验证码按钮（绝对定位在右侧） */}
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sending || cooldown > 0 || !email || !isValidEmail(email) || emailTaken}
                  className={[
                    'absolute right-2 top-1/2 -translate-y-1/2 h-8 rounded-md px-3 text-xs font-medium',
                    'bg-slate-900 text-white hover:bg-slate-800',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white',
                  ].join(' ')}
                >
                  {cooldown > 0
                    ? t('register.actions.resendIn', { defaultValue: 'Resend in {{s}}s', s: cooldown })
                    : t('register.actions.sendCode', { defaultValue: 'Send code' })}
                </button>
              </div>
              {lastDemoCode ? (
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {t('register.hints.demoCode', {
                    defaultValue: 'A demo code has been sent (shown in the toast).',
                  })}{' '}
                  ({lastDemoCode})
                </div>
              ) : null}
            </div>

            {/* 提交 */}
            <Button
              type="submit"
              className="w-full h-11 rounded-full text-white font-medium bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-500 hover:from-indigo-500/90 hover:via-sky-500/90 hover:to-cyan-500/90 focus-visible:ring-2 focus-visible:ring-indigo-500/60"
              disabled={submitting}
            >
              {t('register.actions.register', { defaultValue: 'Register' })}
            </Button>

            {/* 返回登录 */}
            <div className="text-center text-sm mt-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600 hover:underline dark:from-indigo-400 dark:via-sky-400 dark:to-cyan-400"
              >
                {t('register.actions.backToLogin', { defaultValue: 'Back to sign in' })}
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* 本页 Toaster（/login 同样也有） */}
      <Toaster position="top-center" duration={2600} richColors />
    </div>
  )
}
