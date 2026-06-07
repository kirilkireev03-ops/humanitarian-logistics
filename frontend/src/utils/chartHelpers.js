/** Безпечне число для графіків / тултіпів (не NaN, не [object Object]). */
export function safeChartNumber(v, fallback = null) {
  if (v === null || v === undefined || v === '') return fallback
  if (typeof v === 'object') return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

/** yyyy-MM → MM.YYYY для підписів осі. */
export function formatChartPeriod(ym) {
  if (!ym || typeof ym !== 'string') return ym ?? ''
  const m = ym.match(/^(\d{4})-(\d{2})$/)
  if (!m) return ym
  return `${m[2]}.${m[1]}`
}

export function formatChartInt(v) {
  const n = safeChartNumber(v, 0)
  return Math.round(n).toLocaleString('uk-UA')
}

export function formatChartShort(n) {
  const v = safeChartNumber(n, 0)
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} млн`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)} тис.`
  return String(Math.round(v))
}

/** Вирівнює довжину згладженого ряду під фактичний (захист від розсинхрону API). */
export function alignSmoothedSeries(demand, smoothed) {
  const n = demand?.length ?? 0
  if (!n) return []
  const out = [...(smoothed || [])]
  if (out.length > n) return out.slice(0, n)
  while (out.length < n) out.push(null)
  return out
}

/**
 * Верхня межа осі Y з «гарним» округленням; обрізає візуальний вплив одиночних викидів.
 */
export function computeNiceYMax(rows, keys, { padding = 0.12, minTop = 10 } = {}) {
  const values = []
  for (const row of rows || []) {
    for (const key of keys) {
      const v = safeChartNumber(row[key], null)
      if (v !== null && v >= 0) values.push(v)
    }
  }
  if (!values.length) return minTop

  values.sort((a, b) => a - b)
  const p95 = values[Math.min(values.length - 1, Math.floor(values.length * 0.95))]
  let max = Math.max(p95, values[values.length - 1] * 0.85)
  max = Math.max(max * (1 + padding), minTop)

  const mag = Math.pow(10, Math.floor(Math.log10(max)))
  const norm = max / mag
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10
  return nice * mag
}
