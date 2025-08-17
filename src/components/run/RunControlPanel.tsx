/**
 * components/run/RunControlPanel.tsx
 * 运行控制卡片：显示状态（运行中/已停止）、Uptime，开始/停止按钮。
 * 未绑定地址时禁用“开始”并提示。
 *
 * Update:
 * - 显示“今日收益 / 昨日收益”。
 * - 启动前要求输入投入资金，最低 $100 校验，“全部”快捷填充。
 * - 停止前弹出居中确认对话框（AlertDialog）：精简居中款式、红色感叹号、文本按钮（停止/取消）。
 * - 新增：昨日收益卡片显示“是否已发送利润”的状态徽标（Sent/Partial/Pending），多语言与深浅色适配。
 * - 新增2：在“昨日”金额右侧显示“昨日收益率”（= 昨日收益 ÷ 运行金额），以彩色胶囊标签呈现，高可读、不影响其他地方。
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import GreenPillButton from '../GreenPillButton'

import { Zap, Square, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import { useAppStore } from '../../store/appStore'
import { formatMinorPlain } from '../../utils/currency'

/**
 * RunControlPanelProps
 * 运行控制面板的入参。
 */
export interface RunControlPanelProps {
  /** 是否已绑定地址（控制是否允许启动） */
  hasAddress: boolean
  /** 启动回调 */
  onStart?: () => void
  /** 停止回调 */
  onStop?: () => void
  /** className */
  className?: string
}

/**
 * formatUptime
 * 将秒数格式化为 mm:ss 或 hh:mm:ss。
 */
function formatUptime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  if (h > 0) return `${h}:${mm}:${ss}`
  return `${mm}:${ss}`
}

/**
 * isSameDay
 * 判断 ISO 时间与目标日期是否为同一天（本地时区）。
 */
function isSameDay(aISO: string, bDate: Date) {
  const a = new Date(aISO)
  return a.getFullYear() === bDate.getFullYear() && a.getMonth() === bDate.getMonth() && a.getDate() === bDate.getDate()
}

/**
 * startOfDay
 * 返回日期的本地 00:00:00。
 */
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * LedgerEntry
 * 精简的账本项类型（仅当前逻辑需要的字段）。
 */
type LedgerEntry = { type: string; amountMinor: number; createdAt: string }

/**
 * PayoutStatus
 * 昨日利润的发送状态。
 */
type PayoutStatus = 'SENT' | 'PARTIAL' | 'PENDING'

/**
 * getYesterdayNumbers
 * 计算昨日毛收益（EARN/COMMISSION）、20% 服务费与净额。
 */
function getYesterdayNumbers(ledger: LedgerEntry[]) {
  const today = new Date()
  const y = new Date(startOfDay(today).getTime() - 24 * 60 * 60 * 1000)
  const grossMinor = ledger
    .filter((e) => (e.type === 'EARN' || e.type === 'COMMISSION') && isSameDay(e.createdAt, y))
    .reduce((sum, e) => sum + e.amountMinor, 0)
  const feeMinor = Math.round(grossMinor * 0.2)
  const netMinor = Math.max(0, grossMinor - feeMinor)
  return { grossMinor, feeMinor, netMinor, yesterdayDate: y, today }
}

/**
 * getYesterdayPayoutStatus
 * 统计“今天”的 PAYOUT 正向金额与昨日净额对比，得出状态。
 * - >= 昨日净额 => SENT
 * - 0 < 今日支付 < 昨日净额 => PARTIAL
 * - 其他（含 0） => PENDING
 */
function getYesterdayPayoutStatus(ledger: LedgerEntry[], today: Date, yesterdayNetMinor: number): {
  status: PayoutStatus
  paidMinorToday: number
} {
  const paidMinorToday = ledger
    .filter((e) => e.type === 'PAYOUT' && isSameDay(e.createdAt, today))
    .reduce((s, e) => s + Math.max(0, e.amountMinor), 0)

  if (paidMinorToday >= yesterdayNetMinor && yesterdayNetMinor > 0) return { status: 'SENT', paidMinorToday }
  if (paidMinorToday > 0 && paidMinorToday < yesterdayNetMinor) return { status: 'PARTIAL', paidMinorToday }
  return { status: 'PENDING', paidMinorToday }
}

/**
 * StatusBadge
 * 小型胶囊态徽标，用于显示昨日利润的发送状态。
 */
