/**
 * pages/GASetup.tsx
 * Google Authenticator 绑定页：展示二维码占位、密钥复制、输入 6 位验证码并完成绑定（本地模拟）。
 * 成功后写入 localStorage('pref_2fa'='on') 并返回上一页，同时使用 Toaster 提示。
 */

import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { toast } from 'sonner'

/**
 * GASetupPage
 * 绑定流程（模拟）：展示密钥、二维码占位、输入 6 位验证码并提交。
 */
export default function GASetupPage(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation()

  // 说明：演示使用固定密钥；正式环境应来自后端接口
  const SECRET = useMemo(() => 'JBSWY3DPEHPK3PXP', [])
  const [code, setCode] = useState('')

  /**
   * handleCopy
   * 复制密钥到剪贴板，失败时给出提示。
   */
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(SECRET)
      toast.success(t('toast.copySuccess'))
    } catch {
      toast.error(t('toast.copyError'))
    }
  }

  /**
   * handleBind
   * 简单校验 6 位数字，成功则标记为已绑定并返回。
   */
  function handleBind(e: React.FormEvent) {
    e.preventDefault()
    const ok = /^[0-9]{6}$/.test(code)
    if (!ok) {
      toast.error(t('settings.ga.invalid'))
      return
    }
    try {
      localStorage.setItem('pref_2fa', 'on')
    } catch {}
    toast.success(t('settings.ga.on'))
    navigate(-1)
  }

  return (
    <div className="max-w-3xl">
      <section className="rounded-xl border bg-white/70 backdrop-blur p-5 md:p-6 dark:bg-slate-900/70 dark:border-slate-800">
        {/* 标题与说明由顶部栏与下方简要文案组成 */}
        <p className="text-sm text-slate-600 mb-4 dark:text-slate-400">
          {t('settings.ga.desc')}
        </p>

        {/* 两列自适应布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 左侧：二维码与密钥 */}
          <div className="space-y-4">
            <div className="rounded-lg border bg-white/70 p-4 dark:bg-slate-900/60 dark:border-slate-800">
              <div className="text-sm font-medium mb-2">{t('settings.ga.step1')}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t('settings.ga.step2')}
              </div>
              <div className="mt-3 flex items-center justify-center">
                {/* 智能占位二维码图（演示） */}
                <div className="h-44 w-44 rounded-md overflow-hidden border shadow-sm dark:border-slate-800">
                  <img src="https://pub-cdn.sider.ai/u/U05XH90O53X/web-coder/689bf295a616cfbf067042a3/resource/1683895c-04ca-443b-8d4a-e5562af624de.jpg" className="object-cover" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white/70 p-4 dark:bg-slate-900/60 dark:border-slate-800">
              <div className="text-sm font-medium mb-2">{t('settings.ga.secret')}</div>
              <div className="flex items-center gap-2">
                <code className="px-2 py-1 rounded bg-slate-100 text-slate-800 text-xs break-all dark:bg-slate-800 dark:text-slate-200">
                  {SECRET}
                </code>
                {/* outline 按钮需带 bg-transparent */}
                <Button variant="outline" className="bg-transparent" onClick={handleCopy}>
                  {t('actions.copy')}
                </Button>
              </div>
            </div>
          </div>

          {/* 右侧：输入验证码并绑定 */}
          <form className="space-y-4" onSubmit={handleBind}>
            <div>
              <div className="text-sm font-medium mb-2">{t('settings.ga.step3')}</div>
              <div className="space-y-2">
                <Label htmlFor="gaCode">OTP</Label>
                <Input
                  id="gaCode"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D+/g, '').slice(0, 6))}
                  placeholder="000000"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('settings.ga.desc')}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="bg-transparent" onClick={() => navigate(-1)}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit">
                {t('settings.ga.bind')}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
