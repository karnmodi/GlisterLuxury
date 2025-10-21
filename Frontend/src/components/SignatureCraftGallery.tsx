'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'
import { useState } from 'react'

export default function SignatureCraftGallery() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const gallery = [
    {
      title: "Brushed Brass",
      subtitle: "Warm & Timeless",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      description: "Handcrafted with precision, each piece radiates warmth and sophistication"
    },
    {
      title: "Polished Chrome",
      subtitle: "Modern Elegance",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
      description: "Mirror-like finish that reflects contemporary design excellence"
    },
    {
      title: "Matte Black",
      subtitle: "Bold & Contemporary",
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80",
      description: "Sophisticated darkness that makes a powerful design statement"
    },
    {
      title: "Premium Collections",
      subtitle: "Luxury Hardware",
      image: "/images/gallery/Premium Image.jpg",
      description: "Exquisite craftsmanship meeting uncompromising quality standards"
    },
    {
      title: "Global Distribution",
      subtitle: "Worldwide Delivery",
      image: "/images/gallery/Truck.jpg",
      description: "Reliable logistics ensuring your premium hardware arrives pristine"
    },
    {
      title: "Manufacturing Excellence",
      subtitle: "State-of-the-Art Facility",
      image: "/images/gallery/Warehouse.jpg",
      description: "Advanced production meets traditional craftsmanship techniques"
    }
  ]

  return (
    <section id="collections" className="py-24 lg:py-32 bg-gradient-ivory relative overflow-hidden">
      {/* Geometric pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0L100 50L50 100L0 50Z' fill='%232D2D2D' fill-opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Animated decorative elements */}
      <motion.div 
        className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brass/5 rounded-full blur-3xl"
        animate={{
          x: [0, 80, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-olive/5 rounded-full blur-3xl"
        animate={{
          x: [0, -60, 0],
          y: [0, -30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-brass/3 rounded-full blur-3xl"
        animate={{
          x: [0, 40, 0],
          y: [0, -40, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Animated brass lines */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`line-${i}`}
          className="absolute h-px bg-gradient-to-r from-transparent via-brass/10 to-transparent"
          style={{
            top: `${20 + i * 15}%`,
            left: 0,
            right: 0,
          }}
          animate={{
            opacity: [0.1, 0.3, 0.1],
            scaleX: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8,
          }}
        />
      ))}
      
      {/* Floating brass particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-brass/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -50, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 2, 1],
          }}
          transition={{
            duration: 6 + Math.random() * 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        />
      ))}

      {/* Corner decorative elements */}
      <motion.div
        className="absolute top-0 left-0 w-64 h-64"
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-full h-full border-t-2 border-l-2 border-brass/5 rounded-tl-full" />
      </motion.div>
      <motion.div
        className="absolute bottom-0 right-0 w-64 h-64"
        animate={{ rotate: -360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-full h-full border-b-2 border-r-2 border-brass/5 rounded-br-full" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-brass text-sm font-medium tracking-luxury uppercase">Excellence in Every Detail</span>
          <div className="w-16 h-0.5 bg-brass mx-auto mt-3 mb-8" />
          <h2 className="font-serif text-4xl lg:text-5xl text-charcoal mb-6">
            The Art of Craftsmanship
          </h2>
          <p className="text-charcoal/70 text-lg max-w-3xl mx-auto leading-relaxed">
            From premium finishes to world-class manufacturing, discover how we blend traditional artisan techniques with modern innovation. Each piece reflects our unwavering commitment to quality, precision, and timeless design excellence.
          </p>
        </motion.div>

        {/* Gallery Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {gallery.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ 
                duration: 0.8, 
                delay: index * 0.2,
                ease: 'easeOut'
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="group relative overflow-hidden rounded-lg bg-charcoal shadow-2xl cursor-pointer"
            >
              {/* Image Container */}
              <div className="relative aspect-[3/4] overflow-hidden">
                <motion.div
                  animate={{
                    scale: hoveredIndex === index ? 1.15 : 1,
                  }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="w-full h-full"
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </motion.div>

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                {/* Text Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-8">
                  {/* Title & Subtitle - Always visible */}
                  <motion.div
                    initial={{ y: 0 }}
                    animate={{
                      y: hoveredIndex === index ? -10 : 0,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <h3 className="font-serif text-3xl text-ivory mb-2 group-hover:text-brass transition-colors duration-500">
                      {item.title}
                    </h3>
                    <p className="text-ivory/80 text-sm tracking-wide uppercase">
                      {item.subtitle}
                    </p>
                  </motion.div>

                  {/* Description - Appears on hover */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: hoveredIndex === index ? 1 : 0,
                      y: hoveredIndex === index ? 0 : 20,
                    }}
                    transition={{ duration: 0.5 }}
                    className="mt-6 pt-6 border-t border-brass/30"
                  >
                    <p className="font-serif text-xl text-brass italic">
                      {item.description}
                    </p>
                  </motion.div>
                </div>

                {/* Decorative corner accents */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: hoveredIndex === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-brass" />
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-brass" />
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-brass" />
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-brass" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-center mt-16"
        >
          <a
            href="/finishes"
            className="inline-flex items-center gap-3 px-8 py-4 bg-charcoal text-ivory hover:bg-brass hover:text-charcoal transition-all duration-500 rounded-sm group"
          >
            <span className="text-lg font-medium tracking-wide">View All Finishes</span>
            <svg 
              className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  )
}

