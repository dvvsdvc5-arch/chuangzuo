/**
 * http.ts
 * Lightweight HTTP helpers for API requests with base URL + Authorization.
 */

export interface ApiError {
  error: string
}

/**
 * getApiBase
 * Resolve API base URL from localStorage('api_base') or default localhost:8787.
 */
export function getApiBase(): string {
  const saved = typeof window !== 'undefined' ? localStorage.getItem('api_base') : null
  return saved || 'http://localhost:8787'
}

/**
 * getAuthToken
 * Read auth token from localStorage('auth_token')
 */
export function getAuthToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
}

/**
 * buildHeaders
 * Build default headers with JSON and optional Authorization.
 */
function buildHeaders(extra?: Record<string, string>): Headers {
  const h = new Headers({
    'Content-Type': 'application/json',
    ...extra,
  })
  const token = getAuthToken()
  if (token) h.set('Authorization', `Bearer ${token}`)
  return h
}

/**
 * apiGet
 * GET request returning JSON typed as T.
 */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    method: 'GET',
    headers: buildHeaders(),
  })
  if (!res.ok) {
    const err = (await safeJson(res)) as ApiError | undefined
    throw new Error(err?.error || `GET ${path} failed (${res.status})`)
  }
  return (await res.json()) as T
}

/**
 * apiPost
 * POST request with JSON body returning JSON typed as T.
 */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body ?? {}),
  })
  if (!res.ok) {
    const err = (await safeJson(res)) as ApiError | undefined
    throw new Error(err?.error || `POST ${path} failed (${res.status})`)
  }
  return (await res.json()) as T
}

/**
 * apiPostForm
 * POST multipart/form-data request returning JSON typed as T.
 */
export async function apiPostForm<T>(path: string, form: FormData): Promise<T> {
  const headers = new Headers()
  const token = getAuthToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(`${getApiBase()}${path}`, {
    method: 'POST',
    headers,
    body: form,
  })
  if (!res.ok) {
    const err = (await safeJson(res)) as ApiError | undefined
    throw new Error(err?.error || `POST ${path} failed (${res.status})`)
  }
  return (await res.json()) as T
}

/**
 * safeJson
 * Try parse JSON; ignore if fail.
 */
async function safeJson(res: Response): Promise<any | undefined> {
  try {
    return await res.json()
  } catch {
    return undefined
  }
}
