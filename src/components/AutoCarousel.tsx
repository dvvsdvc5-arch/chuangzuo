/**
 * components/AutoCarousel.tsx
 * A lightweight, reusable image carousel with fade transitions.
 * No external dependencies. Accepts an array of image URLs.
 */

import React, { useEffect, useMemo, useState } from 'react'

/**
 * AutoCarouselProps
 * Props interface for the carousel.
 */
export interface AutoCarouselProps {
  /** Image URLs */
  images: string[]
  /** Autoplay interval in ms (default 3500) */
  interval?: number
  /** Optional className for the outer container */
  className?: string
  /** Optional rounded and border styles (applied on container) */
  rounded?: string
  /** Optional aria-label for accessibility */
  ariaLabel?: string
}

/**
 * AutoCarousel
 * Simple fade carousel: cross-fades images on a timer.
 */
export default function AutoCarousel({
  images,
  interval = 3500,
  className = '',
  rounded = 'rounded-2xl',
  ariaLabel = 'image carousel',
}: AutoCarouselProps): JSX.Element {
  const validImages = useMemo(() => images.filter(Boolean), [images])
  const [idx, setIdx] = useState(0)

  // Autoplay advance
  useEffect(() => {
    if (validImages.length <= 1) return
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % validImages.length)
    }, interval)
    return () => clearInterval(t)
  }, [interval, validImages.length])

  // Guard: nothing to render
  if (validImages.length === 0) {
    return (
      <div
        className={`relative overflow-hidden border bg-slate-100 dark:bg-slate-900 dark:border-slate-800 ${rounded} ${className}`}
        aria-label={ariaLabel}
      />
    )
  }

  return (
    <div
      className={`relative overflow-hidden border bg-white dark:bg-slate-900 dark:border-slate-800 ${rounded} ${className}`}
      aria-label={ariaLabel}
    >
      {/* Images (stacked, fade transition) */}
      <div className="absolute inset-0">
        {validImages.map((src, i) => (
          <img
            key={src + i}
            src={src}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
            alt={`slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Gradient overlay for better readability if used with overlay text in future */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-transparent dark:from-black/20" />

      {/* Dots indicator */}
      {validImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {validImages.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-all ${i === idx ? 'bg-white/90 dark:bg-white/90 w-4' : 'bg-white/50 dark:bg-white/50'}`}
              aria-hidden="true"
            />
          ))}
        </div>
      )}
    </div>
  )
}
