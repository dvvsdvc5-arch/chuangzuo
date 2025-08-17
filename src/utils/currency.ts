/**
 * utils/currency.ts
 * 全局金额格式化工具：统一以 $ 前缀展示，不含其它货币符号或文本。
 */

/**
 * formatDollar
 * 将“分/厘等最小单位”的数值格式化为字符串，前置 $，保留两位小数，带千分位。
 * 负数显示为 -$123.45。
 */
function formatDollar(minor: number): string {
  const sign = minor < 0 ? '-' : ''
  const value = Math.abs(minor) / 100
  const num = new Intl.NumberFormat(undefined, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
  return `${sign}$${num}`
}

/**
 * formatMinor
 * 统一的金额格式化函数（适配全局规范：仅 $ 前缀）。
 * 注意：不再使用传入的 currency 参数，保留参数仅为兼容旧调用。
 */
export function formatMinor(minor: number, _currency = 'USD'): string {
  return formatDollar(minor)
}

/**
 * formatMinorPlain
 * 历史“纯数字”接口现与全局规范保持一致：也返回 $ 前缀金额。
 * 若后续有场景需要无符号版本，可再新增专用函数避免混淆。
 */
export function formatMinorPlain(minor: number): string {
  return formatDollar(minor)
}
