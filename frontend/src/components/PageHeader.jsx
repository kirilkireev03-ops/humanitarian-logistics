import { Box, Stack, Typography } from '@mui/material'

import GlassCard from './ui/GlassCard'
import NeonButton from './ui/NeonButton'

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <GlassCard aurora interactive padding={{ xs: 1.5, sm: 2 }} radius={16} sx={{ mb: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: -0.5,
              color: '#ffffff'
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 860 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && (
          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ flexWrap: 'wrap' }}>
            {actions.map((a) => (
              <NeonButton
                key={a.key}
                variant={a.variant || 'outlined'}
                color={a.variant === 'contained' ? 'primary' : 'inherit'}
                startIcon={a.icon || null}
                onClick={a.onClick}
                disabled={a.disabled}
              >
                {a.label}
              </NeonButton>
            ))}
          </Stack>
        )}
      </Stack>
    </GlassCard>
  )
}
