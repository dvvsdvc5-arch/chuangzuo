/**
 * components/run/RunAddressBinder.tsx
 * 收益接收地址绑定卡片：未绑定时显示输入与“绑定”按钮，已绑定时展示地址与“编辑”。
 * 演示环境使用 localStorage 持久化。
 */

import React, { useMemo, useState } from 'react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

/**
 * RunAddressBinderProps
 * 绑定组件的参数。
 */
export interface RunAddressBinderProps {
  /** 发生变更后回调（返回当前地址或空） */
  onChange?: (addr: string | null) => void
  /** className */
  className?: string
}

/**
 * isLikelyAddress
 * 粗略校验地址格式（仅演示：长度与字符集）。
 */
function isLikelyAddress(s: string) {
  const v = s.trim()
  if (v.length < 20 || v.length > 80) return false
  return /^[a-zA-Z0-9:_-]+$/.test(v)
}

/**
 * RunAddressBinder
 * 地址绑定卡片组件。
 */
export default function RunAddressBinder({ onChange, className = '' }: RunAddressBinderProps) {
  const { t } = useTranslation()
  const stored = useMemo(() => localStorage.getItem('run_payout_address') || '', [])
  const [addr, setAddr] = useState<string>(stored)
  const [editing, setEditing] = useState<boolean>(!stored)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!isLikelyAddress(addr)) {
      toast.error(t('run.needAddress') || 'Please bind a receiving address before starting.')
      return
    }
    try {
      localStorage.setItem('run_payout_address', addr.trim())
    } catch {}
    setEditing(false)
    toast.success(t('run.boundSuccess') || 'Address saved')
    onChange?.(addr.trim())
  }

  function handleEdit() {
    setEditing(true)
    setTimeout(() => {
      // 让输入框更易编辑（可选）
    }, 0)
  }

  return (
    <section className={`rounded-xl border bg-white/70 backdrop-blur p-4 dark:bg-slate-900/70 dark:border-slate-800 ${className}`}>
      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('run.bindAddress')}</div>
      {editing ? (
        <form className="mt-3 space-y-2" onSubmit={handleSave}>
          <div className="space-y-1.5">
            <Label htmlFor="recvAddr">{t('run.address')}</Label>
            <Input
              id="recvAddr"
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              placeholder={t('run.addressPlaceholder') || 'Enter your USDT TRC20 / ERC20 address'}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('run.needAddress')}</p>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="bg-transparent" onClick={() => setEditing(false)}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit">{t('actions.save')}</Button>
          </div>
        </form>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="px-2 py-1 rounded bg-slate-100 text-slate-800 text-xs break-all dark:bg-slate-800 dark:text-slate-200">
            {addr}
          </code>
          <Button type="button" variant="outline" className="bg-transparent" onClick={handleEdit}>
            {t('run.edit')}
          </Button>
        </div>
      )}
    </section>
  )
}
