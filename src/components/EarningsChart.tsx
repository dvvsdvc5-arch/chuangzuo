/**
 * components/EarningsChart.tsx
 * Area/line chart for daily earnings using Recharts.
 */
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

/**
 * EarningsPoint
 * Represents a daily datapoint in the earnings chart.
 */
export interface EarningsPoint {
  day: string
  amount: number
}

/**
 * EarningsChartProps
 * Props for the earnings chart.
 */
interface EarningsChartProps {
  data: EarningsPoint[]
  currency: string
}

/**
 * formatCurrency
 * Formats a number into a currency string (frontend display only).
 */
function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

/**
 * EarningsChart
 * Displays an area chart of daily earnings.
 */
export default function EarningsChart({ data, currency }: EarningsChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 6, right: 6, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v, currency)} width={80} />
          <Tooltip
            formatter={(v: number) => formatCurrency(v, currency)}
            contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0' }}
          />
          <Area type="monotone" dataKey="amount" stroke="#6366F1" fill="url(#earningsGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
