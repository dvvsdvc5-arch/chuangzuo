/**
 * components/HeaderIcon.tsx
 * Reusable header icon-only button with optional numeric badge.
 */
import React from 'react'

/**
 * HeaderIconProps
 * Props for the icon-only header action.
 */
export interface HeaderIconProps {
  /** Accessible label for screen readers */
  label: string
  /** Optional link; if provided renders as anchor, else as button */
  href?: string
  /** Icon component from lucide-react */
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Optional unread count badge (shown when > 0) */
  badgeCount?: number
  /** Optional click handler (used when href is not provided) */
  onClick?: () => void
}

/**
 * HeaderIcon
 * Renders a circular icon-only control with subtle border, shadow and hover.
 * Shows a small red badge with a number when badgeCount > 0.
 */
export default function HeaderIcon({ label, href, Icon, badgeCount = 0, onClick }: HeaderIconProps) {
  const content = (
    <span
      className="
        relative inline-flex h-9 w-9 items-center justify-center
        rounded-full border border-slate-200 bg-white
        text-slate-600 hover:text-slate-900 hover:bg-slate-50
        shadow-sm transition-colors
      "
      aria-label={label}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      {badgeCount > 0 && (
        <span
          aria-label={`${badgeCount} unread`}
          className="
            absolute -top-1 -right-1
            min-w-4 h-4 px-1
            rounded-full bg-rose-500 text-white
            text-[10px] leading-4 font-semibold
            flex items-center justify-center
            shadow-md
          "
        >
          {badgeCount}
        </span>
      )}
    </span>
  )

  if (href) {
    return (
      <a href={href} aria-label={label} className="inline-flex" onClick={onClick}>
        {content}
      </a>
    )
  }

  return (
    <button type="button" aria-label={label} className="inline-flex" onClick={onClick}>
      {content}
    </button>
  )
}
