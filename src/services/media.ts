/**
 * services/media.ts
 * Backend media fetching helpers for hero carousel with graceful fallback.
 */

/**
 * HeroImage
 * Contract copied to avoid circular import from components.
 */
export interface HeroImage {
  id: string
  src: string
  alt?: string
  href?: string
}

/**
 * fetchHeroImages
 * Fetches hero images from backend endpoint `/api/hero-images`.
 * If the request fails or returns empty, fallback to smart placeholder images.
 */
export async function fetchHeroImages(): Promise<HeroImage[]> {
  try {
    const res = await fetch('/api/hero-images', { method: 'GET' })
    if (res.ok) {
      const data = (await res.json()) as unknown
      // Basic runtime validation
      if (Array.isArray(data)) {
        const mapped = data
          .map((item: any, idx: number) => {
            if (typeof item?.src === 'string') {
              return {
                id: String(item.id ?? idx),
                src: String(item.src),
                alt: typeof item.alt === 'string' ? item.alt : undefined,
                href: typeof item.href === 'string' ? item.href : undefined,
              } as HeroImage
            }
            return null
          })
          .filter(Boolean) as HeroImage[]
        if (mapped.length > 0) return mapped
      }
    }
  } catch {
    // ignore and use fallback
  }

  // Fallback: smart placeholders to avoid blank UI
  return [
    { id: 'ph-1', src: 'https://pub-cdn.sider.ai/u/U05XH90O53X/web-coder/689bf295a616cfbf067042a3/resource/e8255c1b-5ad4-4276-b0ac-10206050c2c1.jpg', alt: 'Finance' },
    { id: 'ph-2', src: 'https://pub-cdn.sider.ai/u/U05XH90O53X/web-coder/689bf295a616cfbf067042a3/resource/67de0242-a080-4377-ad4c-dc8e352f71d1.jpg', alt: 'Investment' },
    { id: 'ph-3', src: 'https://pub-cdn.sider.ai/u/U05XH90O53X/web-coder/689bf295a616cfbf067042a3/resource/c321af4a-7742-4e5a-bcbf-ac3d445041a8.jpg', alt: 'Growth' },
  ]
}
