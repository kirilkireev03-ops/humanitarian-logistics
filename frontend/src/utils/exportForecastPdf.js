import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

function fmt(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  return Number.isFinite(n) ? String(Math.round(n)) : String(v)
}

async function loadFontBinary(url) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Не вдалося завантажити шрифт (${res.status}): ${url}`)
  }
  const buf = await res.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return binary
}

function fontUrl() {
  const base = import.meta.env.BASE_URL || '/'
  const normalized = base.endsWith('/') ? base : `${base}/`
  return new URL(`${normalized}fonts/NotoSans-Regular.ttf`, window.location.origin).href
}

/**
 * Звіт прогнозу у PDF з підтримкою української (Noto Sans з /public/fonts).
 */
export async function exportForecastPdf(data, chartData) {
  if (!data) return

  const binary = await loadFontBinary(fontUrl())
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const fontFile = 'NotoSans-Regular.ttf'
  const fontFamily = 'NotoSans'
  doc.addFileToVFS(fontFile, binary)
  doc.addFont(fontFile, fontFamily, 'normal', 'Identity-H')
  doc.setFont(fontFamily, 'normal')

  const margin = 14
  let y = 16

  doc.setFont(fontFamily, 'normal')
  doc.setFontSize(16)
  doc.text('Звіт прогнозу попиту', margin, y)
  y += 8

  doc.setFont(fontFamily, 'normal')
  doc.setFontSize(10)
  const meta = [
    `Вантаж: ${data.cargoName || data.cargoId}`,
    `Модель: ${data.model}   α=${fmt(data.alpha)}${data.beta != null ? `   β=${fmt(data.beta)}` : ''}`,
    `ПКПМ (MSE): ${Number(data.mse ?? 0).toFixed(2)}   САП (MAE): ${Number(data.mae ?? 0).toFixed(2)}`,
    `Коридор системи: ${fmt(data.forecastFloor)} — ${fmt(data.forecastCeiling)}`,
    `Дата формування: ${new Date().toLocaleString('uk-UA')}`
  ]
  for (const line of meta) {
    const wrapped = doc.splitTextToSize(line, 182)
    doc.text(wrapped, margin, y)
    y += wrapped.length * 5
  }
  y += 2

  if (data.stabilityNote) {
    doc.setFontSize(9)
    const noteLines = doc.splitTextToSize(String(data.stabilityNote), 182)
    doc.text(noteLines, margin, y)
    y += noteLines.length * 4 + 2
  }

  if (data.warnings?.length) {
    doc.setFont(fontFamily, 'normal')
    doc.setFontSize(10)
    doc.text('Попередження:', margin, y)
    y += 5
    doc.setFont(fontFamily, 'normal')
    for (const w of data.warnings) {
      const lines = doc.splitTextToSize(`• ${w}`, 182)
      doc.text(lines, margin, y)
      y += lines.length * 4
    }
    y += 2
  }

  const body = (chartData || []).map((r) => [
    r.period,
    fmt(r.demand),
    fmt(r.demandAdjusted),
    fmt(r.smoothed),
    fmt(r.forecast),
    fmt(r.forecastLow),
    fmt(r.forecastHigh)
  ])

  autoTable(doc, {
    startY: y,
    head: [['Період', 'Факт', 'Після winsor.', 'Згладжено', 'Прогноз', 'Низ', 'Верх']],
    body,
    styles: {
      font: fontFamily,
      fontStyle: 'normal',
      fontSize: 8,
      cellPadding: 1.5
    },
    headStyles: {
      font: fontFamily,
      fontStyle: 'normal',
      fontSize: 8,
      fillColor: [76, 29, 149],
      textColor: [255, 255, 255]
    },
    margin: { left: margin, right: margin }
  })

  const safeName = (data.cargoName || `cargo_${data.cargoId}`).replace(/[^\w\u0400-\u04FF-]+/g, '_')
  doc.save(`forecast_${safeName}_${data.model}.pdf`)
}
