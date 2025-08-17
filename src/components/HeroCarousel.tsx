/**
 * components/HeroCarousel.tsx
 * Reusable hero image carousel with autoplay, arrows, dots, and optional overlay.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useEmblaCarousel, { EmblaOptionsType, EmblaCarouselType } from 'embla-carousel-react'
import { Button } from './ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * HeroImage
 * Single hero image metadata.
 */
export interface HeroImage {
  /** Unique id for the image item */
  id: string
  /** Image source url */
  src: string
  /** Optional alt text for accessibility */
  alt?: string
  /** Optional link to open when clicking the slide */
  href?: string
}

/**
 * HeroCarouselProps
 * Props for the HeroCarousel component.
 */
interface HeroCarouselProps {
  /** Images to render into the carousel */
  images: HeroImage[]
  /** Optional overlay content (e.g., headline, CTA) */
  overlay?: React.ReactNode
  /** Embla carousel options */
  options?: EmblaOptionsType
  /** Autoplay interval in ms (default: 4000) */
  autoplayMs?: number
}

/**
 * HeroCarousel
 * A responsive 16:9 hero carousel with autoplay, navigation, and dots indicator.
 */
export default function HeroCarousel({
  images,
  overlay,
  options,
  autoplayMs = 4000,
}: HeroCarouselProps) {
  const [viewportRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    ...options,
  })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const timerRef = useRef<number | null>(null)
  const isHoveredRef = useRef(false)

  /** Setup selected index update from embla */
  const onSelect = useCallback((api: EmblaCarouselType) => {
    setSelectedIndex(api.selectedScrollSnap())
  }, [])

  /** Start autoplay timer */
  const start = useCallback(() => {
    // Do not start while hovered (desktop) for better UX
    if (isHoveredRef.current) return
    stop()
    timerRef.current = window.setInterval(() => {
      if (emblaApi) emblaApi.scrollNext()
    }, autoplayMs)
  }, [emblaApi, autoplayMs])

  /** Stop autoplay timer */
  const stop = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  /** Embla lifecycle: subscribe to select and re-init autoplay */
  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', () => onSelect(emblaApi))
    emblaApi.on('reInit', () => {
      onSelect(emblaApi)
      start()
    })
    onSelect(emblaApi)
    start()
    return () => stop()
  }, [emblaApi, onSelect, start, stop])

  /** Hover handlers (desktop pause on hover) */
  const onMouseEnter = useCallback(() => {
    isHoveredRef.current = true
    stop()
  }, [stop])

  const onMouseLeave = useCallback(() => {
    isHoveredRef.current = false
    start()
  }, [start])

  /** Memoize slides to avoid re-render flicker */
  const slides = useMemo(
    () =>
      images.map((img) => (
        <div className="min-w-0 flex-[0_0_100%] relative" key={img.id}>
          {img.href ? (
            <a href={img.href} aria-label={img.alt || 'hero slide'}>
              <img src={img.src} alt={img.alt || ''} className="h-full w-full object-cover" />
            </a>
          ) : (
            <img src={img.src} alt={img.alt || ''} className="h-full w-full object-cover" />
          )}
        </div>
      )),
    [images],
  )

  return (
    <div
      className="relative rounded-xl border overflow-hidden bg-white"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Viewport with fixed aspect for smooth layout */}
      <div className="aspect-[16/9] w-full" ref={viewportRef}>
        <div className="h-full flex">{slides}</div>
      </div>

      {/* Overlay content (e.g. headline + CTA) */}
      {overlay ? (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
            <div className="pointer-events-auto text-white">{overlay}</div>
          </div>
        </div>
      ) : null}

      {/* Arrows */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between p-2">
        <Button
          variant="outline"
          size="icon"
          className="pointer-events-auto bg-transparent bg-white/70 hover:bg-white"
          aria-label="Previous slide"
          onClick={() => emblaApi?.scrollPrev()}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="pointer-events-auto bg-transparent bg-white/70 hover:bg-white"
          aria-label="Next slide"
          onClick={() => emblaApi?.scrollNext()}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/30 rounded-full px-2 py-1">
        {images.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === selectedIndex ? 'w-5 bg-white' : 'w-2 bg-white/70 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
