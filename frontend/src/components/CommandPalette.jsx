import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography
} from '@mui/material'

export default function CommandPalette({ open, onClose, items = [], onRun }) {
  const [q, setQ] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!open) {
      setQ('')
      setActiveIndex(0)
    }
  }, [open])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter((i) => i.label.toLowerCase().includes(s) || (i.keywords || []).some((k) => k.toLowerCase().includes(s)))
  }, [items, q])

  useEffect(() => {
    setActiveIndex(0)
  }, [q, open])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={1.2}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Командна панель
          </Typography>
          <TextField
            autoFocus
            placeholder="Знайти розділ або дію…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActiveIndex((v) => (filtered.length ? (v + 1) % filtered.length : 0))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActiveIndex((v) => (filtered.length ? (v - 1 + filtered.length) % filtered.length : 0))
              } else if (e.key === 'Enter') {
                const item = filtered[activeIndex]
                if (item) {
                  e.preventDefault()
                  onRun?.(item)
                  onClose?.()
                }
              }
            }}
            fullWidth
          />
          <List dense sx={{ maxHeight: 360, overflow: 'auto' }}>
            {filtered.map((item, idx) => (
              <ListItemButton
                key={item.id}
                onClick={() => {
                  onRun?.(item)
                  onClose?.()
                }}
                selected={idx === activeIndex}
                sx={{ borderRadius: 1.5, mb: 0.5 }}
              >
                <ListItemText primary={item.label} secondary={item.hint || ''} />
              </ListItemButton>
            ))}
            {!filtered.length ? (
              <Typography variant="body2" color="text.secondary" sx={{ px: 1.2, py: 1 }}>
                Нічого не знайдено. Спробуйте інший запит.
              </Typography>
            ) : null}
          </List>
          <Typography variant="caption" color="text.secondary">
            Стрілки вгору/вниз — вибір, Enter — виконати, Esc — закрити.
          </Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
