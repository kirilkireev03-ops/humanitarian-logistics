import { useEffect, useMemo, useRef, useState } from 'react'
import SendIcon from '@mui/icons-material/Send'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import PushPinIcon from '@mui/icons-material/PushPin'
import DownloadIcon from '@mui/icons-material/Download'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import SearchIcon from '@mui/icons-material/Search'
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputBase,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'

import IceCrystalIllustration from './IceCrystalIllustration'

const CHAT_KEY = 'hl_sidebar_chat_v1'
const PROFILE_KEY = 'hl_admin_profile_v1'
const CHAT_SEEN_KEY = 'hl_sidebar_chat_seen_at'
const CHAT_DRAFT_KEY = 'hl_sidebar_chat_draft'

/** Чіткі кольори для читабельності в бічній панелі (не залежать від темної theme.secondary) */
const C = {
  panelBg: 'linear-gradient(180deg, rgba(19, 15, 37, 0.92) 0%, rgba(11, 9, 20, 0.96) 100%)',
  panelBorder: 'rgba(255, 255, 255, 0.1)',
  title: '#ffffff',
  subtitle: '#a1a1aa',
  muted: '#71717a',
  hint: '#71717a',
  inputBg: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(255,255,255,0.1)',
  iconIdle: '#a1a1aa'
}

const MENTION_TOKEN_RE = /@([\w\u0400-\u04FF][\w\u0400-\u04FF.-]*)/gu

function readAuthorFromProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return 'admin'
    const p = JSON.parse(raw)
    return p.displayName || p.username || 'admin'
  } catch {
    return 'admin'
  }
}

function readProfileHandles() {
  const handles = new Set()
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return handles
    const p = JSON.parse(raw)
    const add = (s) => {
      const t = String(s || '').trim()
      if (!t) return
      handles.add(t.toLowerCase())
      handles.add(t.toLowerCase().replace(/\s+/g, ''))
    }
    add(p.username)
    add(p.displayName)
  } catch {
    /* ignore */
  }
  return handles
}

function extractMentions(text) {
  const s = String(text || '')
  const out = new Set()
  let m
  const re = new RegExp(MENTION_TOKEN_RE.source, 'gu')
  while ((m = re.exec(s)) !== null) {
    out.add(m[1].toLowerCase())
  }
  return [...out]
}

function getMessageMentions(m) {
  if (Array.isArray(m.mentions) && m.mentions.length) return m.mentions
  return extractMentions(m.text)
}

function messageMentionsMe(m, myHandles) {
  const mentions = getMessageMentions(m)
  return mentions.some((h) => myHandles.has(h))
}

function readChat() {
  try {
    const raw = localStorage.getItem(CHAT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function renderMessageText(text, { dense } = {}) {
  const s = String(text || '')
  if (!s) return null
  const parts = []
  const re = new RegExp(MENTION_TOKEN_RE.source, 'gu')
  let last = 0
  let m
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) {
      parts.push({ type: 'text', value: s.slice(last, m.index) })
    }
    parts.push({ type: 'mention', value: m[0] })
    last = m.index + m[0].length
  }
  if (last < s.length) parts.push({ type: 'text', value: s.slice(last) })
  return (
    <Typography
      component="span"
      variant="caption"
      color="text.secondary"
      sx={{
        display: 'block',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        lineHeight: dense ? 1.35 : 1.45
      }}
    >
      {parts.map((p, i) =>
        p.type === 'mention' ? (
          <Box
            key={`${i}-${p.value}`}
            component="span"
            sx={{
              color: 'primary.light',
              fontWeight: 800,
              textShadow: '0 0 12px rgba(61,158,255,0.35)',
              background: 'rgba(61,158,255,0.12)',
              borderRadius: 0.5,
              px: 0.35
            }}
          >
            {p.value}
          </Box>
        ) : (
          <span key={`${i}-t`}>{p.value}</span>
        )
      )}
    </Typography>
  )
}

function initials(name) {
  const s = String(name || '').trim()
  if (!s) return '?'
  const parts = s.split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] || '?'
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : ''
  return (a + b).toUpperCase()
}

