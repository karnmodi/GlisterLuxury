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
      name: 'Products', 
      href: '/admin/products',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    { 
      name: 'Categories', 
      href: '/admin/categories',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      )
    },
    { 
      name: 'Materials', 
      href: '/admin/materials',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    { 
      name: 'Finishes', 
      href: '/admin/finishes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      )
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory via-cream to-ivory/80">
      {/* Modern Admin Header */}
      <header className="bg-gradient-to-r from-charcoal via-charcoal to-charcoal/95 text-ivory shadow-2xl border-b border-brass/30">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-lg bg-brass/20 backdrop-blur-sm flex items-center justify-center border border-brass/30">
                <svg className="w-7 h-7 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <Link href="/" className="group">
                  <h1 className="text-2xl font-serif font-bold tracking-wide group-hover:text-brass transition-colors">
                    GLISTER ADMIN
                  </h1>
                </Link>
                <p className="text-sm text-brass/80 mt-0.5 tracking-wide">Product Management System</p>
              </div>
            </div>
            <Link
              href="/"
              className="group px-6 py-3 bg-gradient-to-r from-brass to-brass/90 text-charcoal text-sm font-semibold tracking-wide rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Website
            </Link>
          </div>
        </div>
      </header>

      {/* Modern Admin Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-brass/20 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-2 px-6 py-4 text-sm font-medium tracking-wide border-b-3 transition-all duration-300 ${
                  pathname === item.href
                    ? 'border-brass text-brass bg-brass/5'
                    : 'border-transparent text-charcoal/70 hover:text-brass hover:bg-brass/5'
                }`}
              >
                <span className={`transition-transform duration-300 ${pathname === item.href ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content with Modern Background */}
      <main className="container mx-auto px-6 py-8">
        <div className="animate-fadeIn">
          {children}
        </div>
      </main>
    </div>
  )
}

