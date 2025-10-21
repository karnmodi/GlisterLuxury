'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

export default function VisionMissionSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.2
  })

  const missions = [
    {
      text: "Deliver high-quality, durable and stylish hardware solutions that enhance both function and form.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    {
      text: "Foster a culture of continuous innovation so products remain at the forefront of design and technology.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      text: "Maintain ethical business practices and transparent relationships with customers and partners.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ]

  return (
    <section className="py-24 lg:py-32 bg-charcoal relative overflow-hidden">
      {/* Top wave transition from previous section */}
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
      
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A66B' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-brass text-sm font-medium tracking-luxury uppercase">Our Journey</span>
          <div className="w-16 h-0.5 bg-brass mx-auto mt-3 mb-8" />
          <h2 className="font-serif text-4xl lg:text-5xl text-ivory mb-4">
            Vision & Mission
          </h2>
          <p className="text-ivory/60 text-lg max-w-3xl mx-auto">
            Driven by excellence, guided by integrity
          </p>
        </motion.div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
          
          {/* Vision Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="group relative"
          >
            <div className="h-full p-10 lg:p-12 bg-gradient-to-br from-zinc-900 to-charcoal border border-brass/20 rounded-lg hover:border-brass/50 transition-all duration-500 relative overflow-hidden">
              {/* Decorative shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brass/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-brass/10 flex items-center justify-center mb-6 group-hover:bg-brass/20 transition-colors duration-500">
                  <svg className="w-8 h-8 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>

                <h3 className="font-serif text-3xl text-brass mb-6 tracking-wide">
                  Our Vision
                </h3>
                
                <p className="text-ivory/90 text-lg lg:text-xl leading-relaxed font-light">
                  To be a global leader in the hardware industry—known for innovative design, exceptional quality and outstanding customer service.
                </p>

                {/* Decorative element */}
                <div className="mt-8 w-20 h-1 bg-gradient-to-r from-brass to-transparent" />
              </div>

              {/* Corner accents */}
              <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-brass/20 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-brass/20 rounded-bl-lg" />
            </div>
          </motion.div>

          {/* Mission Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="group relative"
          >
            <div className="h-full p-10 lg:p-12 bg-gradient-to-br from-zinc-900 to-charcoal border border-brass/20 rounded-lg hover:border-brass/50 transition-all duration-500 relative overflow-hidden">
              {/* Decorative shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brass/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-brass/10 flex items-center justify-center mb-6 group-hover:bg-brass/20 transition-colors duration-500">
                  <svg className="w-8 h-8 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>

                <h3 className="font-serif text-3xl text-brass mb-6 tracking-wide">
                  Our Mission
                </h3>
                
                <div className="space-y-5">
                  {missions.map((mission, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                      transition={{ 
                        duration: 0.6, 
                        delay: 0.6 + (index * 0.15)
                      }}
                      className="flex items-start gap-4 group/item"
                    >
                      <div className="flex-shrink-0 mt-0.5 text-brass group-hover/item:scale-110 transition-transform duration-300">
                        {mission.icon}
                      </div>
                      <p className="text-ivory/80 leading-relaxed group-hover/item:text-ivory transition-colors duration-300">
                        {mission.text}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Corner accents */}
              <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-brass/20 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-brass/20 rounded-bl-lg" />
            </div>
          </motion.div>
        </div>

        {/* Bottom Quote */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="text-center mt-16"
        >
          <div className="inline-block relative">
            <p className="font-serif text-2xl lg:text-3xl text-brass/80 italic">
              &ldquo;Crafting excellence since 2025&rdquo;
            </p>
            <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brass/50 to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

