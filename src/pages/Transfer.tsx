/**
 * pages/Transfer.tsx
 * Internal transfer page using backend /transfer.
 */

import React, { useState } from 'react'
import { ArrowRightLeft, Send } from 'lucide-react'
import { submitTransfer } from '../services/transfer'

interface TransferForm {
  toAccountId: string
  amount: string
}

export default function TransferPage() {
  const [form, setForm] = useState<TransferForm>({ toAccountId: '', amount: '' })
  const [loading, setLoading] = useState(false)

  /** handleSubmit - call API */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const amountMinor = Math.round(Number(form.amount || 0) * 100)
      await submitTransfer({ toAccountId: form.toAccountId, amountMinor })
      setForm({ toAccountId: '', amount: '' })
      alert('Transfer submitted')
    } catch (err: any) {
      alert(err?.message || 'Transfer failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
        <div className="p-6 border-b flex items-center gap-3">
          <ArrowRightLeft className="w-5 h-5 text-teal-600" />
          <h1 className="text-lg font-semibold">Internal Transfer</h1>
        </div>
        <form className="p-6 grid gap-5" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm text-neutral-600 dark:text-neutral-300">To Account ID</label>
            <input
              required
              placeholder="Recipient account ID"
              value={form.toAccountId}
              onChange={(e) => setForm((s) => ({ ...s, toAccountId: e.target.value }))}
              className="mt-2 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-600 dark:text-neutral-300">Amount (USDT)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 50.00"
              value={form.amount}
              onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
              className="mt-2 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center items-center gap-2 rounded-lg bg-teal-600 text-white px-5 py-2.5 hover:bg-teal-700 active:scale-[.99] disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Submitting…' : 'Submit Transfer'}
          </button>
        </form>
      </div>
    </div>
  )
}
