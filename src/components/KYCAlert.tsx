/**
 * components/KYCAlert.tsx
 * Inline alert prompting users to complete KYC.
 * Dark mode: adds darker background and softer text colors.
 */
import { ShieldAlert } from 'lucide-react'

/**
 * KYCAlertProps
 * Props for the KYC alert component.
 */
interface KYCAlertProps {
  status: 'NOT_STARTED' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED'
}

/**
 * KYCAlert
 * Shows context-aware message based on KYC status.
 */
export default function KYCAlert({ status }: KYCAlertProps) {
  if (status === 'VERIFIED') return null
  const message =
    status === 'NOT_STARTED'
      ? 'Complete KYC to enable withdrawals.'
      : status === 'IN_REVIEW'
      ? 'Your KYC is under review. Withdrawals will be available once verified.'
      : 'Your KYC was rejected. Please resubmit.'

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-3 flex items-start gap-2 dark:border-amber-400/40 dark:bg-amber-950 dark:text-amber-100">
      <ShieldAlert className="h-5 w-5 mt-0.5" />
      <div>
        <div className="font-medium">KYC Required</div>
        <div className="text-sm">{message} <a href="#/kyc" className="underline hover:no-underline">Go to KYC</a>.</div>
      </div>
    </div>
  )
}
