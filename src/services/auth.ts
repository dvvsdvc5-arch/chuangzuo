/**
 * services/auth.ts
 * 提供鉴权相关的前端封装：登录、注册（可选）、GA 探测等。
 * 要点：
 * - 登录成功后调用 saveToken() 持久化存储，供 apiClient 自动注入 Authorization。
 * - 导出 isGAEnabled 供 UI 判断是否展示 OTP 输入框（简单规则，本地模拟）。
 */

import { api, saveToken } from './apiClient'

/**
 * LoginParams
 * 登录入参（支持可选 otp）
 */
export interface LoginParams {
  email: string
  password: string
  otp?: string
}

/**
 * LoginResult
 * 登录结果
 */
export interface LoginResult {
  ok: boolean
  token?: string
  user?: any
  error?: string
  /** 是否需要 GA（本地模拟规则或后端返回） */
  gaRequired?: boolean
}

/**
 * isGAEnabled
 * 简单规则：邮箱中包含 "+ga" 或域名为 "ga.test" 时，认为需要 GA（仅用于 UI 提示）。
 */
export function isGAEnabled(email: string): boolean {
  try {
    if (!email) return false
    if (email.includes('+ga')) return true
    const domain = email.split('@')[1] || ''
    if (domain.toLowerCase() === 'ga.test') return true
  } catch {
    // ignore
  }
  return false
}

/**
 * login
 * 调用后端 /auth/login；成功后保存 token（localStorage），返回标准结构。
 */
export async function login(params: LoginParams): Promise<LoginResult> {
  try {
    const resp = await api.login(params)
    if (resp?.token) {
      // 持久化 token，供后续请求附带 Authorization
      saveToken(resp.token)
      return { ok: true, token: resp.token, user: resp.user, gaRequired: isGAEnabled(params.email) }
    }
    return { ok: false, error: 'No token received from server.' }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Login failed' }
  }
}

/**
 * register
 * 可选：注册后通常也会返回 token；若你的后端支持则可使用。
 */
export async function register(payload: { email: string; password: string; name: string }): Promise<LoginResult> {
  try {
    const resp = await api.register(payload)
    if (resp?.token) {
      saveToken(resp.token)
      return { ok: true, token: resp.token, user: resp.user }
    }
    return { ok: false, error: 'No token received from server.' }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Register failed' }
  }
}
