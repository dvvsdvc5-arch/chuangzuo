/**
 * pages/Wallet.tsx
 * Wallet overview page showing user identity, action bar, and KPI summary.
 * 回滚：WalletKPIGroup 改回独立卡片布局（separate），仍仅展示余额与总收益两项指标。
 * 新增：页面底部添加“快捷设置”分组（账户/安全/平台）。
 */
import { useAppStore } from '../store/appStore'
import UserIdentityCard from '../components/UserIdentityCard'
import WalletKPIGroup from '../components/WalletKPIGroup'
import WalletActionBar from '../components/WalletActionBar'
import WalletQuickSettings from '../components/WalletQuickSettings'

/**
 * WalletPage
 * Displays wallet user identity and KPI group, plus action bar for deposit/withdraw and quick settings.
 */
export default function WalletPage() {
  const { user } = useAppStore()

  return (
    <div className="space-y-4">
      {/* 个人信息：圆形头像（居中） + 姓名 + 账户ID；头像来自全局 user.avatarUrl */}
      <UserIdentityCard name={user.name} accountId={user.id} avatarUrl={(user as any).avatarUrl} orientation="vertical" />

      {/* 行动按钮：品牌主色长半圆按钮，紧跟在用户信息卡片下方 */}
      <WalletActionBar />

      {/* 指标组：仅保留余额与总收益；使用独立卡片并排显示（默认 separate） */}
      <WalletKPIGroup size="sm" metrics={['balance', 'total']} />

      {/* 快捷设置：账户 / 安全 / 平台 */}
      <WalletQuickSettings />
    </div>
  )
}
