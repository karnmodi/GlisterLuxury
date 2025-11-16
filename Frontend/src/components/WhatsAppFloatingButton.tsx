'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { contactApi } from '@/lib/api'
import type { ContactInfo } from '@/types'

export default function WhatsAppFloatingButton() {
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [hasDragged, setHasDragged] = useState(false)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })
  const pathname = usePathname()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const hasDraggedRef = useRef(false)

  // Update viewport size
  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    // Set initial viewport size
    updateViewportSize()

    // Listen for resize events
    window.addEventListener('resize', updateViewportSize)
    
    return () => {
      window.removeEventListener('resize', updateViewportSize)
    }
  }, [])

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const contactInfo = await contactApi.getInfo({ isActive: true })
        
        // Find the first contact info with a valid WhatsApp number
        const contactWithWhatsApp = contactInfo.find(
          (contact: ContactInfo) => 
            contact.businessWhatsApp && 
            contact.businessWhatsApp.trim() !== '' &&
            contact.businessWhatsApp.startsWith('+')
        )
        
        if (contactWithWhatsApp?.businessWhatsApp) {
          setWhatsappNumber(contactWithWhatsApp.businessWhatsApp)
        }
      } catch (error) {
        console.error('Failed to fetch contact info for WhatsApp button:', error)
        // Silently fail - button won't show if there's an error
      } finally {
        setLoading(false)
      }
    }

    fetchContactInfo()
  }, [])

  // Calculate drag constraints based on viewport and button size
  const getDragConstraints = useCallback(() => {
    if (viewportSize.width === 0 || viewportSize.height === 0) {
      return { left: 0, right: 0, top: 0, bottom: 0 }
    }

    // Get button size - responsive sizes: w-12 h-12 (48px), sm:w-14 sm:h-14 (56px), md:w-16 md:h-16 (64px)
    let buttonSize = 48 // default (w-12 h-12)
    if (viewportSize.width >= 768) {
      buttonSize = 64 // md:w-16 md:h-16
    } else if (viewportSize.width >= 640) {
      buttonSize = 56 // sm:w-14 sm:h-14
    }

    // Calculate constraints
    // For fixed positioning with bottom/right, we need to account for:
    // - Default spacing (bottom-4 right-4 = 16px, sm:bottom-6 sm:right-6 = 24px)
    const defaultSpacing = viewportSize.width >= 640 ? 24 : 16
    
    // The button starts at bottom-right with defaultSpacing from edges
    // When dragging, we need to ensure the button never goes outside viewport
    // 
    // Starting position: right edge at (viewportWidth - defaultSpacing), bottom edge at (viewportHeight - defaultSpacing)
    // 
    // Constraints relative to starting position (x: 0, y: 0):
    // - Left: can move left until left edge hits 0, so max left movement = -(viewportWidth - buttonSize - defaultSpacing)
    // - Right: can move right until right edge hits viewportWidth, so max right movement = defaultSpacing
    // - Top: can move up until top edge hits 0, so max up movement = -(viewportHeight - buttonSize - defaultSpacing)
    // - Bottom: can move down until bottom edge hits viewportHeight, so max down movement = defaultSpacing
    
    const maxLeft = -(viewportSize.width - buttonSize - defaultSpacing)
    const maxRight = defaultSpacing
    const maxTop = -(viewportSize.height - buttonSize - defaultSpacing)
    const maxBottom = defaultSpacing
    
    return {
      left: maxLeft,
      right: maxRight,
      top: maxTop,
      bottom: maxBottom,
    }
  }, [viewportSize.width, viewportSize.height])

  // Reset position to default on mount and route changes
  useEffect(() => {
    setPosition({ x: 0, y: 0 })
  }, [pathname])

  // Clamp position when viewport size changes to ensure button stays within bounds
  useEffect(() => {
    if (viewportSize.width === 0 || viewportSize.height === 0) return
    
    const constraints = getDragConstraints()
    setPosition(prev => {
      const clampedX = Math.max(constraints.left, Math.min(constraints.right, prev.x))
      const clampedY = Math.max(constraints.top, Math.min(constraints.bottom, prev.y))
      
      if (clampedX !== prev.x || clampedY !== prev.y) {
        return { x: clampedX, y: clampedY }
      }
      return prev
    })
  }, [viewportSize.width, viewportSize.height, getDragConstraints])

  // Don't render if loading or no WhatsApp number
  if (loading || !whatsappNumber) {
    return null
  }

  // Default message for customers to start the conversation
  const defaultMessage = "Hello! I'm interested in learning more about Glister Luxury's products and services."

  // Format WhatsApp number for URL (remove + sign) and include default message
  const whatsappNumberFormatted = whatsappNumber.replace(/^\+/, '')
  const whatsappUrl = `https://wa.me/${whatsappNumberFormatted}?text=${encodeURIComponent(defaultMessage)}`

  const handleClick = (e: React.MouseEvent) => {
    // Prevent navigation if user was dragging (check both state and ref for reliability)
    if (hasDraggedRef.current || hasDragged || isDragging) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    // Only navigate if user didn't drag
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  const handleDragStart = () => {
    setIsDragging(true)
    setHasDragged(false)
    hasDraggedRef.current = false
  }

  const handleDrag = (event: any, info: any) => {
    // Check if user has dragged more than 5px (threshold for intentional drag)
    const dragDistance = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2)
    if (dragDistance > 5) {
      setHasDragged(true)
      hasDraggedRef.current = true
    }
  }

  const handleDragEnd = (event: any, info: any) => {
    // Get constraints to clamp position
    const constraints = getDragConstraints()
    
    // Clamp position to stay within viewport boundaries
    const clampedX = Math.max(constraints.left, Math.min(constraints.right, info.offset.x))
    const clampedY = Math.max(constraints.top, Math.min(constraints.bottom, info.offset.y))
    
    // Update position state after drag ends (clamped to viewport)
    setPosition({ x: clampedX, y: clampedY })
    
    // Reset drag flags after a delay to prevent click from firing
    // The delay ensures the click event (if any) is processed after drag end
    setTimeout(() => {
      setIsDragging(false)
      setHasDragged(false)
      hasDraggedRef.current = false
    }, 200)
  }

  const dragConstraints = getDragConstraints()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          x: position.x,
          y: position.y,
        }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 pointer-events-auto cursor-grab active:cursor-grabbing z-50"
        drag
        dragConstraints={dragConstraints}
        dragElastic={0.2}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
      >
        <motion.button
          ref={buttonRef}
          onClick={handleClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-[#25D366] rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 group touch-manipulation"
          aria-label="Contact us on WhatsApp"
        >
          {/* WhatsApp Icon SVG */}
          <svg
            className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          
          {/* Pulse animation ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[#25D366]"
            animate={{
              scale: [1, 1.5],
              opacity: [0.8, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        </motion.button>
      </motion.div>
    </AnimatePresence>
  )
}

