/**
 * pages/Ledger.tsx
 * Ledger 页面：移除页面内部标题，改由顶栏在 Ledger 路由显示居中标题。
 */
import LedgerTable from '../components/LedgerTable'
import { useAppStore } from '../store/appStore'

/**
 * LedgerPage
 * 渲染账单表格；不再在页面内部显示标题，避免与顶栏重复。
 */
export default function LedgerPage() {
  const { ledger } = useAppStore()
  return (
    <div className="space-y-4">
      <LedgerTable entries={ledger} />
    </div>
  )
}
