/**
 * components/system/ErrorBoundary.tsx
 * 通用错误边界：捕获子树内运行时异常，展示友好的错误提示与重试按钮，避免整页空白。
 */

import React from 'react'

/** ErrorBoundaryProps
 * 可选自定义回退 UI；默认提供一个简洁的错误卡片。
 */
export interface ErrorBoundaryProps {
  fallback?: React.ReactNode
  className?: string
}

/** ErrorBoundaryState
 * 记录是否出错与错误对象，便于渲染详细信息（开发环境）。
 */
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

/**
 * ErrorBoundary
 * React 类组件错误边界实现。
 */
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  /** 初始化 state */
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: undefined }
  }

  /** 捕获错误并更新状态 */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  /** 记录错误详情（可在此上报） */
  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.warn('[ErrorBoundary]', error, info.componentStack)
  }

  /** 点击重试：尝试清理一次会话并刷新页面 */
  private handleRetry = () => {
    try {
      sessionStorage.setItem('last_error_boundary_retry', Date.now().toString())
    } catch {}
    // 简单刷新（保留登录状态）
    window.location.reload()
  }

  /** 渲染 */
  render(): React.ReactNode {
    const { hasError, error } = this.state
    const { fallback, className = '' } = this.props

    if (!hasError) return this.props.children

    if (fallback) return fallback

    // 默认回退 UI（Tailwind）
    return (
      <div className={`p-6 m-4 rounded-xl border bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">页面出现错误</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          很抱歉，当前页面加载遇到问题。你可以尝试刷新或稍后重试。
        </p>
        {error ? (
          <pre className="mt-3 text-xs text-rose-500/90 bg-rose-50/50 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/60 rounded-lg p-3 overflow-auto max-h-48">
            {String(error?.message || error)}
          </pre>
        ) : null}
        <div className="mt-4">
          <button
            type="button"
            className="inline-flex items-center justify-center px-3 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 active:scale-[.99] transition"
            onClick={this.handleRetry}
          >
            刷新重试
          </button>
        </div>
      </div>
    )
  }
}
