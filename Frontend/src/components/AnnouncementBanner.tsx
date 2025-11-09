'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { announcementsApi } from '@/lib/api'
import type { Announcement } from '@/types'

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await announcementsApi.getPublic()
        // Ensure data is an array
        const safeData = Array.isArray(data) ? data : []

        // Filter by date range if specified
        const now = new Date()
        const activeAnnouncements = safeData.filter(announcement => {
          if (!announcement.isActive) return false

          const startDate = announcement.startDate ? new Date(announcement.startDate) : null
          const endDate = announcement.endDate ? new Date(announcement.endDate) : null

          if (startDate && now < startDate) return false
          if (endDate && now > endDate) return false

          return true
        })

        setAnnouncements(activeAnnouncements)
      } catch (error) {
        console.error('Failed to fetch announcements:', error)
        setAnnouncements([])
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  // Auto-scroll through announcements
  useEffect(() => {
    if (announcements.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % announcements.length)
    }, 5000) // Change announcement every 5 seconds

    return () => clearInterval(interval)
  }, [announcements.length])

  const handleLinkClick = (announcement: Announcement) => {
    if (!announcement.linkUrl || announcement.linkType === 'none') return
    
    if (announcement.linkType === 'internal') {
      router.push(announcement.linkUrl)
    } else if (announcement.linkType === 'external') {
      const url = announcement.linkUrl.startsWith('http://') || announcement.linkUrl.startsWith('https://') 
        ? announcement.linkUrl 
        : `https://${announcement.linkUrl}`
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  // Show banner only if there are active announcements
  if (!loading && announcements.length === 0) {
    return null
  }
  
  // Show loading state or empty state while loading
  if (loading) {
    return (
      <div 
        data-announcement-banner
        className="fixed top-0 left-0 right-0 w-full z-[9999] overflow-hidden bg-charcoal text-ivory"
        style={{ height: '0px' }}
      />
    )
  }

  const currentAnnouncement = announcements[currentIndex]

  return (
    <div 
      data-announcement-banner
      className="fixed top-0 left-0 right-0 w-full z-[9999] overflow-hidden bg-charcoal text-ivory"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAnnouncement._id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
          className="py-2.5 px-4"
          style={{
            backgroundColor: currentAnnouncement.backgroundColor || '#1E1E1E',
            color: currentAnnouncement.textColor || '#FFFFFF'
          }}
        >
          <div className="container mx-auto flex items-center justify-center gap-4">
            <div 
              className={`text-sm md:text-base text-center flex-1 ${
                currentAnnouncement.linkUrl && currentAnnouncement.linkType !== 'none' 
                  ? 'cursor-pointer hover:underline' 
                  : ''
              }`}
              onClick={() => handleLinkClick(currentAnnouncement)}
            >
              {currentAnnouncement.message}
              {currentAnnouncement.linkUrl && currentAnnouncement.linkType !== 'none' && currentAnnouncement.linkText && (
                <span className="ml-2 font-semibold underline">
                  {currentAnnouncement.linkText} →
                </span>
              )}
            </div>
            
            {/* Dots indicator - only show if multiple announcements */}
            {announcements.length > 1 && (
              <div className="flex items-center gap-1.5">
                {announcements.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      index === currentIndex 
                        ? 'bg-current opacity-100 w-4' 
                        : 'bg-current opacity-40 hover:opacity-70'
                    }`}
                    aria-label={`Go to announcement ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

