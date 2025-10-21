'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function CinematicHero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState(false)

  // Optimized images for faster loading
  const images = [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=75&w=2000&auto=format&fit=crop', // Luxury door handle
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=75&w=2000&auto=format&fit=crop', // Modern interior
    '/images/gallery/Knowb.jpg', // Brass knob
    'https://images.unsplash.com/photo-1697374981314-6bdaa638e379?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1332', // Brass fixtures
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=75&w=2000&auto=format&fit=crop', // Luxury bathroom
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=75&w=2000&auto=format&fit=crop', // Modern kitchen
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=75&w=2000&auto=format&fit=crop', // Gold hardware
  ]

  // Preload first image for instant display
  useEffect(() => {
    const img = new window.Image()
    img.src = images[0]
    img.onload = () => setImagesLoaded(true)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [images.length])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-charcoal">
      {/* Image Carousel with Animations */}
      <AnimatePresence>
        <motion.div
          key={currentImageIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <Image
            src={images[currentImageIndex]}
            alt={`Luxury interior ${currentImageIndex + 1}`}
            fill
            className="object-cover"
            priority={currentImageIndex === 0}
            quality={75}
            loading={currentImageIndex === 0 ? "eager" : "lazy"}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwABmQAAA/9k="
          />
          {/* Dark overlay for better readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 via-charcoal/40 to-charcoal/70" />
        </motion.div>
      </AnimatePresence>

      {/* Brass texture overlay */}
      <div
        className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A66B' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Content - CTA Button with Tagline */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Link
              href="#collections"
              className="inline-block px-10 py-4 bg-brass text-charcoal text-lg font-medium tracking-wide rounded-sm hover:bg-olive transition-all duration-500 hover:shadow-2xl hover:shadow-brass/50 group"
            >
              <span className="flex items-center gap-3">
                Explore Collections
                <svg
                  className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
          </motion.div>

          {/* Tagline - High Visibility */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-ivory text-base sm:text-lg font-light tracking-wide max-w-2xl mx-auto leading-relaxed"
            style={{
              textShadow: '0 2px 20px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 0, 0, 0.7), 0 4px 8px rgba(0, 0, 0, 0.8)'
            }}
          >
            Handcrafted luxury hardware and fixtures that transform spaces into timeless masterpieces of elegance and sophistication.
          </motion.p>
        </motion.div>
      </div>

      {/* Scroll Indicator - Repositioned outside content container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 border-2 border-brass/70 rounded-full flex justify-center pt-2"
        >
          <motion.div
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 bg-brass rounded-full"
          />
        </motion.div>
      </motion.div>

      {/* Image indicators */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentImageIndex
              ? 'bg-brass w-8'
              : 'bg-ivory/40 hover:bg-ivory/60'
              }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      {/* Unique transition design - Brass wave separator */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-full h-16"
          style={{ fill: '#2D2D2D' }}
        >
          <path d="M0,0 C150,60 350,60 600,30 C850,0 1050,0 1200,30 L1200,120 L0,120 Z" opacity="0.3" />
          <path d="M0,20 C150,80 350,80 600,50 C850,20 1050,20 1200,50 L1200,120 L0,120 Z" />
        </svg>
      </div>
    </section>
  )
}

