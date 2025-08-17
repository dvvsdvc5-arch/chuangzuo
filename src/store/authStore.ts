/**
 * store/authStore.ts
 * Minimal auth state for guarding routes and tracking current user session.
 */

import { create } from 'zustand'
import { login as svcLogin, isGAEnabled } from '../services/auth'

/** AuthState
 * Tracks authentication state and binds helper actions.
 */
interface AuthState {
  /** Whether user is authenticated */
  isAuthed: boolean
  /** Current user email */
  email?: string
  /** Whether current email is GA-bound (for UI hints) */
  gaBound: boolean
  /** Current auth token (persisted for API requests) */
  token?: string
  /** Attempt login via auth service */
  login: (params: { email: string; password: string; otp?: string }) => Promise<{ ok: boolean; error?: string }>
  /** Logout and clear state */
  logout: () => void
  /** Probe GA binding status for an email (UI reacts to it) */
  probeGA: (email: string) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthed: false,
  email: undefined,
  gaBound: false,
  token: undefined,
  /**
   * login
   * 调用 auth 服务，成功后写入 isAuthed/email/gaBound/token。
   * 同时在 window 暴露 useAuthStore（可被 ApiClient 的 readToken 快路径使用）。
   */
  async login({ email, password, otp }) {
    const res = await svcLogin({ email, password, otp })
    if (res.ok) {
      set({
        isAuthed: true,
        email,
        gaBound: res.gaRequired ?? isGAEnabled(email),
        token: res.token,
      })
      try {
        ;(window as any).useAuthStore = useAuthStore
      } catch {}
      return { ok: true }
    }
    return { ok: false, error: res.error || 'Login failed' }
  },
  /**
   * logout
   * 清空内存态并移除持久化 token；设置 just_logged_out 以便登录页友好提示。
   */
  logout() {
    set({ isAuthed: false, email: undefined, gaBound: false, token: undefined })
    try {
      localStorage.removeItem('auth_token')
      sessionStorage.setItem('just_logged_out', '1')
    } catch {}
  },
  /**
   * probeGA
   * 探测当前邮箱是否需要 GA（UI 动态显示 OTP 输入框）
   */
  probeGA(email: string) {
    const bound = isGAEnabled(email)
    set({ gaBound: bound, email })
    return bound
  },
}))
