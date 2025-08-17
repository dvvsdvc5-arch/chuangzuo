/**
 * pages/Run.tsx
 * “运行”页面：地址绑定 + 运行控制 + 订单列表（时间/利润/平台）。
 * 现在接入 useRunOrderEngine：
 * - 每天 50~100 单的订单计划；
 * - 单笔利润基于“投入资金 × 当月收益率/30”的日目标值分配（<10k: 30%~40%/月；≥10k: 60%~80%/月）；
 * - 每单生成时写入账本（EARN，正向，单位分），Run 面板“今日收益”自动累计。
 */

import React, { useEffect, useRef, useState } from 'react'
import RunAddressBinder from '../components/run/RunAddressBinder'
import RunControlPanel from '../components/run/RunControlPanel'
import OrderItem, { type OrderItemProps } from '../components/run/OrderItem'
import { useTranslation } from 'react-i18next'
import useRunOrderEngine, { type OrderPayload } from '../hooks/useRunOrderEngine'
import { useAppStore } from '../store/appStore'

/**
 * Order
 * 页面内部使用的订单模型。
 */
interface Order extends Omit<OrderItemProps, 'id'> {
  id: string
}

/**
 * createMockId
 * 生成订单ID。
 */
function createMockId() {
  return Math.random().toString(36).slice(2, 9)
}

/**
 * RunPage
 * 组合地址绑定、控制面板与订单列表。
 */
export default function RunPage(): JSX.Element {
  const { t } = useTranslation()
  const wallet = useAppStore((s) => s.wallet)

  const [address, setAddress] = useState<string | null>(() => localStorage.getItem('run_payout_address'))
  const [orders, setOrders] = useState<Order[]>([])

  // 运行标志（用于引擎）
  const [running, setRunning] = useState<boolean>(localStorage.getItem('run_running') === '1')
  const runningRef = useRef<boolean>(running)

  useEffect(() => {
    runningRef.current = running
  }, [running])

  /** 引擎：按计划生成订单；生成时写入账本（EARN）与 UI 列表 */
  useRunOrderEngine({
    running,
    // 防御：当 wallet 未拉取成功（例如首次 /auth/me 401）时使用 0 作为基数，避免页面崩溃
    investMinor: wallet?.pendingMinor ?? 0,
    onOrder: (o: OrderPayload) => {
      // 1) 写入 UI 列表（最多保留 100 条）
      setOrders((prev) => {
        const item: Order = {
          id: createMockId(),
          ts: o.ts,
          profit: +(o.profitUsd.toFixed(2)),
          platform: o.platform,
          symbol: o.symbol,
        }
        const list = [item, ...prev]
        return list.slice(0, 100)
      })

      // 2) 写入账本（EARN，正向），单位分
      const nowISO = new Date(o.ts).toISOString()
      const amountMinor = Math.round(o.profitUsd * 100)
      useAppStore.setState((s) => ({
        ledger: [
          {
            id: 'l_' + Math.random().toString(36).slice(2, 9),
            type: 'EARN',
            amountMinor,
            currency: 'USD',
            createdAt: nowISO,
            refId: 'run-order',
            meta: { platform: o.platform, symbol: o.symbol },
          },
          ...s.ledger,
        ],
      }))
    },
  })

  /** 运行状态回调：来自控制面板 */
  function handleStart() {
    setRunning(true)
  }
  function handleStop() {
    setRunning(false)
  }

  return (
    <div className="space-y-4">
      {/* 顶部两列：左侧地址，右侧控制 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RunAddressBinder onChange={(v) => setAddress(v)} />
        <RunControlPanel hasAddress={!!address} onStart={handleStart} onStop={handleStop} />
      </div>

      {/* 订单列表（演示随机订单 + 当天累计写入账本） */}
      <section className="rounded-xl border bg-white/70 backdrop-blur p-4 dark:bg-slate-900/70 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">{t('run.orders')}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {orders.length} {orders.length === 1 ? 'item' : 'items'}
          </div>
        </div>

        <div className="mt-3">
          {orders.length === 0 ? (
            <div className="text-sm text-slate-600 dark:text-slate-400">{t('run.noOrders')}</div>
          ) : (
            <ul className="space-y-2">
              {orders.map((o) => (
                <OrderItem key={o.id} {...o} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
