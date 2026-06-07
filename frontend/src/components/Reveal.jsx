import { motion } from 'framer-motion'

export function Reveal({ children, delay = 0, y = 10 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  )
}

export function Stagger({ children, delayChildren = 0.06, staggerChildren = 0.09 }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { delayChildren, staggerChildren } }
      }}
    >
      {children}
    </motion.div>
  )
}

export function Item({ children }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 22 },
        show: { opacity: 1, y: 0 }
      }}
      transition={{ type: 'spring', stiffness: 340, damping: 30, mass: 0.9 }}
    >
      {children}
    </motion.div>
  )
}

