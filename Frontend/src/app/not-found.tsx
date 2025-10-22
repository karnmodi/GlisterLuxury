'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <LuxuryNavigation />
      
      {/* Main 404 Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
        <div className="max-w-4xl w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="space-y-8"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center mb-8"
            >
              <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                <Image
                  src="/images/business/G.png"
                  alt="Glister London"
                  fill
                  className="object-contain opacity-60"
                  priority
                />
              </div>
            </motion.div>

            {/* 404 Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <h1 className="text-8xl sm:text-9xl lg:text-[12rem] font-serif font-bold text-charcoal/10 tracking-tight">
                404
              </h1>
            </motion.div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="space-y-4 -mt-16 sm:-mt-20 lg:-mt-24"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-charcoal tracking-wide">
                Page Not Found
              </h2>
              <div className="w-24 h-1 bg-brass mx-auto" />
              <p className="text-lg sm:text-xl text-charcoal/70 max-w-2xl mx-auto leading-relaxed font-crimson">
                The page you're looking for seems to have wandered into uncharted territory. 
                Like our craftsmen shaping brass into perfection, we're constantly crafting new experiences.
              </p>
            </motion.div>

            {/* Development Notice (Optional) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="bg-charcoal/5 border border-brass/20 rounded-lg p-6 max-w-2xl mx-auto"
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <svg className="w-6 h-6 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <h3 className="text-lg font-semibold text-charcoal">Under Development</h3>
              </div>
              <p className="text-sm text-charcoal/60 font-crimson">
                This section is currently being crafted with the same precision and care we put into all our brass creations. 
                Please check back soon.
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
            >
              <Link
                href="/"
                className="group relative px-8 py-4 bg-brass text-charcoal font-medium text-sm tracking-wide rounded-sm hover:bg-olive transition-all duration-300 hover:shadow-xl hover:shadow-brass/30 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Return Home
                </span>
                <div className="absolute inset-0 bg-olive transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Link>

              <Link
                href="/products"
                className="px-8 py-4 bg-transparent border-2 border-charcoal text-charcoal font-medium text-sm tracking-wide rounded-sm hover:bg-charcoal hover:text-ivory transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Explore Products
                </span>
              </Link>
            </motion.div>

            {/* Popular Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="pt-12"
            >
              <p className="text-sm text-charcoal/50 mb-4 tracking-wide uppercase">Popular Destinations</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/about"
                  className="text-sm text-brass hover:text-olive transition-colors duration-300 golden-underline"
                >
                  About Us
                </Link>
                <span className="text-charcoal/30">•</span>
                <Link
                  href="/products"
                  className="text-sm text-brass hover:text-olive transition-colors duration-300 golden-underline"
                >
                  Products
                </Link>
                <span className="text-charcoal/30">•</span>
                <Link
                  href="/collections"
                  className="text-sm text-brass hover:text-olive transition-colors duration-300 golden-underline"
                >
                  Collections
                </Link>
                <span className="text-charcoal/30">•</span>
                <Link
                  href="/finishes"
                  className="text-sm text-brass hover:text-olive transition-colors duration-300 golden-underline"
                >
                  Finishes
                </Link>
                <span className="text-charcoal/30">•</span>
                <Link
                  href="/contact"
                  className="text-sm text-brass hover:text-olive transition-colors duration-300 golden-underline"
                >
                  Contact
                </Link>
              </div>
            </motion.div>

            {/* Decorative Elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 1.4 }}
              className="pt-8"
            >
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-px bg-gradient-to-r from-transparent to-brass/50" />
                <div className="w-2 h-2 rounded-full bg-brass/50" />
                <div className="w-12 h-px bg-gradient-to-l from-transparent to-brass/50" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <LuxuryFooter />
    </div>
  )
}

