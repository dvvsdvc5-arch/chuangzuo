/**
 * services/platforms.ts
 * 提供 Run 页使用的平台列表来源。
 * 优先读取本地配置（localStorage/window），否则回落到默认三家（Binance/OKX/Bybit）。
 */

export type RunPlatform = 'Binance' | 'OKX' | 'Bybit'

/**
 * normalizePlatforms
 * 将外部来源的任意字符串数组标准化为受支持的平台名列表，并去重。
 */
function normalizePlatforms(arr: unknown): RunPlatform[] {
  const sup: RunPlatform[] = ['Binance', 'OKX', 'Bybit']
  if (!Array.isArray(arr)) return sup
  const set = new Set<string>()
  for (const v of arr) {
    if (typeof v !== 'string') continue
    const name = v.trim()
    if (sup.includes(name as RunPlatform)) set.add(name)
  }
  const list = Array.from(set) as RunPlatform[]
  return list.length ? list : sup
}

/**
 * getRunPlatforms
 * 读取平台列表（window.__runPlatforms 或 localStorage.run_platforms），回落到默认。
 */
export function getRunPlatforms(): RunPlatform[] {
  try {
    // @ts-ignore
    const winList = typeof window !== 'undefined' ? (window.__runPlatforms as unknown) : undefined
    if (winList) return normalizePlatforms(winList)
  } catch {}
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('run_platforms')
      if (raw) {
        const arr = JSON.parse(raw)
        return normalizePlatforms(arr)
      }
    }
  } catch {}
  return ['Binance', 'OKX', 'Bybit']
}
