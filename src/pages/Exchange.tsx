/**
 * pages/Exchange.tsx
 * Submit exchange orders and view quick helper.
 */

import React, { useState } from 'react'
import { ArrowLeftRight, Coins } from 'lucide-react'
import { submitExchange, ExchangeDirection, ExchangeSymbol } from '../services/exchange'

/**
 * ExchangeForm
 * Local UI state for the exchange form.
 */
interface ExchangeForm {
  direction: ExchangeDirection
  symbol: ExchangeSymbol
  price: string
  amount: string
}

/**
 * ExchangePage
 * Exchange form with minimal validation and server submission.
 */
export default function ExchangePage() {
  const [form, setForm] = useState<ExchangeForm>({ direction: 'USDT_TO_CRYPTO', symbol: 'BTC', price: '65000', amount: '' })
  const [loading, setLoading] = useState(false)

  /** handleSubmit - create exchange record */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const price = Number(form.price || 0)
      const amount = Number(form.amount || 0)
      const payload =
        form.direction === 'USDT_TO_CRYPTO'
          ? { direction: form.direction, symbol: form.symbol, priceUsdtPerCrypto: price, amountUsdtMinor: Math.round(amount * 100) }
          : { direction: form.direction, symbol: form.symbol, priceUsdtPerCrypto: price, amountCrypto: amount }
      await submitExchange(payload as any)
      setForm((s) => ({ ...s, amount: '' }))
      alert('Exchange submitted')
    } catch (err: any) {
      alert(err?.message || 'Exchange failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <div className="rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
        <div className="p-6 border-b flex items-center gap-3">
          <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
          <h1 className="text-lg font-semibold">Exchange</h1>
        </div>
        <form className="p-6 grid gap-5" onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-neutral-600 dark:text-neutral-300">Direction</label>
              <select
                value={form.direction}
                onChange={(e) => setForm((s) => ({ ...s, direction: e.target.value as ExchangeDirection }))}
                className="mt-2 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
              >
                <option value="USDT_TO_CRYPTO">USDT → CRYPTO</option>
                <option value="CRYPTO_TO_USDT">CRYPTO → USDT</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-600 dark:text-neutral-300">Symbol</label>
              <select
                value={form.symbol}
                onChange={(e) => setForm((s) => ({ ...s, symbol: e.target.value as ExchangeSymbol }))}
                className="mt-2 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
              >
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-neutral-600 dark:text-neutral-300">Price (USDT per 1 unit)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
                className="mt-2 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-600 dark:text-neutral-300">
                Amount {form.direction === 'USDT_TO_CRYPTO' ? '(USDT)' : `(${form.symbol})`}
              </label>
              <input
                type="number"
                min="0"
                step="0.00000001"
                placeholder={form.direction === 'USDT_TO_CRYPTO' ? 'e.g. 100.00' : 'e.g. 0.01'}
                value={form.amount}
                onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
                className="mt-2 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center items-center gap-2 rounded-lg bg-indigo-600 text-white px-5 py-2.5 hover:bg-indigo-700 active:scale-[.99] disabled:opacity-60"
          >
            <Coins className="w-4 h-4" />
            {loading ? 'Submitting…' : 'Submit Exchange'}
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-xl overflow-hidden h-40">
        <img src="https://pub-cdn.sider.ai/u/U05XH90O53X/web-coder/689bf295a616cfbf067042a3/resource/bbca00d7-c97b-4b4d-b11f-729364744ebb.jpg" className="object-cover w-full h-full" />
      </div>
    </div>
  )
}
