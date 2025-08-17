/**
 * services/rates.ts
 * Lightweight market rate fetcher with fallbacks and tiny caching.
 * Primary: Binance. Fallback: Coingecko. Final fallback: static values.
 */

export interface MarketRates {
  BTC_USDT: number
  ETH_USDT: number
  updatedAt: number
}

/**
 * fetchFromBinance
 * Load BTCUSDT/ETHUSDT last price.
 */
async function fetchFromBinance(): Promise<MarketRates> {
  const [btcRes, ethRes] = await Promise.all([
    fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'),
    fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT'),
  ])
  if (!btcRes.ok || !ethRes.ok) throw new Error('binance-failed')
  const btcJson = (await btcRes.json()) as { price: string }
  const ethJson = (await ethRes.json()) as { price: string }
  const BTC_USDT = parseFloat(btcJson.price)
  const ETH_USDT = parseFloat(ethJson.price)
  if (!isFinite(BTC_USDT) || !isFinite(ETH_USDT)) throw new Error('binance-bad')
  const updatedAt = Date.now()
  return { BTC_USDT, ETH_USDT, updatedAt }
}

/**
 * fetchFromCoingecko
 * Load simple price data for BTC/ETH in USDT.
 */
async function fetchFromCoingecko(): Promise<MarketRates> {
  const url =
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usdt'
  const res = await fetch(url, { headers: { 'x-cg-pro-api-key': '' } })
  if (!res.ok) throw new Error('coingecko-failed')
  const data = (await res.json()) as any
  const BTC_USDT = Number(data?.bitcoin?.usdt)
  const ETH_USDT = Number(data?.ethereum?.usdt)
  if (!isFinite(BTC_USDT) || !isFinite(ETH_USDT)) throw new Error('coingecko-bad')
  return { BTC_USDT, ETH_USDT, updatedAt: Date.now() }
}

/**
 * fetchMarketRates
 * Try Binance -> Coingecko -> Static fallback, cache in-memory by minute.
 */
let cache: MarketRates | null = null
let cacheTs = 0

export async function fetchMarketRates(): Promise<MarketRates> {
  const now = Date.now()
  // cache 15s
  if (cache && now - cacheTs < 15_000) return cache
  try {
    cache = await fetchFromBinance()
  } catch {
    try {
      cache = await fetchFromCoingecko()
    } catch {
      // Final fallback to a static snapshot
      cache = { BTC_USDT: 60000, ETH_USDT: 3000, updatedAt: Date.now() }
    }
  }
  cacheTs = Date.now()
  return cache
}
