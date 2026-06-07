import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  Stack,
  Toolbar,
  Typography
} from '@mui/material'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined'
import StackedBarChartOutlinedIcon from '@mui/icons-material/StackedBarChartOutlined'
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'

import { getRole } from '../auth'
import { logout } from '../api'
import AnimatedOutlet from './AnimatedOutlet'
import CommandPalette from './CommandPalette'
import SidebarChat from './SidebarChat'
import { SidebarNavItem } from './ui'

const drawerWidth = 270
const CHAT_HEIGHT_KEY = 'hl_sidebar_chat_height_v1'
const LAST_PATH_KEY = 'hl_last_path_v1'
const FAV_KEY = 'hl_favorites_modules'

const NAV = [
  { path: '/', label: 'Огляд', icon: <DashboardOutlinedIcon /> },
  { path: '/warehouses', label: 'Склади', icon: <WarehouseOutlinedIcon /> },
  { path: '/cargo', label: 'Вантажі', icon: <Inventory2OutlinedIcon /> },
  { path: '/requests', label: 'Заявки', icon: <AssignmentOutlinedIcon /> },
  { path: '/transactions', label: 'Транзакції', icon: <SwapHorizOutlinedIcon /> },
  { path: '/stock', label: 'Залишки', icon: <StackedBarChartOutlinedIcon /> },
  { path: '/forecast', label: 'Прогноз попиту', icon: <TimelineOutlinedIcon /> },
  { path: '/users', label: 'Користувачі', icon: <PeopleOutlineIcon />, roles: ['ADMIN'] },
  { path: '/settings', label: 'Налаштування', icon: <SettingsOutlinedIcon /> }
]

