'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function LoadingScreen() {
  return (
    <motion.div 
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-gradient-to-br from-charcoal via-zinc-900 to-charcoal overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        transition: { duration: 0.5, ease: "easeInOut" }
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {/* Ambient background elements */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-brass/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-olive/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        />
      </div>

      {/* Main loading container */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Logo Container with Animations */}
        <div className="relative">
          
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 -m-8"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="w-full h-full rounded-full border-2 border-brass/30 blur-sm" />
          </motion.div>

          {/* Middle glow ring */}
          <motion.div
            className="absolute inset-0 -m-4"
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3
            }}
          >
            <div className="w-full h-full rounded-full border-2 border-brass/40 blur-[2px]" />
          </motion.div>
          
          {/* Logo with breathing animation */}
          <motion.div
            className="relative w-32 h-32 sm:w-40 sm:h-40"
            animate={{
              scale: [1, 1.08, 1],
              filter: [
                "brightness(1) drop-shadow(0 0 20px rgba(189, 147, 79, 0.3))",
                "brightness(1.2) drop-shadow(0 0 40px rgba(189, 147, 79, 0.6))",
                "brightness(1) drop-shadow(0 0 20px rgba(189, 147, 79, 0.3))"
              ]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Image
              src="/images/business/G.png"
              alt="Loading"
              fill
              className="object-contain"
              priority
            />
            
            {/* Shimmer effect overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ['-200%', '200%']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 1
              }}
              style={{
                maskImage: 'linear-gradient(90deg, transparent, black, transparent)',
                WebkitMaskImage: 'linear-gradient(90deg, transparent, black, transparent)'
              }}
            />
          </motion.div>

          {/* Particle effects around logo */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-brass rounded-full"
              style={{
                left: '50%',
                top: '50%',
              }}
              animate={{
                x: [0, Math.cos((i * Math.PI * 2) / 8) * 80, 0],
                y: [0, Math.sin((i * Math.PI * 2) / 8) * 80, 0],
                opacity: [0, 0.8, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Loading text */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-ivory tracking-wide mb-2">
            GLISTER LUXURY
          </h2>
          <p className="text-sm text-brass tracking-luxury mb-4">The Soul of Interior</p>
          
          {/* Loading dots */}
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-brass rounded-full"
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Subtle horizontal line decoration */}
        <motion.div
          className="mt-8 h-[1px] bg-gradient-to-r from-transparent via-brass/50 to-transparent"
          initial={{ width: 0 }}
          animate={{ width: 200 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </div>

      {/* Corner decorative elements */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-brass/20" />
      <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-brass/20" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-brass/20" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-brass/20" />
    </motion.div>
  )
}

