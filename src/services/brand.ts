/**
 * services/brand.ts
 * 提供品牌信息获取（名称与 Logo 地址），用于头部与侧边等品牌展示。
 * 已调整为纯本地实现：不发起任何网络请求，避免 404 噪音。
 */

export interface BrandInfo {
  /** 平台名称 */
  name: string
  /** 平台 Logo 图片地址（建议为圆形图或可居中裁剪） */
  logoUrl?: string
}

/**
 * fetchBrandInfo
 * 纯本地：优先读取 localStorage 覆盖项（brand_name / brand_logo），否则返回默认值。
 * 不再请求 /api/brand，彻底消除 404。
 */
export async function fetchBrandInfo(): Promise<BrandInfo> {
  try {
    const name =
      (typeof localStorage !== 'undefined' && localStorage.getItem('brand_name')) || 'CCRC'
    const logo =
      (typeof localStorage !== 'undefined' && localStorage.getItem('brand_logo')) || undefined
    return { name, logoUrl: logo || undefined }
  } catch {
    return { name: 'CCRC' }
  }
}
