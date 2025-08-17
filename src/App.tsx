/**
 * App.tsx
 * Routing entry with auth guard and theme provider.
 * - /login is public and standalone (no AppLayout)
 * - All other routes are protected by auth; when unauthenticated, redirect to /login
 */

import './i18n'
import './styles/icon-overrides.css'
import './styles/typography.css'
import { HashRouter, Route, Routes, useNavigate } from 'react-router'
import HomePage from './pages/Home'
import LedgerPage from './pages/Ledger'
import WalletPage from './pages/Wallet'
import WithdrawalsPage from './pages/Withdrawals'
import DepositPage from './pages/Deposit'
import KYCPage from './pages/KYC'
import ReferralsPage from './pages/Referrals'
import SettingsPage from './pages/Settings'
import AppLayout from './components/layout/AppLayout'
import RunPage from './pages/Run'
import NotificationsPage from './pages/Notifications'
import ProfileEditPage from './pages/ProfileEdit'
import GASetupPage from './pages/GASetup'
import AboutPage from './pages/About'
import { ThemeProvider } from 'next-themes'
import DepositRecordsPage from './pages/DepositRecords'
import WithdrawalRecordsPage from './pages/WithdrawalRecords'
import ExchangePage from './pages/Exchange'
import ExchangeRecordsPage from './pages/ExchangeRecords'
import TransferPage from './pages/Transfer'
import MonthlyYieldInjector from './components/run/MonthlyYieldInjector'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import { useAuthStore } from './store/authStore'
import React, { useEffect } from 'react'
import { api } from './services/apiClient'
import DataSyncBootstrapper from './components/system/DataSyncBootstrapper'
import ErrorBoundary from './components/system/ErrorBoundary'
import NetworkToolsPage from './pages/Network'

/**
 * RedirectToLogin
 * Imperative redirect helper when unauthenticated.
 */
function RedirectToLogin() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/login', { replace: true })
  }, [navigate])
  return null
}

/**
 * ProtectedApp
 * Wraps protected routes inside AppLayout.
 */
function ProtectedApp() {
  const isAuthed = useAuthStore((s) => s.isAuthed)
  if (!isAuthed) {
    return <RedirectToLogin />
  }
  return (
    <div className="font-sans">
      <AppLayout>
        <ErrorBoundary>
          {/* Run 页面专用的“月收益提示”注入器（非侵入实现） */}
          <MonthlyYieldInjector />
          {/* 全局数据引导器：登录后首次进入时拉取 user / wallet / ledger 并写入 store */}
          <DataSyncBootstrapper />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/ledger" element={<LedgerPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/withdrawals" element={<WithdrawalsPage />} />
            <Route path="/withdrawal-records" element={<WithdrawalRecordsPage />} />
            <Route path="/deposit" element={<DepositPage />} />
            <Route path="/deposit-records" element={<DepositRecordsPage />} />
            <Route path="/kyc" element={<KYCPage />} />
            <Route path="/referrals" element={<ReferralsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/run" element={<RunPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            {/* Profile edit */}
            <Route path="/profile" element={<ProfileEditPage />} />
            {/* Google Authenticator setup */}
            <Route path="/ga" element={<GASetupPage />} />
            {/* About the Platform */}
            <Route path="/about" element={<AboutPage />} />
            {/* Exchange */}
            <Route path="/exchange" element={<ExchangePage />} />
            {/* Exchange Records */}
            <Route path="/exchange-records" element={<ExchangeRecordsPage />} />
            {/* Internal Transfer */}
            <Route path="/transfer" element={<TransferPage />} />
            {/* Network Tools (no console needed) */}
            <Route path="/network" element={<NetworkToolsPage />} />
          </Routes>
        </ErrorBoundary>
      </AppLayout>
    </div>
  )
}

/**
 * App
 * Router composition with public /login and protected app routes.
 * Add a one-time API health check (console only) to verify connectivity.
 */
export default function App() {
  useEffect(() => {
    api
      .health()
      .then((h) => {
        // eslint-disable-next-line no-console
        console.log('[api] health ok:', h)
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.warn('[api] health failed:', e?.message || e)
      })
  }, [])
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <HashRouter>
        <Routes>
          {/* Public pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          {/* Protected section (catch-all) */}
          <Route path="/*" element={<ProtectedApp />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  )
}
