/**
 * services/support.ts
 * 提供客服支持链接（仅 Telegram）获取能力，后端可配置，亦支持本地覆盖。
 */

export interface SupportInfo {
  /** Telegram 联系链接，例如 https://t.me/your_channel 或 https://t.me/your_bot */
  telegram?: string
}

/**
 * sanitizeTelegram
 * 简单校验并清洗 Telegram 链接，确保是以 https://t.me/ 开头的外链。
 */
function sanitizeTelegram(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined
  const v = url.trim()
  if (!v) return undefined
  // 允许 https://t.me/xxx 或 https://t.me/xxx?start=yyy 这类链接
  if (/^https:\/\/t\.me\/[A-Za-z0-9_/?=+-]+$/i.test(v)) return v
  return undefined
}

/**
 * fetchSupportInfo
 * 从后端拉取 Telegram 联系方式；允许通过 localStorage('pref_support_telegram') 覆盖；
 * 最终若为空则返回安全默认值（示例频道）。
 */
export async function fetchSupportInfo(): Promise<SupportInfo> {
  // 本地覆盖优先
  try {
    const local = localStorage.getItem('pref_support_telegram')
    const sLocal = sanitizeTelegram(local ?? '')
    if (sLocal) return { telegram: sLocal }
  } catch {
    // 忽略存取异常
  }

  // 后端配置
  try {
    const res = await fetch('/api/support', { method: 'GET' })
    if (res.ok) {
      const json = (await res.json()) as any
      const tg = sanitizeTelegram(json?.telegram)
      if (tg) return { telegram: tg }
    }
  } catch {
    // 忽略网络/解析错误，走兜底
  }

  // 兜底默认
  return { telegram: 'https://t.me/ccrc_support' }
}
