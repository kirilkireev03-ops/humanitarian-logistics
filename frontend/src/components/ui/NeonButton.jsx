import { forwardRef } from 'react'
import { Button } from '@mui/material'

import { premiumTransition } from '../../theme/glassTokens'

const NeonButton = forwardRef(function NeonButton({ children, sx, ...props }, ref) {
  return (
    <Button
      ref={ref}
      {...props}
      sx={{
        position: 'relative',
        transition: premiumTransition,
        '&:hover': {
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.22)',
          transform: 'translateY(-1px)'
        },
        '&:active': {
          transform: 'translateY(0)'
        },
        ...sx
      }}
    >
      {children}
    </Button>
  )
})

export default NeonButton
