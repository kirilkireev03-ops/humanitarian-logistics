import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import {
  Box,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  Typography
} from '@mui/material'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'

import {
  chartAxisLineStyle,
  chartGridProps,
  chartLegendWrapperStyle,
  chartTickStyle
} from '../theme/chartTheme'
import { getForecast, getAudit, getStats, listAidRequests, listStock, listTransactions } from '../api'
import PageHeader from '../components/PageHeader'
import IceCrystalIllustration from '../components/IceCrystalIllustration'
import { Item, Stagger } from '../components/Reveal'
import { getRole as getAuthRole } from '../auth'
import { GlassCard, KpiStatNumber } from '../components/ui'
import {
  premiumTransition,
  rechartsTooltipContentStyle,
  tooltipRowGridSx
} from '../theme/glassTokens'
import { cyberInbound, cyberOutbound } from '../theme/cyberAurora'
import {
  computeNiceYMax,
  formatChartInt,
  formatChartPeriod,
  formatChartShort,
  safeChartNumber
} from '../utils/chartHelpers'
import '../styles/dashboardCyber.css'

/** Градієнти donut — холодні неонові акценти без «бруду» */
const PIE_SEGMENT_GRADS = [
  ['#00FFA3', '#059669'],
  ['#00E5FF', '#0369a1'],
  ['#A78BFA', '#6366F1'],
  ['#C084FC', '#6D28D9'],
  ['#38BDF8', '#0E7490'],
  ['#818CF8', '#4338CA'],
  ['#94A3B8', '#475569']
]

function fmtInt(n) {
  const v = Number(n || 0)
  return v.toLocaleString('uk-UA')
}

function fmtShort(n) {
  return formatChartShort(n)
}

/** Локальний календарний день YYYY-MM-DD (узгоджено з підписами осі; без зсуву UTC як у toISOString). */
function toLocalYmd(value) {
  const x = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(x.getTime())) return null
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function apiErrMsg(e) {
  if (!e) return 'Невідома помилка'
  const d = e.response?.data
  return d?.message || d?.error || e.message || 'Невідома помилка'
}

function statusUi(s) {
  if (s === 'PENDING') return { label: 'Очікує', color: 'warning' }
  if (s === 'APPROVED') return { label: 'Схвалено', color: 'info' }
  if (s === 'REJECTED') return { label: 'Відхилено', color: 'error' }
  if (s === 'FULFILLED') return { label: 'Виконано', color: 'success' }
  return { label: s || '—', color: 'default' }
}

function TxTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const inbound = safeChartNumber(payload.find((p) => p.dataKey === 'inbound')?.value, 0)
  const outbound = safeChartNumber(payload.find((p) => p.dataKey === 'outbound')?.value, 0)
  return (
    <Box
      sx={{
        minWidth: 220,
        ...rechartsTooltipContentStyle
      }}
    >
      <Typography
        variant="body2"
        sx={{ fontWeight: 700, mb: 1, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}
      >
        {label}
      </Typography>
      <Stack spacing={0.65}>
        <Box sx={tooltipRowGridSx}>
          <Typography component="span" variant="caption">
            Вхід:
          </Typography>
          <Typography component="span" sx={{ color: cyberInbound.b, fontWeight: 800 }}>
            {fmtInt(inbound)}
          </Typography>
        </Box>
        <Box sx={tooltipRowGridSx}>
          <Typography component="span" variant="caption">
            Вихід:
          </Typography>
          <Typography component="span" sx={{ color: cyberOutbound.b, fontWeight: 800 }}>
            {fmtInt(outbound)}
          </Typography>
        </Box>
      </Stack>
    </Box>
  )
}

function PieStockTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const pl = payload[0]
  return (
    <Box sx={{ minWidth: 168, ...rechartsTooltipContentStyle }}>
      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.75, color: '#fff' }}>
        {pl.name}
      </Typography>
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: '1.125rem',
          color: '#fff',
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'right',
          display: 'block'
        }}
      >
        {fmtInt(pl.value)}
      </Typography>
    </Box>
  )
}

const transitionPremium = premiumTransition

