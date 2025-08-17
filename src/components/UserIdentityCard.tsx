/**
 * components/UserIdentityCard.tsx
 * 个人信息卡片：显示圆形头像、姓名与账户 ID。支持水平/垂直两种布局。
 * Dark mode: container and texts adjust to dark palette.
 * Update:
 * - 为 Account ID 增加复制小图标按钮；点击复制后通过 Toaster 顶部提示（i18n 多语言），3 秒自动消失。
 */
import React from 'react'
import UserAvatar from './UserAvatar'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

/**
 * UserIdentityCardProps
 * 控制信息展示的参数。
 */
export interface UserIdentityCardProps {
  /** 姓名 */
  name: string
  /** 账户 ID（例如：u_1） */
  accountId: string
  /** 可选头像地址 */
  avatarUrl?: string
  /** 布局方向：horizontal（水平）| vertical（垂直），默认 horizontal */
  orientation?: 'horizontal' | 'vertical'
  /** 可选外部 className */
  className?: string
}

/**
 * copyText
 * 尝试使用 Clipboard API 复制文本；失败时退化为 execCommand 方案。
 */
async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
    } finally {
      document.body.removeChild(ta)
    }
  }
}

/**
 * UserIdentityCard
 * 用于在页面顶部或概览区展示当前登录用户的基本信息。
 * - vertical：头像居中，名字在下，ID 再在下
 * - horizontal：头像在左，文字在右（默认）
 */
export default function UserIdentityCard({
  name,
  accountId,
  avatarUrl,
  orientation = 'horizontal',
  className = '',
}: UserIdentityCardProps) {
  const { t } = useTranslation()

  /** 根据布局方向切换容器与内容的对齐样式 */
  const containerLayout =
    orientation === 'vertical'
      ? 'flex flex-col items-center gap-3 text-center'
      : 'flex items-center gap-4'
  const contentClass = orientation === 'vertical' ? 'mt-0.5' : 'min-w-0'
  /** ID 行：在垂直布局时让其水平居中；水平布局则正常左对齐 */
  const idRowClass =
    orientation === 'vertical'
      ? 'mt-0.5 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2'
      : 'mt-0.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2'

  /**
   * handleCopy
   * 复制账户 ID，并弹出绿色成功提示（3 秒自动消失，i18n 多语言）。
   */
  async function handleCopy() {
    try {
      await copyText(accountId)
      toast.success(t('toast.copySuccess'))
    } catch {
      toast.error(t('toast.copyError'))
    }
  }

  return (
    <div className={`rounded-xl border bg-white/70 backdrop-blur p-4 dark:bg-slate-900/70 dark:border-slate-800 ${containerLayout} ${className}`}>
      <UserAvatar name={name} src={avatarUrl} size={56} />
      <div className={contentClass}>
        <div className={`font-medium ${orientation === 'horizontal' ? 'truncate' : ''}`}>{name}</div>
        <div className={idRowClass}>
          <span>Account ID:</span>
          <span className="font-mono text-slate-700 bg-slate-100 rounded px-2 py-0.5 dark:text-slate-200 dark:bg-slate-800">
            {accountId}
          </span>
          {/* 复制按钮：小巧不突兀，hover 时略显色 */}
          <button
            type="button"
            onClick={handleCopy}
            title={t('actions.copy') || 'Copy'}
            aria-label={`${t('actions.copy') || 'Copy'} Account ID`}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
