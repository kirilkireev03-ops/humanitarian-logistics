import { useId } from 'react'
import { Box } from '@mui/material'

/** Мінімальна «крижана» ілюстрація для порожніх станів (без зміни текстів). */
export default function IceCrystalIllustration({ size = 72, sx = {} }) {
  const uid = useId().replace(/:/g, '')
  const gidA = `iceCrA-${uid}`
  const gidB = `iceCrB-${uid}`

  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        mx: 'auto',
        mb: 1.5,
        opacity: 0.92,
        filter: 'drop-shadow(0 0 18px rgba(0, 224, 255, 0.35)) drop-shadow(0 0 28px rgba(0, 163, 255, 0.2))',
        ...sx
      }}
    >
      <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={gidA} x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#33FFE3" />
            <stop offset="0.45" stopColor="#00E0FF" />
            <stop offset="1" stopColor="#00A3FF" />
          </linearGradient>
          <linearGradient id={gidB} x1="8" y1="32" x2="56" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00A3FF" stopOpacity="0.2" />
            <stop offset="0.5" stopColor="#33FFE3" stopOpacity="0.85" />
            <stop offset="1" stopColor="#00E0FF" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <path
          d="M32 6L38 22L54 22L42 32L48 48L32 38L16 48L22 32L10 22L26 22L32 6Z"
          stroke={`url(#${gidB})`}
          strokeWidth="1.2"
          fill={`url(#${gidA})`}
          fillOpacity="0.35"
        />
        <path d="M32 14V50M18 32H46" stroke="#33FFE3" strokeOpacity="0.55" strokeWidth="1" />
        <circle cx="32" cy="32" r="3.5" fill="#33FFE3" fillOpacity="0.9" />
      </svg>
    </Box>
  )
}