const listRowSx = {
  px: 1.25,
  py: 0.85,
  mx: -1,
  mb: 0.5,
  borderRadius: 2,
  border: '1px solid transparent',
  transition: transitionPremium,
  '&:hover': {
    transform: 'translateY(-4px)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    backgroundColor: 'rgba(76, 29, 149, 0.12)',
    boxShadow: '0 10px 28px rgba(0,0,0,0.35), 0 0 24px rgba(76, 29, 149, 0.12)'
  }
}

export default function Dashboard() {
  const role = getAuthRole()
  const canOps = ['ADMIN', 'COORDINATOR', 'OPERATOR'].includes(role)
  const canSeeStock = Boolean(role)

  const [highlightedSlice, setHighlightedSlice] = useState(null)
  const [whPulse, setWhPulse] = useState(0)
  const [reqPulse, setReqPulse] = useState(0)

  const statsQ = useQuery({ queryKey: ['stats'], queryFn: getStats, retry: 1 })

  const stockQ = useQuery({
    queryKey: ['dashStock'],
    queryFn: listStock,
    enabled: canSeeStock
  })

  const txQ = useQuery({
    queryKey: ['dashTx'],
    queryFn: listTransactions,
    enabled: canOps
  })

  const requestsQ = useQuery({
    queryKey: ['dashRequests'],
    queryFn: listAidRequests,
    enabled: canOps
  })

  const auditQ = useQuery({
    queryKey: ['dashAudit'],
    queryFn: getAudit,
    enabled: role === 'ADMIN'
  })

  const stockTotals = useMemo(() => {
    const totals = new Map()
    const rows = stockQ.data || []
    for (const r of rows) {
      const key = r.cargoId
      if (!totals.has(key)) {
        totals.set(key, { cargoId: r.cargoId, cargoName: r.cargoName, total: 0 })
      }
      totals.get(key).total += r.quantityOnHand || 0
    }
    return Array.from(totals.values()).sort((a, b) => b.total - a.total)
  }, [stockQ.data])

  const pieData = useMemo(() => {
    if (!stockTotals.length) return []
    const top = stockTotals.slice(0, 6)
    const rest = stockTotals.slice(6)
    const otherSum = rest.reduce((s, x) => s + x.total, 0)
    const out = top.map((t) => ({ name: t.cargoName, value: t.total, cargoId: t.cargoId }))
    if (otherSum > 0) out.push({ name: 'Інше', value: otherSum })
    return out
  }, [stockTotals])

  const totalStock = useMemo(() => stockTotals.reduce((s, x) => s + (x.total || 0), 0), [stockTotals])

  const lowStock = useMemo(() => {
    if (!stockTotals.length) return []
    const totalSum = stockTotals.reduce((s, x) => s + x.total, 0)
    const avg = totalSum / Math.max(1, stockTotals.length)
    const threshold = Math.max(1, avg * 0.2)
    const asc = [...stockTotals].sort((a, b) => a.total - b.total)
    const filtered = asc.filter((x) => x.total <= threshold)
    return (filtered.length ? filtered : asc).slice(0, 5)
  }, [stockTotals])

  const lowStockInsights = useMemo(() => {
    if (!lowStock.length) return []
    const stockRows = stockQ.data || []
    const txRows = txQ.data || []
    const totalStockSafe = Math.max(1, totalStock)

    const coverageMap = new Map()
    const maxAtWarehouseMap = new Map()
    for (const r of stockRows) {
      if (!coverageMap.has(r.cargoId)) coverageMap.set(r.cargoId, 0)
      if (Number(r.quantityOnHand || 0) > 0) {
        coverageMap.set(r.cargoId, coverageMap.get(r.cargoId) + 1)
      }
      const prevMax = maxAtWarehouseMap.get(r.cargoId) || 0
      maxAtWarehouseMap.set(r.cargoId, Math.max(prevMax, Number(r.quantityOnHand || 0)))
    }

    const outbound30Map = new Map()
    const nowMs = Date.now()
    for (const t of txRows) {
      if (!t?.occurredAt || t.type !== 'OUTBOUND') continue
      const at = new Date(t.occurredAt).getTime()
      if (Number.isNaN(at)) continue
      if (nowMs - at > 30 * 86400000) continue
      outbound30Map.set(t.cargoId, (outbound30Map.get(t.cargoId) || 0) + Number(t.quantity || 0))
    }

    return lowStock.map((x) => {
      const outbound30 = outbound30Map.get(x.cargoId) || 0
      const daily = outbound30 / 30
      const daysCover = daily > 0 ? x.total / daily : null
      const sharePct = (x.total / totalStockSafe) * 100
      const risk = daysCover !== null ? (daysCover < 10 ? 'critical' : daysCover < 21 ? 'warning' : 'ok') : x.total < 100 ? 'warning' : 'ok'
      return {
        ...x,
        sharePct,
        coverage: coverageMap.get(x.cargoId) || 0,
        maxAtWarehouse: maxAtWarehouseMap.get(x.cargoId) || 0,
        outbound30,
        daysCover,
        risk
      }
    })
  }, [lowStock, stockQ.data, txQ.data, totalStock])

  const openRequests = useMemo(() => {
    const rows = requestsQ.data || []
    const filtered = rows.filter((r) => r.status === 'PENDING' || r.status === 'APPROVED')
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    return filtered.slice(0, 6)
  }, [requestsQ.data])

  const txChartData = useMemo(() => {
    const now = new Date()
    const lastDays = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - i), 12, 0, 0, 0)
      const key = toLocalYmd(d)
      const label = d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })
      return { key, label }
    })

    const inbound = new Map(lastDays.map((d) => [d.key, 0]))
    const outbound = new Map(lastDays.map((d) => [d.key, 0]))

    const txs = txQ.data || []
    for (const t of txs) {
      if (!t.occurredAt) continue
      const key = toLocalYmd(t.occurredAt)
      if (!key || !inbound.has(key)) continue
      const qty = t.quantity || 0
      if (t.type === 'INBOUND') inbound.set(key, inbound.get(key) + qty)
      if (t.type === 'OUTBOUND') outbound.set(key, outbound.get(key) + qty)
      // TRANSFER не додаємо до «вхід/вихід» — інакше один день виглядає як подвійний сплеск.
    }

    return lastDays.map((d) => ({
      day: d.label,
      inbound: inbound.get(d.key) || 0,
      outbound: outbound.get(d.key) || 0
    }))
  }, [txQ.data])

  const txYMax = useMemo(
    () => computeNiceYMax(txChartData, ['inbound', 'outbound'], { padding: 0.15, minTop: 10 }),
    [txChartData]
  )

  const topCargoId = stockTotals[0]?.cargoId
  const forecastQ = useQuery({
    queryKey: ['dashForecast', topCargoId],
    enabled: Boolean(topCargoId),
    queryFn: () =>
      getForecast({
        cargoId: topCargoId,
        model: 'AUTO',
        alpha: null,
        beta: null,
        horizon: 3,
        historyMonths: 12
      })
  })

  const apiErrors = [
    statsQ.isError && { key: 'stats', title: 'Зведення (KPI)', msg: apiErrMsg(statsQ.error) },
    canSeeStock && stockQ.isError && { key: 'stock', title: 'Залишки', msg: apiErrMsg(stockQ.error) },
    canOps && txQ.isError && { key: 'tx', title: 'Транзакції', msg: apiErrMsg(txQ.error) },
    canOps && requestsQ.isError && { key: 'req', title: 'Заявки', msg: apiErrMsg(requestsQ.error) },
    role === 'ADMIN' && auditQ.isError && { key: 'audit', title: 'Аудит', msg: apiErrMsg(auditQ.error) },
    Boolean(topCargoId) && forecastQ.isError && { key: 'forecast', title: 'Прогноз', msg: apiErrMsg(forecastQ.error) }
  ].filter(Boolean)

  return (
    <Box className="hl-dash">
      <Stagger>
        <Item>
          <PageHeader
            title="Огляд"
            subtitle="Зведення по системі: склади, типи вантажу, активні заявки, рух за 30 днів та загальні залишки."
          />
        </Item>

        {apiErrors.length > 0 && (
          <Item>
            <GlassCard interactive={false} padding={2}>
              <Typography color="error" sx={{ fontWeight: 700 }}>
                Помилка API
              </Typography>
              <Stack component="ul" spacing={0.75} sx={{ m: 0, pl: 2.25, mt: 1 }}>
                {apiErrors.map((row) => (
                  <Typography key={row.key} component="li" variant="body2" color="text.secondary">
                    <Box component="span" sx={{ fontWeight: 700, color: 'error.light' }}>
                      {row.title}:{' '}
                    </Box>
                    {row.msg}
                  </Typography>
                ))}
              </Stack>
            </GlassCard>
          </Item>
        )}

        <Item>
          <Grid container spacing={4} alignItems="stretch">
            {[
              { label: 'Склади', value: statsQ.data?.warehouses, md: 4, lg: 3 },
              { label: 'Типи вантажів', value: statsQ.data?.cargoTypes, md: 4, lg: 3 },
              { label: 'Активні заявки', value: statsQ.data?.pendingRequests, md: 4, lg: 3 },
              { label: 'Операцій (30 днів)', value: statsQ.data?.transactionsLast30Days, md: 6, lg: 3 },
              { label: 'Одиниць на складах', value: statsQ.data?.totalStockUnits, md: 6, lg: 12 }
            ].map((s) => (
              <Grid key={s.label} item xs={12} sm={6} md={s.md} lg={s.lg}>
                <GlassCard aurora padding={2} sx={{ minHeight: 112, height: '100%' }} innerSx={{ minHeight: 104 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.02 }}>
                    {s.label}
                  </Typography>
                  <KpiStatNumber
                    value={s.value ?? 0}
                    loading={statsQ.isLoading}
                    variant="h4"
                    shimmer
                    pulseVersion={s.label === 'Склади' ? whPulse : s.label === 'Активні заявки' ? reqPulse : 0}
                  />
                </GlassCard>
              </Grid>
            ))}
          </Grid>
        </Item>

        <Item>
          <Grid container spacing={4} alignItems="stretch" sx={{ mt: 4 }}>
            <Grid item xs={12} lg={7}>
              <GlassCard
                padding={2}
                sx={{ height: { xs: 'auto', lg: 390 } }}
                innerSx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 900, letterSpacing: 0.02 }} variant="h6">
                      Динаміка руху (30 днів)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Надходження (INBOUND) та відпуск (OUTBOUND) за 30 днів. Переміщення між складами не дублюються.
                    </Typography>
                  </Box>
                  {txQ.isLoading ? null : (
                    <Chip
                      size="small"
                      label={canOps ? 'Операційні дані' : 'Немає прав'}
                      variant="outlined"
                      sx={{
                        borderColor: 'rgba(255,255,255,0.1)',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        color: 'text.secondary',
                        fontWeight: 600,
                        transition: transitionPremium
                      }}
                    />
                  )}
                </Stack>

                <Box sx={{ height: { xs: 320, lg: 340 }, flex: 1, minHeight: 280 }}>
                  {canOps ? (
                    txQ.isLoading ? (
                      <Stack spacing={1.5} sx={{ height: '100%', justifyContent: 'center', px: 0.5, py: 1 }}>
                        <Skeleton
                          variant="rounded"
                          height={22}
                          sx={{ borderRadius: 1, bgcolor: 'rgba(255,255,255,0.06)' }}
                          animation="wave"
                        />
                        <Skeleton
                          variant="rounded"
                          height={240}
                          sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)' }}
                          animation="wave"
                        />
                      </Stack>
                    ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={txChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="txFillIn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#34D399" stopOpacity={0.5} />
                            <stop offset="55%" stopColor="#10B981" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="txFillOut" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#A855F7" stopOpacity={0.42} />
                            <stop offset="60%" stopColor="#6366F1" stopOpacity={0.12} />
                            <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid {...chartGridProps} />
                        <XAxis dataKey="day" tick={chartTickStyle} interval={3} axisLine={chartAxisLineStyle} />
                        <YAxis
                          tick={chartTickStyle}
                          tickFormatter={fmtShort}
                          width={46}
                          domain={[0, txYMax]}
                          allowDataOverflow
                          axisLine={chartAxisLineStyle}
                        />
                        <Tooltip
                          content={TxTooltip}
                          cursor={{ stroke: 'rgba(0,224,255,0.25)', strokeWidth: 1 }}
                        />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          iconType="circle"
                          wrapperStyle={chartLegendWrapperStyle}
                        />
                        <Area
                          type="monotone"
                          dataKey="outbound"
                          name="Вихід"
                          className="hl-tx-ice"
                          stroke={cyberOutbound.b}
                          strokeWidth={2}
                          fill="url(#txFillOut)"
                          dot={false}
                          activeDot={{ r: 5, strokeWidth: 1, stroke: '#fff', fill: cyberOutbound.b }}
                          isAnimationActive
                        />
                        <Area
                          type="monotone"
                          dataKey="inbound"
                          name="Вхід"
                          className="hl-tx-hero"
                          stroke={cyberInbound.b}
                          strokeWidth={2.6}
                          fill="url(#txFillIn)"
                          dot={false}
                          activeDot={{ r: 5, strokeWidth: 1, stroke: '#fff', fill: cyberInbound.b }}
                          isAnimationActive
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                    )
                  ) : (
                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Недостатньо прав для операційних даних.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </GlassCard>
            </Grid>

            <Grid item xs={12} lg={5}>
              <GlassCard
                padding={2}
                sx={{ height: { xs: 'auto', lg: 390 } }}
                innerSx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 900, letterSpacing: 0.02 }} variant="h6">
                      Запаси за типами вантажу
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Структура залишків (ТОП‑6 + «Інше»).
                    </Typography>
                  </Box>
                </Stack>

                <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }} alignItems="center" justifyContent="center">
                  <Grid item xs={12} sm={5} lg={5} sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ minHeight: 0, display: 'grid', placeItems: 'center' }}>
                      {stockQ.isLoading ? (
                        <Stack spacing={1} sx={{ width: '100%' }}>
                          <Skeleton height={18} />
                          <Skeleton height={18} />
                          <Skeleton height={180} />
                        </Stack>
                      ) : pieData.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                          Немає даних про залишки.
                        </Typography>
                      ) : (
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <defs>
                              {pieData.map((_, idx) => {
                                const [c0, c1] = PIE_SEGMENT_GRADS[idx % PIE_SEGMENT_GRADS.length]
                                return (
                                  <linearGradient key={`pie-grad-${idx}`} id={`pieSlice${idx}`} x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor={c0} />
                                    <stop offset="100%" stopColor={c1} />
                                  </linearGradient>
                                )
                              })}
                            </defs>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              outerRadius={84}
                              innerRadius={48}
                              paddingAngle={2.5}
                              onMouseEnter={(_, index) => setHighlightedSlice(index)}
                              onMouseLeave={() => setHighlightedSlice(null)}
                              onClick={() => setWhPulse((n) => n + 1)}
                            >
                              {pieData.map((_, idx) => {
                                const dim = highlightedSlice !== null && highlightedSlice !== idx
                                return (
                                  <Cell
                                    key={`cell-${idx}`}
                                    fill={`url(#pieSlice${idx})`}
                                    stroke={highlightedSlice === idx ? '#34D399' : 'rgba(255,255,255,0.2)'}
                                    strokeWidth={highlightedSlice === idx ? 2.5 : 1}
                                    opacity={dim ? 0.38 : 1}
                                    style={{
                                      transition: 'opacity 0.35s ease, filter 0.35s ease',
                                      filter: dim ? 'saturate(0.7) brightness(0.92)' : 'saturate(1) brightness(1.05)'
                                    }}
                                  />
                                )
                              })}
                            </Pie>
                            <Tooltip wrapperStyle={{ outline: 'none' }} content={PieStockTooltip} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={7} lg={7} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <GlassCard interactive padding={1.5} radius={16} innerSx={{ display: 'flex', flexDirection: 'column' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 900 }}>
                          Легенда
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Всього: <b>{fmtInt(totalStock)}</b>
                        </Typography>
                      </Stack>
                      <Stack spacing={0.75} sx={{ minHeight: 0, maxHeight: { xs: 170, lg: 210 }, overflow: 'auto', pr: 0.75, pb: 0.25 }}>
                        {pieData.map((p, idx) => {
                          const [c0] = PIE_SEGMENT_GRADS[idx % PIE_SEGMENT_GRADS.length]
                          return (
                          <Stack
                            key={p.name}
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            onMouseEnter={() => setHighlightedSlice(idx)}
                            onMouseLeave={() => setHighlightedSlice(null)}
                            onClick={() => setWhPulse((n) => n + 1)}
                            sx={{
                              py: 0.35,
                              px: 0.5,
                              mx: -0.5,
                              borderRadius: 1,
                              cursor: 'pointer',
                              transition: transitionPremium,
                              ...(highlightedSlice === idx && {
                                bgcolor: 'rgba(16,185,129,0.1)',
                                boxShadow: '0 0 22px rgba(99,102,241,0.14)'
                              }),
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                bgcolor: 'rgba(0,224,255,0.06)',
                                boxShadow: '0 6px 20px rgba(0,0,0,0.25)'
                              }
                            }}
                          >
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: 99,
                                background: `linear-gradient(135deg, ${c0}, #00A3FF)`,
                                border: '1px solid rgba(255,255,255,0.25)',
                                boxShadow:
                                  highlightedSlice === idx
                                    ? '0 0 14px rgba(51,255,227,0.65), 0 0 22px rgba(0,163,255,0.35)'
                                    : '0 0 10px rgba(0,224,255,0.25)'
                              }}
                            />
                            <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap title={p.name}>
                              {p.name}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>
                              {fmtShort(p.value)}
                              {totalStock > 0 ? (
                                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                                  ({((safeChartNumber(p.value, 0) / totalStock) * 100).toFixed(1)}%)
                                </Typography>
                              ) : null}
                            </Typography>
                          </Stack>
                          )
                        })}
                      </Stack>
                    </GlassCard>
                  </Grid>
                </Grid>
              </GlassCard>
            </Grid>
          </Grid>
        </Item>

        <Item>
          <Grid container spacing={4} alignItems="stretch" sx={{ mt: 4 }}>
            <Grid item xs={12} lg={7}>
              <GlassCard
                padding={2}
                sx={{ height: { xs: 'auto', lg: 520 } }}
                innerSx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 900 }} variant="h6">
                      Відкриті заявки
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Очікує / Схвалено (швидкий перегляд).
                    </Typography>
                  </Box>
                </Stack>

                {canOps ? (
                  <List dense sx={{ flex: 1, minHeight: 0, maxHeight: { xs: 340, lg: 430 }, overflow: 'auto', pb: 2 }}>
                    {openRequests.length ? (
                      openRequests.map((r) => (
                        <ListItem
                          key={r.id}
                          button
                          onClick={() => setReqPulse((n) => n + 1)}
                          sx={{
                            ...listRowSx,
                            borderBottom: '1px solid rgba(255,255,255,0.04)'
                          }}
                        >
                          <ListItemText
                            primary={
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Chip size="small" label={statusUi(r.status).label} color={statusUi(r.status).color} variant="outlined" />
                                <Typography sx={{ fontWeight: 900 }}>
                                  {r.cargoName} · {r.quantityRequested}
                                </Typography>
                              </Stack>
                            }
                            secondary={`${r.warehouseName} · створено: ${
                              r.createdAt ? new Date(r.createdAt).toLocaleDateString('uk-UA') : '—'
                            }`}
                          />
                        </ListItem>
                      ))
                    ) : (
                      <Box sx={{ py: 2, textAlign: 'center', px: 1 }}>
                        <IceCrystalIllustration size={76} />
                        <Typography variant="body2" color="text.secondary">
                          Немає активних заявок у демо-даних.
                        </Typography>
                      </Box>
                    )}
                  </List>
                ) : (
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Недостатньо прав для перегляду заявок.
                    </Typography>
                  </Box>
                )}
              </GlassCard>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Stack spacing={3} sx={{ height: { xs: 'auto', lg: 520 } }}>
                <GlassCard
                  padding={2}
                  sx={{ flex: 1, minHeight: 0 }}
                  innerSx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ flexShrink: 0 }}>
                    <Typography sx={{ fontWeight: 900 }} variant="h6">
                      Низькі залишки
                    </Typography>
                  </Stack>
                  <Divider sx={{ my: 1, opacity: 0.25, flexShrink: 0 }} />
                  <Stack direction="row" spacing={0.8} sx={{ mb: 1, flexShrink: 0 }} alignItems="center" flexWrap="wrap">
                    <Chip
                      size="small"
                      icon={<Inventory2OutlinedIcon sx={{ '&&': { color: '#00E0FF', fontSize: 18 } }} />}
                      label={`Позицій: ${lowStockInsights.length}`}
                      variant="outlined"
                      sx={{
                        borderColor: 'rgba(0,224,255,0.35)',
                        bgcolor: 'rgba(255,255,255,0.04)',
                        color: 'text.secondary',
                        fontWeight: 700,
                        transition: transitionPremium,
                        '& .MuiChip-icon': { ml: 0.5 }
                      }}
                    />
                    <Chip
                      size="small"
                      icon={<ReportProblemOutlinedIcon sx={{ '&&': { color: '#FF33A3', fontSize: 18 } }} />}
                      variant="outlined"
                      label={`Критичних: ${lowStockInsights.filter((x) => x.risk === 'critical').length}`}
                      sx={{
                        borderColor: 'rgba(255,51,163,0.45)',
                        bgcolor: 'rgba(255,51,163,0.06)',
                        color: 'text.secondary',
                        fontWeight: 700,
                        transition: transitionPremium,
                        '& .MuiChip-icon': { ml: 0.5 }
                      }}
                    />
                  </Stack>
                  <List
                    dense
                    sx={{
                      flex: '1 1 0%',
                      minHeight: 0,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      pb: 2,
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    {lowStockInsights.length ? (
                      lowStockInsights.map((x) => (
                        <ListItem
                          key={x.cargoId}
                          sx={{
                            ...listRowSx,
                            ...(x.risk === 'critical' && {
                              borderColor: 'rgba(239,68,68,0.45)',
                              animation: 'hl-urgency-border 2.2s ease-in-out infinite'
                            }),
                            ...(x.risk === 'warning' && {
                              borderColor: 'rgba(167, 139, 250, 0.42)',
                              animation: 'hl-urgency-border-warn 3s ease-in-out infinite'
                            })
                          }}
                        >
                          <ListItemText
                            primary={
                              <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 0.3 }}>
                                <Box
                                  className={x.risk === 'critical' ? 'hl-urgency-dot hl-urgency-dot--critical' : x.risk === 'warning' ? 'hl-urgency-dot hl-urgency-dot--warn' : 'hl-urgency-dot hl-urgency-dot--ok'}
                                  sx={{ flexShrink: 0 }}
                                />
                                <Typography sx={{ fontWeight: 800, flex: 1 }}>{x.cargoName}</Typography>
                                <Chip
                                  size="small"
                                  color={x.risk === 'critical' ? 'error' : x.risk === 'warning' ? 'warning' : 'success'}
                                  variant="outlined"
                                  label={x.risk === 'critical' ? 'Критично' : x.risk === 'warning' ? 'Ризик' : 'OK'}
                                />
                              </Stack>
                            }
                            secondary={
                              <Stack spacing={0.2}>
                                <Typography variant="caption" color="text.secondary">
                                  Залишок: <b>{fmtInt(x.total)}</b> · Частка: <b>{x.sharePct.toFixed(1)}%</b>
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Складів з наявністю: <b>{x.coverage}</b> · Макс. на одному складі: <b>{fmtInt(x.maxAtWarehouse)}</b>
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  OUTBOUND за 30 дн: <b>{fmtInt(x.outbound30)}</b> · Покриття: <b>{x.daysCover ? `${x.daysCover.toFixed(1)} дн` : 'н/д'}</b>
                                </Typography>
                              </Stack>
                            }
                          />
                        </ListItem>
                      ))
                    ) : (
                      <Box sx={{ py: 2, textAlign: 'center', px: 1 }}>
                        <IceCrystalIllustration size={72} />
                        <Typography variant="body2" color="text.secondary">
                          Недостатньо даних для розрахунку.
                        </Typography>
                      </Box>
                    )}
                  </List>
                </GlassCard>

                <GlassCard
                  padding={2}
                  sx={{ flex: 1, minHeight: 0 }}
                  innerSx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 900 }} variant="h6">
                        Швидкий прогноз (AUTO)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        На основі топ-вантя по запасах.
                      </Typography>
                    </Box>
                  </Stack>

                {forecastQ.isLoading ? (
                  <Stack spacing={1}>
                    <Skeleton height={20} />
                    <Skeleton height={20} />
                    <Skeleton height={20} />
                  </Stack>
                ) : forecastQ.data ? (
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      Модель: <b>{forecastQ.data.model}</b>
                      {' · '}
                      ПКПМ {safeChartNumber(forecastQ.data.mse, 0).toFixed(1)}
                      {' · '}
                      САП {safeChartNumber(forecastQ.data.mae, 0).toFixed(1)}
                    </Typography>
                    <Stack spacing={0.75}>
                      {forecastQ.data.forecastPeriodLabels.map((p, i) => (
                        <Stack key={p} direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body2" sx={{ width: 70, color: 'text.secondary' }}>
                            {formatChartPeriod(p)}
                          </Typography>
                            <Box
                              sx={{
                                flex: 1,
                                height: 10,
                                borderRadius: 999,
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                overflow: 'hidden'
                              }}
                            >
                            <Box
                              sx={{
                                height: '100%',
                                width: `${Math.min(100, (forecastQ.data.forecastValues[i] / (Math.max(...forecastQ.data.forecastValues) || 1)) * 100)}%`,
                                background: 'linear-gradient(90deg, #60a5fa 0%, #818cf8 100%)',
                                transition: transitionPremium
                              }}
                            />
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{ width: 80, textAlign: 'right', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}
                          >
                            {formatChartInt(forecastQ.data.forecastValues[i])}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Немає даних для прогнозу.
                  </Typography>
                )}
                </GlassCard>
              </Stack>
            </Grid>
          </Grid>
        </Item>

        <Item>
          <Grid container spacing={4} sx={{ mt: 4 }}>
            <Grid item xs={12}>
              <GlassCard padding={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography sx={{ fontWeight: 900 }} variant="h6">
                    Журнал дій (audit)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {role === 'ADMIN' ? 'admin' : 'ADMIN only'}
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 1, opacity: 0.25 }} />

                {role !== 'ADMIN' ? (
                  <Typography variant="body2" color="text.secondary">
                    Для перегляду аудиту потрібна роль ADMIN.
                  </Typography>
                ) : auditQ.isLoading ? (
                  <Stack spacing={1}>
                    <Skeleton height={18} />
                    <Skeleton height={18} />
                    <Skeleton height={18} />
                  </Stack>
                ) : auditQ.data?.length ? (
                  <List dense sx={{ maxHeight: 230, overflow: 'auto' }}>
                    {auditQ.data.slice(0, 7).map((a) => (
                      <ListItem key={a.id} sx={{ ...listRowSx, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip size="small" label={String(a.action).replaceAll('_', ' ')} variant="outlined" />
                              <Typography sx={{ fontWeight: 900 }}>{a.entityType}</Typography>
                            </Stack>
                          }
                          secondary={`${a.actorUsername || 'system'} · ${a.actorRole || '—'} · ${a.at ? new Date(a.at).toLocaleString('uk-UA') : '—'}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Поки що немає записів аудиту.
                  </Typography>
                )}
              </GlassCard>
            </Grid>
          </Grid>
        </Item>
      </Stagger>
    </Box>
  )
}
