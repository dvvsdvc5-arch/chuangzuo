/**
 * hooks/useAssistedCounts.ts
 * 为合作平台生成“今日已助力广告数量”的滚动统计。
 * - 依据 24 小时平均，按 10 分钟一个时间槽（共 144 槽）累计增长；
 * - 每个平台的“当日目标总量”按排序从多到少递减，并带有轻微的日内随机系数（种子固定，日内稳定）；
 * - 每 10 分钟整点更新一次（与本地时间对齐）。
 */

import { useEffect, useMemo, useState } from 'react'

/**
 * 获取今天的开始时间戳（本地时区，毫秒）
 */
function getLocalStartOfDay(ts: number): number {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/**
 * 计算当前处于当天第几个 10 分钟槽（0~144），本地时区。
 */
function getCurrentTenMinSlot(now: Date): number {
  const sod = getLocalStartOfDay(now.getTime())
  const passed = now.getTime() - sod
  const minutes = Math.floor(passed / 60000)
  const slot = Math.floor(minutes / 10)
  return Math.min(Math.max(slot, 0), 144)
}

/**
 * 生成轻量伪随机数（0~1），基于整数种子，保证同一日/同一平台稳定。
 * 算法：Mulberry32 的简化实现。
 */
function seededRandom01(seed: number): number {
  let t = seed + 0x6D2B79F5
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/**
 * 使用平台索引与“今日”的基准种子，得到每个平台的“当日目标总量”。
 * - hi/lo 为合理区间（看起来专业）：hi=2200，lo=900，线性递减；
 * - 附带 0.9~1.1 的细微随机系数，提高“高级感”但不破坏整体梯度。
 */
function getDailyTargetTotal(index: number, totalPlatforms: number, daySeed: number): number {
  const hi = 2200
  const lo = 900
  const ratio = totalPlatforms > 1 ? index / (totalPlatforms - 1) : 0 // 0 是最高，1 是最低
  const linear = Math.round(hi - (hi - lo) * ratio)
  const noise = 0.9 + seededRandom01(daySeed + index * 97) * 0.2 // 0.9 ~ 1.1
  return Math.max(1, Math.round(linear * noise))
}

/**
 * 计算距离下一次 10 分钟边界的毫秒数，用于精确对齐更新节奏。
 */
function msToNextTenMinute(now: Date): number {
  const next = new Date(now)
  const m = now.getMinutes()
  const next10 = Math.floor(m / 10) * 10 + 10
  next.setMinutes(next10, 0, 0) // setMinutes 会自动处理进位
  return Math.max(0, next.getTime() - now.getTime())
}

/**
 * useAssistedCounts
 * @param count 平台数量
 * @returns 按索引对应的平台“今日累计已助力广告数”数组
 */
export function useAssistedCounts(count: number): number[] {
  const [slot, setSlot] = useState<number>(() => getCurrentTenMinSlot(new Date()))

  // 安排对齐 10 分钟边界的更新
  useEffect(() => {
    let intervalId: number | undefined
    const schedule = () => {
      const now = new Date()
      const delay = msToNextTenMinute(now)
      const timeoutId = window.setTimeout(() => {
        setSlot(getCurrentTenMinSlot(new Date()))
        intervalId = window.setInterval(() => {
          setSlot(getCurrentTenMinSlot(new Date()))
        }, 600_000) // 10 分钟
      }, delay)
      return () => {
        window.clearTimeout(timeoutId)
        if (intervalId) window.clearInterval(intervalId)
      }
    }
    const cleanup = schedule()
    return cleanup
  }, [])

  // 计算不同平台的累计已助力量，确保首个最多、之后递减，且日内单调不降。
  const values = useMemo(() => {
    const now = new Date()
    const dayStart = getLocalStartOfDay(now.getTime())
    const daySeed = Math.floor(dayStart / 86_400_000) * 131_542 // 简易日种子
    const totalSlots = 144
    const progress = Math.min(1, Math.max(0, slot / totalSlots))

    const arr: number[] = []
    for (let i = 0; i < count; i++) {
      const dailyTarget = getDailyTargetTotal(i, count, daySeed)
      const cumulative = Math.floor(dailyTarget * progress)
      arr.push(cumulative)
    }
    return arr
  }, [count, slot])

  return values
}

export default useAssistedCounts
