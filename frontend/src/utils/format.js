export function nvl(v, fallback = '—') {
  if (v === null || v === undefined || v === '') return fallback
  if (typeof v === 'object') return fallback
  return v
}

export function formatDateTimeSafe(v, fallback = '—') {
  if (!v) return fallback
  const d = v instanceof Date ? v : new Date(v)
  if (Number.isNaN(d.getTime())) return fallback
  return d.toLocaleString('uk-UA')
}

export function getGridFieldValue(value, row, field) {
  if (row && typeof row === 'object' && field in row) return row[field]
  if (value && typeof value === 'object') {
    if (value.row && typeof value.row === 'object' && field in value.row) return value.row[field]
    if (field in value) return value[field]
  }
  return value
}

