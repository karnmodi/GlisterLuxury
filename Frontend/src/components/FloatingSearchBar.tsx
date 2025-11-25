'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import SearchModal from './SearchModal'

export default function FloatingSearchBar() {
  const [isVisible, setIsVisible] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [bannerHeight, setBannerHeight] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()

  // Only show on home page
  const isHomePage = pathname === '/'

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Detect announcement banner height using ResizeObserver for real-time updates
  useEffect(() => {
    const updateBannerHeight = () => {
      const banner = document.querySelector('[data-announcement-banner]') as HTMLElement
      if (banner) {
        setBannerHeight(banner.offsetHeight)
      } else {
        setBannerHeight(0)
      }
    }

    // Initial check
    updateBannerHeight()

    // Use ResizeObserver to watch for banner size changes
    const observer = new ResizeObserver(updateBannerHeight)
    const banner = document.querySelector('[data-announcement-banner]')

    if (banner) {
      observer.observe(banner)
    }

    // Also use MutationObserver to detect when banner is added/removed
    const mutationObserver = new MutationObserver(updateBannerHeight)
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    })

    // Fallback: check periodically in case observers miss something
    const interval = setInterval(updateBannerHeight, 2000)

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
      clearInterval(interval)
    }
  }, [])

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

  // Calculate dynamic top position
  // Mobile: banner + nav (64px) + spacing (12px)
  // Desktop: banner + nav (80px) + spacing (16px)
  const navHeight = isMobile ? 64 : 80
  const spacing = isMobile ? 12 : 16
  const topPosition = bannerHeight + navHeight + spacing

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed left-1/2 -translate-x-1/2 z-[9997] px-3 sm:px-4 w-full max-w-2xl"
            style={{ top: `${topPosition}px` }}
          >
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full bg-white/95 backdrop-blur-md shadow-2xl rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm sm:text-base text-gray-500 group-hover:text-gray-700 transition-colors text-left flex-1">
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
