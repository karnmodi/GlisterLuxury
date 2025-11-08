'use client'

import { motion, useScroll, useSpring } from 'framer-motion'

export default function ScrollProgressIndicator() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-charcoal/20 z-[9998] pointer-events-none"
      style={{ originX: 0 }}
    >
      <motion.div
        className="h-full bg-gradient-to-r from-brass via-brass to-olive shadow-lg shadow-brass/50"
        style={{ scaleX }}
      />
    </motion.div>
  )
}

