/**
 * pages/Notifications.tsx
 * 通知列表页面：中间居中展示通知列表，配合 AppLayout 的极简头部与隐藏底栏模式。
 */
import React from 'react'

/**
 * Notification
 * 描述一条通知的接口。
 */
interface Notification {
  /** 唯一 id */
  id: string
  /** 标题 */
  title: string
  /** 简要描述 */
  message: string
  /** 时间戳（字符串显示） */
  time: string
  /** 是否未读 */
  unread?: boolean
}

/**
 * NotificationsPage
 * 渲染通知列表，仅负责内容区域；头部和底部由 AppLayout 控制（极简模式）。
 */
export default function NotificationsPage() {
  // 简单模拟通知数据；后续可通过接口替换
  const notifications: Notification[] = [
    {
      id: 'n1',
      title: 'Payout processed',
      message: 'Your manual payout has been processed successfully.',
      time: new Date().toLocaleString(),
      unread: true,
    },
    {
      id: 'n2',
      title: 'KYC approved',
      message: 'Your identity verification was approved.',
      time: new Date(Date.now() - 1000 * 60 * 60).toLocaleString(),
    },
    {
      id: 'n3',
      title: 'Weekly report',
      message: 'Your weekly earnings report is ready.',
      time: new Date(Date.now() - 1000 * 60 * 60 * 24).toLocaleString(),
    },
  ]

  /**
   * 渲染单条通知项
   */
  const renderItem = (n: Notification) => (
    <li
      key={n.id}
      className={`rounded-lg border p-4 ${n.unread ? 'bg-white' : 'bg-white/70'} backdrop-blur`}
      aria-label={n.title}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{n.title}</div>
          <div className="text-sm text-slate-600 mt-1">{n.message}</div>
        </div>
        <div className="text-xs text-slate-500 whitespace-nowrap">{n.time}</div>
      </div>
    </li>
  )

  return (
    <div className="w-full">
      {/* 居中容器：在可视区中部显示 */}
      <div className="mx-auto max-w-2xl">
        <div className="py-6">
          <ul className="space-y-3">
            {notifications.map(renderItem)}
          </ul>
        </div>
      </div>
    </div>
  )
}
