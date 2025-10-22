'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false)

  const closeMenu = () => setIsOpen(false)

  return (
    <div className="lg:hidden">
      {/* Mobile Menu Button */}
      <button 
        className="text-ivory hover:text-brass p-2 transition-colors duration-300 z-50 relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle mobile menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Full Screen Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay - Full Screen */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999]" 
              onClick={closeMenu}
            />

            {/* Sidebar Panel - Right Hand Side */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-screen w-[320px] max-w-[85vw] bg-gradient-to-br from-charcoal via-zinc-900 to-charcoal shadow-2xl z-[10000]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative Border */}
              <div className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-transparent via-brass to-transparent opacity-50" />

              {/* Scrollable Content Container */}
              <div className="h-full overflow-y-auto overflow-x-hidden">
                <div className="flex flex-col min-h-full p-6">
                  
                  {/* Header Section */}
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-brass/20">
                    <div className="flex items-center space-x-3">
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <Image
                          src="/images/business/G.png"
                          alt="Glister London"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="text-ivory font-serif font-bold text-sm tracking-wide">GLISTER LONDON</h3>
                        <p className="text-brass text-xs">The Soul of Interior</p>
                      </div>
                    </div>
                    
                    {/* Close Button */}
                    <button 
                      className="text-ivory hover:text-brass transition-colors duration-300 p-1"
                      onClick={closeMenu}
                      aria-label="Close menu"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Navigation Menu */}
                  <nav className="flex-1 space-y-1">
                    
                    {/* About Link */}
                    <Link 
                      href="/about" 
                      className="block text-base font-medium text-ivory hover:text-brass hover:bg-brass/5 transition-all duration-300 py-3 px-4 rounded-sm border-b border-brass/10" 
                      onClick={closeMenu}
                    >
                      About
                    </Link>
                    
                    {/* Collections Section */}
                    <div className="border-b border-brass/10">
                      <div className="text-base font-semibold text-ivory py-3 px-4">
                        Collections
                      </div>
                      <div className="space-y-1 pb-2">
                        <Link 
                          href="/collections/luxury" 
                          className="block text-sm text-ivory/80 hover:text-brass hover:bg-brass/5 transition-all duration-300 py-2 px-4 ml-4 rounded-sm" 
                          onClick={closeMenu}
                        >
                          Luxury Collection
                        </Link>
                        <Link 
                          href="/collections/classic" 
                          className="block text-sm text-ivory/80 hover:text-brass hover:bg-brass/5 transition-all duration-300 py-2 px-4 ml-4 rounded-sm" 
                          onClick={closeMenu}
                        >
                          Classic Collection
                        </Link>
                        <Link 
                          href="/collections/modern" 
                          className="block text-sm text-ivory/80 hover:text-brass hover:bg-brass/5 transition-all duration-300 py-2 px-4 ml-4 rounded-sm" 
                          onClick={closeMenu}
                        >
                          Modern Collection
                        </Link>
                        <Link 
                          href="/collections/heritage" 
                          className="block text-sm text-ivory/80 hover:text-brass hover:bg-brass/5 transition-all duration-300 py-2 px-4 ml-4 rounded-sm" 
                          onClick={closeMenu}
                        >
                          Heritage Collection
                        </Link>
                      </div>
                    </div>

                    {/* Products Section */}
                    <div className="border-b border-brass/10">
                      <div className="text-base font-semibold text-ivory py-3 px-4">
                        Products
                      </div>
                      <div className="space-y-1 pb-2">
                        <Link 
                          href="/products/cabinet-hardware" 
                          className="block text-sm text-ivory/80 hover:text-brass hover:bg-brass/5 transition-all duration-300 py-2 px-4 ml-4 rounded-sm" 
                          onClick={closeMenu}
                        >
                          Cabinet Hardware
                        </Link>
                        <Link 
                          href="/products/bathroom-accessories" 
                          className="block text-sm text-ivory/80 hover:text-brass hover:bg-brass/5 transition-all duration-300 py-2 px-4 ml-4 rounded-sm" 
                          onClick={closeMenu}
                        >
                          Bathroom Accessories
                        </Link>
                        <Link 
                          href="/products/mortise-handles" 
                          className="block text-sm text-ivory/80 hover:text-brass hover:bg-brass/5 transition-all duration-300 py-2 px-4 ml-4 rounded-sm" 
                          onClick={closeMenu}
                        >
                          Mortise Handles
                        </Link>
                        <Link 
                          href="/products/door-hardware" 
                          className="block text-sm text-ivory/80 hover:text-brass hover:bg-brass/5 transition-all duration-300 py-2 px-4 ml-4 rounded-sm" 
                          onClick={closeMenu}
                        >
                          Door Hardware
                        </Link>
                        <Link 
                          href="/products/sockets-switches" 
                          className="block text-sm text-ivory/80 hover:text-brass hover:bg-brass/5 transition-all duration-300 py-2 px-4 ml-4 rounded-sm" 
                          onClick={closeMenu}
                        >
                          Sockets & Switches
                        </Link>
                      </div>
                    </div>

                    {/* Finishes Link */}
                    <Link 
                      href="/finishes" 
                      className="block text-base font-medium text-ivory hover:text-brass hover:bg-brass/5 transition-all duration-300 py-3 px-4 rounded-sm border-b border-brass/10" 
                      onClick={closeMenu}
                    >
                      Finishes
                    </Link>
                    
                    {/* Contact Link */}
                    <Link 
                      href="/contact" 
                      className="block text-base font-medium text-ivory hover:text-brass hover:bg-brass/5 transition-all duration-300 py-3 px-4 rounded-sm border-b border-brass/10" 
                      onClick={closeMenu}
                    >
                      Contact
                    </Link>
                  </nav>

                  {/* CTA Button at Bottom */}
                  <div className="mt-auto pt-6 border-t border-brass/20">
                    <Link 
                      href="/explore"
                      className="block w-full px-6 py-4 bg-brass text-charcoal text-center font-semibold tracking-wide rounded-sm hover:bg-olive transition-all duration-300 shadow-lg hover:shadow-brass/50"
                      onClick={closeMenu}
                    >
                      Explore Collections
                    </Link>
                    
                    {/* Decorative Element */}
                    <div className="mt-6 text-center">
                      <div className="inline-block w-16 h-[2px] bg-gradient-to-r from-transparent via-brass/50 to-transparent" />
                    </div>
                  </div>

                </div>
              </div>

              {/* Corner Accents */}
              <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-brass/30 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-brass/30 pointer-events-none" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
