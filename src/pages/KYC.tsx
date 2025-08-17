/**
 * pages/KYC.tsx
 * KYC 实名验证页面：证件类型选择（护照/身份证/驾驶证）、姓名、证件号、证件照片上传。
 * 更新：
 * - 上传成功后仅显示照片，不显示文件名与任何操作按钮。
 * - 移除表单上方的“标题 + 状态徽章”，避免与顶部居中标题重复。
 */

import { useMemo, useRef, useState } from 'react'
import { useAppStore } from '../store/appStore'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useTranslation } from 'react-i18next'
import { Car, Globe, IdCard, ImagePlus } from 'lucide-react'

/**
 * DocType
 * 支持的证件类型
 */
type DocType = 'PASSPORT' | 'ID_CARD' | 'DRIVER_LICENSE'

/**
 * DocTypeOption
 * 用于渲染证件类型卡片的数据接口。
 */
interface DocTypeOption {
  key: DocType
  label: string
  Icon: React.ComponentType<{ className?: string }>
}

/**
 * isImageFile
 * 判断文件是否为图片类型。
 */
function isImageFile(file: File) {
  return file.type.startsWith('image/')
}

/**
 * KYCPage
 * 提交实名信息的表单，包含证件类型、姓名、证件号与证件照片。
 * 交互：上传成功后仅显示照片，不显示文件名和操作按钮。
 * 结构：移除了表单上方的标题与状态徽章（由全局 Header 承担）。
 */
export default function KYCPage() {
  const { user, submitKYC } = useAppStore()
  const { t } = useTranslation()

  // 表单状态
  const [docType, setDocType] = useState<DocType>('ID_CARD')
  const [fullName, setFullName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  /**
   * docOptions
   * 三种证件类型的配置（多语言标签）
   */
  const docOptions: DocTypeOption[] = useMemo(
    () => [
      { key: 'PASSPORT', label: t('settings.kyc.docType.passport'), Icon: Globe },
      { key: 'ID_CARD', label: t('settings.kyc.docType.idCard'), Icon: IdCard },
      { key: 'DRIVER_LICENSE', label: t('settings.kyc.docType.driverLicense'), Icon: Car },
    ],
    [t],
  )

  /**
   * handlePickImage
   * 触发文件选择。
   */
  function handlePickImage() {
    fileInputRef.current?.click()
  }

  /**
   * handleFileChange
   * 图片校验（类型/大小）+ 预览
   */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const MAX = 2 * 1024 * 1024 // 2MB
    if (!isImageFile(file)) {
      setError(t('settings.profileEdit.errors.notImage'))
      return
    }
    if (file.size > MAX) {
      setError(t('settings.profileEdit.errors.tooLarge'))
      return
    }
    setError(null)
    setPhotoFile(file)
    const url = URL.createObjectURL(file)
    setPhotoPreview(url)
  }

  /**
   * handleSubmit
   * 提交 mock KYC，切换至 IN_REVIEW。
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // 前端校验：必填 + 图片
    if (!fullName.trim() || !idNumber.trim()) return
    if (!photoFile) {
      setError(t('settings.kyc.errors.photoRequired'))
      return
    }
    setLoading(true)
    try {
      // 现有 store 仅接受 { fullName, idNumber }，此处保持兼容
      await submitKYC({ fullName, idNumber })
    } finally {
      setLoading(false)
    }
  }

  const submitDisabled = loading || !fullName.trim() || !idNumber.trim() || !photoFile

  return (
    <div className="space-y-4">
      {/* 表单：仅在未 Verified 时显示 */}
      {user.kycStatus !== 'VERIFIED' && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-white/70 backdrop-blur p-4 md:p-5 max-w-2xl space-y-4 dark:bg-slate-900/70 dark:border-slate-800"
        >
          {/* 证件类型 */}
          <div className="space-y-2">
            <Label>{t('settings.kyc.docType.title')}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {docOptions.map(({ key, label, Icon }) => {
                const active = docType === key
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setDocType(key)}
                    className={[
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all',
                      'hover:bg-slate-50 dark:hover:bg-slate-800/60',
                      active
                        ? 'border-indigo-300/60 bg-gradient-to-br from-indigo-50 to-cyan-50 shadow-sm dark:from-slate-800 dark:to-slate-800/70 dark:border-slate-700'
                        : 'border-slate-200 dark:border-slate-800',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'inline-flex h-8 w-8 items-center justify-center rounded-md',
                        active
                          ? 'bg-gradient-to-br from-indigo-500 to-cyan-500 text-white'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                      ].join(' ')}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 姓名 */}
          <div className="grid gap-2">
            <Label htmlFor="fullName">{t('settings.kyc.fields.fullName')}</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('settings.kyc.placeholders.fullName') || 'Jane Doe'}
            />
          </div>

          {/* 证件号 */}
          <div className="grid gap-2">
            <Label htmlFor="idNumber">{t('settings.kyc.fields.idNumber')}</Label>
            <Input
              id="idNumber"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder={t('settings.kyc.placeholders.idNumber') || 'ABC123456'}
            />
          </div>

          {/* 证件照片上传 */}
          <div className="grid gap-2">
            <Label htmlFor="docPhoto">{t('settings.kyc.fields.photo')}</Label>

            {/* 上传成功后仅显示照片 */}
            {photoPreview ? (
              <div className="rounded-lg border bg-white/60 p-3 dark:bg-slate-900/60 dark:border-slate-800">
                <img
                  src={photoPreview}
                  alt="document preview"
                  className="w-full max-w-full max-h-80 sm:max-h-96 object-contain rounded-md border border-slate-200 dark:border-slate-800"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePickImage}
                className="w-full rounded-lg border border-dashed p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:border-slate-800"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow">
                  <ImagePlus className="h-6 w-6" />
                </div>
                <div className="mt-2 text-sm font-medium">{t('settings.kyc.upload.cta')}</div>
                <div className="mt-1 text-xs text-slate-500">{t('settings.kyc.tips.photo')}</div>
              </button>
            )}

            {/* 隐藏 input */}
            <input
              id="docPhoto"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {error && <p className="text-xs text-rose-600">{error}</p>}
          </div>

          {/* 操作按钮：仅“提交审核” */}
          <div className="flex items-center gap-2 pt-1">
            <Button type="submit" disabled={submitDisabled}>
              {loading ? t('settings.kyc.submitting') : t('settings.kyc.submit')}
            </Button>
          </div>

          {/* 备注说明 */}
          <div className="text-xs text-slate-500">{t('settings.kyc.note')}</div>
        </form>
      )}

      {/* 已通过状态提示 */}
      {user.kycStatus === 'VERIFIED' && (
        <div className="rounded-xl border bg-emerald-50 text-emerald-900 border-emerald-200 p-4">
          {t('settings.kyc.verifiedTip')}
        </div>
      )}
    </div>
  )
}
