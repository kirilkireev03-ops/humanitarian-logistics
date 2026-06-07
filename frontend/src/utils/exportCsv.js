/**
 * Експорт CSV для Excel (Windows/UA): UTF-8 з BOM, роздільник «;», CRLF.
 * Так кирилиця не «ламається» при відкритті подвійним кліком у Excel.
 */
function csvEscape(value, sep = ';') {
  if (value === null || value === undefined) return ''
  const s = String(value)
  const needsQuote =
    s.includes('"') || s.includes(sep) || s.includes(',') || s.includes('\n') || s.includes('\r')
  if (needsQuote) {
    return `"${s.replaceAll('"', '""')}"`
  }
  return s
}

export function downloadCsv(filename, columns, rows, options = {}) {
  const sep = options.separator ?? ';'
  const header = columns.map((c) => csvEscape(c.label, sep)).join(sep)
  const body = rows
    .map((r) =>
      columns.map((c) => csvEscape(typeof c.get === 'function' ? c.get(r) : r[c.key], sep)).join(sep)
    )
    .join('\r\n')
  const csv = `\uFEFF${header}\r\n${body}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Рядок CSV з BOM (для власних експортів, напр. прогноз). */
export function buildExcelUtf8Csv(lines, sep = ';') {
  const text = lines.map((row) => row.map((cell) => csvEscape(cell, sep)).join(sep)).join('\r\n')
  return `\uFEFF${text}`
}