function StatusBadge({ status }: { status: PayoutStatus }) {
  const { t } = useTranslation()
  const map: Record<
    PayoutStatus,
    {
      text: string
      cls: string
      Icon: React.ComponentType<any> | null
    }
  > = {
    SENT: {
      text: t('yesterdayCard.status.sent'),
      cls:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800',
      Icon: CheckCircle2,
    },
    PARTIAL: {
      text: t('yesterdayCard.status.partial'),
      cls:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800',
      Icon: Clock,
    },
    PENDING: {
      text: t('yesterdayCard.status.pending'),
      cls: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/30 dark:text-slate-300 dark:border-slate-800',
      Icon: null,
    },
  }
  const { text, cls, Icon } = map[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {text}
    </span>
  )
}

/**
 * formatPercent
 * 按值自动选择小数位并本地化格式化百分比。
 * |p| < 1 -> 2 位；1 ≤ |p| < 100 -> 1 位；≥100 -> 0 位
 */
function formatPercent(pct: number) {
  const abs = Math.abs(pct)
  const digits = abs < 1 ? 2 : abs < 100 ? 1 : 0
  return pct.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

/**
 * RunControlPanel
 * 展示当前运行状态与操作按钮。
 * 包含：今日/昨日收益统计；未启动前要求输入投入资金并校验；最低金额提示。
 * 停止：以紧凑型、居中、文本按钮风格的 AlertDialog 确认。
 * 新增：昨日收益卡片右上角显示“是否已发送利润”的状态。
 * 新增2：在昨日金额右侧展示“昨日收益率”（= 昨日收益 / 运行金额）。
 */
export default function RunControlPanel({ hasAddress, onStart, onStop, className = '' }: RunControlPanelProps) {
  const { t } = useTranslation()

  // 全局钱包与账本
  const wallet = useAppStore((s) => s.wallet)
  const ledger = useAppStore((s) => s.ledger)

  // 运行状态持久化（演示）
  const initialRunning = useMemo(() => localStorage.getItem('run_running') === '1', [])
  const initialStartedAt = useMemo(() => Number(localStorage.getItem('run_startedAt') || 0), [])
  const [running, setRunning] = useState<boolean>(initialRunning)
  const [startedAt, setStartedAt] = useState<number>(initialStartedAt)
  const [now, setNow] = useState<number>(Date.now())

  // 停止确认弹窗开关
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false)

  // 启动前投入金额（主单位，字符串输入）
  const [investInput, setInvestInput] = useState<string>('')

  // 计时器
  useEffect(() => {
    if (!running) return
    const tm = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(tm)
  }, [running])

  const uptimeSec = running && startedAt ? (now - startedAt) / 1000 : 0

  /**
   * today / yesterday 收益（仅统计 EARN / COMMISSION 的正负净额）
   */
  const today = new Date()
  const yesterday = new Date(startOfDay(today).getTime() - 24 * 60 * 60 * 1000)

  let todayEarningsMinor = 0
  let yesterdayEarningsMinor = 0
  for (const e of ledger as LedgerEntry[]) {
    const eligible = e.type === 'EARN' || e.type === 'COMMISSION'
    if (!eligible) continue
    if (isSameDay(e.createdAt, today)) {
      todayEarningsMinor += e.amountMinor
    } else if (isSameDay(e.createdAt, yesterday)) {
      yesterdayEarningsMinor += e.amountMinor
    }
  }

  /**
   * 计算昨日净额与发送状态（用于状态徽标）
   * - 与 Wallet KPI 的规则保持一致，提升一致性。
   */
  const { netMinor: yNetMinor } = getYesterdayNumbers(ledger as LedgerEntry[])
  const { status: yStatus } = getYesterdayPayoutStatus(ledger as LedgerEntry[], today, yNetMinor)

  /**
   * parseInvestMinor
   * 将输入的主单位金额解析为分（minor），保留两位小数，四舍五入。
   */
  function parseInvestMinor(input: string) {
    const v = parseFloat(input)
    if (!isFinite(v) || v <= 0) return NaN
    return Math.round(v * 100)
  }

  // 最低金额阈值（100 美元）
  const MIN_MAIN = 100
  const MIN_MINOR = MIN_MAIN * 100

  // 实时解析并用于提示
  const investMinorCandidate = parseInvestMinor(investInput)
  const showBelowMinTip =
    investInput.trim().length > 0 && !Number.isNaN(investMinorCandidate) && investMinorCandidate < MIN_MINOR

  /**
   * handleFillAll
   * 填充“全部可用金额”到输入框（主单位，保留两位小数）。
   */
  function handleFillAll() {
    const all = (wallet.availableMinor / 100).toFixed(2)
    setInvestInput(all)
  }

  /**
   * doStop
   * 实际停止逻辑（由确认弹窗中的“停止”触发）。
   */
  function doStop() {
    setRunning(false)
    try {
      localStorage.setItem('run_running', '0')
    } catch {}
    onStop?.()
    toast.success(t('run.stopped') || 'Stopped')
  }

  /**
   * handleStart
   * 校验地址与投入金额，余额充足后：
   * - 从 available 扣除投入金额
   * - 加到 pending
   * - 记一条 ADJUSTMENT 负向流水（表示资金分配到运行）
   * - 切换为运行中
   */
  function handleStart() {
    if (!hasAddress) {
      toast.error(t('run.needAddress') || 'Please bind a receiving address before starting.')
      return
    }
    const investMinor = parseInvestMinor(investInput)
    if (Number.isNaN(investMinor)) {
      toast.error(t('run.investInvalid') || 'Please enter a valid amount to invest.')
      return
    }
    if (investMinor < MIN_MINOR) {
      toast.error(t('run.min100') || '最低投入 $100')
      return
    }
    if (investMinor > wallet.availableMinor) {
      toast.error(t('run.investExceed') || 'Amount exceeds available balance.')
      return
    }

    // 更新钱包与账本（模拟锁定资金到运行）
    const nowISO = new Date().toISOString()
    const id = 'l_' + Math.random().toString(36).slice(2, 9)
    useAppStore.setState((s) => ({
      wallet: {
        ...s.wallet,
        availableMinor: s.wallet.availableMinor - investMinor,
        pendingMinor: s.wallet.pendingMinor + investMinor,
        updatedAt: nowISO,
      },
      ledger: [
        { id, type: 'ADJUSTMENT', amountMinor: -investMinor, currency: s.wallet.currency, createdAt: nowISO, refId: 'run-invest' },
        ...s.ledger,
      ],
    }))

    const ts = Date.now()
    setRunning(true)
    setStartedAt(ts)
    try {
      localStorage.setItem('run_running', '1')
      localStorage.setItem('run_startedAt', String(ts))
    } catch {}
    onStart?.()
    toast.success(t('run.running') || 'Running')
  }

  // 可用余额（显示）
  const availableText = formatMinorPlain(wallet.availableMinor)

  // 运行金额（基数）：使用 pendingMinor 作为“投入运行的金额”
  const runningBaseMinor = wallet.pendingMinor
  // 昨日收益率（百分比）
  const yesterdayRatePct = runningBaseMinor > 0 ? (yesterdayEarningsMinor / runningBaseMinor) * 100 : NaN
  const rateSign = Number.isFinite(yesterdayRatePct) ? (yesterdayRatePct > 0 ? 'pos' : yesterdayRatePct < 0 ? 'neg' : 'zero') : 'none'
  const rateChipClass =
    rateSign === 'pos'
      ? 'text-emerald-700 border-emerald-200 bg-emerald-50/80 dark:text-emerald-200 dark:border-emerald-800 dark:bg-emerald-900/30'
      : rateSign === 'neg'
      ? 'text-rose-700 border-rose-200 bg-rose-50/80 dark:text-rose-200 dark:border-rose-800 dark:bg-rose-900/30'
      : 'text-slate-600 border-slate-200 bg-slate-50 dark:text-slate-300 dark:border-slate-800 dark:bg-slate-800/40'

  return (
    <section className={`rounded-xl border bg-white/70 backdrop-blur p-4 dark:bg-slate-900/70 dark:border-slate-800 ${className}`}>
      {/* 顶部状态行 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{running ? t('run.running') : t('run.stopped')}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t('run.uptime')}: {formatUptime(uptimeSec)}
          </div>
        </div>
        {/* 状态点 */}
        <span
          className={`h-2.5 w-2.5 rounded-full ${running ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]' : 'bg-slate-400 dark:bg-slate-500'}`}
          aria-label={running ? 'running' : 'stopped'}
        />
      </div>

      {/* 今日 / 昨日收益卡片（紧凑双列） */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg border bg-white/60 p-3 dark:bg-slate-900/60 dark:border-slate-800">
          <div className="flex items-start justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('wallet.today')}</span>
            <span className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 opacity-80" />
          </div>
          <div className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
            {formatMinorPlain(todayEarningsMinor)}
          </div>
        </div>

        {/* 昨日卡片：添加发送状态徽标 + 昨日收益率 */}
        <div className="rounded-lg border bg-white/60 p-3 dark:bg-slate-900/60 dark:border-slate-800">
          <div className="flex items-start justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('wallet.yesterday')}</span>
            <div className="flex items-center gap-2">
              <StatusBadge status={yStatus} />
              <span className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-400 opacity-80" />
            </div>
          </div>

          {/* 金额 + 百分比徽标（收益率） */}
          <div className="mt-1 flex items-baseline gap-2">
            <div className="font-semibold text-amber-600 dark:text-amber-300">
              {formatMinorPlain(yesterdayEarningsMinor)}
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${rateChipClass}`}
              aria-label="yesterday-yield-percent"
              title={
                Number.isFinite(yesterdayRatePct)
                  ? `${formatPercent(yesterdayRatePct)}%`
                  : '—'
              }
            >
              {Number.isFinite(yesterdayRatePct) ? `${formatPercent(yesterdayRatePct)}%` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* 操作区 */}
      <div className="mt-4">
        {running ? (
          <>
            <GreenPillButton
              label={t('run.stop')}
              icon={<Square />}
              onClick={() => setConfirmOpen(true)}
              fullWidth
              palette="emerald"
            />

            {/* 停止确认弹窗：紧凑、居中、文本按钮风格；红色感叹号图标 */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogContent className="sm:max-w-sm rounded-xl border bg-white/95 backdrop-blur-md dark:bg-slate-900/95 dark:border-slate-800 p-5">
                <AlertDialogHeader>
                  {/* 顶部红色感叹号图标徽章（低调柔光） */}
                  <div
                    className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full
                    bg-rose-100/80 dark:bg-rose-900/30 ring-1 ring-rose-200/60 dark:ring-rose-800/50">
                    <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                  </div>
                  <AlertDialogTitle className="text-center text-base font-semibold text-slate-900 dark:text-slate-100">
                    {t('run.confirmTitle')}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-center text-sm text-slate-600 dark:text-slate-400">
                    {t('run.confirmDesc')}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                {/* 文本按钮：取消（深色） / 停止（红色） */}
                <AlertDialogFooter className="sm:justify-center gap-6">
                  <AlertDialogCancel
                    className="bg-transparent border-none shadow-none h-auto px-2 py-1
                    text-slate-800 hover:text-slate-900 underline-offset-4 hover:underline
                    focus-visible:outline-none focus-visible:ring-0 dark:text-slate-200 dark:hover:text-slate-100"
                  >
                    {t('actions.cancel')}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      doStop()
                      setConfirmOpen(false)
                    }}
                    className="bg-transparent border-none shadow-none h-auto px-2 py-1
                    font-semibold text-rose-600 hover:text-rose-700
                    focus-visible:outline-none focus-visible:ring-0
                    dark:text-rose-400 dark:hover:text-rose-300"
                  >
                    {t('run.stop')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <div className="space-y-3">
            {/* 投入资金输入（输入框内右侧“全部”渐变文字） + 可用余额徽标 */}
            <div className="grid gap-1.5">
              <Label htmlFor="investAmt">{t('run.invest') || 'Investment amount'}</Label>
              <div className="flex items-center gap-2">
                {/* 缩短输入框整体宽度：固定而不随容器拉伸 */}
                <div className="relative flex-none w-56 sm:w-64 md:w-72 lg:w-80">
                  <Input
                    id="investAmt"
                    inputMode="decimal"
                    placeholder="≥ 100.00"
                    className="placeholder:text-slate-400 dark:placeholder:text-slate-500 pr-28 md:pr-36"
                    value={investInput}
                    onChange={(e) =>
                      setInvestInput(
                        e.target.value
                          .replace(/[^\d.]/g, '') // 仅保留数字与小数点
                          .replace(/(\..*)\./, '$1') // 只允许一个小数点
                      )
                    }
                  />
                  {/* 右侧内嵌“全部”渐变文字：靠右、上下居中、可点击与可键盘触发 */}
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={t('run.fillAll') || 'Fill all available'}
                    title={t('run.fillAll') || '全部'}
                    className="
                      absolute inset-y-0 right-2 md:right-3 flex items-center px-2
                      text-xs font-medium cursor-pointer select-none whitespace-nowrap
                      bg-clip-text text-transparent
                      bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600
                      dark:from-indigo-300 dark:via-sky-300 dark:to-cyan-300
                      hover:opacity-90 focus:opacity-90 active:opacity-100
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-indigo-500/40
                    "
                    onClick={handleFillAll}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleFillAll()
                      }
                    }}
                  >
                    {t('run.all') || '全部'}
                  </span>
                </div>

                <div className="text-xs px-2 py-1 rounded-md border bg-slate-50 text-slate-600 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700">
                  {t('wallet.available')}: {availableText}
                </div>
              </div>
              {showBelowMinTip && <p className="text-xs text-rose-600">{t('run.min100') || '最低投入 $100'}</p>}
            </div>

            <GreenPillButton label={t('run.start')} icon={<Zap />} onClick={handleStart} fullWidth palette="brand" />
            {!hasAddress && <p className="text-xs text-rose-600">{t('run.needAddress') || 'Please bind a receiving address before starting.'}</p>}
          </div>
        )}
      </div>
    </section>
  )
}
