/**
 * pages/Referrals.tsx
 * 邀请好友页面（两级推广）：规则说明 + 邀请链接复制/分享 + 收益汇总 + 一级/二级明细 + 筛选/排序 + 导出 CSV。
 * 多语言：所有展示文本使用 i18n key，随语言切换。
 */

import React, { useCallback, useMemo, useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Gift, Link2, Users, TrendingUp, PiggyBank, CircleDollarSign, Share2, FileDown, Copy } from 'lucide-react'
import StatCard from '../components/StatCard'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

/**
 * ReferralFriend
 * 好友项（演示数据结构）
 */
interface ReferralFriend {
  id: string
  name: string
  joinedAt: string
  avatar?: string
  /** 当日（或最新周期）利润（以分计，USD/USDT的 minor 单位） */
  todayProfitMinor: number
  /** 首充金额（分），仅一级有意义；若未首充则为 0 */
  firstDepositMinor?: number
}

/**
 * SortKey
 * 列表排序选项
 */
type SortKey = 'joinedDesc' | 'firstDepositDesc' | 'todayProfitDesc' | 'nameAsc'

/**
 * formatMinor
 * 将 minor（分）格式化为本地化货币字符串。
 */
function formatMinor(minor: number, currency = 'USD'): string {
  const v = minor / 100
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(v)
  } catch {
    return `${currency} ${v.toFixed(2)}`
  }
}

/**
 * formatDateLocal
 * 以当前语言输出简洁日期字符串。
 */
function formatDateLocal(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString()
  } catch {
    return iso.slice(0, 10)
  }
}

/**
 * MoneyMono
 * 等宽货币文本封装（视觉更清晰）。
 */
function MoneyMono({ value }: { value: string }) {
  return <span className="font-mono tabular-nums">{value}</span>
}

/**
 * SectionCard
 * 页面分区容器：圆角、毛玻璃、边框，暗黑样式。
 */
function SectionCard(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className = '', ...rest } = props
  return (
    <section
      className={`rounded-xl border bg-white/70 backdrop-blur p-4 md:p-5 dark:bg-slate-900/70 dark:border-slate-800 ${className}`}
      {...rest}
    />
  )
}

/**
 * RuleItem
 * 奖励规则条目（图标 + 标题 + 说明）
 */
function RuleItem({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center dark:bg-indigo-500/10 dark:text-indigo-300">
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</div>
      </div>
    </div>
  )
}

/**
 * LevelBadge
 * 等级小徽章（一级/二级）
 */
function LevelBadge({ level }: { level: 1 | 2 }) {
  const { t } = useTranslation()
  const palette =
    level === 1
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800'
      : 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-200 dark:border-sky-800'
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${palette}`}>
      {level === 1 ? t('referralsPage.level1.badge') : t('referralsPage.level2.badge')}
    </span>
  )
}

/**
 * FriendRow
 * 好友明细行（自适应两种等级；二级不显示首充奖励）
 */
function FriendRow({
  friend,
  level,
}: {
  friend: ReferralFriend
  level: 1 | 2
}) {
  const { t } = useTranslation()
  const firstDeposit = friend.firstDepositMinor ?? 0
  const firstReward = level === 1 && firstDeposit > 0 ? Math.round(firstDeposit * 0.3) : 0
  const shareRate = level === 1 ? 0.1 : 0.05
  const todayShare = Math.round(friend.todayProfitMinor * shareRate)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-3 p-3 rounded-lg border dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
      {/* 用户与等级 */}
      <div className="sm:col-span-4 flex items-center gap-3">
        {/* 简洁头像占位 */}
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center font-semibold">
          {friend.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{friend.name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {t('referralsPage.joinedAtLabel')} {formatDateLocal(friend.joinedAt)}
          </div>
        </div>
        <div className="ml-auto sm:ml-2">
          <LevelBadge level={level} />
        </div>
      </div>

      {/* 首充与奖励（一级显示） */}
      <div className="sm:col-span-4">
        {level === 1 ? (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[11px] text-slate-500">{t('referralsPage.friend.firstDeposit')}</div>
              <div className="text-sm font-medium">
                <MoneyMono value={formatMinor(firstDeposit)} />
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">{t('referralsPage.friend.yourFirstReward')}</div>
              <div className="text-sm font-semibold">
                <MoneyMono value={formatMinor(firstReward)} />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {t('referralsPage.friend.level2NoFirst')}
          </div>
        )}
      </div>

      {/* 今日利润与分成 */}
      <div className="sm:col-span-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[11px] text-slate-500">{t('referralsPage.friend.friendTodayProfit')}</div>
            <div className="text-sm font-medium">
              <MoneyMono value={formatMinor(friend.todayProfitMinor)} />
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500">
              {t('referralsPage.friend.yourShare', { rate: level === 1 ? '10%' : '5%' })}
            </div>
            <div className="text-sm font-semibold">
              <MoneyMono value={formatMinor(todayShare)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * TinyStat
 * 小型行内统计徽章，用于分级区头部展示汇总数据。
 */
function TinyStat({ label, value, tone = 'indigo' }: { label: string; value: string; tone?: 'indigo' | 'emerald' | 'sky' }) {
  const palettes = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-800',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800',
    sky: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-200 dark:border-sky-800',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${palettes[tone]}`}>
      {label}: <span className="font-mono">{value}</span>
    </span>
  )
}

