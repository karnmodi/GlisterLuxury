'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const navItems = [
    { 
      name: 'Analytics', 
      href: '/admin/analytics',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      name: 'Products', 
      href: '/admin/products',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    { 
      name: 'Orders', 
      href: '/admin/orders',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    { 
      name: 'Categories', 
      href: '/admin/categories',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      )
    },
    { 
      name: 'Materials & Finishes', 
      href: '/admin/materials',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    { 
      name: 'FAQs', 
      href: '/admin/faqs',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory via-cream to-ivory/80">
      {/* Compact Admin Header */}
      <header className="bg-gradient-to-r from-charcoal via-charcoal to-charcoal/95 text-ivory shadow-lg border-b border-brass/30">
        <div className="w-full px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brass/20 backdrop-blur-sm flex items-center justify-center border border-brass/30 flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <Link href="/" className="group">
                  <h1 className="text-base sm:text-lg font-serif font-bold tracking-wide group-hover:text-brass transition-colors truncate">
                    GLISTER ADMIN
                  </h1>
                </Link>
                <p className="text-[10px] sm:text-xs text-brass/80 tracking-wide hidden sm:block">Product Management System</p>
              </div>
            </div>
            <Link
              href="/"
              className="group px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-brass to-brass/90 text-charcoal text-[10px] sm:text-xs font-semibold tracking-wide rounded-md hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-1 flex-shrink-0"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="hidden sm:inline">View Website</span>
              <span className="sm:hidden">Site</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Compact Admin Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-brass/20 sticky top-0 z-40 shadow-sm">
        <div className="w-full px-2 sm:px-3">
          <div className="flex gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-xs font-medium tracking-wide border-b-2 transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                  pathname === item.href
                    ? 'border-brass text-brass bg-brass/5'
                    : 'border-transparent text-charcoal/70 hover:text-brass hover:bg-brass/5'
                }`}
              >
                <span className={`transition-transform duration-300 ${pathname === item.href ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content with Modern Background */}
      <main className="w-full px-2 sm:px-4 py-2 sm:py-4">
        <div className="animate-fadeIn">
          {children}
        </div>
      </main>
    </div>
  )
}

