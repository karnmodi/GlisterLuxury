'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import { aboutUsApi } from '@/lib/api'
import type { AboutUs } from '@/types'

export default function AboutPage() {
  const [aboutContent, setAboutContent] = useState<AboutUs[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Group content by section
  const aboutSection = aboutContent.filter(item => item.section === 'about')
  const visionSection = aboutContent.filter(item => item.section === 'vision')
  const philosophySection = aboutContent.filter(item => item.section === 'philosophy')
  const coreValues = aboutContent.filter(item => item.section === 'coreValues').sort((a, b) => a.order - b.order)

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  useEffect(() => {
    const fetchAboutContent = async () => {
      try {
        setLoading(true)
        const data = await aboutUsApi.getAll({ isActive: true, sortBy: 'order' })
        setAboutContent(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch content')
      } finally {
        setLoading(false)
      }
    }

    fetchAboutContent()
  }, [])

  if (loading) {
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
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 overflow-hidden bg-gradient-to-b from-ivory to-charcoal">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-brass/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1, 0.9, 1],
              opacity: [0.08, 0.12, 0.08]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-olive/10 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-brass text-sm font-medium tracking-luxury uppercase mb-4 block">The Story</span>
            <div className="w-16 h-0.5 bg-brass mx-auto mb-6" />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-ivory mb-6 tracking-wide">
              About Glister London
            </h1>
            <p className="text-ivory/80 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              The Emotion of Craft. The Pride of Your Home.
            </p>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      {aboutSection.length > 0 && (
        <section className="py-16 sm:py-24 bg-ivory relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {aboutSection.map((item) => (
              <motion.div
                key={item._id}
                ref={ref}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.8 }}
                className="prose prose-lg max-w-none"
              >
                <h2 className="text-3xl sm:text-4xl font-serif text-charcoal mb-6">{item.title}</h2>
                <div className="text-charcoal/80 leading-relaxed whitespace-pre-wrap text-lg">
                  {item.content}
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

          {/* Decorative background elements */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brass/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-olive/10 rounded-full blur-3xl" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
              
              {/* Vision Card */}
              {visionSection.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
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
                  initial={{ opacity: 0, x: 50 }}
                  animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
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

      {/* Core Values Section */}
      {coreValues.length > 0 && (
        <section className="py-24 lg:py-32 bg-ivory relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              ref={ref}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <span className="text-brass text-sm font-medium tracking-luxury uppercase">What Drives Us</span>
              <div className="w-16 h-0.5 bg-brass mx-auto mt-3 mb-8" />
              <h2 className="font-serif text-4xl lg:text-5xl text-charcoal mb-6">
                Core Values
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {coreValues.map((value, index) => (
                <motion.div
                  key={value._id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
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

                      <h3 className="font-serif text-2xl text-charcoal mb-4 tracking-wide">{value.title}</h3>
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

      {/* CTA Section */}
      <section className="bg-gradient-charcoal py-16 sm:py-24 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-ivory mb-4">
              Experience the Emotion of Craft
            </h2>
            <p className="text-ivory/70 mb-8 text-lg leading-relaxed">
              Discover how Glister London transforms hardware into emotion—the art of design you can feel.
            </p>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/products"
              className="inline-block px-8 py-3 bg-brass text-charcoal font-medium rounded-sm hover:bg-olive transition-all duration-300 hover:shadow-lg hover:shadow-brass/50"
            >
              Explore Our Collections
            </motion.a>
          </motion.div>
        </div>
      </section>

      <LuxuryFooter />
    </div>
  )
}

