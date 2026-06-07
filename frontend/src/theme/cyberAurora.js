/**
 * Chart / series accents — neon on midnight (backgrounds stay amethyst-only elsewhere).
 */
export const cyberBg = '#0B0914'

/** Line chart: inbound = neon mint, outbound = electric cyan */
export const cyberInbound = {
  a: '#00FFA3',
  b: '#00FFA3',
  fill: 'linear-gradient(180deg, rgba(0, 255, 163, 0.32) 0%, rgba(0, 255, 163, 0.06) 75%, rgba(0, 255, 163, 0) 100%)'
}

export const cyberOutbound = {
  a: '#00E5FF',
  b: '#00E5FF',
  fill: 'linear-gradient(180deg, rgba(0, 229, 255, 0.3) 0%, rgba(0, 229, 255, 0.06) 78%, rgba(0, 229, 255, 0) 100%)'
}

export const cyberForecast = {
  a: '#A78BFA',
  b: '#C084FC',
  line: '#C084FC',
  band: 'rgba(124, 58, 237, 0.18)'
}

export const cyberCritical = '#F43F5E'

export const cyberGlass = {
  panel: 'rgba(19, 15, 37, 0.55)',
  border: 'rgba(255, 255, 255, 0.1)',
  inset: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.07)',
  blur: 'blur(20px)'
}

export const cyberTooltipShell = {
  backgroundColor: 'rgba(11, 9, 20, 0.96)',
  border: `1px solid ${cyberGlass.border}`,
  borderRadius: 12,
  boxShadow: `${cyberGlass.inset}, 0 20px 48px rgba(0,0,0,0.62), 0 0 36px rgba(76, 29, 149, 0.2)`,
  padding: '12px 14px',
  backdropFilter: cyberGlass.blur,
  WebkitBackdropFilter: cyberGlass.blur
}
