/**
 * hooks/useRunOrderEngine.ts
 * 运行订单生成引擎：
 * - 基于“投入运行的金额”（wallet.pendingMinor）计算每日目标收益；
 * - 每天随机订单数量 50~100 单；
 * - 每单利润围绕“剩余目标 / 剩余订单”生成，带 0.7~1.3 噪声，保证最终不超过当日目标；
 * - 到达当日订单数后停止，跨日自动重置；
 * - 生成间隔 3~7s（演示友好）。
 */

import { useEffect, useMemo, useRef } from 'react'
import { getRunPlatforms, type RunPlatform } from '../services/platforms'

/**
 * OrderPayload
 * 回调中输出给宿主组件（Run 页）的订单信息。
 */
export interface OrderPayload {
  platform: RunPlatform
  /** USD 主单位利润（保留两位） */
  profitUsd: number
  /** 交易对（简单从 BTC/USDT 与 ETH/USDT 中随机） */
  symbol: 'BTC/USDT' | 'ETH/USDT'
  /** 时间戳（毫秒） */
  ts: number
}

/**
 * RunOrderEngineOptions
 * 引擎入参。
 */
export interface RunOrderEngineOptions {
  /** 是否处于“运行中” */
  running: boolean
  /** 投入的资金（单位：分，minor） */
  investMinor: number
  /** 生成一单时的回调 */
  onOrder: (o: OrderPayload) => void
}

/**
 * todayKey
 * 当地日期键（YYYYMMDD）。
 */
function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}${m}${day}`
}

/**
 * seededRand01
 * 基于整数种子的稳定伪随机（0~1）。
 */
function seededRand01(seed: number): number {
  let t = seed + 0x6D2B79F5
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/**
 * pickSymbol
 * 简单随机 BTC/USDT or ETH/USDT。
 */
function pickSymbol(r: number): 'BTC/USDT' | 'ETH/USDT' {
  return r < 0.5 ? 'BTC/USDT' : 'ETH/USDT'
}

/**
 * schedule
 * 工具：创建一次性计时器。
 */
function schedule(fn: () => void, ms: number) {
  const id = window.setTimeout(fn, ms)
  return () => window.clearTimeout(id)
}

/**
 * useRunOrderEngine
 * 宿主负责：传入 running 与 investMinor；在 onOrder 中写入 UI 列表与账本。
 */
export default function useRunOrderEngine({ running, investMinor, onOrder }: RunOrderEngineOptions) {
  // 平台列表：首选本地/全局配置，回落默认
  const platforms = useMemo(() => getRunPlatforms(), [])

  // 计划状态（Ref）：跨渲染保存
  const planRef = useRef<{
    day: string
    ordersPlanned: number
    ordersDone: number
    targetSumMinor: number
    producedMinor: number
  } | null>(null)

  // 定时器卸载器
  const timerRef = useRef<null | (() => void)>(null)

  /**
   * buildPlan
   * 基于投入金额与“今日”构建或重建计划。
   */
  function buildPlan() {
    const day = todayKey()
    const invMain = Math.max(0, Math.floor(investMinor)) / 100 // 转为主单位 USD
    if (invMain <= 0) {
      planRef.current = { day, ordersPlanned: 0, ordersDone: 0, targetSumMinor: 0, producedMinor: 0 }
      return
    }

    // 阶梯收益率（按月）：<10k => 30%~40%；≥10k => 60%~80%
    const lowTier = invMain < 10000
    const baseMonthly = lowTier ? 0.30 : 0.60
    const capMonthly = lowTier ? 0.40 : 0.80

    // 当日收益率：围绕基线做轻微扰动（±10%），不超过封顶
    const daySeed = parseInt(day, 10) ^ Math.floor(invMain * 100)
    const jitter = 0.9 + seededRand01(daySeed) * 0.2 // 0.9 ~ 1.1
    const monthlyForToday = Math.min(capMonthly, baseMonthly * jitter)

    // 日目标收益（分）
    const dailyTargetMain = (invMain * monthlyForToday) / 30
    const targetSumMinor = Math.max(0, Math.round(dailyTargetMain * 100))

    // 每日订单数（稳定在今日，50~100）
    const ordersPlanned = 50 + Math.floor(seededRand01(daySeed + 77) * 51) // 50~100（含）

    planRef.current = {
      day,
      ordersPlanned,
      ordersDone: 0,
      targetSumMinor,
      producedMinor: 0,
    }
  }

  /**
   * ensurePlan
   * 若跨日或未建，则重建计划。
   */
  function ensurePlan() {
    const day = todayKey()
    if (!planRef.current || planRef.current.day !== day) {
      buildPlan()
    }
  }

  /**
   * makeOneOrder
   * 生成一单利润，遵循“剩余目标/剩余订单的期望值 ± 噪声”，且保证剩余订单仍可分配。
   */
  function makeOneOrder() {
    ensurePlan()
    const plan = planRef.current!
    if (!plan || plan.ordersPlanned === 0) return

    const remainingOrders = plan.ordersPlanned - plan.ordersDone
    if (remainingOrders <= 0) return

    const remainingMinor = Math.max(0, plan.targetSumMinor - plan.producedMinor)

    // 期望单笔
    const expected = remainingOrders > 0 ? remainingMinor / remainingOrders : 0
    // 噪声 0.7~1.3（更自然）
    const r = Math.random()
    let sample = Math.round(expected * (0.7 + r * 0.6))

    // 至少 1 分；同时确保剩余订单每单至少 1 分
    const minCents = 1
    const maxAllowed = Math.max(minCents, remainingMinor - (remainingOrders - 1) * minCents)
    if (sample < minCents) sample = minCents
    if (sample > maxAllowed) sample = maxAllowed

    // 更新计划进度
    planRef.current = {
      ...plan,
      ordersDone: plan.ordersDone + 1,
      producedMinor: plan.producedMinor + sample,
    }

    // 输出订单
    const platIdx = Math.floor(Math.random() * platforms.length)
    const platform = platforms[platIdx]
    const symbol = pickSymbol(Math.random())
    const profitUsd = sample / 100

    onOrder({ platform, profitUsd, symbol, ts: Date.now() })
  }

  /**
   * scheduleNext
   * 安排下一单（3~7s）。
   */
  function scheduleNext() {
    if (timerRef.current) {
      timerRef.current()
      timerRef.current = null
    }
    const delay = 3000 + Math.random() * 4000
    timerRef.current = schedule(() => {
      // 非运行或无投入：不继续
      if (!running || investMinor <= 0) return

      ensurePlan()
      const plan = planRef.current!
      if (plan.ordersDone >= plan.ordersPlanned) {
        // 当日目标达成：不再生成（等待跨日重置）
        return
      }

      makeOneOrder()
      scheduleNext()
    }, delay)
  }

  // 监听 running 状态与投入金额，按需重建计划并开始/停止调度
  useEffect(() => {
    ensurePlan()
    if (timerRef.current) {
      timerRef.current()
      timerRef.current = null
    }
    if (running && investMinor > 0) {
      scheduleNext()
    }
    return () => {
      if (timerRef.current) {
        timerRef.current()
        timerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, investMinor])

  // 跨日重置（每分钟检查一次是否跨日）
  useEffect(() => {
    const id = window.setInterval(() => {
      const key = todayKey()
      if (!planRef.current || planRef.current.day !== key) {
        buildPlan()
        if (running && investMinor > 0) {
          scheduleNext()
        }
      }
    }, 60_000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, investMinor])
}