/**
 * sortAndFilter
 * 通用的筛选排序逻辑：按姓名包含关键字过滤，再按指定字段排序。
 */
function sortAndFilter<T extends ReferralFriend>(list: T[], q: string, key: SortKey, _isLevel1: boolean): T[] {
  const query = q.trim().toLowerCase()
  const filtered = query ? list.filter((f) => f.name.toLowerCase().includes(query)) : list.slice()
  filtered.sort((a, b) => {
    switch (key) {
      case 'joinedDesc':
        return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
      case 'firstDepositDesc':
        // 仅一级有意义；二级按0处理
        return (b.firstDepositMinor ?? 0) - (a.firstDepositMinor ?? 0)
      case 'todayProfitDesc':
        return b.todayProfitMinor - a.todayProfitMinor
      case 'nameAsc':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })
  return filtered
}

/**
 * buildCsvAndDownload
 * 将二维字符串数组导出为 CSV 并触发下载（含 BOM 以兼容 Excel）。
 */
function buildCsvAndDownload(filename: string, rows: string[][]) {
  const csv = rows.map((r) =>
    r
      .map((cell) => {
        const v = cell.replace(/\"/g, '\"\"')
        // 若包含逗号/引号/换行，加引号
        return /[",\n]/.test(v) ? `"${v}"` : v
      })
      .join(','),
  ).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * ReferralsPage
 * 页面主组件
 */
export default function ReferralsPage() {
  const { t, i18n } = useTranslation()

  /** 邀请链接（保持与原先逻辑一致） */
  const link = useMemo(() => {
    try {
      const base = `${location.origin}${location.pathname}`
      const code = 'JANE123'
      return `${base}#/signup?ref=${code}`
    } catch {
      return '#'
    }
  }, [])

  /** 从链接中提取邀请码（演示固定） */
  const inviteCode = useMemo(() => {
    const m = /ref=([^&]+)/.exec(link)
    return m ? decodeURIComponent(m[1]) : ''
  }, [link])

  /** 复制链接 */
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(link)
      toast.success(t('toast.copySuccess', { defaultValue: 'Copied' }))
    } catch {
      toast.error(t('toast.copyError', { defaultValue: 'Copy failed. Please copy manually.' }))
    }
  }, [link, t])

  /** 复制邀请码 */
  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteCode)
      toast.success(t('toast.copySuccess'))
    } catch {
      toast.error(t('toast.copyError'))
    }
  }, [inviteCode, t])

  /** 分享（原生 Web Share 可用时） */
  const onShare = useCallback(async () => {
    const title = t('referralsPage.title')
    const text = t('referralsPage.subtitle')
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: link })
      } else {
        await navigator.clipboard.writeText(link)
        toast.success(t('toast.copySuccess'))
      }
    } catch {
      // 用户取消或不支持则忽略
    }
  }, [link, t])

  /**
   * 演示数据
   * - 一级好友 4 个：含不同首充金额与今日利润
   * - 二级好友 6 个：仅今日利润
   * 注意：生产中请用接口返回数据替换
   */
  const level1: ReferralFriend[] = useMemo(
    () => [
      { id: 'u1', name: 'Alice', joinedAt: new Date(Date.now() - 7 * 86400000).toISOString(), firstDepositMinor: 300_00, todayProfitMinor: 2200 },
      { id: 'u2', name: 'Bob', joinedAt: new Date(Date.now() - 3 * 86400000).toISOString(), firstDepositMinor: 0, todayProfitMinor: 1500 },
      { id: 'u3', name: 'Carol', joinedAt: new Date(Date.now() - 14 * 86400000).toISOString(), firstDepositMinor: 500_00, todayProfitMinor: 3400 },
      { id: 'u4', name: 'Daniel', joinedAt: new Date(Date.now() - 1 * 86400000).toISOString(), firstDepositMinor: 200_00, todayProfitMinor: 900 },
    ],
    [],
  )

  const level2: ReferralFriend[] = useMemo(
    () => [
      { id: 'v1', name: 'Erin', joinedAt: new Date(Date.now() - 9 * 86400000).toISOString(), todayProfitMinor: 1200 },
      { id: 'v2', name: 'Frank', joinedAt: new Date(Date.now() - 5 * 86400000).toISOString(), todayProfitMinor: 800 },
      { id: 'v3', name: 'Grace', joinedAt: new Date(Date.now() - 2 * 86400000).toISOString(), todayProfitMinor: 1650 },
      { id: 'v4', name: 'Helen', joinedAt: new Date(Date.now() - 11 * 86400000).toISOString(), todayProfitMinor: 720 },
      { id: 'v5', name: 'Ivan', joinedAt: new Date(Date.now() - 21 * 86400000).toISOString(), todayProfitMinor: 940 },
      { id: 'v6', name: 'Judy', joinedAt: new Date(Date.now() - 18 * 86400000).toISOString(), todayProfitMinor: 1330 },
    ],
    [],
  )

  /** 汇总计算（整体） */
  const stats = useMemo(() => {
    // 1) 一级首充奖励累计：30% * 首充金额
    const l1FirstRewardMinor = level1.reduce((sum, f) => sum + (f.firstDepositMinor ? Math.round(f.firstDepositMinor * 0.3) : 0), 0)
    // 2) 今日预估运行奖励：一级 10% + 二级 5%
    const l1Today = level1.reduce((s, f) => s + f.todayProfitMinor, 0)
    const l2Today = level2.reduce((s, f) => s + f.todayProfitMinor, 0)
    const todayShareMinor = Math.round(l1Today * 0.1 + l2Today * 0.05)
    // 3) 合计（含今日预估）
    const totalMinor = l1FirstRewardMinor + todayShareMinor

    return {
      l1Count: level1.length,
      l2Count: level2.length,
      l1FirstRewardMinor,
      todayShareMinor,
      totalMinor,
    }
  }, [level1, level2])

  /** 搜索与排序状态（应用于 L1/L2 列表） */
  const [query, setQuery] = useState<string>('')
  const [sortKey, setSortKey] = useState<SortKey>('joinedDesc')

  /** 经过筛选/排序的一级与二级列表 */
  const l1List = useMemo(() => sortAndFilter(level1, query, sortKey, true), [level1, query, sortKey])
  const l2List = useMemo(() => sortAndFilter(level2, query, sortKey, false), [level2, query, sortKey])

  /** 分级区块的筛选后汇总 */
  const l1FilteredSummary = useMemo(() => {
    const firstRewardMinor = l1List.reduce((s, f) => s + (f.firstDepositMinor ? Math.round(f.firstDepositMinor * 0.3) : 0), 0)
    const todayShareMinor = Math.round(l1List.reduce((s, f) => s + f.todayProfitMinor, 0) * 0.1)
    return { firstRewardMinor, todayShareMinor }
  }, [l1List])

  const l2FilteredSummary = useMemo(() => {
    const todayShareMinor = Math.round(l2List.reduce((s, f) => s + f.todayProfitMinor, 0) * 0.05)
    return { todayShareMinor }
  }, [l2List])

  /** 导出 CSV（一级） */
  const exportL1 = useCallback(() => {
    const header = [
      'Name',
      t('referralsPage.joinedAtLabel'),
      t('referralsPage.friend.firstDeposit'),
      t('referralsPage.friend.yourFirstReward'),
      t('referralsPage.friend.friendTodayProfit'),
      t('referralsPage.friend.yourShare', { rate: '10%' }),
    ]
    const rows = l1List.map((f) => {
      const firstDep = f.firstDepositMinor ?? 0
      const firstReward = firstDep > 0 ? Math.round(firstDep * 0.3) : 0
      const share = Math.round(f.todayProfitMinor * 0.1)
      return [
        f.name,
        formatDateLocal(f.joinedAt),
        (firstDep / 100).toFixed(2),
        (firstReward / 100).toFixed(2),
        (f.todayProfitMinor / 100).toFixed(2),
        (share / 100).toFixed(2),
      ]
    })
    buildCsvAndDownload(`referrals_L1_${i18n.language}.csv`, [header, ...rows])
  }, [l1List, t, i18n.language])

  /** 导出 CSV（二级） */
  const exportL2 = useCallback(() => {
    const header = [
      'Name',
      t('referralsPage.joinedAtLabel'),
      t('referralsPage.friend.friendTodayProfit'),
      t('referralsPage.friend.yourShare', { rate: '5%' }),
    ]
    const rows = l2List.map((f) => {
      const share = Math.round(f.todayProfitMinor * 0.05)
      return [
        f.name,
        formatDateLocal(f.joinedAt),
        (f.todayProfitMinor / 100).toFixed(2),
        (share / 100).toFixed(2),
      ]
    })
    buildCsvAndDownload(`referrals_L2_${i18n.language}.csv`, [header, ...rows])
  }, [l2List, t, i18n.language])

  return (
    <div className="space-y-4">
      {/* 顶部 Hero：渐变标题 + 简述 */}
      <div className="relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 dark:border-slate-800">
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-8">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('nav.referrals')}
            </div>
            <h1
              className="
                mt-2 text-2xl md:text-3xl font-semibold tracking-tight
                bg-clip-text text-transparent
                bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600
                dark:from-indigo-400 dark:via-sky-400 dark:to-cyan-400
              "
            >
              {t('referralsPage.title', { defaultValue: 'Invite friends to earn rewards' })}
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {t('referralsPage.subtitle')}
            </p>
          </div>
          <div className="h-28 md:h-auto">
            {/* 智能占位/示意图 */}
            <img src="https://pub-cdn.sider.ai/u/U05XH90O53X/web-coder/689bf295a616cfbf067042a3/resource/a817ccdf-458c-4b21-8427-4bc56f08453a.jpg" className="object-cover h-full w-full" />
          </div>
        </div>
      </div>

      {/* 邀请链接 */}
      <SectionCard>
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          <h2 className="text-base font-semibold tracking-tight">
            {t('referralsPage.link.title')}
          </h2>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <Input readOnly value={link} />
            <Button onClick={copy}>
              <Copy className="h-4 w-4 mr-2" />
              {t('actions.copy')}
            </Button>
            <Button variant="outline" className="bg-transparent" onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" />
              {t('actions.share')}
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">{t('referralsPage.link.code')}</span>
            <span className="inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-xs bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700">
              <span className="font-mono">{inviteCode}</span>
              <button
                type="button"
                className="text-indigo-600 hover:underline dark:text-indigo-400"
                onClick={copyCode}
                aria-label={t('actions.copy') || 'Copy'}
              >
                {t('actions.copy')}
              </button>
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('referralsPage.link.tip')}
          </p>
        </div>
      </SectionCard>

      {/* 汇总统计（全局） */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          label={t('referralsPage.stats.firstDeposit')}
          value={formatMinor(stats.l1FirstRewardMinor)}
          sub={t('referralsPage.stats.firstDepositSub')}
          icon={<Gift size={16} />}
          accent="orange"
          size="sm"
        />
        <StatCard
          label={t('referralsPage.stats.today')}
          value={formatMinor(stats.todayShareMinor)}
          sub={t('referralsPage.stats.todaySub')}
          icon={<TrendingUp size={16} />}
          accent="green"
          size="sm"
        />
        <StatCard
          label={t('referralsPage.stats.total')}
          value={formatMinor(stats.totalMinor)}
          sub={t('referralsPage.stats.totalSub')}
          icon={<CircleDollarSign size={16} />}
          accent="blue"
          size="sm"
        />
      </div>

      {/* 规则说明 */}
      <SectionCard>
        <div className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          <h3 className="text-base font-semibold tracking-tight">
            {t('referralsPage.rules.title')}
          </h3>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <RuleItem
            icon={<Users className="h-4 w-4" />}
            title={t('referralsPage.rules.level1.title')}
            desc={t('referralsPage.rules.level1.desc')}
          />
          <RuleItem
            icon={<Users className="h-4 w-4" />}
            title={t('referralsPage.rules.level2.title')}
            desc={t('referralsPage.rules.level2.desc')}
          />
        </div>
      </SectionCard>

      {/* 工具条：搜索 + 排序（作用于下方两个列表） */}
      <SectionCard className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('referralsPage.filter.searchPlaceholder') || 'Search name...'}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">{t('referralsPage.filter.sort.label')}</span>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder={t('referralsPage.filter.sort.label')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="joinedDesc">{t('referralsPage.filter.sort.joinedDesc')}</SelectItem>
              <SelectItem value="firstDepositDesc">{t('referralsPage.filter.sort.firstDepositDesc')}</SelectItem>
              <SelectItem value="todayProfitDesc">{t('referralsPage.filter.sort.todayProfitDesc')}</SelectItem>
              <SelectItem value="nameAsc">{t('referralsPage.filter.sort.nameAsc')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SectionCard>

      {/* 一级好友列表 */}
      <SectionCard>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Users className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <h3 className="text-base font-semibold tracking-tight">
              {t('referralsPage.level1.title')}（{l1List.length}）
            </h3>
            {/* 分级小汇总（筛选后数据） */}
            <TinyStat
              label={t('referralsPage.perLevel.l1.rewardFirstTotal')}
              value={formatMinor(l1FilteredSummary.firstRewardMinor)}
              tone="emerald"
            />
            <TinyStat
              label={t('referralsPage.perLevel.l1.todayShare')}
              value={formatMinor(l1FilteredSummary.todayShareMinor)}
              tone="indigo"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {t('referralsPage.level1.tip')}
            </div>
            <Button variant="outline" className="bg-transparent h-8 px-2 text-xs" onClick={exportL1}>
              <FileDown className="h-3.5 w-3.5 mr-1.5" />
              {t('actions.exportCSV')}
            </Button>
          </div>
        </div>
        <div className="mt-3 grid gap-2">
          {l1List.map((f) => (
            <FriendRow key={f.id} friend={f} level={1} />
          ))}
          {l1List.length === 0 && (
            <div className="text-center text-sm text-slate-500 py-6">
              {query ? t('referralsPage.emptyFiltered') : t('referralsPage.level1.empty')}
            </div>
          )}
        </div>
      </SectionCard>

      {/* 二级好友列表 */}
      <SectionCard>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Users className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <h3 className="text-base font-semibold tracking-tight">
              {t('referralsPage.level2.title')}（{l2List.length}）
            </h3>
            <TinyStat
              label={t('referralsPage.perLevel.l2.todayShare')}
              value={formatMinor(l2FilteredSummary.todayShareMinor)}
              tone="sky"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {t('referralsPage.level2.tip')}
            </div>
            <Button variant="outline" className="bg-transparent h-8 px-2 text-xs" onClick={exportL2}>
              <FileDown className="h-3.5 w-3.5 mr-1.5" />
              {t('actions.exportCSV')}
            </Button>
          </div>
        </div>
        <div className="mt-3 grid gap-2">
          {l2List.map((f) => (
            <FriendRow key={f.id} friend={f} level={2} />
          ))}
          {l2List.length === 0 && (
            <div className="text-center text-sm text-slate-500 py-6">
              {query ? t('referralsPage.emptyFiltered') : t('referralsPage.level2.empty')}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  )
}
