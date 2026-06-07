import { useEffect, useMemo, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { getForecast, listCargo } from '../api'
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Area,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Slider,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'

import PageHeader from '../components/PageHeader'
import { Item, Stagger } from '../components/Reveal'
import { buildExcelUtf8Csv } from '../utils/exportCsv'
import {
  alignSmoothedSeries,
  computeNiceYMax,
  formatChartInt,
  formatChartPeriod,
  safeChartNumber
} from '../utils/chartHelpers'
import {
  rechartsTooltipContentStyle,
  tooltipRowGridSx,
  glassCardSurface,
  midnightBg
} from '../theme/glassTokens'
import { cyberForecast, cyberInbound, cyberOutbound, cyberCritical } from '../theme/cyberAurora'
import {
  chartAxisLineStyle,
  chartGridProps,
  chartLegendWrapperStyle,
  chartTickStyle
} from '../theme/chartTheme'
import '../styles/dashboardCyber.css'

const MODEL_LABEL_SHORT = {
  AUTO: 'Авто',
  SES: 'SES',
  HOLT: 'Холт',
  MA: 'КС'
}

function displayModelName(model) {
  if (!model) return '—'
  if (String(model).startsWith('MA(')) return String(model).replace(/^MA/, 'КС')
  return MODEL_LABEL_SHORT[model] || model
}

function normalizeCompareModel(model) {
  const m = String(model || '')
  if (m.startsWith('MA(')) return 'MA'
  return m
}

const RISK_LABEL_UA = { HIGH: 'Високий', MEDIUM: 'Помірний', LOW: 'Низький' }

function ForecastTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const val = (key) => payload.find((p) => p.dataKey === key)?.value

  const d = val('demand')
  const adj = val('demandAdjusted')
  const s = val('smoothed')
  const f = val('forecast')

  const fmt = (v) => {
    const n = safeChartNumber(v, null)
    return n === null ? '—' : formatChartInt(n)
  }

  return (
    <Box
      sx={{
        minWidth: 236,
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
            Фактичний відпуск (місяць):
          </Typography>
          <Typography component="span" sx={{ color: cyberInbound.b, fontWeight: 800 }}>
            {fmt(d)}
          </Typography>
        </Box>
        {adj != null && adj !== d && (
          <Box sx={tooltipRowGridSx}>
            <Typography component="span" variant="caption">
              Після winsorization:
            </Typography>
            <Typography component="span" sx={{ color: '#F59E0B', fontWeight: 800 }}>
              {fmt(adj)}
            </Typography>
          </Box>
        )}
        <Box sx={tooltipRowGridSx}>
          <Typography component="span" variant="caption">
            Згладжено на історії:
          </Typography>
          <Typography component="span" sx={{ color: cyberOutbound.b, fontWeight: 800 }}>
            {fmt(s)}
          </Typography>
        </Box>
        <Box sx={tooltipRowGridSx}>
          <Typography component="span" variant="caption">
            Прогноз:
          </Typography>
          <Typography component="span" sx={{ color: cyberForecast.line, fontWeight: 800 }}>
            {fmt(f)}
          </Typography>
        </Box>
      </Stack>
    </Box>
  )
}

function ForecastAnomalyDot(props) {
  const { cx, cy, payload } = props
  if (payload?.anomaly == null || cx == null || cy == null) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill="#C084FC"
      stroke="#0B0914"
      strokeWidth={1.5}
      className="hl-anomaly-dot"
    />
  )
}

export default function Forecast() {
  const SETTINGS_KEY = 'hl_forecast_settings_v2'
  const [cargoId, setCargoId] = useState('')
  const [model, setModel] = useState('AUTO')
  const [alpha, setAlpha] = useState(0.3)
  const [beta, setBeta] = useState(0.2)
  const [horizon, setHorizon] = useState(6)
  const [historyMonths, setHistoryMonths] = useState(24)
  const [nonce, setNonce] = useState(0)
  const [viewMode, setViewMode] = useState('combo')
  const [showScenarios, setShowScenarios] = useState(true)
  const [scenarioSpread, setScenarioSpread] = useState(15)

  const cargoQ = useQuery({
    queryKey: ['cargo'],
    queryFn: listCargo
  })

  const forecastQ = useQuery({
    queryKey: ['forecast', cargoId, model, alpha, beta, horizon, historyMonths, nonce],
    enabled: Boolean(cargoId),
    queryFn: () =>
      getForecast({
        cargoId: Number(cargoId),
        model,
        alpha: model === 'MA' || model === 'AUTO' ? null : alpha,
        beta: model === 'HOLT' ? beta : null,
        horizon,
        historyMonths
      })
  })

  const cargoList = cargoQ.data || []
  const data = forecastQ.data
  const compareQueries = useQueries({
    queries: ['SES', 'HOLT', 'MA'].map((m) => ({
      queryKey: ['forecast-compare', cargoId, m, horizon, historyMonths],
      enabled: Boolean(cargoId),
      queryFn: () =>
        getForecast({
          cargoId: Number(cargoId),
          model: m,
          alpha: null,
          beta: null,
          horizon,
          historyMonths
        })
    }))
  })

  useEffect(() => {
    if (!cargoId && cargoList.length) setCargoId(String(cargoList[0].id))
  }, [cargoId, cargoList])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY)
      if (!raw) return
      const s = JSON.parse(raw)
      if (s.model) setModel(s.model)
      if (Number.isFinite(s.alpha)) setAlpha(Number(s.alpha))
      if (Number.isFinite(s.beta)) setBeta(Number(s.beta))
      if (Number.isFinite(s.horizon)) setHorizon(Number(s.horizon))
      if (Number.isFinite(s.historyMonths)) setHistoryMonths(Number(s.historyMonths))
      if (s.viewMode) setViewMode(s.viewMode)
      if (typeof s.showScenarios === 'boolean') setShowScenarios(s.showScenarios)
      if (Number.isFinite(s.scenarioSpread)) setScenarioSpread(Number(s.scenarioSpread))
    } catch {
      // ignore malformed persisted settings
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        model,
        alpha,
        beta,
        horizon,
        historyMonths,
        viewMode,
        showScenarios,
        scenarioSpread
      })
    )
  }, [model, alpha, beta, horizon, historyMonths, viewMode, showScenarios, scenarioSpread])

  const chartData = useMemo(() => {
    if (!data) return []
    const adjusted = data.historicalDemandAdjusted || data.historicalDemand
    const flags = data.outlierFlags || []
    const smoothedAligned = alignSmoothedSeries(data.historicalDemand, data.smoothedSeries)
    const hist = data.historicalPeriodLabels.map((p, i) => ({
      type: 'history',
      period: p,
      periodLabel: formatChartPeriod(p),
      demand: safeChartNumber(data.historicalDemand[i], null),
      demandAdjusted: safeChartNumber(adjusted[i], null),
      smoothed: safeChartNumber(smoothedAligned[i], null),
      forecast: null,
      forecastLow: null,
      forecastHigh: null,
      bandBase: 0,
      bandSpan: 0,
      scenarioOptimistic: null,
      scenarioPessimistic: null,
      anomaly: flags[i] ? data.historicalDemand[i] : null
    }))
    const fc = data.forecastPeriodLabels.map((p, i) => {
      const fv = safeChartNumber(data.forecastValues[i], 0)
      const mae = safeChartNumber(data.mae, 0)
      const low = Math.max(0, fv - mae)
      const high = fv + mae
      return {
        type: 'forecast',
        period: p,
        periodLabel: formatChartPeriod(p),
        demand: null,
        smoothed: null,
        forecast: fv,
        forecastLow: low,
        forecastHigh: high,
        bandBase: low,
        bandSpan: Math.max(0, high - low),
        scenarioOptimistic: fv * (1 + scenarioSpread / 100),
        scenarioPessimistic: Math.max(0, fv * (1 - scenarioSpread / 100)),
        anomaly: null
      }
    })
    const combined = [...hist, ...fc]
    if (hist.length && fc.length) {
      const lastSmoothed = hist[hist.length - 1].smoothed
      if (lastSmoothed !== null) {
        fc[0] = { ...fc[0], smoothed: lastSmoothed }
      }
    }
    return combined
  }, [data, scenarioSpread])

  const forecastYMax = useMemo(() => {
    if (!chartData.length) return 100
    const keys = [
      'demand',
      'demandAdjusted',
      'smoothed',
      'forecast',
      'forecastHigh',
      'scenarioOptimistic',
      'anomaly'
    ]
    let max = computeNiceYMax(chartData, keys, { padding: 0.12, minTop: 10 })
    if (data?.forecastCeiling != null) {
      max = Math.max(max, safeChartNumber(data.forecastCeiling, 0) * 1.05)
    }
    return max
  }, [chartData, data?.forecastCeiling])

  const comparison = useMemo(
    () =>
      compareQueries
        .map((q) => q.data)
        .filter(Boolean)
        .sort((a, b) => Number(a.mse ?? Number.POSITIVE_INFINITY) - Number(b.mse ?? Number.POSITIVE_INFINITY)),
    [compareQueries]
  )

  const bestModel = comparison[0]

  const forecastSummary = useMemo(() => {
    if (!data?.forecastValues?.length) return null
    const vals = data.forecastValues.map((v) => Number(v || 0))
    const sum = vals.reduce((s, x) => s + x, 0)
    const avg = sum / vals.length
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    return { sum, avg, min, max }
  }, [data])

  const insight = useMemo(() => {
    if (!data || !forecastSummary) return null
    const h = data.historicalDemandAdjusted || data.historicalDemand || []
    const histTail = h.slice(-Math.min(6, h.length))
    const histAvg = histTail.length ? histTail.reduce((s, x) => s + Number(x || 0), 0) / histTail.length : 0
    const trendPct = histAvg > 0 ? ((forecastSummary.avg - histAvg) / histAvg) * 100 : 0
    const volatility = forecastSummary.avg > 0 ? ((data.mae || 0) / forecastSummary.avg) * 100 : 0
    const trendLabel = trendPct > 7 ? 'зростання попиту' : trendPct < -7 ? 'зниження попиту' : 'стабільний попит'
    const riskLabel = volatility > 20 ? 'високий ризик коливань' : volatility > 10 ? 'помірний ризик' : 'низький ризик'
    const recommendation =
      trendPct > 7
        ? 'Рекомендація: збільшити буферний запас і частоту поповнення.'
        : trendPct < -7
          ? 'Рекомендація: скоригувати закупівлі, щоб уникнути надмірних залишків.'
          : 'Рекомендація: утримувати поточний рівень запасів із невеликим страховим буфером.'
    return { trendPct, volatility, trendLabel, riskLabel, recommendation }
  }, [data, forecastSummary])

  const kpis = useMemo(() => {
    if (!data || !forecastSummary || !insight) return null
    const nextMonth = Number(data.forecastValues?.[0] ?? 0)
    const safetyStock = Math.max(0, Math.round(nextMonth + (data.mae || 0) * 1.65))
    const confidencePct = Math.max(5, Math.min(99, Math.round(100 - insight.volatility * 1.25)))
    const riskLevel = insight.volatility > 20 ? 'HIGH' : insight.volatility > 10 ? 'MEDIUM' : 'LOW'
    return { nextMonth, safetyStock, confidencePct, riskLevel }
  }, [data, forecastSummary, insight])

  const sliderSx = {
    height: 10,
    py: 0.5,
    '& .MuiSlider-rail': {
      opacity: 1,
      height: 8,
      borderRadius: 99,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
    },
    '& .MuiSlider-track': {
      height: 8,
      borderRadius: 99,
      border: 'none',
      background: 'linear-gradient(90deg, #00FFA3 0%, #6366F1 50%, #00E5FF 100%)',
      boxShadow: '0 0 16px rgba(99,102,241,0.25)'
    },
    '& .MuiSlider-thumb': {
      width: 20,
      height: 20,
      backgroundColor: '#ffffff',
      border: '2px solid rgba(11,9,20,0.9)',
      boxShadow: '0 4px 14px rgba(0,0,0,0.45), 0 0 0 6px rgba(99,102,241,0.12)',
      transition: 'all 0.3s ease-out',
      '&:hover, &.Mui-focusVisible': {
        boxShadow: '0 6px 18px rgba(0,0,0,0.5), 0 0 0 8px rgba(139,92,246,0.14)'
      }
    },
    '& .MuiSlider-mark': {
      backgroundColor: 'rgba(255,255,255,0.25)',
      height: 6,
      width: 2,
      borderRadius: 1
    },
    '& .MuiSlider-markLabel': {
      color: 'text.secondary',
      fontSize: 11,
      fontWeight: 600
    }
  }

  const selectMenuProps = {
    PaperProps: {
      sx: {
        mt: 0.75,
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(9,9,11,0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 24px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
        maxHeight: 320,
        '& .MuiMenuItem-root': {
          transition: 'all 0.3s ease-out',
          borderRadius: 1,
          mx: 0.5,
          my: 0.15,
          '&:hover': {
            background: 'rgba(99,102,241,0.14)'
          },
          '&.Mui-selected': {
            background: 'rgba(99, 102, 241, 0.16)'
          }
        }
      }
    }
  }

  const glassPanelSx = {
    p: 2.75,
    height: '100%',
    borderRadius: 2,
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: midnightBg,
    backgroundImage: glassCardSurface,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 18px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)'
  }

  const forecastKpiPaperSx = (kind, riskLevel) => {
    const base = {
      p: 1.35,
      borderRadius: 2,
      backgroundColor: midnightBg,
      backgroundImage: glassCardSurface,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.1)',
      transition: 'all 0.3s ease-out',
      '&:hover': { transform: 'translateY(-3px)' }
    }
    if (kind === 'next')
      return {
        ...base,
        borderColor: 'rgba(0, 255, 163, 0.28)',
        boxShadow: '0 0 28px rgba(0, 255, 163, 0.1), inset 0 1px 0 rgba(255,255,255,0.07)'
      }
    if (kind === 'buffer')
      return {
        ...base,
        borderColor: 'rgba(99, 102, 241, 0.35)',
        boxShadow: '0 0 28px rgba(76, 29, 149, 0.18), inset 0 1px 0 rgba(255,255,255,0.07)'
      }
    if (riskLevel === 'HIGH')
      return {
        ...base,
        borderColor: 'rgba(244, 63, 94, 0.45)',
        boxShadow: '0 0 32px rgba(244, 63, 94, 0.18), inset 0 1px 0 rgba(255,255,255,0.06)',
        animation: 'hl-urgency-border 2.5s ease-in-out infinite'
      }
    if (riskLevel === 'MEDIUM')
      return {
        ...base,
        borderColor: 'rgba(167, 139, 250, 0.4)',
        boxShadow: '0 0 28px rgba(99, 102, 241, 0.14), inset 0 1px 0 rgba(255,255,255,0.06)',
        animation: 'hl-urgency-border-warn 3.2s ease-in-out infinite'
      }
    return {
      ...base,
      borderColor: 'rgba(139, 92, 246, 0.32)',
      boxShadow: '0 0 24px rgba(76, 29, 149, 0.12), inset 0 1px 0 rgba(255,255,255,0.07)'
    }
  }

  const exportForecastPdf = async () => {
    if (!data) return
    try {
      const { exportForecastPdf: doExport } = await import('../utils/exportForecastPdf.js')
      await doExport(data, chartData)
    } catch (e) {
      console.error('PDF export failed', e)
      window.alert('Не вдалося сформувати PDF. Перезавантажте сторінку або спробуйте експорт CSV.')
    }
  }

  const exportForecastCsv = () => {
    if (!chartData.length || !data) return
    const sep = ';'
    const header = [
      'період',
      'факт',
      'факт_після_winsorization',
      'згладжено',
      'прогноз',
      'прогноз_низ',
      'прогноз_верх',
      'системна_нижня_межа',
      'системна_верхня_межа',
      'оптимістичний',
      'песимістичний'
    ]
    const floor = data.forecastFloor ?? ''
    const ceiling = data.forecastCeiling ?? ''
    const rows = chartData.map((r) => [
      r.period,
      r.demand ?? '',
      r.demandAdjusted ?? '',
      r.smoothed ?? '',
      r.forecast ?? '',
      r.forecastLow ?? '',
      r.forecastHigh ?? '',
      floor,
      ceiling,
      r.scenarioOptimistic ?? '',
      r.scenarioPessimistic ?? ''
    ])
    const csv = buildExcelUtf8Csv([header, ...rows], sep)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `forecast_${data.cargoName || data.cargoId}_${data.model}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Box>
      <Stagger>
        <Item>
          <PageHeader
            title="Прогноз попиту"
            subtitle="Прогноз за місячним OUTBOUND: winsorization викидів (1.5×IQR), обмеження прогнозу реалістичним коридором, згасаючий тренд у моделі Холта. Порівняння SES / Холт / КС за ПКПМ (MSE) та САП (MAE). Експорт: CSV (UTF-8 + BOM, роздільник «;» для Excel) та PDF (кирилиця через Noto Sans)."
          />
        </Item>

        <Item>
          <Grid container spacing={2.5}>
            <Grid item xs={12} lg={4}>
              <Paper sx={glassPanelSx}>
                <Stack spacing={2}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
                    Параметри розрахунку
                  </Typography>
                  <TextField
                    select
                    label="Вантаж"
                    value={cargoId}
                    onChange={(e) => setCargoId(e.target.value)}
                    fullWidth
                    disabled={cargoQ.isLoading}
                    SelectProps={{ MenuProps: selectMenuProps }}
                  >
                    {cargoList.map((c) => (
                      <MenuItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    label="Модель прогнозу"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    fullWidth
                    SelectProps={{ MenuProps: selectMenuProps }}
                  >
                    <MenuItem value="AUTO">Авто — найкраща за ПКПМ (середньоквадратична помилка)</MenuItem>
                    <MenuItem value="SES">SES — просте експоненційне згладжування</MenuItem>
                    <MenuItem value="HOLT">Холт — рівень і тренд у часі</MenuItem>
                    <MenuItem value="MA">Ковзне середнє</MenuItem>
                  </TextField>

                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Альфа α (0…1): {alpha.toFixed(2)}{' '}
                      <Typography component="span" variant="caption" sx={{ opacity: 0.85 }}>
                        — швидкість реакції на нові дані
                      </Typography>
                    </Typography>
                    <Slider
                      value={alpha}
                      min={0.05}
                      max={1}
                      step={0.05}
                      marks={[{ value: 0.1, label: '0.1' }, { value: 0.5, label: '0.5' }, { value: 0.9, label: '0.9' }]}
                      onChange={(_, v) => setAlpha(Number(Array.isArray(v) ? v[0] : v))}
                      disabled={model === 'MA' || model === 'AUTO'}
                      sx={sliderSx}
                    />
                    {(model === 'MA' || model === 'AUTO') && (
                      <Typography variant="caption" color="text.secondary">
                        Для цього режиму α підбирається автоматично або не застосовується.
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Бета β (0…1): {beta.toFixed(2)}{' '}
                      <Typography component="span" variant="caption" sx={{ opacity: 0.85 }}>
                        — чутливість до зміни тренду (лише Холт)
                      </Typography>
                    </Typography>
                    <Slider
                      value={beta}
                      min={0.05}
                      max={1}
                      step={0.05}
                      marks={[{ value: 0.1, label: '0.1' }, { value: 0.5, label: '0.5' }, { value: 0.9, label: '0.9' }]}
                      onChange={(_, v) => setBeta(Number(Array.isArray(v) ? v[0] : v))}
                      disabled={model !== 'HOLT'}
                      sx={sliderSx}
                    />
                    {model !== 'HOLT' && (
                      <Typography variant="caption" color="text.secondary">
                        β використовується лише в моделі Холта для оновлення тренду.
                      </Typography>
                    )}
                  </Box>

                  <Stack direction="row" spacing={2}>
                    <TextField
                      label="Горизонт (міс.)"
                      type="number"
                      inputProps={{ min: 1, max: 36 }}
                      value={horizon}
                      onChange={(e) => setHorizon(Number(e.target.value))}
                      fullWidth
                    />
                    <TextField
                      label="Історія (міс.)"
                      type="number"
                      inputProps={{ min: 3, max: 120 }}
                      value={historyMonths}
                      onChange={(e) => setHistoryMonths(Number(e.target.value))}
                      fullWidth
                    />
                  </Stack>

                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      Сценарії попиту: ±{scenarioSpread}%
                    </Typography>
                    <Slider
                      value={scenarioSpread}
                      min={5}
                      max={40}
                      step={1}
                      onChange={(_, v) => setScenarioSpread(Number(Array.isArray(v) ? v[0] : v))}
                      disabled={!showScenarios}
                      sx={sliderSx}
                    />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        Показати оптимістичний/стрес-сценарій
                      </Typography>
                      <Switch
                        checked={showScenarios}
                        onChange={(e) => setShowScenarios(e.target.checked)}
                        sx={{
                          transition: 'all 0.3s ease-out',
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#A78BFA' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            background: 'linear-gradient(90deg, #6366F1, #7C3AED)',
                            opacity: 1
                          }
                        }}
                      />
                    </Stack>
                  </Stack>

                  <Button variant="contained" onClick={() => setNonce((x) => x + 1)} disabled={!cargoId} fullWidth>
                    Оновити прогноз
                  </Button>

                  {forecastQ.isError && (
                    <Alert severity="error" sx={{ py: 0.5 }}>
                      {forecastQ.error?.response?.data?.message
                        || forecastQ.error?.response?.data?.error
                        || forecastQ.error?.message
                        || 'Помилка прогнозу'}
                    </Alert>
                  )}

                  {data && (
                    <Stack spacing={0.75}>
                      <Typography variant="caption" color="text.secondary">
                        Обрана модель:{' '}
                        <b>{displayModelName(data.model)}</b>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        α: <b>{Number(data.alpha ?? 0).toFixed(2)}</b>
                        {data.beta !== null && data.beta !== undefined ? (
                          <> · β: <b>{Number(data.beta).toFixed(2)}</b></>
                        ) : null}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ПКПМ (точність): <b>{Number(data.mse ?? 0).toFixed(2)}</b> · САП (похибка):{' '}
                        <b>{Number(data.mae ?? 0).toFixed(2)}</b>
                      </Typography>
                      {forecastSummary && (
                        <Typography variant="caption" color="text.secondary">
                          На {horizon} міс. сума <b>{forecastSummary.sum.toFixed(0)}</b>, середнє{' '}
                          <b>{forecastSummary.avg.toFixed(1)}</b>, діапазон{' '}
                          <b>
                            {forecastSummary.min.toFixed(0)} — {forecastSummary.max.toFixed(0)}
                          </b>
                          {data.forecastFloor != null && data.forecastCeiling != null ? (
                            <>
                              {' '}
                              · коридор системи:{' '}
                              <b>
                                {Number(data.forecastFloor).toFixed(0)} — {Number(data.forecastCeiling).toFixed(0)}
                              </b>
                            </>
                          ) : null}
                        </Typography>
                      )}
                    </Stack>
                  )}
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={8}>
              <Paper
                sx={{
                  ...glassPanelSx,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}
              >
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" spacing={1}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {data ? data.cargoName : 'Динаміка попиту'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Факт (зелена) → після winsorization (помаранчева) → прогноз; фіолетові точки — викиди; лінії мін/макс — коридор прогнозу.
                      </Typography>
                    </Box>
                    {bestModel && (
                      <Chip
                        variant="outlined"
                        sx={{
                          fontWeight: 800,
                          borderColor: 'rgba(139, 92, 246, 0.45)',
                          color: 'text.secondary',
                          boxShadow: '0 0 22px rgba(76, 29, 149, 0.2)',
                          transition: 'all 0.3s ease-out',
                          '& .MuiChip-label': { fontVariantNumeric: 'tabular-nums' }
                        }}
                        label={`Мін. ПКПМ: ${displayModelName(bestModel.model)} (${Number(bestModel.mse).toFixed(1)})`}
                      />
                    )}
                  </Stack>
                  {data?.stabilityNote && (
                    <Alert severity="info">{data.stabilityNote}</Alert>
                  )}
                  {data?.warnings?.length > 0 &&
                    data.warnings.map((w) => (
                      <Alert key={w} severity="warning">
                        {w}
                      </Alert>
                    ))}
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  {comparison.map((m) => {
                    const isActive =
                      data && normalizeCompareModel(data.model) === normalizeCompareModel(m.model)
                    const isBest = bestModel && m.model === bestModel.model
                    return (
                    <Paper
                      key={m.model}
                      variant="outlined"
                      sx={{
                        px: 1.35,
                        py: 1,
                        minWidth: 120,
                        borderRadius: 2,
                        border: isBest
                          ? '1px solid rgba(52, 211, 153, 0.45)'
                          : isActive
                            ? '1px solid rgba(99,102,241,0.45)'
                            : '1px solid rgba(255,255,255,0.1)',
                        background: isBest ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)',
                        backdropFilter: 'blur(16px)',
                        transition: 'all 0.3s ease-out',
                        '&:hover': {
                          borderColor: 'rgba(99,102,241,0.45)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 0 24px rgba(99,102,241,0.12)'
                        }
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 900, display: 'block' }}>
                        {displayModelName(m.model)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        ПКПМ {Number(m.mse).toFixed(1)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        САП {Number(m.mae).toFixed(1)}
                      </Typography>
                    </Paper>
                    )
                  })}
                </Stack>
                {kpis && (
                  <Grid container spacing={1.75}>
                    <Grid item xs={12} sm={4}>
                      <Paper sx={forecastKpiPaperSx('next')}>
                        <Typography variant="caption" color="text.secondary">
                          Очікуваний відпуск (наступний місяць)
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: '#fff' }}>
                          {kpis.nextMonth.toFixed(0)}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper sx={forecastKpiPaperSx('buffer')}>
                        <Typography variant="caption" color="text.secondary">
                          Рекомендований страховий запас
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: '#fff' }}>
                          {kpis.safetyStock}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper sx={forecastKpiPaperSx('risk', kpis.riskLevel)}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Впевненість прогнозу
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: '#fff' }}>
                          {kpis.confidencePct}%
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                          <Typography variant="caption" color="text.secondary">
                            Ризик коливань:
                          </Typography>
                          <Chip
                            size="small"
                            label={RISK_LABEL_UA[kpis.riskLevel] || kpis.riskLevel}
                            color={kpis.riskLevel === 'HIGH' ? 'error' : kpis.riskLevel === 'MEDIUM' ? 'warning' : 'success'}
                            variant="outlined"
                          />
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                )}
                {insight && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.35,
                      borderRadius: 2,
                      border: '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: midnightBg,
                      backgroundImage: glassCardSurface,
                      backdropFilter: 'blur(16px)',
                      boxShadow: '0 0 28px rgba(76, 29, 149, 0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
                      transition: 'all 0.3s ease-out'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 900 }}>
                      Висновок: {insight.trendLabel}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Тренд прогнозу vs останні 6 міс. (очищена історія): <b>{insight.trendPct.toFixed(1)}%</b> ·
                      відносна похибка (САП / середній прогноз): <b>{insight.volatility.toFixed(1)}%</b> ·{' '}
                      {insight.riskLabel}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {insight.recommendation}
                    </Typography>
                  </Paper>
                )}
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={1}>
                  <ToggleButtonGroup
                    size="small"
                    color="primary"
                    exclusive
                    value={viewMode}
                    onChange={(_e, v) => v && setViewMode(v)}
                    sx={{
                      flexWrap: 'wrap',
                      gap: 0.5,
                      '& .MuiToggleButton-root': {
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: '10px !important',
                        px: 1.5,
                        border: '1px solid rgba(255,255,255,0.12) !important',
                        color: 'text.secondary',
                        transition: 'all 0.3s ease-out',
                        '&.Mui-selected': {
                          color: '#fff',
                          background: 'linear-gradient(135deg, rgba(99,102,241,0.38), rgba(76,29,149,0.28))',
                          borderColor: 'rgba(99,102,241,0.45) !important',
                          boxShadow: '0 0 20px rgba(76, 29, 149, 0.22)'
                        },
                        '&:hover': {
                          background: 'rgba(255,255,255,0.06)'
                        }
                      }
                    }}
                  >
                    <ToggleButton value="combo">Комбінований</ToggleButton>
                    <ToggleButton value="line">Лінії</ToggleButton>
                    <ToggleButton value="area">Заливка</ToggleButton>
                  </ToggleButtonGroup>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button
                      variant="outlined"
                      onClick={exportForecastCsv}
                      disabled={!data}
                      sx={{ textTransform: 'none', fontWeight: 700, transition: 'all 0.3s ease-out' }}
                    >
                      Експорт CSV (Excel)
                    </Button>
                    <Button
                      variant="contained"
                      onClick={exportForecastPdf}
                      disabled={!data}
                      sx={{ textTransform: 'none', fontWeight: 700, transition: 'all 0.3s ease-out' }}
                    >
                      Експорт PDF
                    </Button>
                  </Stack>
                </Stack>
                <Divider sx={{ opacity: 0.22 }} />

                <Box className="hl-dash" sx={{ height: { xs: 420, md: 500 }, minHeight: 380 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 12, right: 18, left: 4, bottom: 12 }}>
                      <defs>
                        <linearGradient id="forecastDemandFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34D399" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="forecastSmoothedFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#A855F7" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="forecastOrangeFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#C084FC" stopOpacity={0.38} />
                          <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...chartGridProps} />
                      <XAxis
                        dataKey="periodLabel"
                        tick={chartTickStyle}
                        axisLine={chartAxisLineStyle}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={chartTickStyle}
                        tickFormatter={formatChartInt}
                        domain={[0, forecastYMax]}
                        allowDataOverflow
                        axisLine={chartAxisLineStyle}
                      />
                      {data?.forecastFloor != null && (
                        <ReferenceLine
                          y={data.forecastFloor}
                          stroke="rgba(52, 211, 153, 0.35)"
                          strokeDasharray="6 4"
                          label={{ value: 'мін', position: 'insideTopRight', fill: 'rgba(52,211,153,0.7)', fontSize: 10 }}
                        />
                      )}
                      {data?.forecastCeiling != null && (
                        <ReferenceLine
                          y={data.forecastCeiling}
                          stroke="rgba(244, 63, 94, 0.35)"
                          strokeDasharray="6 4"
                          label={{ value: 'макс', position: 'insideTopRight', fill: 'rgba(244,63,94,0.75)', fontSize: 10 }}
                        />
                      )}
                      <Tooltip content={ForecastTooltip} />
                      <Legend wrapperStyle={chartLegendWrapperStyle} />
                      <Area
                        type="monotone"
                        dataKey="bandBase"
                        stackId="confBand"
                        stroke="none"
                        fill="rgba(0,0,0,0)"
                        connectNulls
                        isAnimationActive={false}
                        legendType="none"
                      />
                      <Area
                        type="monotone"
                        dataKey="bandSpan"
                        stackId="confBand"
                        stroke="none"
                        fill="rgba(124, 58, 237, 0.14)"
                        connectNulls
                        isAnimationActive={false}
                        legendType="none"
                      />
                      {(viewMode === 'area' || viewMode === 'combo') && (
                        <Area
                          type="monotone"
                          dataKey="demand"
                          stroke="none"
                          fill="url(#forecastDemandFill)"
                          connectNulls
                          isAnimationActive={false}
                          legendType="none"
                        />
                      )}
                      {(viewMode === 'area' || viewMode === 'combo') && (
                        <Area
                          type="monotone"
                          dataKey="smoothed"
                          stroke="none"
                          fill="url(#forecastSmoothedFill)"
                          connectNulls
                          isAnimationActive={false}
                          legendType="none"
                        />
                      )}
                      {(viewMode === 'line' || viewMode === 'combo') && (
                        <Line
                          type="monotone"
                          dataKey="demand"
                          name="Факт (до winsorization)"
                          stroke={cyberInbound.b}
                          dot={false}
                          strokeWidth={2.5}
                          connectNulls={false}
                        />
                      )}
                      {(viewMode === 'line' || viewMode === 'combo') && (
                        <Line
                          type="monotone"
                          dataKey="demandAdjusted"
                          name="Після winsorization"
                          stroke="#F59E0B"
                          dot={false}
                          strokeWidth={2}
                          strokeDasharray="6 4"
                          connectNulls
                        />
                      )}
                      {(viewMode === 'line' || viewMode === 'combo') && (
                        <Line
                          type="monotone"
                          dataKey="smoothed"
                          name="Згладжені дані"
                          stroke={cyberOutbound.b}
                          dot={false}
                          strokeWidth={2.2}
                          connectNulls
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="forecastLow"
                        name="Нижня межа (≈ −САП)"
                        stroke="rgba(167, 139, 250, 0.28)"
                        dot={false}
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="forecastHigh"
                        name="Верхня межа (≈ +САП)"
                        stroke="rgba(167, 139, 250, 0.28)"
                        dot={false}
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        connectNulls
                      />
                      {(viewMode === 'area' || viewMode === 'combo') && (
                        <Area
                          type="monotone"
                          dataKey="forecast"
                          name="Прогноз (заливка)"
                          stroke="none"
                          fill="url(#forecastOrangeFill)"
                          connectNulls
                          isAnimationActive={false}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        name="Прогноз"
                        stroke={cyberForecast.line}
                        dot={false}
                        strokeWidth={3}
                        strokeDasharray="10 6"
                        connectNulls
                      />
                      {showScenarios && (
                        <Line
                          type="monotone"
                          dataKey="scenarioOptimistic"
                          name={`Оптимістичний (+${scenarioSpread}%)`}
                          stroke="#6366F1"
                          dot={false}
                          strokeWidth={2}
                          strokeDasharray="6 4"
                          connectNulls
                        />
                      )}
                      {showScenarios && (
                        <Line
                          type="monotone"
                          dataKey="scenarioPessimistic"
                          name={`Стрес-сценарій (-${scenarioSpread}%)`}
                          stroke={cyberCritical}
                          dot={false}
                          strokeWidth={2}
                          strokeDasharray="6 4"
                          connectNulls
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="anomaly"
                        name="Аномальні точки"
                        stroke="none"
                        strokeWidth={0}
                        dot={ForecastAnomalyDot}
                        activeDot={{ r: 8, fill: '#C084FC', stroke: '#fff', strokeWidth: 1 }}
                        connectNulls={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Item>
      </Stagger>
    </Box>
  )
}
