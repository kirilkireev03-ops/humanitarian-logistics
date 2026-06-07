import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'

// Avoid filter: blur on route transitions — on some GPUs/browsers it can leave content invisible.
const variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 }
}

export default function AnimatedOutlet() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.16, ease: 'easeOut' }}
        style={{ willChange: 'opacity, transform' }}
      >
        <Box>
          <Outlet />
        </Box>
      </motion.div>
    </AnimatePresence>
  )
}

