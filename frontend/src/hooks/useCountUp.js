import { useEffect, useState } from 'react'

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3
}

/**
 * Animates from 0 to `end` over `durationMs`. Respects reduced motion via `prefersReducedMotion`.
 */
export function useCountUp(end, { durationMs = 1400, enabled = true } = {}) {
  const [value, setValue] = useState(() => (enabled ? 0 : end))
  const target = Number(end) || 0

  useEffect(() => {
    if (!enabled) {
      setValue(target)
      return
    }
    let raf = 0
    const reduce =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setValue(target)
      return
    }

    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs)
      setValue(Math.round(easeOutCubic(t) * target))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs, enabled])

  return value
}
