'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import MobileNavigation from './MobileNavigation'
import SearchModal from './SearchModal'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useAuth } from '@/contexts/AuthContext'
import { useCategories } from '@/contexts/CategoriesContext'
import { useCollections } from '@/contexts/CollectionsContext'
import type { Category, Collection } from '@/types'

export default function LuxuryNavigation() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { categories, loading: categoriesLoading, hasAttemptedFetch, error: categoriesError } = useCategories()
  const { collections, collectionsWithProducts } = useCollections()
  const [bannerHeight, setBannerHeight] = useState(0)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [menuMaxHeight, setMenuMaxHeight] = useState(600)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { itemCount } = useCart()
  const { itemCount: wishlistCount } = useWishlist()
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Detect announcement banner height
  useEffect(() => {
    const checkBanner = () => {
      const banner = document.querySelector('[data-announcement-banner]') as HTMLElement
      if (banner) {
        setBannerHeight(banner.offsetHeight)
      } else {
        setBannerHeight(0)
      }
    }
    
    // Check immediately and after a delay for announcements to load
    checkBanner()
    const timeout = setTimeout(checkBanner, 1000)
    const interval = setInterval(checkBanner, 2000)
    
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [])

  // Calculate viewport-aware menu height
  useEffect(() => {
    const calculateMenuHeight = () => {
      const viewportHeight = window.innerHeight
      const navHeight = 80 // Approximate navigation bar height
      const padding = 40 // Top and bottom padding
      const maxHeight = Math.min(600, viewportHeight - navHeight - padding)
      setMenuMaxHeight(maxHeight)
    }

    calculateMenuHeight()
    window.addEventListener('resize', calculateMenuHeight)
    return () => window.removeEventListener('resize', calculateMenuHeight)
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  // Filter categories and subcategories based on search query
  // Backend already filters to only show categories/subcategories with products
  const filteredCategories = useMemo(() => {
    // Apply search query filter if present
    if (!searchQuery.trim()) {
      return categories
    }

    const query = searchQuery.toLowerCase().trim()
    return categories
      .map((category) => {
        const categoryMatches = 
          category.name.toLowerCase().includes(query) ||
          category.description?.toLowerCase().includes(query)

        const matchingSubcategories = category.subcategories?.filter(
          (subcategory) =>
            subcategory.name.toLowerCase().includes(query) ||
            subcategory.description?.toLowerCase().includes(query)
        ) || []

        // Include category if it matches or has matching subcategories
        if (categoryMatches || matchingSubcategories.length > 0) {
          return {
            ...category,
            subcategories: categoryMatches
              ? (category.subcategories || [])
              : matchingSubcategories,
          }
        }

        return null
      })
      .filter((category): category is Category => category !== null)
  }, [categories, searchQuery])

  // Helper function to highlight matching text (memoized search pattern)
  const highlightText = useMemo(() => {
    if (!searchQuery.trim()) return null
    
    const query = searchQuery.trim()
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    
    return (text: string) => {
      const parts = text.split(regex)
      return parts.map((part, index) => {
        if (part.toLowerCase() === query.toLowerCase()) {
          return (
            <mark key={index} className="bg-brass/30 text-brass px-0.5 rounded">
              {part}
            </mark>
          )
        }
        return <span key={index}>{part}</span>
      })
    }
  }, [searchQuery])

  // Helper to render text with or without highlighting
  const renderText = (text: string) => {
    if (!searchQuery.trim() || !highlightText) return text
    return highlightText(text)
  }

  // Calculate optimal column count based on category count
  const columnCount = useMemo(() => {
    const count = filteredCategories.length
    if (count <= 4) return 2
    if (count <= 9) return 3
    if (count <= 16) return 4
    return 5
  }, [filteredCategories.length])

  // Filter collections to only show those with products
  const filteredCollections = collections.filter(collection => 
    collectionsWithProducts.has(collection._id)
  )

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed left-0 right-0 z-[9998] transition-all duration-500 ${
        scrolled 
          ? 'bg-charcoal/95 backdrop-blur-md shadow-lg' 
          : 'bg-charcoal/80 backdrop-blur-sm'
      }`}
      style={{ top: `${bannerHeight}px` }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-12 h-12 transition-transform duration-300 group-hover:scale-110">
              <Image
                src="/images/business/G.png"
                alt="Glister Luxury Logo"
                fill
                sizes="48px"
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-ivory tracking-wide">GLISTER LUXURY</h1>
              <p className="text-xs text-brass tracking-luxury">The Soul of Interior</p>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-10">
            <Link 
              href="/about" 
              className="text-ivory hover:text-brass transition-colors duration-300 text-sm font-medium tracking-wide golden-underline"
            >
              About
            </Link>

            {/* Products with Submenu - Dynamic Categories */}
            <div
              data-products-nav
              className="relative inline-flex"
              onMouseEnter={() => {
                if (closeTimeoutRef.current) {
                  clearTimeout(closeTimeoutRef.current)
                  closeTimeoutRef.current = null
                }
                setActiveMenu('products')
              }}
              onMouseLeave={(e) => {
                    // Only close if mouse is not moving to the menu
                    const relatedTarget = e.relatedTarget as HTMLElement
                    if (!relatedTarget || !relatedTarget.closest('[data-products-menu]')) {
                      closeTimeoutRef.current = setTimeout(() => {
                        setActiveMenu(null)
                        setExpandedCategories(new Set())
                        setSearchQuery('')
                      }, 200)
                    }
                  }}
            >
              <Link
                href="/products"
                onClick={(e) => {
                  e.preventDefault()
                  router.push('/products')
                }}
                className="text-ivory hover:text-brass transition-colors duration-300 text-sm font-medium tracking-wide golden-underline-with-submenu whitespace-nowrap relative inline-flex items-center gap-3 group"
              >
                Products &nbsp;
                <span className="submenu-indicator" aria-label="More options available"></span>
              </Link>

              <AnimatePresence>
                {activeMenu === 'products' && (
                  <motion.div
                    data-products-menu
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 pt-2 min-w-[800px] max-w-[1100px] xl:max-w-[1200px] bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg shadow-2xl overflow-hidden z-50"
                    style={{ maxHeight: `${menuMaxHeight}px` }}
                    onMouseEnter={() => {
                      if (closeTimeoutRef.current) {
                        clearTimeout(closeTimeoutRef.current)
                        closeTimeoutRef.current = null
                      }
                      setActiveMenu('products')
                    }}
                    onMouseLeave={(e) => {
                      const relatedTarget = e.relatedTarget as HTMLElement
                      if (!relatedTarget || !relatedTarget.closest('[data-products-nav]')) {
                        closeTimeoutRef.current = setTimeout(() => {
                          setActiveMenu(null)
                          setExpandedCategories(new Set())
                          setSearchQuery('')
                        }, 200)
                      }
                    }}
                  >
                    {categoriesLoading || !hasAttemptedFetch ? (
                      <div className="px-6 py-8 text-center">
                        <p className="text-sm text-ivory/50">Loading categories...</p>
                      </div>
                    ) : categoriesError ? (
                      <div className="px-6 py-8 text-center">
                        <p className="text-sm text-red-400 mb-2">Failed to load categories</p>
                        <p className="text-xs text-ivory/50">{categoriesError}</p>
                      </div>
                    ) : categories.length > 0 ? (
                      <div className="flex flex-col" style={{ maxHeight: `${menuMaxHeight}px` }}>
                        {/* Search Bar */}
                        <div className="p-4 border-b border-brass/20">
                          <div className="relative">
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search categories and products..."
                              className="w-full px-4 py-2.5 pl-10 bg-charcoal/80 border border-brass/30 rounded-sm text-ivory placeholder-ivory/50 focus:outline-none focus:ring-2 focus:ring-brass/50 focus:border-brass transition-all duration-300"
                            />
                            <svg
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brass/60"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {searchQuery && (
                              <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory/50 hover:text-brass transition-colors duration-300"
                                aria-label="Clear search"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Categories Grid - Scrollable */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                          {filteredCategories.length > 0 ? (
                            <div className={`grid gap-6 ${
                              columnCount === 2 ? 'grid-cols-2' :
                              columnCount === 3 ? 'grid-cols-3' :
                              columnCount === 4 ? 'grid-cols-4' :
                              'grid-cols-5'
                            }`}>
                              {filteredCategories.map((category) => {
                                const isExpanded = expandedCategories.has(category._id)
                                const hasSubcategories = category.subcategories && category.subcategories.length > 0

                                const toggleCategory = (e: React.MouseEvent) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setExpandedCategories((prev) => {
                                    const newSet = new Set(prev)
                                    if (newSet.has(category._id)) {
                                      newSet.delete(category._id)
                                    } else {
                                      newSet.add(category._id)
                                    }
                                    return newSet
                                  })
                                }

                                return (
                                  <div
                                    key={category._id}
                                    className="min-w-0"
                                  >
                                    {/* Category Header */}
                                    <div className="mb-3 pb-2 border-b border-brass/30 hover:border-brass/50 transition-colors duration-300">
                                      <div className="flex items-start justify-between gap-2">
                                        <Link
                                          href={`/products?category=${category._id}`}
                                          className="flex-1"
                                        >
                                          <h3 className="text-base font-semibold text-brass hover:text-olive transition-colors duration-300">
                                            {renderText(category.name)}
                                          </h3>
                                          {category.description && (
                                            <p className="text-xs text-ivory/60 mt-1 line-clamp-2">
                                              {renderText(category.description)}
                                            </p>
                                          )}
                                        </Link>
                                        {hasSubcategories && (
                                          <button
                                            onClick={toggleCategory}
                                            className="flex-shrink-0 mt-0.5 p-1 rounded-sm hover:bg-brass/10 transition-colors duration-200 group"
                                            aria-label={isExpanded ? 'Collapse subcategories' : 'Expand subcategories'}
                                            aria-expanded={isExpanded}
                                          >
                                            <svg
                                              className={`w-4 h-4 text-brass/70 group-hover:text-brass transition-all duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Subcategories List - Expand on click */}
                                    {hasSubcategories && (
                                      <AnimatePresence>
                                        {isExpanded && (
                                          <motion.ul
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2, ease: 'easeOut' }}
                                            className="space-y-1.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar mb-2"
                                          >
                                            {category.subcategories?.map((subcategory) => {
                                              // Construct URL with proper encoding using URLSearchParams
                                              const params = new URLSearchParams({
                                                category: category._id,
                                                subcategory: subcategory._id
                                              })
                                              const subcategoryUrl = `/products?${params.toString()}`
                                              
                                              return (
                                                <li key={subcategory._id}>
                                                  <Link
                                                    href={subcategoryUrl}
                                                    className="block px-2 py-1.5 text-sm text-ivory/90 hover:text-brass hover:bg-brass/10 rounded-sm transition-all duration-300 group"
                                                    onClick={(e) => {
                                                      // Ensure click is handled properly
                                                      e.stopPropagation()
                                                    }}
                                                  >
                                                    <span className="flex items-center gap-2">
                                                      <span className="w-1.5 h-1.5 rounded-full bg-brass/30 group-hover:bg-brass transition-colors duration-300 flex-shrink-0"></span>
                                                      <span className="truncate">
                                                        {renderText(subcategory.name)}
                                                      </span>
                                                    </span>
                                                  </Link>
                                                </li>
                                              )
                                            })}
                                          </motion.ul>
                                        )}
                                      </AnimatePresence>
                                    )}

                                    {/* Show subcategories count if not expanded and search is active */}
                                    {!isExpanded && hasSubcategories && searchQuery && (
                                      <p className="text-xs text-ivory/50 italic px-2 py-1.5">
                                        {category.subcategories?.length || 0} subcategories
                                      </p>
                                    )}

                                    {!hasSubcategories && (
                                      <p className="text-xs text-ivory/40 italic px-2 py-1.5">
                                        No subcategories
                                      </p>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="px-6 py-8 text-center">
                              <p className="text-sm text-ivory/50 mb-2">No categories match "{searchQuery}"</p>
                              <button
                                onClick={() => setSearchQuery('')}
                                className="text-sm text-brass hover:text-olive transition-colors duration-300 underline"
                              >
                                Clear search
                              </button>
                            </div>
                          )}
                        </div>

                        {/* View All Products Link */}
                        <div className="p-4 pt-0 border-t border-brass/20">
                          <Link
                            href={searchQuery ? `/products?search=${encodeURIComponent(searchQuery)}` : '/products'}
                            className="inline-flex items-center gap-2 text-sm font-medium text-brass hover:text-olive transition-colors duration-300 group"
                          >
                            {searchQuery ? 'View all matching products' : 'View All Products'}
                            <svg
                              className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="px-6 py-8 text-center">
                        <p className="text-sm text-ivory/50">No categories available</p>
                        {hasAttemptedFetch && categories.length === 0 && (
                          <p className="text-xs text-ivory/40 mt-2">No categories with products found</p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link 
              href="/finishes" 
              className="text-ivory hover:text-brass transition-colors duration-300 text-sm font-medium tracking-wide golden-underline"
            >
              Finishes
            </Link>

            <Link 
              href="/faqs" 
              className="text-ivory hover:text-brass transition-colors duration-300 text-sm font-medium tracking-wide golden-underline"
            >
              FAQs
            </Link>

            <Link
              href="/contact"
              className="text-ivory hover:text-brass transition-colors duration-300 text-sm font-medium tracking-wide golden-underline"
            >
              Contact
            </Link>

            <Link
              href="/catalogue"
              className="text-ivory hover:text-brass transition-colors duration-300 text-sm font-medium tracking-wide golden-underline"
            >
              Catalogue
            </Link>

            {/* Track Order - Only for non-logged-in users */}
            {!isAuthenticated && (
              <Link
                href="/track"
                className="text-ivory hover:text-brass transition-colors duration-300 text-sm font-medium tracking-wide golden-underline"
              >
                Track Order
              </Link>
            )}
          </div>

          {/* Action Icons - Visible on Desktop */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Search Icon */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="text-ivory hover:text-brass transition-colors duration-300"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Profile Icon with Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => isAuthenticated && setShowUserMenu(true)}
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <Link 
                href={isAuthenticated ? "/profile" : "/login"}
                className="text-ivory hover:text-brass transition-colors duration-300 flex items-center gap-2"
                aria-label="Profile"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
              
              {/* User Dropdown Menu */}
              {isAuthenticated && (
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-2 w-56 bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg shadow-2xl overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-brass/20">
                        <p className="text-ivory text-sm font-medium">{user?.name}</p>
                        <p className="text-brass/70 text-xs">{user?.email}</p>
                      </div>
                      
                      <Link
                        href="/profile"
                        className="block px-4 py-3 text-sm text-ivory hover:text-brass hover:bg-brass/10 transition-all duration-300 border-b border-brass/10"
                      >
                        My Account
                      </Link>
                      
                      <Link
                        href="/orders"
                        className="block px-4 py-3 text-sm text-ivory hover:text-brass hover:bg-brass/10 transition-all duration-300 border-b border-brass/10"
                      >
                        My Orders
                      </Link>
                      
                      <Link
                        href="/favorites"
                        className="block px-4 py-3 text-sm text-ivory hover:text-brass hover:bg-brass/10 transition-all duration-300 border-b border-brass/10"
                      >
                        My Favorites
                      </Link>
                      
                      {user?.role === 'admin' && (
                        <Link
                          href="/admin/products"
                          className="block px-4 py-3 text-sm text-ivory hover:text-brass hover:bg-brass/10 transition-all duration-300 border-b border-brass/10"
                        >
                          Admin Panel
                        </Link>
                      )}
                      
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 transition-all duration-300"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>

            {/* Favorites Icon with Badge */}
            <Link 
              href="/favorites"
              className="text-ivory hover:text-brass transition-colors duration-300 relative"
              aria-label="Favorites"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brass text-charcoal text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            <Link 
              href="/cart"
              className="text-ivory hover:text-brass transition-colors duration-300 relative"
              aria-label="Cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {/* Cart badge */}
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brass text-charcoal text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Divider */}
            <div className="w-px h-6 bg-brass/30" />

            {/* Explore Collections Button with Submenu */}
            {filteredCollections.length > 0 ? (
              <div 
                className="relative inline-flex"
                onMouseEnter={() => {
                  if (closeTimeoutRef.current) {
                    clearTimeout(closeTimeoutRef.current)
                    closeTimeoutRef.current = null
                  }
                  setActiveMenu('explore')
                }}
                onMouseLeave={() => {
                  closeTimeoutRef.current = setTimeout(() => {
                    setActiveMenu(null)
                  }, 200)
                }}
              >
                <Link 
                  href="/collections"
                  className="px-6 py-2.5 bg-brass text-charcoal text-sm font-medium tracking-wide rounded-sm hover:bg-olive transition-all duration-300 hover:shadow-lg hover:shadow-brass/50"
                >
                  Explore Collections
                </Link>
                
                <AnimatePresence>
                  {activeMenu === 'explore' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 pt-2 w-64 bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg shadow-2xl overflow-hidden max-h-[600px] overflow-y-auto z-50"
                      onMouseEnter={() => {
                        if (closeTimeoutRef.current) {
                          clearTimeout(closeTimeoutRef.current)
                          closeTimeoutRef.current = null
                        }
                        setActiveMenu('explore')
                      }}
                      onMouseLeave={() => {
                        closeTimeoutRef.current = setTimeout(() => {
                          setActiveMenu(null)
                        }, 200)
                      }}
                    >
                      {filteredCollections.slice(0, 4).map((collection, index) => (
                        <div key={collection._id} className="border-b border-brass/10 last:border-b-0">
                          <Link
                            href={`/collections/${collection.slug}`}
                            className="block px-6 py-3 text-sm font-semibold text-brass hover:text-olive hover:bg-brass/10 transition-all duration-300"
                          >
                            {collection.name}
                            {collection.productCount !== undefined && (
                              <span className="ml-2 text-xs text-ivory/60">({collection.productCount})</span>
                            )}
                          </Link>
                        </div>
                      ))}
                      <Link
                        href="/collections"
                        className="block px-6 py-3 text-sm font-medium text-brass hover:text-olive hover:bg-brass/10 transition-all duration-300 border-t border-brass/20"
                      >
                        View All Collections →
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link 
                href="/collections"
                className="px-6 py-2.5 bg-brass text-charcoal text-sm font-medium tracking-wide rounded-sm hover:bg-olive transition-all duration-300 hover:shadow-lg hover:shadow-brass/50"
              >
                Explore Collections
              </Link>
            )}
          </div>

          {/* Mobile Icons & Menu */}
          <div className="flex lg:hidden items-center gap-4">

            {/* Search Icon - Mobile */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="text-ivory hover:text-brass transition-colors duration-300"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Profile Icon - Mobile */}
            <Link
              href={isAuthenticated ? "/profile" : "/login"}
              className="text-ivory hover:text-brass transition-colors duration-300"
              aria-label="Profile"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>

            {/* Favourites Icon - Mobile */}
            <Link 
              href="/favorites"
              className="text-ivory hover:text-brass transition-colors duration-300"
              aria-label="Favourites"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            {/* Cart Icon - Mobile */}
            <Link 
              href="/cart"
              className="text-ivory hover:text-brass transition-colors duration-300 relative"
              aria-label="Cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {/* Cart badge */}
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brass text-charcoal text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Navigation Menu */}
            <MobileNavigation />
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </motion.nav>
  )
}

