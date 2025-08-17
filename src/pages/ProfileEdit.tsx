/**
 * pages/ProfileEdit.tsx
 * 资料编辑页：头像（居中大尺寸）+ 昵称可改 + 邮箱只读展示 + 手机号可编辑（小图标触发）。
 * 保存后更新全局用户信息（Zustand），并使用 localStorage 兜底持久化。
 * Dark mode：卡片与控件适配深色配色。
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAppStore } from '../store/appStore'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useTranslation } from 'react-i18next'
import { Pencil } from 'lucide-react'

/**
 * toDataUrl
 * 将文件读取为 dataURL，限制类型为图片，大小默认 2MB。
 */
async function toDataUrl(file: File, maxSizeMB = 2): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('not-image')
  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > maxSizeMB) throw new Error('too-large')
  const reader = new FileReader()
  return await new Promise((resolve, reject) => {
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * ProfileEditPage
 * 头像居中放大；展示邮箱（只读）；手机号旁小图标切换编辑态；保存后写回全局。
 */
export default function ProfileEditPage(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const storeUser = useAppStore((s) => s.user)

  const fileRef = useRef<HTMLInputElement | null>(null)
  const phoneRef = useRef<HTMLInputElement | null>(null)

  // 初始值来自全局 store 与本地存储（兜底）
  const [name, setName] = useState<string>(storeUser?.name || '')
  const [preview, setPreview] = useState<string | null>(
    (storeUser as any)?.avatarUrl || localStorage.getItem('profile_avatar') || null,
  )
  const [phone, setPhone] = useState<string>(
    () => ((storeUser as any)?.phone as string) || localStorage.getItem('profile_phone') || '',
  )
  const [phoneEditing, setPhoneEditing] = useState<boolean>(false)

  const nameValid = useMemo(() => name.trim().length >= 1, [name])

  useEffect(() => {
    // 若进入编辑态，自动聚焦手机号输入框
    if (phoneEditing) {
      requestAnimationFrame(() => phoneRef.current?.focus())
    }
  }, [phoneEditing])

  /**
   * handlePick
   * 触发文件选择
   */
  function handlePick() {
    fileRef.current?.click()
  }

  /**
   * handleFile
   * 处理文件选择并预览
   */
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await toDataUrl(file, 2)
      setPreview(url)
    } catch (err: any) {
      if (err?.message === 'too-large') {
        window.alert(t('settings.profileEdit.errors.tooLarge') || 'Image is too large.')
      } else {
        window.alert(t('settings.profileEdit.errors.notImage') || 'Please upload an image file.')
      }
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  /**
   * handleRemove
   * 清除头像，恢复为首字母占位
   */
  function handleRemove() {
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  /**
   * handleTogglePhoneEdit
   * 切换手机号编辑状态
   */
  function handleTogglePhoneEdit() {
    setPhoneEditing((v) => !v)
  }

  /**
   * handleSave
   * 持久化到全局 store（Zustand）与 localStorage（兜底），然后返回上一页
   */
  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const setState = (useAppStore as any).setState as (p: any) => void
    const getState = (useAppStore as any).getState as () => any
    const current = getState()?.user || {}
    const next = {
      ...current,
      name: name.trim() || current.name,
      avatarUrl: preview || undefined,
      phone: phone?.trim?.() || '',
    }
    setState({ user: next })
    try {
      localStorage.setItem('profile_name', next.name || '')
      localStorage.setItem('profile_avatar', preview || '')
      localStorage.setItem('profile_phone', next.phone || '')
    } catch {}
    // 使用已有成功文案，避免新增 key
    window.alert(t('settings.changePassword.success') || 'Saved')
    navigate(-1)
  }

  // 头像首字母占位
  const initialChar = (name?.trim?.()[0] || storeUser?.name?.[0] || 'U').toUpperCase()

  return (
    <div className="space-y-4 max-w-xl">
      {/* 表单卡片（移除了页面内标题区，标题由顶部 Header 居中显示） */}
      <form
        onSubmit={handleSave}
        className="rounded-xl border bg-white/70 backdrop-blur p-5 space-y-5 dark:bg-slate-900/70 dark:border-slate-800"
      >
        {/* 头像：居中放大（按需移除标签） */}
        <div className="flex flex-col items-center gap-3">
          {/* 预览区域 */}
          <span
            className="inline-flex items-center justify-center rounded-full overflow-hidden border border-slate-200 shadow-sm dark:border-slate-800"
            style={{ width: 120, height: 120 }}
            aria-label="avatar preview"
          >
            {preview ? (
              <img src={preview} alt="avatar" className="object-cover w-full h-full" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-white text-3xl font-semibold select-none bg-gradient-to-br from-indigo-500 to-cyan-400">
                {initialChar}
              </span>
            )}
          </span>

          {/* 操作区：整体垂直居中，美观排列 */}
          <div className="flex flex-col items-center gap-2 pt-1">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <input
                ref={fileRef}
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
              <Button type="button" onClick={handlePick}>
                {t('settings.profileEdit.actions.upload')}
              </Button>
              {/* shadcn outline 按钮需添加 bg-transparent */}
              <Button type="button" variant="outline" className="bg-transparent" onClick={handleRemove}>
                {t('settings.profileEdit.actions.remove')}
              </Button>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
              {t('settings.profileEdit.tips.size')}
            </div>
          </div>
        </div>

        {/* 昵称 */}
        <div className="space-y-2">
          <Label htmlFor="name">{t('settings.profileEdit.fields.name')}</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
        </div>

        {/* 邮箱（只读） */}
        <div className="space-y-2">
          <Label htmlFor="email">{t('settings.profileEdit.fields.email')}</Label>
          <Input
            id="email"
            value={storeUser?.email || ''}
            readOnly
            aria-readonly="true"
            placeholder="example@domain.com"
          />
        </div>

        {/* 手机号（右侧小图标控制编辑） */}
        <div className="space-y-2">
          <Label htmlFor="phone">{t('settings.profileEdit.fields.phone')}</Label>
          <div className="relative">
            <Input
              id="phone"
              ref={phoneRef}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              readOnly={!phoneEditing}
              aria-readonly={!phoneEditing}
              placeholder="e.g. +1 555 000 1234"
              // 说明：增加右侧内边距防止文字被右侧按钮覆盖；非编辑态保持默认鼠标样式
              className={`${phoneEditing ? '' : 'cursor-default'} pr-12`}
            />
            {/* 说明：按钮绝对定位在右侧并垂直居中，尺寸略大以提升点击体验 */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="bg-transparent absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={handleTogglePhoneEdit}
              title={t('settings.profileEdit.actions.edit')}
              aria-label={t('settings.profileEdit.actions.edit')}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 操作 */}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" className="bg-transparent" onClick={() => navigate(-1)}>
            {t('actions.cancel')}
          </Button>
          <Button type="submit" disabled={!nameValid}>
            {t('actions.save')}
          </Button>
        </div>
      </form>
    </div>
  )
}
