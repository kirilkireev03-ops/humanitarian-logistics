import { useEffect, useMemo, useState } from 'react'
import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import BoltIcon from '@mui/icons-material/Bolt'
import InsightsIcon from '@mui/icons-material/Insights'

const TIPS = [
  'Порада: перевіряй критичні залишки перед погодженням заявок.',
  'Порада: фіксуй transfer одразу після підтвердження з хаба.',
  'Порада: для нестабільного попиту дивись MAE у прогнозі.',
  'Порада: закріплюй важливі повідомлення в чаті для команди.'
]

function readChatCount() {
  try {
    const raw = localStorage.getItem('hl_sidebar_chat_v1')
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.length : 0
  } catch {
    return 0
  }
}

export default function SidebarWowPanel() {
  const [now, setNow] = useState(() => new Date())
  const [chatCount, setChatCount] = useState(() => readChatCount())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'hl_sidebar_chat_v1') setChatCount(readChatCount())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const tip = useMemo(() => {
    const idx = Math.floor(now.getMinutes() / 2) % TIPS.length
    return TIPS[idx]
  }, [now])

  return (
    <Paper
      sx={{
        p: 1,
        borderRadius: 2,
        borderColor: 'rgba(61,158,255,0.22)',
        background:
          'linear-gradient(180deg, rgba(61,158,255,0.14) 0%, rgba(124,77,255,0.09) 52%, rgba(0,200,160,0.08) 100%)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.28), 0 0 26px rgba(61,158,255,0.12) inset'
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.6 }}>
        <Stack direction="row" alignItems="center" spacing={0.6}>
          <AutoAwesomeIcon sx={{ fontSize: 16, color: 'primary.light' }} />
          <Typography variant="caption" sx={{ fontWeight: 900 }}>
            Ops Pulse
          </Typography>
        </Stack>
        <Chip
          size="small"
          icon={<BoltIcon sx={{ '&&': { fontSize: 13 } }} />}
          label={now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
          color="info"
          variant="outlined"
          sx={{ height: 22 }}
        />
      </Stack>

      <Stack direction="row" spacing={0.6} sx={{ mb: 0.65 }}>
        <Chip size="small" label={`Чат: ${chatCount}`} variant="outlined" />
        <Chip size="small" label="Стан: Online" color="success" variant="outlined" />
      </Stack>

      <Box
        sx={{
          p: 0.8,
          borderRadius: 1.5,
          border: '1px solid rgba(255,255,255,0.10)',
          background: 'rgba(0,0,0,0.16)'
        }}
      >
        <Stack direction="row" spacing={0.6} alignItems="flex-start">
          <InsightsIcon sx={{ fontSize: 15, mt: 0.1, color: 'primary.light' }} />
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.35 }}>
            {tip}
          </Typography>
        </Stack>
      </Box>
    </Paper>
  )
}
