import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAuthed } from '../auth'
import { login } from '../api'
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'

export default function Login() {
  const nav = useNavigate()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthed()) nav('/')
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try {
      await login(username, password)
      nav('/')
    } catch (e) {
      const body = e.response?.data
      const apiMsg = body?.message || body?.error
      const netMsg = e.code === 'ERR_NETWORK' ? "Немає зв'язку з сервером (перевірте, що API запущено на порту 8080)." : null
      setErr(netMsg || apiMsg || 'Невірний логін або пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2
      }}
    >
      <Paper sx={{ width: '100%', maxWidth: 460, p: 3 }}>
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Вхід
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Увійдіть для доступу до панелей системи.
            </Typography>
          </Box>

          {err && <Alert severity="error">{err}</Alert>}

          <form onSubmit={onSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Логін"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                fullWidth
              />
              <TextField
                label="Пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
              />
              <Button type="submit" variant="contained" disabled={loading} size="large">
                {loading ? 'Вхід…' : 'Увійти'}
              </Button>
            </Stack>
          </form>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', pt: 0.5 }}>
            Демо: <b>admin</b> / <b>admin123</b>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  )
}

