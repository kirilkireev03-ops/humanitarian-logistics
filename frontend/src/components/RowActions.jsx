import { IconButton, Stack } from '@mui/material'

export default function RowActions({ actions = [], justify = 'flex-end' }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ py: 0.5, width: '100%', justifyContent: justify }}>
      {actions.map((a) => (
        <span key={a.key}>
          <IconButton
            size="small"
            color={a.color || 'default'}
            onClick={a.onClick}
            disabled={Boolean(a.disabled)}
            title={a.title || ''}
            aria-label={a.title || a.key}
          >
            {a.icon}
          </IconButton>
        </span>
      ))}
    </Stack>
  )
}

