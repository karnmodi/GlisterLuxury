'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

export default function CoreValuesCarousel() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  const values = [
    {
      title: "Quality & Durability",
      description: "Crafted from the finest materials to stand the test of time",
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: "Innovation & Design",
      description: "Pushing boundaries while honoring traditional craftsmanship",
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      title: "Integrity & Ethical Practices",
      description: "Building trust through transparency and honesty",
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      title: "Customer Focus",
      description: "Your vision, our commitment to excellence",
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ]

  return (
    <section className="py-24 lg:py-32 bg-charcoal relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-brass/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-olive/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-brass text-sm font-medium tracking-luxury uppercase">What Drives Us</span>
          <div className="w-16 h-0.5 bg-brass mx-auto mt-3 mb-8" />
          <h2 className="font-serif text-4xl lg:text-5xl text-ivory mb-6">
            Core Values
          </h2>
          <p className="text-ivory/70 text-lg max-w-2xl mx-auto">
            The principles that guide every piece we create
          </p>
        </motion.div>

        {/* Values Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ 
                duration: 0.8, 
                delay: index * 0.2,
                ease: 'easeOut'
              }}
              className="group relative"
            >
              {/* Card */}
              <div className="relative h-full p-10 bg-gradient-to-br from-charcoal to-zinc-900 border border-brass/20 rounded-lg hover:border-brass/50 transition-all duration-500 overflow-hidden">
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-brass-shine opacity-0 group-hover:opacity-100 group-hover:animate-shine" />
                
                {/* Decorative corners - outside content area */}
                <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-brass/30 rounded-tr-lg group-hover:border-brass/60 transition-colors duration-500" />
                <div className="absolute bottom-3 left-3 w-12 h-12 border-b-2 border-l-2 border-brass/30 rounded-bl-lg group-hover:border-brass/60 transition-colors duration-500" />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className="text-brass mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    {value.icon}
                  </div>

                  {/* Title */}
                  <h3 className="font-serif text-xl lg:text-2xl text-ivory mb-4 group-hover:text-brass transition-colors duration-500">
                    {value.title}
                  </h3>

                  {/* Description */}
                  <p className="text-ivory/70 text-sm leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </div>

              {/* Floating accent */}
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  delay: index * 0.3,
                  ease: 'easeInOut'
                }}
                className="absolute -top-2 -right-2 w-4 h-4 bg-brass/50 rounded-full blur-sm"
              />
            </motion.div>
          ))}
        </div>

        {/* Bottom Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="text-center mt-16"
        >
          <p className="font-serif text-2xl text-brass/70 italic">
            Excellence in every detail
          </p>
        </motion.div>
      </div>
    </section>
  )
}

