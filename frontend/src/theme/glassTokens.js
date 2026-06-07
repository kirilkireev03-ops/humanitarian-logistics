/**
 * Midnight Amethyst — ultra-dark panels, cold violet depth only (no mud).
 */
export const midnightBg = '#0B0914'
export const midnightDeep = '#130F25'

/** Outer ring — deep indigo / amethyst only */
export const glassBorderGradient =
  'linear-gradient(135deg, rgba(45, 27, 78, 0.65) 0%, rgba(15, 10, 26, 0.5) 42%, rgba(59, 7, 100, 0.55) 100%)'

/** Card face — barely perceptible black-purple → void violet */
export const glassInnerBg = `linear-gradient(168deg, #0E0A17 0%, ${midnightBg} 46%, #100C1C 100%)`

export const glassCardSurface = `linear-gradient(168deg, rgba(14, 10, 23, 0.99) 0%, rgba(11, 9, 20, 1) 48%, rgba(19, 15, 37, 0.98) 100%)`

export const glassBackdrop = 'blur(20px)'

export const glassInsetHighlight = 'inset 0 1px 0 0 rgba(255, 255, 255, 0.07)'

export const premiumTransition = 'all 0.3s ease-out'

/** Primary CTA — indigo / violet only */
export const accentOceanGradient = 'linear-gradient(90deg, #312E81 0%, #6366F1 45%, #7C3AED 100%)'

export const arcticAccent = {
  icyBlue: '#00E5FF',
  arcticTeal: '#00FFA3',
  electricBlue: '#00E5FF',
  coolPink: '#C084FC',
  deepIndigo: '#6366F1',
  paleGold: '#A78BFA'
}

export const springMicro = { type: 'spring', stiffness: 380, damping: 36, mass: 0.9 }

export const arcticMuted = '#A1A1AA'

const tooltipShell = {
  backgroundColor: 'rgba(11, 9, 20, 0.96)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 12,
  boxShadow: `${glassInsetHighlight}, 0 20px 48px rgba(0,0,0,0.65), 0 0 40px rgba(76, 29, 149, 0.18)`,
  padding: '12px 14px',
  backdropFilter: glassBackdrop,
  WebkitBackdropFilter: glassBackdrop
}

export const rechartsTooltipContentStyle = {
  ...tooltipShell
}

export const rechartsTooltipLabelStyle = {
  color: '#ffffff',
  fontWeight: 700,
  marginBottom: 8,
  fontVariantNumeric: 'tabular-nums'
}

export const rechartsTooltipItemStyle = {
  color: '#ffffff',
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums'
}

/** Grid row: label | value */
export const tooltipRowGridSx = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'baseline',
  columnGap: 12,
  rowGap: 2,
  fontVariantNumeric: 'tabular-nums',
  '& > *:first-of-type': { color: arcticMuted, fontSize: 12, lineHeight: 1.45 },
  '& > *:last-of-type': {
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 13,
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'right',
    minWidth: '4.5ch'
  }
}
