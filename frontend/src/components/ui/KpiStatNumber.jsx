import { useEffect, useState } from 'react'
import { Skeleton, Typography, Box } from '@mui/material'

import { useCountUp } from '../../hooks/useCountUp'

function fmtInt(n) {
  const v = Number(n || 0)
  return v.toLocaleString('uk-UA')
}

/**
 * KPI figure — optional slow shimmer + pulse on `pulseVersion` increment.
 */
export default function KpiStatNumber({
  value,
  loading,
  variant = 'h4',
  countUp = true,
  shimmer = false,
  pulseVersion = 0,
  sx = {}
}) {
  const n = Number(value) || 0
  const animated = useCountUp(n, { durationMs: 1600, enabled: countUp && !loading })
  const display = animated
  const [pulseOn, setPulseOn] = useState(false)

  useEffect(() => {
    if (!pulseVersion) return
    setPulseOn(true)
    const t = window.setTimeout(() => setPulseOn(false), 700)
    return () => window.clearTimeout(t)
  }, [pulseVersion])

  if (loading) {
    return (
      <Skeleton
        variant="rounded"
        width={120}
        height={40}
        animation="wave"
        sx={{ mt: 0.75, bgcolor: 'rgba(255,255,255,0.06)' }}
      />
    )
  }

  return (
    <Box
      sx={{
        display: 'inline-block',
        mt: 0.75,
        animation: pulseOn ? 'hl-kpi-pulse-once 0.65s ease-out 1' : 'none'
      }}
    >
      <Typography
        component="div"
        variant={variant}
        className={shimmer ? 'hl-kpi-shimmer' : undefined}
        sx={{
          fontWeight: 800,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          ...(!shimmer && { color: '#ffffff' }),
          ...sx
        }}
      >
        {fmtInt(display)}
      </Typography>
    </Box>
  )
}
