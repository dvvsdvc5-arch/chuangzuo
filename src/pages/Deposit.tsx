/**
 * pages/Deposit.tsx
 * Deposit submission page with optional proof image upload.
 * - Submits to backend /deposits via services/deposits
 */

import React, { useState } from 'react'
import { Upload, CreditCard, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router'
import { createDeposit } from '../services/deposits'

/** Local form model */
interface DepositForm {
  network: string
  address: string
  txHash?: string
  amount: string
  proof?: File | null
}

/** DepositPage - submit a deposit with simple, clean UI */
export default function DepositPage() {
  const [form, setForm] = useState<DepositForm>({ network: 'TRC20', address: '', txHash: '', amount: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  /** handleSubmit - post to API and navigate to records */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const amountMinor = form.amount ? Math.round(Number(form.amount) * 100) : undefined
      await createDeposit({
        network: form.network,
        address: form.address,
        txHash: form.txHash || undefined,
        amountMinor,
        proof: form.proof || undefined,
      })
      // 成功后跳转充值记录
      navigate('/deposit-records')
    } catch (err: any) {
      alert(err?.message || 'Deposit failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <div className="rounded-2xl border bg-white dark:bg-neutral-900 shadow-sm">
        <div className="p-6 border-b flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          <h1 className="text-lg font-semibold">Deposit</h1>
        </div>
        <form className="p-6 grid gap-5" onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-neutral-600 dark:text-neutral-300">Network</label>
              <select
                value={form.network}
                onChange={(e) => setForm((s) => ({ ...s, network: e.target.value }))}
                className="mt-2 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
                required
              >
                <option value="TRC20">TRC20 (USDT)</option>
                <option value="ERC20">ERC20 (USDT)</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-600 dark:text-neutral-300">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 100.00"
                value={form.amount}
                onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
                className="mt-2 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-neutral-600 dark:text-neutral-300">From Address</label>
              <input
                required
                placeholder="Your wallet address"
                value={form.address}
                onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                className="mt-2 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-600 dark:text-neutral-300">Tx Hash (optional)</label>
              <input
                placeholder="Transaction hash"
                value={form.txHash}
                onChange={(e) => setForm((s) => ({ ...s, txHash: e.target.value }))}
                className="mt-2 w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-neutral-600 dark:text-neutral-300">Upload Proof (optional)</label>
            <div className="mt-2 flex items-center gap-3">
              <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700">
                <Upload className="w-4 h-4" />
                <span className="text-sm">Choose Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setForm((s) => ({ ...s, proof: e.target.files?.[0] || null }))}
                />
              </label>
              {form.proof && <span className="text-xs text-neutral-500">{form.proof.name}</span>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center items-center gap-2 rounded-lg bg-emerald-600 text-white px-5 py-2.5 hover:bg-emerald-700 active:scale-[.99] disabled:opacity-60"
          >
            {loading ? 'Submitting…' : 'Submit Deposit'}
          </button>

          <div className="pt-2 flex items-start gap-2 text-xs text-neutral-500">
            <ShieldCheck className="w-4 h-4 mt-[2px]" />
            <p>We will review your deposit promptly. Proof is recommended for fastest approval.</p>
          </div>
        </form>
      </div>

      <div className="mt-6 rounded-xl overflow-hidden h-40">
        <img src="https://pub-cdn.sider.ai/u/U05XH90O53X/web-coder/689bf295a616cfbf067042a3/resource/c6bf1dd1-d299-445e-829d-a7f10e67f087.jpg" className="object-cover w-full h-full" />
      </div>
    </div>
  )
}
