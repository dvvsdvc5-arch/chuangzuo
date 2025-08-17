/**
 * services/apiClient.ts
 * 统一的后端 API 封装：
 * - 自动拼接 baseURL（支持 localStorage('api_base') 覆盖）
 * - 自动注入 Authorization: Bearer token（从 zustand 或 localStorage 读取）
 * - 提供健康检查、鉴权、用户、钱包、账单等方法
 */

export interface ApiClientOptions {
  baseURL?: string
}

/** Build baseURL: localStorage('api_base') -> options -> default http://localhost:8787 */
function resolveBaseURL(opts?: ApiClientOptions): string {
  try {
    const saved = localStorage.getItem('api_base')
    if (saved) return saved
  } catch {}
  return opts?.baseURL || 'http://localhost:8787'
}

/** Try to read token from authStore or localStorage */
function readToken(): string | null {
  try {
    // 允许从全局 window 暴露的 zustand 读取（若存在）
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
 * saveToken
 * 将 token 存至 localStorage，便于页面刷新后继续携带鉴权。
 * 注意：若你的 authStore 需要同步，可在登录逻辑中自行写入 store。
 */
export function saveToken(token: string) {
  try {
    localStorage.setItem('auth_token', token)
  } catch {}
}

/** fetchJson - unified GET/POST etc returning JSON with error handling */
async function fetchJson<T = any>(input: string, init?: RequestInit): Promise<T> {
  const token = readToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as any),
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const resp = await fetch(input, { ...init, headers })
  const text = await resp.text()
  const data = text ? JSON.parse(text) : null
  if (!resp.ok) {
    throw new Error(data?.error || `HTTP ${resp.status}`)
  }
  return data as T
}

/** ApiClient - small facade */
export class ApiClient {
  base: string
  constructor(opts?: ApiClientOptions) {
    this.base = resolveBaseURL(opts)
  }

  /** GET /health */
  health() {
    return fetchJson<{ ok: boolean; db: boolean; version: string }>(`${this.base}/health`)
  }

  // ---------- Auth ----------
  /** POST /auth/login */
  login(payload: { email: string; password: string; otp?: string }) {
    return fetchJson<{ token: string; user: any }>(`${this.base}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  /** POST /auth/register */
  register(payload: { email: string; password: string; name: string }) {
    return fetchJson<{ token: string; user: any }>(`${this.base}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  /** GET /auth/me */
  me() {
    return fetchJson<{ user: any }>(`${this.base}/auth/me`)
  }

  // ---------- User/Profile ----------
  /** GET /users/me */
  userMe() {
    return fetchJson<{ user: any }>(`${this.base}/users/me`)
  }

  /** PUT /users/me */
  updateMe(payload: { name?: string; phone?: string; avatarUrl?: string }) {
    return fetchJson<{ ok: boolean; user: any }>(`${this.base}/users/me`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  }

  // ---------- Wallet & Ledger ----------
  /** GET /wallet */
  wallet() {
    return fetchJson<{ wallet: any; assets: any }>(`${this.base}/wallet`)
  }

  /** GET /ledger?limit=50 */
  ledger(limit = 50) {
    const url = `${this.base}/ledger?limit=${encodeURIComponent(String(limit))}`
    return fetchJson<{ items: any[] }>(url)
  }

  // ---------- Deposits ----------
  /** GET /deposits */
  deposits() {
    return fetchJson<{ items: any[] }>(`${this.base}/deposits`)
  }

  // 充值提交与 KYC/图片上传等 multipart 在页面内单独封装会更灵活，此处略。

  // ---------- Withdrawals ----------
  /** GET /withdrawals */
  withdrawals() {
    return fetchJson<{ items: any[] }>(`${this.base}/withdrawals`)
  }

  // ---------- Exchange ----------
  /** GET /exchange/records */
  exchangeRecords() {
    return fetchJson<{ items: any[] }>(`${this.base}/exchange/records`)
  }

  // ---------- Notifications ----------
  /** GET /notifications */
  notifications() {
    return fetchJson<{ items: any[] }>(`${this.base}/notifications`)
  }
}

export const api = new ApiClient()
