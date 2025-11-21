import { useEffect, useState } from 'react'

interface UseFloatingSidebarOptions {
  sidebarRef: React.RefObject<HTMLDivElement | null>
  headerRef: React.RefObject<HTMLElement | null>
  footerRef: React.RefObject<HTMLDivElement | null>
  initialTop?: number
}

/**
 * Custom hook to manage floating sidebar positioning
 * Handles smooth scroll behavior and respects header/footer boundaries
 */
export function useFloatingSidebar({
  sidebarRef,
  headerRef,
  footerRef,
  initialTop = 120,
}: UseFloatingSidebarOptions) {
  const [sidebarTop, setSidebarTop] = useState(initialTop)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Only update on desktop (lg and above)
    if (window.innerWidth < 1024) return

    const headerSection = headerRef.current
    const footer = footerRef.current
    const sidebar = sidebarRef.current
    if (!headerSection || !footer || !sidebar) return

    const updatePosition = () => {
      // Only update on desktop
      if (window.innerWidth < 1024) return

      const viewportHeight = window.innerHeight
      const sidebarHeight = sidebar.offsetHeight

      // Get element positions in viewport coordinates
      const headerRect = headerSection.getBoundingClientRect()
      const footerRect = footer.getBoundingClientRect()

      // Navigation bar height (approximate)
      const navHeight = 80

      // Spacing/padding
      const topGap = 24 // Space from header/nav
      const bottomGap = 24 // Space from footer

      // Calculate boundaries in viewport coordinates
      const headerBottom = headerRect.bottom
      const footerTop = footerRect.top

      // Calculate viewport center
      const viewportCenter = viewportHeight / 2
      
      // Calculate sidebar center offset (half of sidebar height)
      const sidebarCenterOffset = sidebarHeight / 2
      
      // Target position: vertically centered in viewport
      let targetTop = viewportCenter - sidebarCenterOffset

      // Check if header is visible (header bottom is below nav)
      const headerIsVisible = headerBottom > navHeight
      
      // When header is visible: position sidebar below header with spacing
      if (headerIsVisible) {
        const minTop = Math.max(navHeight + topGap, headerBottom + topGap)
        // Use the greater of centered position or minimum position
        targetTop = Math.max(targetTop, minTop)
      }

      // When footer approaches: adjust position to stay above footer with spacing
      const maxTop = footerTop - sidebarHeight - bottomGap
      if (targetTop + sidebarHeight + bottomGap > footerTop) {
        targetTop = Math.max(
          navHeight + topGap, // Never go above nav
          footerTop - sidebarHeight - bottomGap
        )
      }

      // Ensure we don't go above the minimum safe position
      const absoluteMinTop = navHeight + topGap
      targetTop = Math.max(targetTop, absoluteMinTop)

      // Apply position
      setSidebarTop(targetTop)
    }

    // Throttled scroll handler for smooth performance
    let rafId: number | null = null
    const handleScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(() => {
          updatePosition()
          rafId = null
        })
      }
    }

    // Set up observers for header and footer
    const headerObserver = new IntersectionObserver(
      () => updatePosition(),
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    )

    const footerObserver = new IntersectionObserver(
      () => updatePosition(),
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    )

    headerObserver.observe(headerSection)
    footerObserver.observe(footer)

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', updatePosition, { passive: true })

    // Initial calculation
    setTimeout(updatePosition, 100)

    return () => {
      headerObserver.disconnect()
      footerObserver.disconnect()
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', updatePosition)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [sidebarRef, headerRef, footerRef])

  return sidebarTop
}
