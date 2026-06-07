import { ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'

import { premiumTransition } from '../../theme/glassTokens'

/**
 * Sidebar row — quiet rail, premium hover (no scale neon).
 */
export default function SidebarNavItem({ icon, label, selected, onClick }) {
  return (
    <ListItem disablePadding sx={{ display: 'block', px: 0 }}>
      <ListItemButton
        selected={selected}
        onClick={onClick}
        sx={{
          borderRadius: 2,
          mx: 1,
          my: 0.35,
          py: 1,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid transparent',
          transition: premiumTransition,
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: '14%',
            bottom: '14%',
            width: 3,
            borderRadius: '0 4px 4px 0',
            opacity: selected ? 1 : 0,
            transform: selected ? 'scaleY(1)' : 'scaleY(0.5)',
            transition: 'opacity 0.25s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: 'linear-gradient(180deg, #60a5fa 0%, #818cf8 100%)',
            boxShadow: 'none'
          },
          ...(selected
            ? {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.06)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
              }
            : {
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.12)'
                }
              }),
          '&:hover::before': {
            opacity: 0.85,
            transform: 'scaleY(1)'
          }
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 40,
            color: selected ? 'primary.light' : 'text.secondary',
            transition: premiumTransition
          }}
        >
          {icon}
        </ListItemIcon>
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            fontWeight: selected ? 700 : 600,
            fontSize: 14,
            letterSpacing: 0.02,
            color: selected ? 'text.primary' : 'text.secondary'
          }}
        />
      </ListItemButton>
    </ListItem>
  )
}
