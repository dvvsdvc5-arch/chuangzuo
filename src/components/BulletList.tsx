/**
 * components/BulletList.tsx
 * A resilient bullet list that safely renders arrays of items.
 * It normalizes non-array inputs (string, ReactNode, null/undefined) into an array
 * to avoid "items.map is not a function" runtime errors.
 */

import React from 'react'

/**
 * BulletListProps
 * Props for the bullet list component.
 */
export interface BulletListProps {
  /**
   * Items to render. Can be:
   * - React.ReactNode[]
   * - single React.ReactNode (string/element)
   * - null/undefined
   */
  items: React.ReactNode[] | React.ReactNode | null | undefined
  /** Optional outer className */
  className?: string
  /** If true, use tighter spacing and smaller font */
  dense?: boolean
  /** Custom leading icon for each item (e.g., <span>•</span>) */
  icon?: React.ReactNode
  /** List container tag: 'ul' | 'ol' | 'div' (default: 'ul') */
  as?: 'ul' | 'ol' | 'div'
}

/**
 * normalizeItems
 * Convert arbitrary input into an array of nodes.
 */
function normalizeItems(input: BulletListProps['items']): React.ReactNode[] {
  if (Array.isArray(input)) return input.filter(Boolean)
  if (input === null || input === undefined) return []
  return [input]
}

/**
 * BulletList
 * Renders a semantic list with safe item mapping.
 */
export default function BulletList({
  items,
  className = '',
  dense = false,
  icon,
  as = 'ul',
}: BulletListProps) {
  const list = normalizeItems(items)
  if (list.length === 0) return null

  const Tag = as as any
  const textSize = dense ? 'text-xs' : 'text-sm'
  const gapY = dense ? 'space-y-1' : 'space-y-1.5'

  // If developer wants default bullets, we keep list-disc for ul/ol only
  const defaultListStyle =
    as === 'ul' || as === 'ol' ? 'list-disc pl-5' : ''

  return (
    <Tag className={[defaultListStyle, textSize, gapY, className].join(' ')}>
      {list.map((item, idx) => {
        // If a custom icon is provided, render as flex row to place the icon
        if (icon) {
          return (
            <div
              key={idx}
              className="flex items-start gap-2 text-slate-700 dark:text-slate-300"
              role={as === 'div' ? 'listitem' : undefined}
            >
              <span className="mt-1.5 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden="true">
                {icon}
              </span>
              <span className="min-w-0">{item}</span>
            </div>
          )
        }
        // Semantic li when using ul/ol
        if (as === 'ul' || as === 'ol') {
          return (
            <li key={idx} className="text-slate-700 dark:text-slate-300">
              {item}
            </li>
          )
        }
        // Fallback div items
        return (
          <div key={idx} className="text-slate-700 dark:text-slate-300" role="listitem">
            {item}
          </div>
        )
      })}
    </Tag>
  )
}
