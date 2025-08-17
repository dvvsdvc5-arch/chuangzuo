/**
 * components/system/DataSyncBootstrapper.tsx
 * 在用户已登录（isAuthed）时，集中从后端拉取关键数据（user、wallet/assets、ledger），
 * 并以非侵入方式写入 Zustand（使用 setState），从而不需要修改各页面。
 * 该组件自身不渲染任何可见内容。
 *
 * 本版增强：
 * - 在 isAuthed=true 但 token 缺失时，认为是“登录态不一致”，自动登出并跳转登录；
 * - 捕获到 401/Unauthorized 时，自动登出 + 跳转登录，静默处理不刷控制台；
 * - 通过 bootedRef 防止重复初始化，避免无意义的重复请求。
 */

import React, { useEffect, useRef } from 'react'
import { api } from '../../services/apiClient'
import { useAuthStore } from '../../store/authStore'
import { useAppStore } from '../../store/appStore'

/**
 * upsertStore
 * 使用 setState 非侵入式写入 store，避免依赖具体的 action 函数命名。
 */
function upsertStore(partial: any) {
  try {
    const setState = (useAppStore as any).setState as (p: any) => void
    setState(partial)
  } catch {
    // ignore
  }
}

/**
 * isUnauthorized
 * 识别常见 401 错误信息。
 */
function isUnauthorized(err: unknown): boolean {
  const msg = String((err as any)?.message || err || '')
  return msg.includes('401') || /unauthorized/i.test(msg)
}

/**
 * readTokenSafe
 * 尝试从全局暴露的 zustand 或 localStorage 读取 token。仅用于前置判断，避免不必要的 401。
 */
function readTokenSafe(): string | null {
  try {
    const g: any = (window as any)
    if (g.useAuthStore?.getState) {
      const st = g.useAuthStore.getState()
      if (st?.token) return st.token as string
    }
  } catch {}
  try {
    const t = localStorage.getItem('auth_token')
    if (t) return t
  } catch {}
  return null
}

/**
 * DataSyncBootstrapper
 * 监听 isAuthed，触发一次性“初始化同步”；并在路由切换仍保持已加载数据。
 * 若遇到 401/Unauthorized 或者 token 缺失的不一致状态，自动登出并跳转登录。
 */
export default function DataSyncBootstrapper(): JSX.Element | null {
  const isAuthed = useAuthStore((s) => s.isAuthed)
  const logout = useAuthStore((s) => s.logout)
  const bootedRef = useRef(false)

  useEffect(() => {
    // 仅在 isAuthed=true 且尚未引导时执行
    if (!isAuthed || bootedRef.current) return

    // 若 token 缺失，视为登录态不一致：静默处理并跳转登录
    const token = readTokenSafe()
    if (!token) {
      try {
        sessionStorage.setItem('session_expired', '1')
      } catch {}
      try {
        logout()
      } finally {
        window.location.hash = '#/login'
        bootedRef.current = true
      }
      return
    }

    let alive = true
    async function bootstrap() {
      try {
        // 1) 当前用户
        const me = await api.me()
        if (!alive) return
        upsertStore({ user: me.user })

        // 2) 钱包与资产
        const w = await api.wallet()
        if (!alive) return
        upsertStore({ wallet: w.wallet, assets: w.assets })

        // 3) 最近账单（默认 50）
        const led = await api.ledger(50)
        if (!alive) return
        upsertStore({ ledger: led.items || [] })
      } catch (err) {
        // 401：会话失效 —— 自动登出并跳转到登录页（静默处理）
        if (isUnauthorized(err)) {
          try {
            sessionStorage.setItem('session_expired', '1')
          } catch {}
          try {
            logout()
          } finally {
            window.location.hash = '#/login'
          }
          return
        }
        // 其他错误静默，避免打扰用户
      } finally {
        bootedRef.current = true
      }
    }

    bootstrap()
    return () => {
      alive = false
    }
  }, [isAuthed, logout])

  return null
}
