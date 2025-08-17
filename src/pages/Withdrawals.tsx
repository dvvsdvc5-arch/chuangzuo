/**
 * pages/Withdrawals.tsx
 * Submit a withdrawal request to backend /withdrawals.
 */

import React, { useState } from 'react'
import { Send, Wallet } from 'lucide-react'
import { createWithdrawal } from '../services/withdrawals'
import { useNavigate } from 'react-router'

interface WithdrawalForm {
  network: string
  address: string
  symbol: 'USDT' | 'BTC' | 'ETH'
  amount: string
}

export default function WithdrawalsPage() {
  const [form, setForm] = useState<WithdrawalForm>({ network: 'TRC20', address: '', symbol: 'USDT', amount: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  /** handleSubmit - call API and go to records page */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const amount = Number(form.amount || 0)
      const payload =
        form.symbol === 'USDT'
          ? { network: form.network, address: form.address, symbol: form.symbol as const, amountMinor: Math.round(amount * 100) }
          : { network: form.network, address: form.address, symbol: form.symbol as const, amountCrypto: amount }
      await createWithdrawal(payload as any)
      navigate('/withdrawal-records')
    } catch (err: any) {
      alert(err?.message || 'Withdrawal failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <div className="rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
        <div className="p-6 border-b flex items-center gap-3">
          <Send className="w-5 h-5 text-rose-600" />
          <h1 className="text-lg font-semibold">Withdraw</h1>
        </div>
        <form className="p-6 grid gap-5" onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-neutral-600 dark:text-neutral-300">Currency</label>
              <select
                value={form.symbol}
                onChange={(e) => setForm((s) => ({ ...s, symbol: e.target.value as any }))}
                className="mt-2 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
                required
              >
                <option value="USDT">USDT</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-600 dark:text-neutral-300">Network</label>
              <select
                value={form.network}
                onChange={(e) => setForm((s) => ({ ...s, network: e.target.value }))}
                className="mt-2 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
                required
              >
                <option value="TRC20">TRC20</option>
                <option value="ERC20">ERC20</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-neutral-600 dark:text-neutral-300">To Address</label>
            <input
              required
              placeholder="Recipient wallet address"
              value={form.address}
              onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
              className="mt-2 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
            />
          </div>

          <div>
            <label className="text-sm text-neutral-600 dark:text-neutral-300">
              Amount {form.symbol === 'USDT' ? '(USD)' : `(${form.symbol})`}
            </label>
            <input
              type="number"
              min="0"
              step="0.00000001"
              placeholder={form.symbol === 'USDT' ? 'e.g. 100.00' : 'e.g. 0.01'}
              value={form.amount}
              onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
              className="mt-2 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center items-center gap-2 rounded-lg bg-rose-600 text-white px-5 py-2.5 hover:bg-rose-700 active:scale-[.99] disabled:opacity-60"
          >
            <Wallet className="w-4 h-4" />
            {loading ? 'Submitting…' : 'Submit Withdrawal'}
          </button>
        </form>
      </div>
    </div>
  )
}
