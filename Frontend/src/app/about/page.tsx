'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import ScrollProgressIndicator from '@/components/ScrollProgressIndicator'
import BackToTopButton from '@/components/BackToTopButton'
import { aboutUsApi, blogApi } from '@/lib/api'
import type { AboutUs, Blog } from '@/types'
import Link from 'next/link'

export default function AboutPage() {
  const [aboutContent, setAboutContent] = useState<AboutUs[]>([])
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Hooks must be called before any conditional returns
  const { scrollYProgress } = useScroll()
  const parallaxY1 = useTransform(scrollYProgress, [0, 1], [0, -150])
  const parallaxY2 = useTransform(scrollYProgress, [0, 1], [0, -100])
  const parallaxY3 = useTransform(scrollYProgress, [0, 1], [0, -200])

  // Use separate refs for each section to ensure content appears immediately
  const [aboutRef, aboutInView] = useInView({
    triggerOnce: false,
    threshold: 0.05,
    rootMargin: '50px 0px'
  })
  const [visionRef, visionInView] = useInView({
    triggerOnce: false,
    threshold: 0.05,
    rootMargin: '50px 0px'
  })
  const [promiseRef, promiseInView] = useInView({
    triggerOnce: false,
    threshold: 0.05,
    rootMargin: '50px 0px'
  })
  const [valuesRef, valuesInView] = useInView({
    triggerOnce: false,
    threshold: 0.05,
    rootMargin: '50px 0px'
  })

  // Group content by section - ensure aboutContent is always an array
  const safeAboutContent = Array.isArray(aboutContent) ? aboutContent : []
  const aboutSection = safeAboutContent.filter(item => item.section === 'about')
  const visionSection = safeAboutContent.filter(item => item.section === 'vision')
  const philosophySection = safeAboutContent.filter(item => item.section === 'philosophy')
  const promiseSection = safeAboutContent.filter(item => item.section === 'promise')
  const coreValues = safeAboutContent.filter(item => item.section === 'coreValues').sort((a, b) => a.order - b.order)

  // Fetch data immediately on mount
  useEffect(() => {
    const fetchAboutContent = async () => {
      try {
        setLoading(true)
        const [aboutData, blogData] = await Promise.all([
          aboutUsApi.getAll({ isActive: true, sortBy: 'order' }),
          blogApi.getAll({ isActive: true, sortBy: 'order' })
        ])
        // Set data immediately when received - ensure arrays
        setAboutContent(Array.isArray(aboutData) ? aboutData : [])
        setBlogs(Array.isArray(blogData) ? blogData : [])
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch content')
        setLoading(false)
      }
    }

    // Start fetching immediately
    fetchAboutContent()
  }, [])

  // Don't block rendering - show content immediately when available
  // Only show loading spinner if we have no data at all
  if (loading && (Array.isArray(aboutContent) ? aboutContent.length : 0) === 0 && (Array.isArray(blogs) ? blogs.length : 0) === 0) {
    return (
      <div className="min-h-screen bg-ivory">
        <LuxuryNavigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-brass border-t-transparent rounded-full"
          />
        </div>
        <LuxuryFooter />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ivory">
        <LuxuryNavigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-serif text-charcoal mb-4">Something went wrong</h2>
            <p className="text-charcoal/70">{error}</p>
          </div>
        </div>
        <LuxuryFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ivory">
      <LuxuryNavigation />
      <ScrollProgressIndicator />
      
      {/* Hero Section - Completely Redesigned */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-charcoal">
        {/* Base Background Layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal via-zinc-900 to-charcoal" />

        {/* Animated Gradient Mesh - Layer 1 */}
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(201, 166, 107, 0.3) 0%, transparent 50%),
                              radial-gradient(circle at 80% 70%, rgba(154, 151, 116, 0.25) 0%, transparent 50%),
                              radial-gradient(circle at 50% 50%, rgba(201, 166, 107, 0.15) 0%, transparent 60%)`,
            backgroundSize: '200% 200%',
          }}
        />

        {/* Animated Gradient Mesh - Layer 2 */}
        <motion.div
          className="absolute inset-0 opacity-15"
          animate={{
            backgroundPosition: ['100% 100%', '0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            backgroundImage: `radial-gradient(circle at 60% 20%, rgba(154, 151, 116, 0.3) 0%, transparent 50%),
                              radial-gradient(circle at 30% 80%, rgba(201, 166, 107, 0.2) 0%, transparent 50%)`,
            backgroundSize: '150% 150%',
          }}
        />

        {/* Gradient Orbs with Parallax */}
        <motion.div
          style={{ y: parallaxY1 }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-brass/15 via-olive/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          style={{ y: parallaxY2 }}
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-tl from-olive/12 via-brass/8 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.12, 0.2, 0.12],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
        <motion.div
          style={{ y: parallaxY3 }}
          className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-gradient-to-br from-brass/10 to-olive/8 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.1, 0.18, 0.1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />

        {/* Animated Brass Grid Lines */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`grid-h-${i}`}
            className="absolute h-px bg-gradient-to-r from-transparent via-brass/8 to-transparent"
            style={{
              top: `${15 + i * 14}%`,
              left: 0,
              right: 0,
            }}
            animate={{
              opacity: [0.05, 0.2, 0.05],
              scaleX: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 5 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.6,
            }}
          />
        ))}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`grid-v-${i}`}
            className="absolute w-px bg-gradient-to-b from-transparent via-brass/8 to-transparent"
            style={{
              left: `${20 + i * 20}%`,
              top: 0,
              bottom: 0,
            }}
            animate={{
              opacity: [0.05, 0.15, 0.05],
              scaleY: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 6 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.8,
            }}
          />
        ))}

        {/* Floating Geometric Shapes - Hexagons with Hover */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`hex-${i}`}
            className="absolute group cursor-pointer hidden md:block"
            style={{
              left: `${65 + i * 12}%`,
              top: `${20 + i * 25}%`,
            }}
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            whileHover={{
              scale: 1.3,
              opacity: 0.4,
              transition: { duration: 0.3 },
            }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 2,
            }}
          >
            <svg width="80" height="80" viewBox="0 0 80 80" className="text-brass/20 group-hover:text-brass/40 transition-colors duration-300">
              <polygon
                points="40,5 70,20 70,50 40,65 10,50 10,20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </motion.div>
        ))}

        {/* Floating Geometric Shapes - Diamonds with Hover */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`diamond-${i}`}
            className="absolute group cursor-pointer hidden md:block"
            style={{
              left: `${70 + i * 8}%`,
              top: `${35 + i * 15}%`,
            }}
            animate={{
              rotate: [0, -360],
              scale: [0.8, 1.2, 0.8],
              opacity: [0.08, 0.18, 0.08],
            }}
            whileHover={{
              scale: 1.4,
              opacity: 0.3,
              transition: { duration: 0.3 },
            }}
            transition={{
              duration: 15 + i * 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 1.5,
            }}
          >
            <div className="w-12 h-12 border border-brass/25 rotate-45 group-hover:border-brass/50 group-hover:shadow-lg group-hover:shadow-brass/20 transition-all duration-300" />
          </motion.div>
        ))}

        {/* Floating Geometric Shapes - Circles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`circle-${i}`}
            className="absolute rounded-full border border-brass/20"
            style={{
              width: `${30 + i * 10}px`,
              height: `${30 + i * 10}px`,
              left: `${60 + i * 7}%`,
              top: `${50 + i * 10}%`,
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.25, 0.1],
            }}
            transition={{ 
              duration: 8 + i * 2,
              repeat: Infinity, 
              ease: 'easeInOut',
              delay: i * 0.8,
            }}
          />
        ))}

        {/* Enhanced Particle System - Optimized count */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full bg-brass/30"
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ 
              y: [0, -60 - Math.random() * 40, 0],
              x: [0, (Math.random() - 0.5) * 30, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5 + Math.random(), 1],
            }}
            transition={{ 
              duration: 6 + Math.random() * 8,
              repeat: Infinity, 
              ease: 'easeInOut',
              delay: Math.random() * 5,
            }}
          />
        ))}

        {/* Enhanced Corner Decorative Elements */}
        <motion.div
          className="absolute top-0 left-0 w-80 h-80 z-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-full h-full border-t-2 border-l-2 border-brass/10 rounded-tl-full" />
          <div className="absolute top-8 left-8 w-24 h-24 border-t border-l border-brass/15" />
        </motion.div>
        <motion.div
          className="absolute bottom-0 right-0 w-80 h-80 z-0"
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-full h-full border-b-2 border-r-2 border-brass/10 rounded-br-full" />
          <div className="absolute bottom-8 right-8 w-24 h-24 border-b border-r border-brass/15" />
        </motion.div>

        {/* Asymmetric Layout Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center min-h-[80vh] py-16 lg:py-0">
            {/* Left Side - Content (60%) */}
            <div className="lg:col-span-3 space-y-6 lg:space-y-8">
              {/* "The Story" Label with Enhanced Styling */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex items-center gap-4"
              >
                <div className="w-12 h-px bg-gradient-to-r from-transparent to-brass" />
                <span className="text-brass text-sm font-medium tracking-luxury uppercase">
                  The Story
                </span>
                <div className="w-12 h-px bg-gradient-to-l from-transparent to-brass" />
              </motion.div>

              {/* Hero Title with Staggered Letter Animation */}
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-serif font-bold text-ivory leading-tight"
              >
                {['About', 'Glister', 'Luxury'].map((word, wordIdx) => (
                  <motion.span
                    key={wordIdx}
                    className="inline-block mr-3"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: 0.6 + wordIdx * 0.2,
                      ease: 'easeOut',
                    }}
                  >
                    {word.split('').map((letter, letterIdx) => (
                      <motion.span
                        key={letterIdx}
                        className="inline-block"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: 0.8 + wordIdx * 0.2 + letterIdx * 0.05,
                          ease: 'easeOut',
                        }}
                        style={{
                          textShadow: wordIdx === 1 ? '0 0 20px rgba(201, 166, 107, 0.3)' : 'none',
                        }}
                      >
                        {letter === ' ' ? '\u00A0' : letter}
                      </motion.span>
                    ))}
                  </motion.span>
                ))}
              </motion.h1>

              {/* Glassmorphism Subtitle Card */}
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brass/10 via-olive/5 to-brass/10 rounded-lg blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
                <div className="relative backdrop-blur-md bg-charcoal/40 border border-brass/20 rounded-lg p-6 lg:p-8 shadow-xl shadow-brass/10 group-hover:border-brass/40 transition-all duration-500">
                  <motion.p
                    className="text-ivory/90 text-lg sm:text-xl lg:text-2xl leading-relaxed font-light"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.4 }}
                  >
                    The <span className="text-brass font-medium">Emotion of Craft</span>. The Pride of Your Home.
                  </motion.p>
                  <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-brass/30 rounded-tr-lg" />
                  <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-brass/30 rounded-bl-lg" />
                </div>
              </motion.div>
            </div>

            {/* Right Side - Visual Elements (40%) - Hidden on mobile, shown on tablet+ */}
            <div className="lg:col-span-2 relative h-[300px] md:h-[400px] lg:h-[500px] hidden md:block">
              {/* Animated Visual Separator Line */}
              <motion.div
                className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-3/4 bg-gradient-to-b from-transparent via-brass/30 to-transparent"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 1, delay: 1.6 }}
              />

              {/* Floating Brass Elements with Hover Effects */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`float-${i}`}
                  className="absolute group cursor-pointer"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${15 + i * 12}%`,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    rotate: [0, 180, 360],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  whileHover={{
                    scale: 1.3,
                    opacity: 0.6,
                    transition: { duration: 0.3 },
                  }}
                  transition={{
                    duration: 8 + i * 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.5,
                  }}
                >
                  <div className="w-16 h-16 border-2 border-brass/20 rounded-lg rotate-45 group-hover:border-brass/50 group-hover:shadow-lg group-hover:shadow-brass/30 transition-all duration-300" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>


        {/* Bottom Wave Transition */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="relative block w-full h-16"
            style={{ fill: '#F5F5F0' }}
          >
            <path d="M0,0 C150,60 350,60 600,30 C850,0 1050,0 1200,30 L1200,120 L0,120 Z" opacity="0.8" />
            <path d="M0,20 C150,80 350,80 600,50 C850,20 1050,20 1200,50 L1200,120 L0,120 Z" />
          </svg>
        </div>
      </section>

      {/* About Section - Redesigned */}
      {aboutSection.length > 0 && (
        <section className="py-20 sm:py-28 lg:py-32 bg-ivory relative overflow-hidden">
          {/* Animated Brass Texture Overlay */}
          <motion.div 
            className="absolute inset-0 opacity-3 pointer-events-none"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A66B' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '80px 80px',
            }}
          />

          {/* Subtle Gradient Orbs */}
          <motion.div
            className="absolute top-1/4 right-1/4 w-96 h-96 bg-brass/5 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.05, 0.08, 0.05],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-olive/5 rounded-full blur-3xl"
            animate={{
              scale: [1.1, 1, 1.1],
              opacity: [0.04, 0.07, 0.04],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
          />

          {/* Animated lines */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={`about-line-${i}`}
              className="absolute h-px bg-gradient-to-r from-transparent via-brass/4 to-transparent"
              style={{
                top: `${25 + i * 18}%`,
                left: 0,
                right: 0,
              }}
              animate={{
                opacity: [0.03, 0.12, 0.03],
                scaleX: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 1.5,
              }}
            />
          ))}

          {/* Floating Particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`about-particle-${i}`}
              className="absolute w-1.5 h-1.5 bg-brass/15 rounded-full"
              style={{
                left: `${15 + i * 12}%`,
                top: `${20 + i * 10}%`,
              }}
              animate={{
                y: [0, -25, 0],
                opacity: [0.08, 0.2, 0.08],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 6 + Math.random() * 4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.8,
              }}
            />
          ))}

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {aboutSection.map((item) => (
              <motion.div
                key={item._id}
                ref={aboutRef}
                initial={{ opacity: 1, y: 0, scale: 1 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: false, margin: '50px 0px' }}
                transition={{ 
                  duration: 0.6,
                  ease: [0.6, 0.01, 0, 0.9]
                }}
                className="relative group"
              >
                {/* Glassmorphism Card Container */}
                <div className="relative backdrop-blur-md bg-ivory/80 border border-brass/20 rounded-2xl p-8 lg:p-12 shadow-2xl shadow-brass/5 group-hover:border-brass/30 group-hover:shadow-brass/10 transition-all duration-500">
                  {/* Background Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-brass/5 via-transparent to-olive/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Decorative Corner Elements */}
                  <motion.div
                    className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-brass/20 rounded-tl-lg"
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <motion.div
                    className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-brass/20 rounded-br-lg"
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 2,
                    }}
                  />

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Title with Enhanced Styling */}
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-charcoal mb-8 leading-tight">
                      {item.title.split(' ').map((word, idx) => 
                        idx === 0 ? (
                          <span key={idx} className="text-brass inline-block">
                            {word}
                            <motion.span
                              className="inline-block ml-2"
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            >
                              —
                            </motion.span>
                          </span>
                        ) : (
                          <span key={idx} className="text-charcoal"> {word}</span>
                        )
                      )}
                    </h2>

                    {/* Elegant Divider */}
                    <motion.div
                      className="w-20 h-0.5 bg-gradient-to-r from-brass via-olive to-transparent mb-8"
                      initial={{ scaleX: 1 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: false, margin: '50px 0px' }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    />

                    {/* Content with Dynamic Brass Accents */}
                    <div className="text-charcoal/80 leading-relaxed whitespace-pre-wrap text-lg lg:text-xl space-y-6">
                      {item.content.split('\n\n').map((paragraph, pIdx) => {
                        // For the first paragraph, highlight first few words in brass
                        if (pIdx === 0) {
                          const words = paragraph.split(' ');
                          const firstWordsCount = Math.min(3, words.length);
                          return (
                            <motion.p
                              key={pIdx}
                              initial={{ opacity: 1, y: 0 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: false, margin: '50px 0px' }}
                              transition={{ duration: 0.8, delay: 0.4 + pIdx * 0.1 }}
                              className="text-charcoal/90"
                            >
                              {words.map((word, wIdx) => (
                                <span
                                  key={wIdx}
                                  className={wIdx < firstWordsCount ? 'text-brass font-medium' : ''}
                                >
                                  {word}{wIdx < words.length - 1 ? ' ' : ''}
                                </span>
                              ))}
                            </motion.p>
                          );
                        }
                        // For other paragraphs, normal rendering
                        return (
                          <motion.p
                            key={pIdx}
                            initial={{ opacity: 1, y: 0 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, margin: '50px 0px' }}
                            transition={{ duration: 0.8, delay: 0.5 + pIdx * 0.1 }}
                            className="text-charcoal/80"
                          >
                            {paragraph}
                          </motion.p>
                        );
                      })}
                    </div>

                    {/* Bottom Decorative Line */}
                    <motion.div
                      className="w-16 h-0.5 bg-gradient-to-l from-brass to-transparent mt-8"
                      initial={{ scaleX: 1 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: false, margin: '50px 0px' }}
                      transition={{ duration: 0.8, delay: 0.7 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Vision & Philosophy Section */}
      {(visionSection.length > 0 || philosophySection.length > 0) && (
        <section className="py-24 lg:py-32 bg-charcoal relative overflow-hidden">
          {/* Top wave transition */}
          <div className="absolute top-0 left-0 right-0 overflow-hidden">
            <svg 
              viewBox="0 0 1200 120" 
              preserveAspectRatio="none" 
              className="relative block w-full h-16 rotate-180"
              style={{ fill: '#2D2D2D' }}
            >
              <path d="M0,0 C150,60 350,60 600,30 C850,0 1050,0 1200,30 L1200,120 L0,120 Z" opacity="0.5" />
            </svg>
          </div>

          {/* Decorative background elements with parallax */}
          <motion.div 
            style={{ y: parallaxY1 }}
            className="absolute top-1/4 right-1/4 w-96 h-96 bg-brass/10 rounded-full blur-3xl" 
          />
          <motion.div 
            style={{ y: parallaxY2 }}
            className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-olive/10 rounded-full blur-3xl" 
          />

          {/* Floating particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`vision-particle-${i}`}
              className="absolute w-1.5 h-1.5 bg-brass/20 rounded-full"
              style={{
                left: `${15 + (i * 10)}%`,
                top: `${20 + (i * 8)}%`,
              }}
              animate={{
                y: [0, -40, 0],
                opacity: [0.1, 0.4, 0.1],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            />
          ))}

          {/* Subtle pattern overlay */}
          <div 
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A66B' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
              
              {/* Vision Card */}
              {visionSection.length > 0 && (
                <motion.div
                  ref={visionRef}
                  initial={{ opacity: 1, x: 0 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, margin: '50px 0px' }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="group relative"
                >
                  <div className="h-full p-10 lg:p-12 bg-gradient-to-br from-zinc-900 to-charcoal border border-brass/20 rounded-lg hover:border-brass/50 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brass/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    
                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-full bg-brass/10 flex items-center justify-center mb-6 group-hover:bg-brass/20 transition-colors duration-500">
                        <svg className="w-8 h-8 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>

                      {visionSection.map((item) => (
                        <div key={item._id}>
                          <h3 className="font-serif text-3xl text-brass mb-6 tracking-wide">{item.title}</h3>
                          <p className="text-ivory/90 text-lg lg:text-xl leading-relaxed font-light whitespace-pre-wrap">
                            {item.content}
                          </p>
                          {item.subtitle && (
                            <p className="text-ivory/70 text-base mt-4 italic whitespace-pre-wrap">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      ))}

                      <div className="mt-8 w-20 h-1 bg-gradient-to-r from-brass to-transparent" />
                    </div>

                    <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-brass/20 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-brass/20 rounded-bl-lg" />
                  </div>
                </motion.div>
              )}

              {/* Philosophy Card */}
              {philosophySection.length > 0 && (
                <motion.div
                  ref={visionRef}
                  initial={{ opacity: 1, x: 0 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, margin: '50px 0px' }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="group relative"
                >
                  <div className="h-full p-10 lg:p-12 bg-gradient-to-br from-zinc-900 to-charcoal border border-brass/20 rounded-lg hover:border-brass/50 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brass/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    
                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-full bg-brass/10 flex items-center justify-center mb-6 group-hover:bg-brass/20 transition-colors duration-500">
                        <svg className="w-8 h-8 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>

                      {philosophySection.map((item) => (
                        <div key={item._id}>
                          <h3 className="font-serif text-3xl text-brass mb-6 tracking-wide">{item.title}</h3>
                          <p className="text-ivory/90 text-lg lg:text-xl leading-relaxed font-light whitespace-pre-wrap">
                            {item.content}
                          </p>
                          {item.subtitle && (
                            <p className="text-ivory/70 text-base mt-4 italic whitespace-pre-wrap">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      ))}

                      <div className="mt-8 w-20 h-1 bg-gradient-to-r from-brass to-transparent" />
                    </div>

                    <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-brass/20 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-brass/20 rounded-bl-lg" />
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Promise Section */}
      {promiseSection.length > 0 && (
        <section className="py-24 lg:py-32 bg-ivory relative overflow-hidden">
          {/* Pattern overlay */}
          <div 
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A66B' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-brass/10 rounded-tl-lg" />
          <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-brass/10 rounded-br-lg" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {promiseSection.map((item) => (
              <motion.div
                key={item._id}
                ref={promiseRef}
                initial={{ opacity: 1, y: 0 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: '50px 0px' }}
                transition={{ duration: 0.8 }}
                className="text-center"
              >
                <span className="text-brass text-sm font-medium tracking-luxury uppercase mb-4 block">Our Commitment</span>
                <div className="w-16 h-0.5 bg-brass mx-auto mb-6" />
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-charcoal mb-8 tracking-wide">
                  {item.title.split(' ').map((word, idx) => 
                    idx < 2 ? <span key={idx} className="text-brass">{word} </span> : <span key={idx}>{word} </span>
                  )}
                </h2>
                <p className="text-charcoal/80 leading-relaxed whitespace-pre-wrap text-lg lg:text-xl max-w-3xl mx-auto">
                  {item.content}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Core Values Section */}
      {coreValues.length > 0 && (
        <section className="py-24 lg:py-32 bg-ivory relative overflow-hidden">
          {/* Floating particles */}
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={`values-particle-${i}`}
              className="absolute w-1.5 h-1.5 bg-brass/20 rounded-full"
              style={{
                left: `${10 + (i * 8)}%`,
                top: `${15 + (i * 7)}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.1, 0.3, 0.1],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 4 + Math.random() * 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}

          {/* Animated lines */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={`values-line-${i}`}
              className="absolute h-px bg-gradient-to-r from-transparent via-brass/5 to-transparent"
              style={{
                top: `${25 + i * 18}%`,
                left: 0,
                right: 0,
              }}
              animate={{
                opacity: [0.05, 0.15, 0.05],
                scaleX: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 6 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 1.2,
              }}
            />
          ))}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              ref={valuesRef}
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: '50px 0px' }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <span className="text-brass text-sm font-medium tracking-luxury uppercase">What Drives Us</span>
              <div className="w-16 h-0.5 bg-brass mx-auto mt-3 mb-8" />
              <h2 className="font-serif text-4xl lg:text-5xl text-charcoal mb-6">
                <span className="text-brass">Core</span> Values
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {coreValues.map((value, index) => (
                <motion.div
                  key={value._id}
                  initial={{ opacity: 1, y: 0 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: '50px 0px' }}
                  transition={{ 
                    duration: 0.8, 
                    delay: index * 0.15,
                    ease: 'easeOut'
                  }}
                  className="group relative"
                >
                  <div className="relative h-full p-10 bg-white border border-brass/20 rounded-lg hover:border-brass/50 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-xl">
                    <div className="absolute inset-0 bg-brass-shine opacity-0 group-hover:opacity-100 group-hover:animate-shine" />
                    
                    <div className="relative z-10">
                      <div className="w-16 h-16 rounded-full bg-brass/10 flex items-center justify-center mb-6 group-hover:bg-brass/20 transition-colors duration-500">
                        <svg className="w-8 h-8 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>

                      <h3 className="font-serif text-2xl text-charcoal mb-4 tracking-wide">
                        <span className="text-brass">{value.title.split(' ')[0]}</span> {value.title.split(' ').slice(1).join(' ')}
                      </h3>
                      <p className="text-charcoal/80 leading-relaxed whitespace-pre-wrap">
                        {value.content}
                      </p>
                    </div>

                    <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-brass/30 rounded-tr-lg group-hover:border-brass/60 transition-colors duration-500" />
                    <div className="absolute bottom-3 left-3 w-12 h-12 border-b-2 border-l-2 border-brass/30 rounded-bl-lg group-hover:border-brass/60 transition-colors duration-500" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Journal/Blog Section */}
      {Array.isArray(blogs) && blogs.length > 0 && (
        <section className="py-24 lg:py-32 bg-charcoal relative overflow-hidden">
          {/* Top wave transition */}
          <div className="absolute top-0 left-0 right-0 overflow-hidden">
            <svg 
              viewBox="0 0 1200 120" 
              preserveAspectRatio="none" 
              className="relative block w-full h-16 rotate-180"
              style={{ fill: '#2D2D2D' }}
            >
              <path d="M0,0 C150,60 350,60 600,30 C850,0 1050,0 1200,30 L1200,120 L0,120 Z" opacity="0.5" />
            </svg>
          </div>

          {/* Pattern overlay */}
          <div 
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A66B' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          />

          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`blog-particle-${i}`}
              className="absolute w-1.5 h-1.5 bg-brass/20 rounded-full"
              style={{
                left: `${20 + (i * 12)}%`,
                top: `${25 + (i * 10)}%`,
              }}
              animate={{
                y: [0, -35, 0],
                opacity: [0.1, 0.35, 0.1],
                scale: [1, 1.4, 1],
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.6,
              }}
            />
          ))}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="text-brass text-sm font-medium tracking-luxury uppercase mb-4 block">The Journal</span>
              <div className="w-16 h-0.5 bg-brass mx-auto mb-6" />
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-ivory mb-6 tracking-wide">
                Where Design Meets Emotion
              </h2>
              <p className="text-ivory/80 text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed">
                Welcome to The Glister Journal, where design meets emotion and craftsmanship tells its story.
              </p>
            </motion.div>

            {/* Blog Articles Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {(Array.isArray(blogs) ? blogs : []).map((blog, index) => (
                <motion.div
                  key={blog._id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.8, 
                    delay: index * 0.1,
                    ease: 'easeOut'
                  }}
                  viewport={{ once: true }}
                  className="group relative"
                >
                  <div className="h-full p-8 bg-gradient-to-br from-zinc-900 to-charcoal border border-brass/20 rounded-lg hover:border-brass/50 transition-all duration-500 relative overflow-hidden hover:shadow-xl hover:shadow-brass/20">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brass/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    
                    <div className="relative z-10">
                      <h3 className="font-serif text-2xl lg:text-3xl text-brass mb-4 tracking-wide group-hover:text-brass/90 transition-colors">
                        {blog.title}
                      </h3>
                      <p className="text-ivory/80 text-base lg:text-lg mb-6 leading-relaxed line-clamp-3">
                        {blog.shortDescription}
                      </p>
                      <p className="text-ivory/70 text-sm lg:text-base leading-relaxed line-clamp-4 mb-6">
                        {blog.content}
                      </p>
                      
                      {/* Tags */}
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {blog.tags.slice(0, 3).map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-3 py-1 text-xs text-brass/80 border border-brass/30 rounded-full bg-brass/5"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-6 w-20 h-1 bg-gradient-to-r from-brass to-transparent" />
                    </div>

                    <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-brass/30 rounded-tr-lg group-hover:border-brass/60 transition-colors duration-500" />
                    <div className="absolute bottom-3 left-3 w-12 h-12 border-b-2 border-l-2 border-brass/30 rounded-bl-lg group-hover:border-brass/60 transition-colors duration-500" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-gradient-to-b from-charcoal to-zinc-900 py-16 sm:py-24 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-ivory mb-6 tracking-wide">
              Experience the <span className="text-brass">Emotion of Craft</span>
            </h2>
            <p className="text-ivory/70 mb-10 text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto">
              Discover how <span className="text-brass">Glister Luxury</span> transforms hardware into emotion—the art of design you can feel.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/collections"
                className="inline-block px-8 py-3 bg-brass text-charcoal font-medium rounded-sm hover:bg-olive transition-all duration-300 hover:shadow-lg hover:shadow-brass/50"
              >
                Explore Collections
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/about"
                className="inline-block px-8 py-3 border-2 border-brass text-brass font-medium rounded-sm hover:bg-brass/10 transition-all duration-300"
              >
                Discover Craft
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/finishes"
                className="inline-block px-8 py-3 border-2 border-brass text-brass font-medium rounded-sm hover:bg-brass/10 transition-all duration-300"
              >
                Shop the Finish
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      <BackToTopButton />
      <LuxuryFooter />
    </div>
  )
}

