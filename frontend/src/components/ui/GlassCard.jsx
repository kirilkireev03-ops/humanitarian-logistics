import { useCallback, useRef } from 'react'
import { Box } from '@mui/material'
import { useReducedMotion } from 'framer-motion'

import {
  glassBackdrop,
  glassBorderGradient,
  glassCardSurface,
  glassInsetHighlight,
  midnightBg,
  premiumTransition
} from '../../theme/glassTokens'

/**
 * Midnight Amethyst glass — hover spotlight, no loud card fills.
 */
export default function GlassCard({
  children,
  interactive = true,
  aurora = false,
  radius = 16,
  padding = 2,
  sx = {},
  innerSx = {},
  ...boxProps
}) {
  const reduceMotion = useReducedMotion()
  const hoverOff = !interactive || reduceMotion
  const rootRef = useRef(null)

  const onPointerMove = useCallback(
    (e) => {
      if (hoverOff) return
      const el = rootRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const x = ((e.clientX - r.left) / r.width) * 100
      const y = ((e.clientY - r.top) / r.height) * 100
      el.style.setProperty('--hl-spot-x', `${x}%`)
      el.style.setProperty('--hl-spot-y', `${y}%`)
      el.style.setProperty('--hl-spot-op', '1')
    },
    [hoverOff]
  )

  const onPointerLeave = useCallback(() => {
    rootRef.current?.style.setProperty('--hl-spot-op', '0')
  }, [])

  return (
    <Box
      ref={rootRef}
      {...boxProps}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      sx={{
        '--hl-spot-x': '50%',
        '--hl-spot-y': '50%',
        '--hl-spot-op': 0,
        position: 'relative',
        p: '1px',
        borderRadius: `${radius}px`,
        background: glassBorderGradient,
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.55)',
        transition: premiumTransition,
        ...(!hoverOff && {
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.62), 0 0 36px rgba(76, 29, 149, 0.15)'
          }
        }),
        ...sx
      }}
    >
      <Box
        className="hl-glass-inner"
        sx={{
          position: 'relative',
          borderRadius: `${Math.max(radius - 1, 12)}px`,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: midnightBg,
          backgroundImage: glassCardSurface,
          backdropFilter: glassBackdrop,
          WebkitBackdropFilter: glassBackdrop,
          boxShadow: glassInsetHighlight,
          p: padding,
          height: '100%',
          overflow: 'hidden',
          transition: premiumTransition,
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            opacity: 'calc(var(--hl-spot-op, 0) * 0.95)',
            transition: 'opacity 0.35s ease',
            background:
              'radial-gradient(520px circle at var(--hl-spot-x, 50%) var(--hl-spot-y, 50%), rgba(139, 92, 246, 0.22), rgba(49, 46, 129, 0.1) 38%, transparent 58%)',
            mixBlendMode: 'screen'
          },
          ...innerSx
        }}
      >
        {aurora ? (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: '-35%',
              opacity: reduceMotion ? 0.04 : 0.14,
              pointerEvents: 'none',
              background:
                'radial-gradient(ellipse 55% 45% at 55% 25%, rgba(76, 29, 149, 0.35), transparent 62%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(15, 10, 30, 0.5), transparent 55%)',
              filter: 'blur(48px)'
            }}
          />
        ) : null}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            flex: 1,
            minHeight: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch'
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}