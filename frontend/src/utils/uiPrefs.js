const PREFS_KEY = 'hl_ui_prefs_v1'

const DEFAULT_PREFS = {
  glow: 65,
  compactCards: false,
  cardGap: 20,
  themeVariant: 'aurora',
  animations: true
}

export function readUiPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const parsed = JSON.parse(raw)
    return {
      glow: Number.isFinite(parsed?.glow) ? parsed.glow : DEFAULT_PREFS.glow,
      compactCards: Boolean(parsed?.compactCards),
      cardGap: Number.isFinite(parsed?.cardGap) ? parsed.cardGap : DEFAULT_PREFS.cardGap,
      themeVariant: ['aurora', 'ocean', 'violet'].includes(parsed?.themeVariant) ? parsed.themeVariant : DEFAULT_PREFS.themeVariant,
      animations: parsed?.animations !== false
    }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function applyUiPrefs(prefs) {
  if (typeof document === 'undefined') return
  const glow = Math.max(0, Math.min(100, Number(prefs?.glow ?? DEFAULT_PREFS.glow)))
  document.documentElement.style.setProperty('--hl-glow-strength', String(glow / 100))
  const gap = Math.max(12, Math.min(32, Number(prefs?.cardGap ?? DEFAULT_PREFS.cardGap)))
  document.documentElement.style.setProperty('--hl-card-gap', `${gap}px`)
  if (prefs?.compactCards) {
    document.documentElement.setAttribute('data-hl-compact', '1')
  } else {
    document.documentElement.removeAttribute('data-hl-compact')
  }
  document.documentElement.setAttribute('data-hl-theme', prefs?.themeVariant || DEFAULT_PREFS.themeVariant)
  if (prefs?.animations === false) {
    document.documentElement.setAttribute('data-hl-motion', 'reduced')
  } else {
    document.documentElement.removeAttribute('data-hl-motion')
  }
}

export function saveUiPrefs(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

export { PREFS_KEY, DEFAULT_PREFS }