export default function SidebarChat() {
  const [messages, setMessages] = useState(() => readChat())
  const [text, setText] = useState(() => localStorage.getItem(CHAT_DRAFT_KEY) || '')
  const [unread, setUnread] = useState(0)
  const [feedMode, setFeedMode] = useState('all')
  const [search, setSearch] = useState('')
  const [author, setAuthor] = useState(() => readAuthorFromProfile())
  const [sel, setSel] = useState({ start: 0, end: 0 })
  const [rulesOpen, setRulesOpen] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const sync = () => setAuthor(readAuthorFromProfile())
    const onStorage = (e) => {
      if (e.key === PROFILE_KEY) sync()
    }
    window.addEventListener('hl-profile-changed', sync)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('hl-profile-changed', sync)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === CHAT_KEY) {
        const next = readChat()
        const lastSeen = Number(localStorage.getItem(CHAT_SEEN_KEY) || 0)
        const unreadCount = next.filter((m) => new Date(m.at).getTime() > lastSeen).length
        setUnread(unreadCount)
        setMessages(next)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    const lastSeen = Number(localStorage.getItem(CHAT_SEEN_KEY) || 0)
    const unreadCount = messages.filter((m) => new Date(m.at).getTime() > lastSeen).length
    setUnread(unreadCount)
  }, [messages])

  const myHandles = useMemo(() => {
    const h = new Set(readProfileHandles())
    h.add(author.toLowerCase())
    h.add(author.toLowerCase().replace(/\s+/g, ''))
    return h
  }, [author])

  const mentionCandidates = useMemo(() => {
    const set = new Set()
    const add = (s) => {
      const t = String(s || '').trim()
      if (t.length < 2) return
      set.add(t)
    }
    add(author)
    messages.slice(-80).forEach((m) => add(m.author))
    try {
      const raw = localStorage.getItem(PROFILE_KEY)
      if (raw) {
        const p = JSON.parse(raw)
        add(p.displayName)
        add(p.username)
      }
    } catch {
      /* ignore */
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'uk'))
  }, [messages, author])

  const save = (next) => {
    setMessages(next)
    localStorage.setItem(CHAT_KEY, JSON.stringify(next))
  }

  useEffect(() => {
    localStorage.setItem(CHAT_DRAFT_KEY, text)
  }, [text])

  const searchNorm = search.trim().toLowerCase()

  const matchesSearch = (m) => {
    if (!searchNorm) return true
    const t = String(m.text || '').toLowerCase()
    const a = String(m.author || '').toLowerCase()
    const men = getMessageMentions(m).join(' ')
    return t.includes(searchNorm) || a.includes(searchNorm) || men.includes(searchNorm)
  }

  const pinnedMessages = useMemo(() => {
    return messages.filter((m) => m.pinned && matchesSearch(m)).sort((a, b) => new Date(b.at) - new Date(a.at))
  }, [messages, searchNorm])

  const mainFeedMessages = useMemo(() => {
    let list = messages.filter((m) => !m.pinned && matchesSearch(m))
    if (feedMode === 'mentions') {
      list = list.filter((m) => messageMentionsMe(m, myHandles))
    }
    return list
  }, [messages, searchNorm, feedMode, myHandles])

  const mentionPick = useMemo(() => {
    const el = inputRef.current
    const pos = el ? el.selectionStart ?? text.length : text.length
    const before = text.slice(0, pos)
    const m = before.match(/@([\w\u0400-\u04FF.-]*)$/u)
    if (!m) return null
    const q = (m[1] || '').toLowerCase()
    const hits = mentionCandidates
      .filter((name) => name.toLowerCase().includes(q))
      .slice(0, 6)
    if (!hits.length) return null
    return { start: before.length - m[0].length, end: pos, query: m[0], hits }
  }, [text, sel.start, sel.end, mentionCandidates])

  const applyMention = (name) => {
    const pick = mentionPick
    if (!pick || !inputRef.current) return
    const { start, end } = pick
    const nextText = `${text.slice(0, start)}@${name} ${text.slice(end)}`
    setText(nextText)
    requestAnimationFrame(() => {
      const el = inputRef.current
      if (!el) return
      const caret = start + name.length + 2
      el.focus()
      el.setSelectionRange(caret, caret)
      setSel({ start: caret, end: caret })
    })
  }

  const formatTime = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
  }

  const send = () => {
    const body = text.trim()
    if (!body) return
    const mentions = extractMentions(body)
    const next = [
      ...messages,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        author,
        text: body,
        at: new Date().toISOString(),
        reactions: {},
        pinned: false,
        mentions
      }
    ].slice(-120)
    save(next)
    localStorage.setItem(CHAT_SEEN_KEY, String(Date.now()))
    setUnread(0)
    setText('')
    localStorage.removeItem(CHAT_DRAFT_KEY)
  }

  const markSeen = () => {
    localStorage.setItem(CHAT_SEEN_KEY, String(Date.now()))
    setUnread(0)
  }

  const toggleReaction = (id, emoji) => {
    const next = messages.map((m) => {
      if (m.id !== id) return m
      const prev = m.reactions || {}
      const mine = Array.isArray(prev[emoji]) ? prev[emoji] : []
      const updated = mine.includes(author) ? mine.filter((u) => u !== author) : [...mine, author]
      return { ...m, reactions: { ...prev, [emoji]: updated } }
    })
    save(next)
  }

  const togglePin = (id) => {
    const next = messages.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m))
    save(next)
  }

  const clearChat = () => {
    if (!window.confirm('Очистити весь чат? Дію не можна скасувати.')) return
    save([])
    setUnread(0)
  }

  const exportChat = () => {
    const body = messages
      .map((m) => {
        const men = getMessageMentions(m).length ? ` [@${getMessageMentions(m).join(', @')}]` : ''
        return `[${new Date(m.at).toLocaleString('uk-UA')}] ${m.author}${m.pinned ? ' [PIN]' : ''}${men}: ${m.text}`
      })
      .join('\n')
    const blob = new Blob([body || ''], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sidebar_chat_export.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderMessageCard = (m, { dense } = {}) => {
    const mentionedMe = messageMentionsMe(m, myHandles)
    const isMine = String(m.author || '').trim().toLowerCase() === String(author || '').trim().toLowerCase()
    const bubbleBg = isMine ? 'rgba(61,158,255,0.12)' : 'rgba(255,255,255,0.045)'
    const bubbleBorder = isMine ? 'rgba(61,158,255,0.22)' : 'rgba(255,255,255,0.08)'
    return (
      <Box
        key={m.id}
        sx={{
          px: dense ? 0.75 : 0.9,
          py: dense ? 0.55 : 0.75,
          borderRadius: 1.8,
          background: mentionedMe ? 'rgba(61,158,255,0.10)' : bubbleBg,
          border: `1px solid ${mentionedMe ? 'rgba(61,158,255,0.30)' : bubbleBorder}`,
          boxShadow: mentionedMe
            ? '0 0 0 1px rgba(61,158,255,0.08) inset, 0 14px 40px rgba(61,158,255,0.10)'
            : '0 10px 28px rgba(0,0,0,0.18)',
          transition: 'transform 140ms ease, border-color 140ms ease, box-shadow 180ms ease',
          '&:hover': {
            transform: dense ? 'none' : 'translateY(-1px)',
            borderColor: mentionedMe ? 'rgba(61,158,255,0.40)' : 'rgba(61,158,255,0.22)'
          }
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={0.75}>
          <Stack direction="row" alignItems="center" spacing={0.7} sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: dense ? 20 : 22,
                height: dense ? 20 : 22,
                borderRadius: 999,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 0.3,
                color: '#e8edf4',
                border: '1px solid rgba(255,255,255,0.10)',
                background:
                  'linear-gradient(135deg, rgba(61,158,255,0.24) 0%, rgba(124,77,255,0.18) 55%, rgba(0,200,160,0.14) 110%)'
              }}
            >
              {initials(m.author)}
            </Box>
            <Stack spacing={0} sx={{ minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
                {m.pinned ? <PushPinIcon sx={{ fontSize: 13, opacity: 0.85, flexShrink: 0 }} /> : null}
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 900, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {m.author}
                </Typography>
                {isMine ? (
                  <Chip
                    size="small"
                    label="Ви"
                    variant="outlined"
                    color="info"
                    sx={{ height: 20, '& .MuiChip-label': { px: 0.6, fontSize: 10 } }}
                  />
                ) : null}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.9 }}>
                {formatTime(m.at)}
              </Typography>
            </Stack>
            {mentionedMe ? (
              <Chip size="small" icon={<AlternateEmailIcon sx={{ '&&': { fontSize: 14 } }} />} label="Ви" color="primary" variant="outlined" sx={{ height: 20, '& .MuiChip-label': { px: 0.6, fontSize: 10 } }} />
            ) : null}
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.3}>
            <IconButton
              size="small"
              onClick={() => togglePin(m.id)}
              title={m.pinned ? 'Відкріпити' : 'Закріпити зверху'}
              aria-label={m.pinned ? 'Відкріпити' : 'Закріпити зверху'}
            >
              <PushPinIcon fontSize="inherit" sx={{ fontSize: 12 }} />
            </IconButton>
          </Stack>
        </Stack>
        {renderMessageText(m.text, { dense })}
        <Stack direction="row" sx={{ mt: dense ? 0.35 : 0.55, flexWrap: 'wrap', gap: 0.5 }}>
          {['👍', '🔥', '✅'].map((emoji) => {
            const count = (m.reactions?.[emoji] || []).length
            return (
              <Chip
                key={emoji}
                size="small"
                label={`${emoji} ${count || ''}`.trim()}
                variant="outlined"
                onClick={() => toggleReaction(m.id, emoji)}
                sx={{
                  height: 22,
                  '& .MuiChip-label': { fontSize: 11, px: 0.8 },
                  transition: 'transform 120ms ease, border-color 160ms ease, background-color 160ms ease',
                  '&:hover': { transform: 'translateY(-1px)', backgroundColor: 'rgba(61,158,255,0.10)', borderColor: 'rgba(61,158,255,0.28)' }
                }}
              />
            )
          })}
        </Stack>
      </Box>
    )
  }

  const mainSlice = mainFeedMessages.slice(-20)
  return (
    <>
    <Paper
      className="hl-sidebar-chat"
      sx={{
        mt: 0,
        p: { xs: 1.5, sm: 1.75 },
        borderRadius: 2,
        position: 'relative',
        isolation: 'isolate',
        border: `1px solid ${C.panelBorder}`,
        background: `${C.panelBg}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
        height: '100%',
        flex: 1,
        alignSelf: 'stretch',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        minWidth: 0,
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: '6%',
          right: '6%',
          top: -48,
          height: 110,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(0,224,255,0.24) 0%, rgba(0,163,255,0.1) 42%, transparent 72%)',
          filter: 'blur(22px)',
          opacity: 0.9,
          animation: 'hl-chat-breathe 5.5s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0
        },
        '& > *': { position: 'relative', zIndex: 1 }
      }}
    >
      <Stack
        direction="column"
        justifyContent="flex-start"
        alignItems="stretch"
        sx={{
          mb: 1.75,
          gap: 1,
          minHeight: 0,
          flexShrink: 0,
          position: 'relative',
          isolation: 'isolate'
        }}
      >
        <Stack direction="row" spacing={1.15} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)'
            }}
          >
            <ChatBubbleOutlineIcon sx={{ fontSize: 18, color: '#a1a1aa' }} />
          </Box>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 900,
                lineHeight: 1.25,
                letterSpacing: 0.02,
                color: C.title,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              Загальний чат
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.65} sx={{ mt: 0.25, minWidth: 0 }}>
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: '#34d399',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.08)',
                  flexShrink: 0
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: C.subtitle, fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                Онлайн · <Box component="span" sx={{ color: C.title, fontWeight: 700 }}>{author}</Box>
              </Typography>
            </Stack>
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          justifyContent="flex-start"
          sx={{
            flexShrink: 0,
            flexWrap: 'nowrap',
            zIndex: 2,
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <IconButton
            size="small"
            onClick={() => setRulesOpen(true)}
            title="Правила чату"
            aria-label="Правила чату"
            sx={{
              width: 30,
              height: 30,
              borderRadius: 1.5,
              border: '1px solid rgba(61,158,255,0.2)',
              bgcolor: 'rgba(255,255,255,0.06)',
              flexShrink: 0
            }}
          >
            <HelpOutlineIcon sx={{ fontSize: 17, color: C.iconIdle }} />
          </IconButton>
          <Chip
            size="small"
            icon={<NotificationsActiveIcon sx={{ fontSize: '16px !important', color: `${C.iconIdle} !important` }} />}
            label={unread ? `${unread}` : '0'}
            color={unread ? 'warning' : 'default'}
            variant="outlined"
            onClick={markSeen}
            sx={{
              height: 28,
              fontWeight: 700,
              fontSize: 12,
              flexShrink: 0,
              color: C.title,
              borderColor: unread ? 'rgba(255,184,77,0.55)' : 'rgba(255,255,255,0.22)',
              bgcolor: unread ? 'rgba(255,159,10,0.12)' : 'rgba(255,255,255,0.06)',
              '& .MuiChip-label': { px: 0.75 },
              ...(unread
                ? {
                    animation: 'hl-soft-pulse 1200ms ease-in-out infinite',
                    boxShadow: '0 0 14px rgba(255,159,10,0.22)'
                  }
                : {})
            }}
          />
          <IconButton
            size="small"
            onClick={exportChat}
            title="Експорт"
            aria-label="Експорт"
            sx={{ width: 30, height: 30, borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.10)', flexShrink: 0, bgcolor: 'rgba(255,255,255,0.05)' }}
          >
            <DownloadIcon sx={{ fontSize: 17, color: C.iconIdle }} />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={clearChat}
            title="Очистити"
            aria-label="Очистити"
            sx={{
              width: 30,
              height: 30,
              borderRadius: 1.5,
              border: '1px solid rgba(255,110,130,0.35)',
              bgcolor: 'rgba(255,61,127,0.1)',
              flexShrink: 0,
              color: '#ffb4c1'
            }}
          >
            <DeleteSweepIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Stack>
      </Stack>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        sx={{ mb: 1.25, gap: 1, rowGap: 1 }}
      >
        <ToggleButtonGroup
          size="small"
          color="primary"
          exclusive
          value={feedMode}
          onChange={(_e, v) => v && setFeedMode(v)}
          sx={{
            borderRadius: 1.5,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            '& .MuiToggleButton-root': {
              border: 0,
              px: 0.95,
              py: 0.45,
              fontSize: 12,
              textTransform: 'none',
              fontWeight: 700,
              letterSpacing: 0.02,
              background: 'transparent',
              color: C.muted
            },
            '& .MuiToggleButton-root.Mui-selected': {
              background: 'rgba(61,158,255,0.35)',
              color: '#ffffff'
            },
            '& .MuiToggleButton-root:hover': {
              bgcolor: 'rgba(255,255,255,0.06)',
              color: C.title
            }
          }}
        >
          <ToggleButton value="all">Стрічка</ToggleButton>
          <ToggleButton value="mentions">Згадки</ToggleButton>
        </ToggleButtonGroup>

        <Button
          variant="text"
          size="small"
          onClick={() => unread && markSeen()}
          sx={{
            borderRadius: 1.5,
            fontWeight: 700,
            fontSize: 12,
            textTransform: 'none',
            minWidth: 0,
            px: 1,
            py: 0.5,
            ml: { xs: 0, sm: 'auto' },
            flexShrink: 0,
            opacity: 1,
            cursor: unread ? 'pointer' : 'default',
            color: unread ? '#8fd4ff' : C.muted,
            '&:hover': { bgcolor: unread ? 'rgba(61,158,255,0.12)' : 'transparent' }
          }}
        >
          {unread ? 'Позначити прочитаним' : 'Немає нових'}
        </Button>
      </Stack>

      {pinnedMessages.length ? (
        <>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.45 }}>
            <PushPinIcon sx={{ fontSize: 14, opacity: 0.85 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
              Закріплені зверху
            </Typography>
            <Chip size="small" label={pinnedMessages.length} variant="outlined" sx={{ height: 20, '& .MuiChip-label': { px: 0.6, fontSize: 10 } }} />
          </Stack>
          <Stack spacing={0.55} sx={{ maxHeight: 96, overflow: 'auto', pr: 0.5, mb: 0.7 }}>
            {pinnedMessages.map((m) => renderMessageCard(m, { dense: true }))}
          </Stack>
          <Divider sx={{ opacity: 0.22, mb: 0.7 }} />
        </>
      ) : null}

      <TextField
        size="small"
        placeholder="Пошук у повідомленнях…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        variant="outlined"
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 0.75, fontSize: 17, color: C.iconIdle, ml: 0.25 }} />
        }}
        sx={{
          mb: 1.15,
          mt: 0.25,
          flexShrink: 0,
          '& .MuiOutlinedInput-root': {
            borderRadius: 1.75,
            fontSize: 13,
            minHeight: 38,
            color: C.title,
            background: C.inputBg,
            '& fieldset': { borderColor: C.inputBorder },
            '&:hover fieldset': { borderColor: 'rgba(110,185,255,0.45)' },
            '&.Mui-focused fieldset': { borderColor: 'rgba(110,195,255,0.65)' }
          },
          '& .MuiOutlinedInput-input::placeholder': {
            color: C.hint,
            opacity: 1
          }
        }}
      />
      <Box
        sx={{
          position: 'relative',
          flex: 1,
          minHeight: 72,
          minWidth: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible',
          pt: 0.5
        }}
      >
        <Typography
          variant="overline"
          sx={{
            fontWeight: 800,
            display: 'block',
            mb: 0.85,
            mt: 0.25,
            fontSize: 10,
            letterSpacing: '0.12em',
            color: C.muted
          }}
        >
          Останні повідомлення
        </Typography>

        <Stack
          spacing={0.85}
          sx={{
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            pr: 0.25,
            pb: 0.5,
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(110,170,240,0.35) rgba(255,255,255,0.06)',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(110,170,240,0.35)',
              borderRadius: 8
            },
            '&::-webkit-scrollbar-track': { background: 'rgba(255,255,255,0.05)', borderRadius: 8 }
          }}
        >
          {mainSlice.length ? (
            mainSlice.map((m) => renderMessageCard(m))
          ) : (
            <Box
              sx={{
                py: 2.5,
                px: 1.25,
                borderRadius: 2,
                border: '1px solid rgba(0,224,255,0.2)',
                bgcolor: 'rgba(0,163,255,0.06)',
                textAlign: 'center'
              }}
            >
              <IceCrystalIllustration size={64} sx={{ mb: 1 }} />
              <Typography variant="body2" sx={{ lineHeight: 1.65, color: C.subtitle, fontSize: 13 }}>
                {feedMode === 'mentions'
                  ? 'Немає згадок про вас у незакріпленій стрічці.'
                  : 'Нічого не знайдено або чат порожній.'}
              </Typography>
            </Box>
          )}
        </Stack>

        {mentionPick ? (
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              left: 0,
              right: 34,
              bottom: '100%',
              mb: 0.5,
              p: 0.5,
              zIndex: 10,
              border: '1px solid rgba(61,158,255,0.22)',
              background: 'rgba(15,20,25,0.92)',
              backdropFilter: 'blur(10px)',
              maxHeight: 140,
              overflow: 'auto'
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ px: 0.6, display: 'block', mb: 0.25 }}>
              Згадати…
            </Typography>
            <Stack spacing={0.25}>
              {mentionPick.hits.map((name) => (
                <Chip
                  key={name}
                  size="small"
                  label={`@${name}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyMention(name)}
                  sx={{ justifyContent: 'flex-start', borderRadius: 1 }}
                />
              ))}
            </Stack>
          </Paper>
        ) : null}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
            sx={{
            mt: 'auto',
            pt: 1.25,
            flexShrink: 0,
            width: '100%',
            minWidth: 0,
            maxWidth: '100%',
            boxSizing: 'border-box',
            borderTop: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <Box
            sx={{
              flex: '1 1 auto',
              minWidth: 0,
              maxWidth: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              border: `1px solid ${C.inputBorder}`,
              borderRadius: 2,
              px: 1.15,
              py: 0.5,
              minHeight: 40,
              backgroundColor: C.inputBg,
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              '&:focus-within': {
                borderColor: 'rgba(110,195,255,0.55)',
                boxShadow: '0 0 0 2px rgba(61,158,255,0.2)'
              }
            }}
          >
            <InputBase
              inputRef={inputRef}
              placeholder=""
              value={text}
              onChange={(e) => setText(e.target.value)}
              onSelect={(e) => {
                const t = e.target
                setSel({ start: t.selectionStart ?? 0, end: t.selectionEnd ?? 0 })
              }}
              onClick={(e) => {
                const t = e.target
                setSel({ start: t.selectionStart ?? 0, end: t.selectionEnd ?? 0 })
              }}
              multiline
              minRows={1}
              maxRows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              fullWidth
              sx={{
                flex: 1,
                fontSize: 13,
                lineHeight: 1.5,
                color: C.title,
                '& .MuiInputBase-input': {
                  py: 0.25,
                  px: 0,
                  resize: 'none',
                  overflow: 'auto',
                  maxHeight: 64,
                  minHeight: 22,
                  caretColor: '#8fd4ff'
                }
              }}
            />
          </Box>
          <IconButton
            color="primary"
            onClick={send}
            disabled={!text.trim()}
            title="Надіслати"
            aria-label="Надіслати повідомлення"
            sx={{
              flexShrink: 0,
              width: 28,
              height: 28,
              borderRadius: '8px',
              background: 'linear-gradient(145deg, rgba(61,158,255,0.92) 0%, rgba(124,77,255,0.82) 100%)',
              color: '#0d1117',
              boxShadow: '0 4px 12px rgba(61,158,255,0.22)',
              '&:hover': {
                background: 'linear-gradient(145deg, rgba(75,168,255,1) 0%, rgba(135,95,255,0.92) 100%)',
                boxShadow: '0 6px 16px rgba(61,158,255,0.32)'
              },
              '&.Mui-disabled': {
                background: 'rgba(255,255,255,0.06)',
                color: 'action.disabled',
                boxShadow: 'none'
              }
            }}
          >
            <SendIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Stack>

      </Box>
    </Paper>

      <Dialog
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            border: '1px solid rgba(61,158,255,0.22)',
            background: 'linear-gradient(180deg, rgba(26,34,45,0.98) 0%, rgba(18,22,28,0.99) 100%)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.45)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, pb: 0.5 }}>
          Правила загального чату
        </DialogTitle>
        <Typography variant="caption" color="text.secondary" sx={{ px: 3, display: 'block', pb: 1 }}>
          Логістика гуманітарної допомоги — швидка координація без зайвого шуму
        </Typography>
        <DialogContent sx={{ pt: 0 }}>
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, color: 'primary.light' }}>
                Про що писати
              </Typography>
              <Typography variant="body2" color="text.secondary" component="div">
                <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
                  <li>статуси поставок, переміщень і залишків на складах;</li>
                  <li>узгодження заявок на допомогу та пріоритети;</li>
                  <li>нагадування колегам про дедлайни та зміни маршрутів;</li>
                  <li>короткі запити уточнень (що, куди, коли, скільки).</li>
                </Box>
              </Typography>
            </Box>
            <Divider sx={{ opacity: 0.2 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, color: 'primary.light' }}>
                Згадки (@)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Наберіть <b>@</b> і ім’я або логін колеги — наприклад, <b>@Адміністратор</b> або <b>@coordinator</b>. У
                вкладці «Згадки» зручно фільтрувати повідомлення, де вас згадали.
              </Typography>
            </Box>
            <Divider sx={{ opacity: 0.2 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, color: 'primary.light' }}>
                Як надіслати
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <b>Enter</b> — надіслати повідомлення. <b>Shift+Enter</b> — новий рядок у тому ж повідомленні.
              </Typography>
            </Box>
            <Divider sx={{ opacity: 0.2 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, color: 'error.light' }}>
                Краще не писати
              </Typography>
              <Typography variant="body2" color="text.secondary" component="div">
                <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
                  <li>зайвий офтоп і спам;</li>
                  <li>чутливі персональні дані без крайньої потреби;</li>
                  <li>образи та токсичність — лише конструктив і повага.</li>
                </Box>
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={() => setRulesOpen(false)} sx={{ textTransform: 'none', fontWeight: 800 }}>
            Зрозуміло
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
