import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Slider,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import NoteAddIcon from '@mui/icons-material/NoteAdd'
import StarIcon from '@mui/icons-material/Star'
import DeleteIcon from '@mui/icons-material/Delete'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { enqueueSnackbar } from 'notistack'
import PageHeader from '../components/PageHeader'
import { Item, Stagger } from '../components/Reveal'
import { applyUiPrefs, DEFAULT_PREFS, readUiPrefs, saveUiPrefs } from '../utils/uiPrefs'

const PROFILE_KEY = 'hl_admin_profile_v1'
const NOTES_KEY = 'hl_notes_v1'
const FAV_KEY = 'hl_favorites_modules'

const MODULES = [
  { path: '/', label: 'Огляд' },
  { path: '/warehouses', label: 'Склади' },
  { path: '/cargo', label: 'Вантажі' },
  { path: '/requests', label: 'Заявки' },
  { path: '/transactions', label: 'Транзакції' },
  { path: '/stock', label: 'Залишки' },
  { path: '/forecast', label: 'Прогноз попиту' },
  { path: '/users', label: 'Користувачі' },
  { path: '/settings', label: 'Налаштування' }
]

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export default function Settings() {
  const [profile, setProfile] = useState(() =>
    readJson(PROFILE_KEY, {
      username: 'admin',
      displayName: 'Адміністратор системи',
      email: 'admin@example.local',
      title: 'Адміністратор системи',
      statusText: 'Онлайн'
    })
  )
  const [prefs, setPrefs] = useState(() => readUiPrefs())
  const [notes, setNotes] = useState(() =>
    readJson(NOTES_KEY, []).map((n) => ({
      ...n,
      status: n.status || 'todo'
    }))
  )
  const [newNote, setNewNote] = useState('')
  const [dragId, setDragId] = useState(null)
  const [favorites, setFavorites] = useState(() => readJson(FAV_KEY, ['/', '/forecast']))
  const [moduleSearch, setModuleSearch] = useState('')

  const stats = useMemo(
    () => ({
      notes: notes.length,
      favorites: favorites.length,
      glow: prefs.glow,
      compact: prefs.compactCards,
      profileFilled: [profile.username, profile.displayName, profile.email, profile.title, profile.statusText].filter((x) => String(x || '').trim()).length
    }),
    [notes.length, favorites.length, prefs.glow, prefs.compactCards, profile]
  )
  const filteredModules = useMemo(() => {
    const s = moduleSearch.trim().toLowerCase()
    if (!s) return MODULES
    return MODULES.filter((m) => m.label.toLowerCase().includes(s))
  }, [moduleSearch])
  const gridGap = useMemo(() => Math.max(12, Math.min(32, Number(prefs.cardGap || 20))), [prefs.cardGap])

  const saveProfile = () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    window.dispatchEvent(new Event('hl-profile-changed'))
    enqueueSnackbar('Профіль оновлено', { variant: 'success' })
  }

  const savePrefs = () => {
    saveUiPrefs(prefs)
    applyUiPrefs(prefs)
    enqueueSnackbar('Налаштування інтерфейсу збережено', { variant: 'success' })
  }
  const resetPrefs = () => {
    setPrefs({ ...DEFAULT_PREFS })
    saveUiPrefs({ ...DEFAULT_PREFS })
    applyUiPrefs({ ...DEFAULT_PREFS })
    enqueueSnackbar('UI налаштування скинуто до стандартних', { variant: 'info' })
  }

  useEffect(() => {
    applyUiPrefs(prefs)
  }, [prefs])

  const toggleFavorite = (path) => {
    const next = favorites.includes(path) ? favorites.filter((p) => p !== path) : [...favorites, path]
    setFavorites(next)
    localStorage.setItem(FAV_KEY, JSON.stringify(next))
    // миттєво оновити «Обране» в сайдбарі (в тій же вкладці)
    window.dispatchEvent(new Event('hl-favorites-changed'))
  }

  const addNote = () => {
    const text = newNote.trim()
    if (!text) return
    const next = [{ id: `${Date.now()}`, text, at: new Date().toISOString(), status: 'todo' }, ...notes].slice(0, 200)
    setNotes(next)
    localStorage.setItem(NOTES_KEY, JSON.stringify(next))
    setNewNote('')
  }

  const removeNote = (id) => {
    const next = notes.filter((n) => n.id !== id)
    setNotes(next)
    localStorage.setItem(NOTES_KEY, JSON.stringify(next))
  }

  const moveNote = (id, status) => {
    const next = notes.map((n) => (n.id === id ? { ...n, status } : n))
    setNotes(next)
    localStorage.setItem(NOTES_KEY, JSON.stringify(next))
  }

  const byStatus = useMemo(
    () => ({
      todo: notes.filter((n) => n.status === 'todo'),
      progress: notes.filter((n) => n.status === 'progress'),
      done: notes.filter((n) => n.status === 'done')
    }),
    [notes]
  )

  return (
    <Box sx={{ '--settings-gap': `${gridGap}px`, maxWidth: 1500, mx: 'auto' }}>
      <Stagger>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'var(--settings-gap)' }}>
          <Item>
            <PageHeader
              title="Налаштування"
              subtitle="Профіль, персоналізація інтерфейсу, нотатки та обрані модулі. Усі зміни зберігаються локально та реально працюють."
            />
          </Item>

          <Item>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  lg: 'repeat(5, minmax(0, 1fr))'
                },
                gap: 'var(--settings-gap)'
              }}
            >
              <Paper className="hl-settings-card" sx={{ p: 1.5, borderColor: 'rgba(61,158,255,0.26)', background: 'rgba(61,158,255,0.10)', minHeight: 86, height: '100%' }}>
                <Typography variant="caption" color="text.secondary">
                  Нотаток
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  {stats.notes}
                </Typography>
              </Paper>
              <Paper className="hl-settings-card" sx={{ p: 1.5, borderColor: 'rgba(255,214,10,0.26)', background: 'rgba(255,214,10,0.08)', minHeight: 86, height: '100%' }}>
                <Typography variant="caption" color="text.secondary">
                  Обраних модулів
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  {stats.favorites}
                </Typography>
              </Paper>
              <Paper className="hl-settings-card" sx={{ p: 1.5, borderColor: 'rgba(124,77,255,0.26)', background: 'rgba(124,77,255,0.08)', minHeight: 86, height: '100%' }}>
                <Typography variant="caption" color="text.secondary">
                  Світіння інтерфейсу
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  {stats.glow}%
                </Typography>
              </Paper>
              <Paper className="hl-settings-card" sx={{ p: 1.5, borderColor: 'rgba(52,199,89,0.26)', background: 'rgba(52,199,89,0.08)', minHeight: 86, height: '100%' }}>
                <Typography variant="caption" color="text.secondary">
                  Компактні картки
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  {stats.compact ? 'Увімк.' : 'Вимк.'}
                </Typography>
              </Paper>
              <Paper className="hl-settings-card" sx={{ p: 1.5, borderColor: 'rgba(61,158,255,0.26)', background: 'rgba(61,158,255,0.08)', minHeight: 86, height: '100%' }}>
                <Typography variant="caption" color="text.secondary">
                  Профіль заповнено
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  {Math.round((stats.profileFilled / 5) * 100)}%
                </Typography>
              </Paper>
            </Box>
          </Item>

          <Item>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
                gap: 'var(--settings-gap)'
              }}
            >
              <Paper className="hl-settings-card" sx={{ p: 2.2, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                  Профіль адміністратора
                </Typography>
                <Stack spacing={1.35}>
                  <TextField size="small" label="Логін" autoComplete="username" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} />
                  <TextField size="small" label="Ім'я для відображення" value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} />
                  <TextField size="small" label="Ел. пошта" type="email" autoComplete="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                  <TextField size="small" label="Посада" value={profile.title} onChange={(e) => setProfile({ ...profile, title: e.target.value })} />
                  <TextField size="small" label="Статус" value={profile.statusText} onChange={(e) => setProfile({ ...profile, statusText: e.target.value })} />
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={saveProfile}>
                    Зберегти профіль
                  </Button>
                </Stack>
              </Paper>
              <Paper className="hl-settings-card" sx={{ p: 2.2, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                  Вигляд інтерфейсу
                </Typography>
                <Stack spacing={1.35}>
                  <Typography variant="body2" color="text.secondary">
                    Інтенсивність підсвічування: {prefs.glow}%
                  </Typography>
                  <Slider value={prefs.glow} min={0} max={100} onChange={(_, v) => setPrefs({ ...prefs, glow: Number(v) })} />
                  <Typography variant="body2" color="text.secondary">
                    Відступи між блоками: {prefs.cardGap}px
                  </Typography>
                  <Slider value={prefs.cardGap} min={12} max={32} step={2} onChange={(_, v) => setPrefs({ ...prefs, cardGap: Number(v) })} />
                  <TextField
                    size="small"
                    select
                    label="Тема переливів"
                    value={prefs.themeVariant}
                    onChange={(e) => setPrefs({ ...prefs, themeVariant: e.target.value })}
                  >
                    <MenuItem value="aurora">Північне сяйво — неоново-блакитний</MenuItem>
                    <MenuItem value="ocean">Океан — глибока бірюза</MenuItem>
                    <MenuItem value="violet">Неоновий фіолет — фіолетово-малиновий</MenuItem>
                  </TextField>
                  <FormControlLabel
                    control={<Checkbox checked={prefs.compactCards} onChange={(e) => setPrefs({ ...prefs, compactCards: e.target.checked })} />}
                    label="Компактний режим карток"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={prefs.animations} onChange={(e) => setPrefs({ ...prefs, animations: e.target.checked })} />}
                    label="Анімації та переходи"
                  />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Button variant="outlined" startIcon={<SaveIcon />} onClick={savePrefs} fullWidth>
                      Зберегти UI
                    </Button>
                    <Button variant="text" startIcon={<RestartAltIcon />} onClick={resetPrefs} fullWidth>
                      Скинути UI
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </Box>
          </Item>

          <Item>
            <Paper className="hl-settings-card" sx={{ p: 2.2 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                Обрані модулі
              </Typography>
              <TextField
                size="small"
                placeholder="Пошук модуля..."
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                sx={{ mb: 1.2, maxWidth: 360 }}
                fullWidth
              />
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {filteredModules.map((m) => {
                  const active = favorites.includes(m.path)
                  return (
                    <Chip
                      key={m.path}
                      icon={<StarIcon />}
                      label={m.label}
                      color={active ? 'warning' : 'default'}
                      variant={active ? 'filled' : 'outlined'}
                      onClick={() => toggleFavorite(m.path)}
                    />
                  )
                })}
              </Stack>
            </Paper>
          </Item>

          <Item>
            <Paper className="hl-settings-card" sx={{ p: 2.2 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                Нотатки (Kanban)
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1.2 }}>
                <TextField
                  size="small"
                  placeholder="Додайте важливу нотатку..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      addNote()
                    }
                  }}
                  fullWidth
                />
                <Button variant="contained" onClick={addNote} startIcon={<NoteAddIcon />}>
                  Додати
                </Button>
              </Stack>
              <Grid container spacing={3}>
                {[
                  { key: 'todo', label: 'Зробити', tone: 'rgba(61,158,255,0.10)', border: 'rgba(61,158,255,0.26)' },
                  { key: 'progress', label: 'В роботі', tone: 'rgba(255,159,10,0.10)', border: 'rgba(255,159,10,0.26)' },
                  { key: 'done', label: 'Готово', tone: 'rgba(52,199,89,0.10)', border: 'rgba(52,199,89,0.26)' }
                ].map((col) => (
                  <Grid item xs={12} md={4} key={col.key}>
                    <Paper
                      className="hl-kanban-column"
                      variant="outlined"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragId) moveNote(dragId, col.key)
                        setDragId(null)
                      }}
                      sx={{
                        p: 1,
                        minHeight: 250,
                        maxHeight: 350,
                        borderColor: col.border,
                        background: col.tone
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                        {col.label} · {byStatus[col.key].length}
                      </Typography>
                      <Stack spacing={0.8} sx={{ mt: 0.8, maxHeight: 295, overflow: 'auto' }}>
                        {byStatus[col.key].map((n) => (
                          <Paper
                            key={n.id}
                            draggable
                            onDragStart={() => setDragId(n.id)}
                            onDragEnd={() => setDragId(null)}
                            variant="outlined"
                            sx={{
                              p: 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.8,
                              cursor: 'grab',
                              transition: 'transform 120ms ease, box-shadow 160ms ease',
                              '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 8px 16px rgba(0,0,0,0.18)' }
                            }}
                          >
                            <DragIndicatorIcon fontSize="small" sx={{ opacity: 0.55 }} />
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              {n.text}
                            </Typography>
                            <IconButton size="small" color="error" onClick={() => removeNote(n.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Paper>
                        ))}
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Item>
        </Box>
      </Stagger>
    </Box>
  )
}
