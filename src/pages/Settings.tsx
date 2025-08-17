/**
 * pages/Settings.tsx
 * Settings page that aggregates all quick settings:
 * - Profile Edit
 * - Language
 * - Change Password
 * - KYC
 * - Google Authenticator
 * - About
 * - Logout
 * Leverages WalletQuickSettings for a complete, localized experience.
 */
import React from 'react'
import { useTranslation } from 'react-i18next'
import WalletQuickSettings from '../components/WalletQuickSettings'

/**
 * SettingsPage
 * Renders the full quick settings list with sections and actions.
 */
export default function SettingsPage(): JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Page title */}
      <h2 className="text-xl font-semibold tracking-tight">
        {t('nav.settings')}
      </h2>

      {/* Full quick settings (account/security/platform) */}
      <WalletQuickSettings />
    </div>
  )
}