export default function AppShell() {
  const nav = useNavigate()
  const loc = useLocation()
  const role = getRole()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [lastPath, setLastPath] = useState(() => {
    try {
      return localStorage.getItem(LAST_PATH_KEY) || ''
    } catch {
      return ''
    }
  })
  const [chatHeight, setChatHeight] = useState(() => {
    try {
      const raw = Number(localStorage.getItem(CHAT_HEIGHT_KEY))
      if (Number.isFinite(raw)) return Math.max(340, Math.min(760, raw))
    } catch {
      // ignore
    }
    return 460
  })

  const items = NAV.filter((i) => {
    if (!i.roles) return true
    if (!role) return false
    return i.roles.includes(role)
  })
  const [favoritePaths, setFavoritePaths] = useState(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY)
      const list = raw ? JSON.parse(raw) : []
      return Array.isArray(list) ? list : []
    } catch {
      return []
    }
  })
  useEffect(() => {
    const readFav = () => {
      try {
        const raw = localStorage.getItem(FAV_KEY)
        const list = raw ? JSON.parse(raw) : []
        setFavoritePaths(Array.isArray(list) ? list : [])
      } catch {
        setFavoritePaths([])
      }
    }
    const onStorage = (e) => {
      if (e.key === FAV_KEY) readFav()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('hl-favorites-changed', readFav)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('hl-favorites-changed', readFav)
    }
  }, [])

  const favorites = useMemo(() => {
    if (!favoritePaths.length) return []
    return items.filter((it) => favoritePaths.includes(it.path))
  }, [items, favoritePaths])
  const lastNavItem = useMemo(() => items.find((i) => i.path === lastPath), [items, lastPath])
  const paletteItems = useMemo(
    () => [
      ...(lastNavItem && lastNavItem.path !== loc.pathname
        ? [
            {
              id: 'go-last',
              label: `Повернутись: ${lastNavItem.label}`,
              hint: lastNavItem.path,
              keywords: ['назад', 'останній', lastNavItem.label],
              action: () => nav(lastNavItem.path)
            }
          ]
        : []),
      ...items.map((i) => ({
        id: `nav-${i.path}`,
        label: `Перейти: ${i.label}`,
        hint: i.path,
        keywords: ['перейти', 'навігація', 'розділ', i.label],
        action: () => nav(i.path)
      })),
      {
        id: 'logout',
        label: 'Вийти з системи',
        hint: 'Завершити сеанс',
        keywords: ['вихід', 'logout'],
        action: () => {
          logout()
          nav('/login')
        }
      },
      {
        id: 'go-dashboard',
        label: 'Відкрити Огляд',
        hint: '/',
        keywords: ['дашборд', 'огляд', 'головна'],
        action: () => nav('/')
      }
    ],
    [items, nav, lastNavItem, loc.pathname]
  )

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
        return
      }
      // Quick navigation: Alt+1..9 for sidebar modules.
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const idx = Number(e.key) - 1
        if (Number.isInteger(idx) && idx >= 0 && idx < items.length) {
          e.preventDefault()
          nav(items[idx].path)
          return
        }
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [items, nav])

  useEffect(() => {
    localStorage.setItem(CHAT_HEIGHT_KEY, String(chatHeight))
  }, [chatHeight])

  useEffect(() => {
    if (!loc.pathname) return
    try {
      localStorage.setItem(LAST_PATH_KEY, loc.pathname)
      setLastPath(loc.pathname)
    } catch {
      // ignore
    }
  }, [loc.pathname])

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100dvh',
        height: '100dvh',
        alignItems: 'stretch',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}
    >
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: 'linear-gradient(180deg, rgba(19, 15, 37, 0.88) 0%, rgba(11, 9, 20, 0.92) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
          transition: 'all 0.3s ease-out'
        }}
      >
        <Toolbar sx={{ display: 'flex', gap: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              letterSpacing: 0.01,
              color: '#ffffff'
            }}
          >
            Логістика гуманітарної допомоги
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Роль: {role || '—'}
          </Typography>
          <IconButton color="inherit" onClick={() => setPaletteOpen(true)} title="Командна панель (Ctrl/Cmd+K)">
            <SearchOutlinedIcon />
          </IconButton>
          <IconButton
            color="inherit"
            onClick={() => {
              logout()
              nav('/login')
            }}
            title="Вийти"
          >
            <LogoutOutlinedIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            height: '100dvh',
            boxSizing: 'border-box',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            background: 'linear-gradient(180deg, #130F25 0%, #0B0914 55%, #0E0A17 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '4px 0 40px rgba(0,0,0,0.55), inset -1px 0 0 rgba(255,255,255,0.04)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease-out'
          }
        }}
      >
        <Toolbar />
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* Лише головне меню — скрол; «Обране» винесено нижче, щоб не ховалося під чатом */}
          <Box
            sx={{
              flex: '1 1 0%',
              minHeight: 120,
              overflowY: 'auto',
              overflowX: 'hidden',
              px: 1.35,
              pt: 0.5,
              pb: 0.75,
              position: 'relative',
              zIndex: 1,
              scrollbarWidth: 'thin',
              '&::-webkit-scrollbar': { width: 5, height: 0 }
            }}
          >
            <List sx={{ py: 0 }}>
              {items.map((item) => {
                const selected =
                  item.path === '/'
                    ? loc.pathname === '/'
                    : loc.pathname.startsWith(item.path)
                return (
                  <SidebarNavItem
                    key={item.path}
                    icon={item.icon}
                    label={item.label}
                    selected={selected}
                    onClick={() => nav(item.path)}
                  />
                )
              })}
            </List>
          </Box>

          {favorites.length ? (
            <>
              <Divider sx={{ opacity: 0.22, flexShrink: 0 }} />
              <Box
                sx={{
                  flexShrink: 0,
                  mx: 0.5,
                  p: 1.15,
                  borderRadius: 2,
                  position: 'relative',
                  zIndex: 1,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.12)',
                    transform: 'translateY(-1px)'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 1,
                    borderRadius: '8px 8px 0 0',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                    opacity: 0.6
                  }
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1, pr: 0.25 }}>
                  <Stack direction="row" alignItems="center" spacing={0.85}>
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: 1.5,
                        display: 'grid',
                        placeItems: 'center',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)'
                      }}
                    >
                      <StarRoundedIcon sx={{ fontSize: 17, color: '#fbbf24' }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="overline"
                        sx={{
                          display: 'block',
                          fontWeight: 900,
                          letterSpacing: '0.14em',
                          lineHeight: 1.15,
                          color: 'primary.light',
                          fontSize: 10
                        }}
                      >
                        Обране
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: 11, opacity: 0.85 }}>
                        Швидкий доступ
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    size="small"
                    label={favorites.length}
                    sx={{
                      height: 22,
                      fontWeight: 800,
                      fontSize: 11,
                      borderColor: 'rgba(61,158,255,0.35)',
                      background: 'rgba(61,158,255,0.1)',
                      '& .MuiChip-label': { px: 0.9 }
                    }}
                    variant="outlined"
                  />
                </Stack>
                <Stack spacing={0.65}>
                  {favorites.map((f) => {
                    const active = f.path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(f.path)
                    return (
                      <Button
                        key={`fav-${f.path}`}
                        fullWidth
                        onClick={() => nav(f.path)}
                        startIcon={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: active ? 'primary.light' : 'text.secondary',
                              opacity: active ? 1 : 0.88,
                              '& svg': { fontSize: 19 }
                            }}
                          >
                            {f.icon}
                          </Box>
                        }
                        endIcon={
                          <ChevronRightRoundedIcon
                            sx={{ fontSize: 20, opacity: active ? 0.55 : 0.28, transition: 'opacity 0.15s ease' }}
                          />
                        }
                        sx={{
                          justifyContent: 'flex-start',
                          textTransform: 'none',
                          fontWeight: 800,
                          fontSize: 13,
                          letterSpacing: 0.15,
                          py: 0.95,
                          px: 1.1,
                          borderRadius: 2,
                          border: active ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(255,255,255,0.08)',
                          color: 'text.primary',
                          background: active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                          boxShadow: active ? '0 4px 14px rgba(0,0,0,0.12)' : 'none',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '& .MuiButton-startIcon': { mr: 1 },
                          '& .MuiButton-endIcon': { ml: 'auto', mr: 0 },
                          '&:hover': {
                            background: 'rgba(255,255,255,0.06)',
                            borderColor: 'rgba(255,255,255,0.12)',
                            boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                            transform: 'translateY(-2px)',
                            '& .MuiSvgIcon-root': { opacity: 0.9 }
                          }
                        }}
                      >
                        {f.label}
                      </Button>
                    )
                  })}
                </Stack>
              </Box>
            </>
          ) : (
            <>
              <Divider sx={{ opacity: 0.22, flexShrink: 0 }} />
              <Box
                sx={{
                  flexShrink: 0,
                  mx: 0.5,
                  p: 1.1,
                  borderRadius: 2,
                  zIndex: 1,
                  border: '1px dashed rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.03)'
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <StarRoundedIcon sx={{ color: '#fbbf24', fontSize: 22, opacity: 0.85 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.light', display: 'block', letterSpacing: 0.08 }}>
                      Обране
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: 11, color: 'text.secondary', display: 'block', lineHeight: 1.45, mt: 0.15 }}>
                      Оберіть модулі у «Налаштування», щоб з’явились тут.
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    className="hl-btn-shimmer-hover"
                    onClick={() => nav('/settings')}
                    sx={{ flexShrink: 0, textTransform: 'none', fontWeight: 800, borderRadius: 2 }}
                  >
                    Відкрити
                  </Button>
                </Stack>
              </Box>
            </>
          )}

          <Divider sx={{ opacity: 0.22, flexShrink: 0 }} />
          <Box
            sx={{
              px: 1.1,
              pt: 0.6,
              pb: 1.1,
              flex: '0 0 auto',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              overflow: 'hidden',
              minWidth: 0
            }}
          >
            <Box
              sx={{
                flex: '0 0 auto',
                minHeight: 340,
                height: `${chatHeight}px`,
                maxHeight: 'min(70dvh, calc(100dvh - 220px))',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                width: '100%',
                overflow: 'hidden'
              }}
            >
              <Box
                onMouseDown={(e) => {
                  e.preventDefault()
                  const startY = e.clientY
                  const startH = chatHeight
                  const onMove = (ev) => {
                    const next = startH - (ev.clientY - startY)
                    setChatHeight(Math.max(340, Math.min(window.innerHeight - 120, next)))
                  }
                  const onUp = () => {
                    window.removeEventListener('mousemove', onMove)
                    window.removeEventListener('mouseup', onUp)
                  }
                  window.addEventListener('mousemove', onMove)
                  window.addEventListener('mouseup', onUp)
                }}
                sx={{
                  mb: 0.5,
                  height: 10,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'ns-resize',
                  borderRadius: 1.5,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)'
                }}
                title="Перетягни, щоб змінити розмір чату"
              >
                <Box sx={{ width: 42, height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.2)' }} />
              </Box>
              <SidebarChat />
            </Box>
          </Box>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 'var(--hl-card-gap, 24px)', minWidth: 0, minHeight: 0, overflow: 'auto' }}>
        <Toolbar />
        <AnimatedOutlet />
      </Box>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={paletteItems}
        onRun={(item) => item.action?.()}
      />
    </Box>
  )
}

