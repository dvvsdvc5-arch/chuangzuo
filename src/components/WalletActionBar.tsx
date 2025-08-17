/**
 * components/WalletActionBar.tsx
 * Wallet actions: Deposit, Withdraw, and Exchange, localized.
 * Visual: three pill buttons in one row with brand gradient.
 */
import React from 'react'
import GreenPillButton from './GreenPillButton'
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export interface WalletActionBarProps {
  /** Optional container className to tweak spacing/layout from parent */
  className?: string
}

/**
 * WalletActionBar
 * Provides three primary wallet actions in a single row.
 */
export default function WalletActionBar({ className = '' }: WalletActionBarProps) {
  const { t } = useTranslation()

  /** Deposit navigates to the new deposit page */
  function handleDepositClick() {}

  /** Placeholder exchange action (replaced by navigation) */
  function handleExchangeClick() {}

  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      <GreenPillButton
        label={t('actions.deposit')}
        icon={<ArrowDownCircle />}
        href="#/deposit"
        fullWidth
      />
      <GreenPillButton
        label={t('actions.exchange', { defaultValue: 'Exchange' })}
        icon={<ArrowLeftRight />}
        href="#/exchange"
        fullWidth
      />
      <GreenPillButton
        label={t('actions.withdraw')}
        icon={<ArrowUpCircle />}
        href="#/withdrawals"
        fullWidth
      />
    </div>
  )
}
