'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MobileNavigation from './MobileNavigation'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useAuth } from '@/contexts/AuthContext'

export default function LuxuryNavigation() {
  const [scrolled, setScrolled] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
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

  const collectionsSubmenu = [
    { name: 'Luxury Collection', href: '/collections/luxury' },
    { name: 'Classic Collection', href: '/collections/classic' },
    { name: 'Modern Collection', href: '/collections/modern' },
    { name: 'Heritage Collection', href: '/collections/heritage' },
  ]

  const productsSubmenu = [
    { name: 'Cabinet Hardware', href: '/products/cabinet-hardware' },
    { name: 'Bathroom Accessories', href: '/products/bathroom-accessories' },
    { name: 'Mortise Handles', href: '/products/mortise-handles' },
    { name: 'Door Hardware', href: '/products/door-hardware' },
    { name: 'Sockets & Switches', href: '/products/sockets-switches' },
  ]

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-[9998] transition-all duration-500 ${
        scrolled 
          ? 'bg-charcoal/95 backdrop-blur-md shadow-lg' 
          : 'bg-charcoal/80 backdrop-blur-sm'
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-12 h-12 transition-transform duration-300 group-hover:scale-110">
              <Image
                src="/images/business/G.png"
                alt="Glister London Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-ivory tracking-wide">GLISTER LONDON</h1>
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
            
            {/* Collections with Submenu */}
            <div 
              className="relative"
              onMouseEnter={() => setActiveMenu('collections')}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <Link 
                href="/collections" 
                className="text-ivory hover:text-brass transition-colors duration-300 text-sm font-medium tracking-wide golden-underline flex items-center gap-1"
              >
                Collections
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              
              <AnimatePresence>
                {activeMenu === 'collections' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg shadow-2xl overflow-hidden"
                  >
                    {collectionsSubmenu.map((item, index) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-6 py-3 text-sm text-ivory hover:text-brass hover:bg-brass/10 transition-all duration-300 border-b border-brass/10 last:border-b-0"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Products with Submenu */}
            <div 
              className="relative"
              onMouseEnter={() => setActiveMenu('products')}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <Link 
                href="/products" 
                className="text-ivory hover:text-brass transition-colors duration-300 text-sm font-medium tracking-wide golden-underline flex items-center gap-1"
              >
                Products
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              
              <AnimatePresence>
                {activeMenu === 'products' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg shadow-2xl overflow-hidden"
                  >
                    {productsSubmenu.map((item, index) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-6 py-3 text-sm text-ivory hover:text-brass hover:bg-brass/10 transition-all duration-300 border-b border-brass/10 last:border-b-0"
                      >
                        {item.name}
                      </Link>
                    ))}
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
          </div>
          
          {/* Action Icons - Visible on Desktop */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Search Icon */}
            <button 
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

            {/* CTA Button */}
            <Link 
              href="/explore"
              className="px-6 py-2.5 bg-brass text-charcoal text-sm font-medium tracking-wide rounded-sm hover:bg-olive transition-all duration-300 hover:shadow-lg hover:shadow-brass/50"
            >
              Explore Collections
            </Link>
          </div>

          {/* Mobile Icons & Menu */}
          <div className="flex lg:hidden items-center gap-4">
            {/* Search Icon - Mobile */}
            <button 
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
              href="/favourites"
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
    </motion.nav>
  )
}

