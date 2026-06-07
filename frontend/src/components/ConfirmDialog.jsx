import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'

export default function ConfirmDialog({ open, title, description, confirmText = 'Підтвердити', onClose, onConfirm }) {
  return (
    <Dialog open={open} onClose={() => onClose?.()} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose?.()}>Скасувати</Button>
        <Button variant="contained" color="error" onClick={() => onConfirm?.()}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

