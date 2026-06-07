import { Chip, Grid, Paper, Stack, Typography } from '@mui/material'

import { glassBackdrop, glassCardSurface, midnightBg, premiumTransition } from '../theme/glassTokens'

export default function KpiStrip({ items = [] }) {
  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {items.map((k) => (
        <Grid item xs={12} sm={6} md={3} key={k.label}>
          <Paper
            sx={{
              p: 1.4,
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: glassBackdrop,
              WebkitBackdropFilter: glassBackdrop,
              border: '1px solid rgba(255,255,255,0.1)',
              borderColor:
                k.tone === 'success'
                  ? 'rgba(0, 255, 163, 0.22)'
                  : k.tone === 'warning'
                    ? 'rgba(167, 139, 250, 0.28)'
                    : k.tone === 'danger'
                      ? 'rgba(244, 63, 94, 0.28)'
                      : 'rgba(255,255,255,0.1)',
              backgroundColor: midnightBg,
              backgroundImage: glassCardSurface,
              boxShadow: '0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
              animation: 'hl-row-in 220ms ease-out both',
              transition: premiumTransition,
              '&:hover': {
                transform: 'translateY(-4px)',
                borderColor: 'rgba(139, 92, 246, 0.28)',
                boxShadow: '0 12px 28px rgba(0,0,0,0.5), 0 0 24px rgba(76, 29, 149, 0.12)'
              }
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Typography variant="caption" color="text.secondary">
                {k.label}
              </Typography>
              {k.badge ? <Chip size="small" label={k.badge} variant="outlined" /> : null}
            </Stack>
            <Typography
              variant="h6"
              className="hl-metric-shimmer"
              sx={{
                fontWeight: 800,
                mt: 0.3,
                fontVariantNumeric: 'tabular-nums',
                color: '#FFFFFF'
              }}
            >
              {k.value}
            </Typography>
            {k.hint ? (
              <Typography variant="caption" color="text.secondary">
                {k.hint}
              </Typography>
            ) : null}
          </Paper>
        </Grid>
      ))}
    </Grid>
  )
}
