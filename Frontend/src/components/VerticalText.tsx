'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface VerticalTextProps {
  text: string
  isHovered?: boolean
  className?: string
}

export default function VerticalText({
  text,
  isHovered = false,
  className = '',
}: VerticalTextProps) {
  // Split text into words
  const words = useMemo(() => {
    return text.split(' ').filter(word => word.length > 0)
  }, [text])

  return (
    <div className={`flex flex-col items-start justify-end gap-1 ${className}`}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: isHovered ? 1 : 0.7,
            y: 0,
            letterSpacing: isHovered ? '0.1em' : '0.05em',
          }}
          transition={{
            duration: 0.3,
            delay: isHovered ? index * 0.05 : 0,
            ease: 'easeOut',
          }}
          className="font-serif font-bold text-ivory h-7 sm:h-8 lg:h-9 flex items-center text-base sm:text-lg lg:text-xl whitespace-nowrap"
          style={{
            textShadow: isHovered
              ? '0 0 10px rgba(201, 166, 107, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)'
              : '0 1px 2px rgba(0, 0, 0, 0.2)',
          }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  )
}

