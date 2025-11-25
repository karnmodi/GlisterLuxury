'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import SearchModal from './SearchModal'

export default function FloatingSearchBar() {
  const [isVisible, setIsVisible] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const pathname = usePathname()

  // Only show on home page
  const isHomePage = pathname === '/'

  useEffect(() => {
    if (!isHomePage) {
      setIsVisible(false)
      return
    }

    const handleScroll = () => {
      // Show floating search bar after scrolling 100px
      const scrollPosition = window.scrollY
      setIsVisible(scrollPosition > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHomePage])

  if (!isHomePage) return null

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-2xl"
          >
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full bg-white/95 backdrop-blur-md shadow-2xl rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex items-center gap-4 px-6 py-4">
                <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-gray-500 group-hover:text-gray-700 transition-colors text-left flex-1">
                  Search products, categories...
                </span>
                <kbd className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-gray-100 group-hover:bg-gray-200 border border-gray-300 rounded-lg text-xs font-mono text-gray-600 transition-colors">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
