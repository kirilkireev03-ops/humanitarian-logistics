import React from 'react'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Keep in console for debugging in browser DevTools
    // eslint-disable-next-line no-console
    console.error('UI crashed:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    const msg = this.state.error?.message || String(this.state.error)
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
        <Paper sx={{ p: 3, maxWidth: 720, width: '100%' }}>
          <Stack spacing={1.5}>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              Сталася помилка в інтерфейсі
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Нижче — текст помилки. Це допоможе швидко її виправити.
            </Typography>
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 1.5,
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(0,0,0,0.35)',
                overflow: 'auto',
                fontSize: 12
              }}
            >
              {msg}
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={() => window.location.reload()}>
                Перезавантажити
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  localStorage.clear()
                  window.location.href = '/login'
                }}
              >
                Скинути сесію
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    )
  }
}

