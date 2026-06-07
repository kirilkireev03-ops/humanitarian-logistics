import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import InsightsIcon from '@mui/icons-material/Insights'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import AutoGraphIcon from '@mui/icons-material/AutoGraph'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import RadarIcon from '@mui/icons-material/Radar'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'

function readCount(key) {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}

export default function SidebarBottomExtras({ variant = 'hub' }) {
  const nav = useNavigate()
  const [now, setNow] = useState(() => new Date())
  const [chatCount, setChatCount] = useState(() => readCount('hl_sidebar_chat_v1'))
  const [notesCount, setNotesCount] = useState(() => readCount('hl_notes_v1'))

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'hl_sidebar_chat_v1') setChatCount(readCount('hl_sidebar_chat_v1'))
      if (e.key === 'hl_notes_v1') setNotesCount(readCount('hl_notes_v1'))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const loadScore = useMemo(() => {
    // Lightweight dynamic score for a "working" mini-widget.
    const h = now.getHours()
    const base = h >= 8 && h <= 20 ? 68 : 44
    return Math.max(15, Math.min(99, base + Math.min(20, chatCount) + Math.min(12, notesCount)))
  }, [now, chatCount, notesCount])

  const actions = [
    { id: 'a1', label: 'Прогноз', icon: <AutoGraphIcon fontSize="small" />, to: '/forecast' },
    { id: 'a2', label: 'Заявки', icon: <AssignmentTurnedInIcon fontSize="small" />, to: '/requests' },
    { id: 'a3', label: 'Огляд', icon: <RocketLaunchIcon fontSize="small" />, to: '/' }
  ]

  const missionTrend = useMemo(() => {
    // tiny deterministic sparkline-like series that changes over time
    const seed = now.getMinutes()
    return Array.from({ length: 14 }, (_, i) => {
      const v = 38 + Math.sin((seed + i) / 2.7) * 20 + (i % 4) * 4
      return Math.max(8, Math.min(92, Math.round(v)))
    })
  }, [now])

  if (variant === 'mission') {
    const peak = Math.max(...missionTrend)
    const avg = Math.round(missionTrend.reduce((s, x) => s + x, 0) / missionTrend.length)
    return (
      <Paper
        sx={{
          p: 1,
          borderRadius: 2,
          borderColor: 'rgba(255,159,10,0.25)',
          background:
            'linear-gradient(180deg, rgba(255,159,10,0.12) 0%, rgba(255,61,127,0.08) 55%, rgba(61,158,255,0.08) 100%)',
          boxShadow: '0 10px 24px rgba(0,0,0,0.24), 0 0 16px rgba(255,159,10,0.10) inset'
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.55 }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <RadarIcon sx={{ fontSize: 15, color: '#ffb347' }} />
            <Typography variant="caption" sx={{ fontWeight: 900 }}>
              Радар активності
            </Typography>
          </Stack>
          <Chip size="small" icon={<LocalFireDepartmentIcon sx={{ '&&': { fontSize: 12 } }} />} label={`${peak}%`} variant="outlined" color="warning" sx={{ height: 20 }} />
        </Stack>
        <Stack direction="row" spacing={0.55} sx={{ mb: 0.6 }}>
          <Chip size="small" label={`Сер. ${avg}%`} variant="outlined" sx={{ height: 19, '& .MuiChip-label': { px: 0.55, fontSize: 10 } }} />
          <Chip size="small" label={`Пік ${peak}%`} variant="outlined" sx={{ height: 19, '& .MuiChip-label': { px: 0.55, fontSize: 10 } }} />
        </Stack>
        <Stack direction="row" alignItems="flex-end" spacing={0.35} sx={{ height: 34 }}>
          {missionTrend.map((v, idx) => (
            <Box
              key={`m-${idx}`}
              sx={{
                flex: 1,
                minWidth: 0,
                height: `${v}%`,
                borderRadius: '4px 4px 2px 2px',
                background: 'linear-gradient(180deg, rgba(255,159,10,0.95) 0%, rgba(255,61,127,0.85) 65%, rgba(61,158,255,0.75) 100%)'
              }}
            />
          ))}
        </Stack>
      </Paper>
    )
  }

  if (variant === 'quest') {
    const quest = [
      { id: 'q1', label: 'Оновити прогноз', done: now.getMinutes() % 2 === 0, to: '/forecast' },
      { id: 'q2', label: 'Перевірити заявки', done: now.getMinutes() % 3 === 0, to: '/requests' },
      { id: 'q3', label: 'Оцінити залишки', done: now.getMinutes() % 5 === 0, to: '/stock' }
    ]
    const doneCount = quest.filter((q) => q.done).length
    return (
      <Paper
        sx={{
          p: 1,
          borderRadius: 2,
          borderColor: 'rgba(52,199,89,0.24)',
          background:
            'linear-gradient(180deg, rgba(52,199,89,0.12) 0%, rgba(61,158,255,0.08) 55%, rgba(124,77,255,0.08) 100%)',
          boxShadow: '0 10px 24px rgba(0,0,0,0.24), 0 0 16px rgba(52,199,89,0.10) inset'
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.55 }}>
          <Typography variant="caption" sx={{ fontWeight: 900 }}>
            Швидкі цілі
          </Typography>
          <Chip size="small" label={`${doneCount}/3`} variant="outlined" color="success" sx={{ height: 20 }} />
        </Stack>
        <Stack spacing={0.45}>
          {quest.map((q) => (
            <Button
              key={q.id}
              variant={q.done ? 'contained' : 'outlined'}
              color={q.done ? 'success' : 'primary'}
              size="small"
              startIcon={<CheckCircleOutlineIcon fontSize="small" />}
              onClick={() => nav(q.to)}
              sx={{ justifyContent: 'flex-start', borderRadius: 1.5, textTransform: 'none', fontWeight: 800 }}
            >
              {q.label}
            </Button>
          ))}
        </Stack>
      </Paper>
    )
  }

  return (
    <Paper
      sx={{
        p: 1,
        borderRadius: 2,
        borderColor: 'rgba(61,158,255,0.20)',
        background:
          'linear-gradient(180deg, rgba(61,158,255,0.10) 0%, rgba(124,77,255,0.07) 55%, rgba(0,200,160,0.06) 100%)',
        boxShadow: '0 10px 26px rgba(0,0,0,0.24), 0 0 20px rgba(61,158,255,0.10) inset',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.6 }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <InsightsIcon sx={{ fontSize: 15, color: 'primary.light' }} />
          <Typography variant="caption" sx={{ fontWeight: 900 }}>
            Центр швидкого доступу
          </Typography>
        </Stack>
        <Chip
          size="small"
          label={now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
          variant="outlined"
          sx={{ height: 20, '& .MuiChip-label': { px: 0.55, fontSize: 10 } }}
        />
      </Stack>

      <Stack direction="row" spacing={0.55} sx={{ mb: 0.7 }}>
        <Chip size="small" label={`Чат: ${chatCount}`} variant="outlined" sx={{ height: 20, '& .MuiChip-label': { px: 0.55, fontSize: 10 } }} />
        <Chip size="small" label={`Нотатки: ${notesCount}`} variant="outlined" sx={{ height: 20, '& .MuiChip-label': { px: 0.55, fontSize: 10 } }} />
      </Stack>

      <Box sx={{ mb: 0.7 }}>
        <Typography variant="caption" color="text.secondary">
          Інтенсивність сесії: <b>{loadScore}%</b>
        </Typography>
        <Box sx={{ mt: 0.35, height: 6, borderRadius: 999, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.06)' }}>
          <Box
            sx={{
              width: `${loadScore}%`,
              height: '100%',
              borderRadius: 999,
              background: 'linear-gradient(90deg, #3d9eff 0%, #7c4dff 60%, #00c8a0 100%)'
            }}
          />
        </Box>
      </Box>

      <Stack spacing={0.45} sx={{ mt: 'auto' }}>
        {actions.map((a) => (
          <Button
            key={a.id}
            variant="outlined"
            size="small"
            startIcon={a.icon}
            onClick={() => nav(a.to)}
            sx={{ justifyContent: 'flex-start', borderRadius: 1.5, textTransform: 'none', fontWeight: 800 }}
          >
            {a.label}
          </Button>
        ))}
      </Stack>
    </Paper>
  )
}
