/**
 * pages/Network.tsx
 * 网络工具页：在站内设置 API Base、查看/清理 Token，测试 /health 与 /auth/me。
 * 适用于无法打开浏览器控制台的环境。
 */

import React, { useEffect, useMemo, useState } from 'react'
import { Server, Link as LinkIcon, ShieldCheck, Trash2, RefreshCw, LogIn } from 'lucide-react'
import { Button } from '../components/ui/button'
import { api } from '../services/apiClient'
import { useAuthStore } from '../store/authStore'

/** 简单类型：测试结果 */
interface TestResult {
  ok: boolean
  message: string
  data?: any
}

/**
 * safeGet
 * 从 localStorage 读取 key，遇异常返回 undefined。
 */
function safeGet(key: string): string | undefined {
  try {
    const v = localStorage.getItem(key)
    return v ?? undefined
  } catch {
    return undefined
  }
}

/**
 * safeSet
 * 写入 localStorage；失败静默
 */
function safeSet(key: string, val: string) {
  try {
    localStorage.setItem(key, val)
  } catch {}
}

/**
 * safeRemove
 * 移除 localStorage；失败静默
 */
function safeRemove(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {}
}

/**
 * NetworkToolsPage
 * 站内网络调试工具。
 */
export default function NetworkToolsPage(): JSX.Element {
  const [base, setBase] = useState<string>('')
  const [token, setToken] = useState<string | undefined>(undefined)
  const [health, setHealth] = useState<TestResult | null>(null)
  const [me, setMe] = useState<TestResult | null>(null)
  const logout = useAuthStore((s) => s.logout)

  /** 初始化：读取当前 base 与 token */
  useEffect(() => {
    const fromLS = safeGet('api_base')
    const currentBase = fromLS || api.base || 'http://localhost:8787'
    setBase(currentBase)

    const t = safeGet('auth_token')
    setToken(t)
  }, [])

  /** 掩码显示 token，避免泄露 */
  const maskedToken = useMemo(() => {
    if (!token) return '(no token)'
    if (token.length <= 12) return token
    return `${token.slice(0, 6)}...${token.slice(-6)}`
  }, [token])

  /** 保存 base：立即写入 localStorage，并更新全局 api.base（无需刷新） */
  function handleSaveBase() {
    if (!base || !/^https?:\/\//i.test(base)) {
      alert('Please enter a valid URL, e.g. http://localhost:8787')
      return
    }
    safeSet('api_base', base)
    try {
      // 更新全局 ApiClient 的 base，后续请求立即生效
      ;(api as any).base = base
    } catch {}
    setHealth(null)
    setMe(null)
    alert('API Base saved. You can test endpoints below.')
  }

  /** 清理 token：移除持久化，并触发应用内退出 */
  function handleClearToken() {
    safeRemove('auth_token')
    setToken(undefined)
    // 触发应用内注销并返回登录
    try {
      logout()
    } catch {}
    alert('Token cleared. You have been logged out.')
  }

  /** 手动刷新 token 状态显示 */
  function handleRefreshTokenState() {
    setToken(safeGet('auth_token'))
  }

  /** 测试 /health */
  async function handleTestHealth() {
    setHealth(null)
    setMe(null)
    try {
      const data = await api.health()
      setHealth({ ok: true, message: 'OK', data })
    } catch (e: any) {
      setHealth({ ok: false, message: e?.message || 'Failed', data: null })
    }
  }

  /** 测试 /auth/me */
  async function handleTestMe() {
    setMe(null)
    try {
      const data = await api.me()
      setMe({ ok: true, message: 'OK', data })
    } catch (e: any) {
      setMe({ ok: false, message: e?.message || 'Failed', data: null })
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 顶部说明 */}
      <section className="rounded-xl border bg-white p-4 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-lg font-semibold">Network Tools</h1>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Configure API Base, check token, and test /health and /auth/me without opening the browser console.
        </p>
      </section>

      {/* API Base 设置 */}
      <section className="rounded-xl border bg-white p-4 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <LinkIcon className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <h2 className="text-sm font-medium">API Base</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            aria-label="API Base"
            className="flex-1 rounded-md border px-3 py-2 text-sm bg-white dark:bg-slate-950 dark:border-slate-800"
            placeholder="http://localhost:8787"
            value={base}
            onChange={(e) => setBase(e.target.value)}
          />
          <Button variant="outline" className="bg-transparent" onClick={handleSaveBase}>
            Save
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Current base is stored in localStorage("api_base") and applied immediately to ApiClient.
        </p>
      </section>

      {/* Token 区域 */}
      <section className="rounded-xl border bg-white p-4 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-sm font-medium">Auth Token</h2>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm">
            <div className="text-slate-500 dark:text-slate-400">localStorage("auth_token")</div>
            <div className="font-mono mt-1">{maskedToken}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="bg-transparent" onClick={handleRefreshTokenState}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button variant="outline" className="bg-transparent" onClick={handleClearToken}>
              <Trash2 className="mr-2 h-4 w-4" /> Clear Token & Logout
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          After clearing, you will be redirected to the login page. Login again to obtain a fresh token.
        </p>
      </section>

      {/* 测试按钮 */}
      <section className="rounded-xl border bg-white p-4 dark:bg-slate-900 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleTestHealth}>
            <RefreshCw className="mr-2 h-4 w-4" /> Test /health
          </Button>
          <Button variant="outline" className="bg-transparent" onClick={handleTestMe}>
            <ShieldCheck className="mr-2 h-4 w-4" /> Test /auth/me
          </Button>
          <a href="#/login">
            <Button variant="outline" className="bg-transparent">
              <LogIn className="mr-2 h-4 w-4" /> Go to Login
            </Button>
          </a>
        </div>

        {/* 结果展示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-md border p-3 dark:border-slate-800">
            <div className="text-sm font-medium mb-2">/health</div>
            {!health ? (
              <div className="text-xs text-slate-500">No result.</div>
            ) : health.ok ? (
              <pre className="text-xs overflow-auto">{JSON.stringify(health.data, null, 2)}</pre>
            ) : (
              <div className="text-xs text-rose-600">Failed: {health.message}</div>
            )}
          </div>
          <div className="rounded-md border p-3 dark:border-slate-800">
            <div className="text-sm font-medium mb-2">/auth/me</div>
            {!me ? (
              <div className="text-xs text-slate-500">No result.</div>
            ) : me.ok ? (
              <pre className="text-xs overflow-auto">{JSON.stringify(me.data, null, 2)}</pre>
            ) : (
              <div className="text-xs text-rose-600">Failed: {me.message}</div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
