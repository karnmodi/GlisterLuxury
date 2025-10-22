'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const navItems = [
    { name: 'Products', href: '/admin/products' },
    { name: 'Categories', href: '/admin/categories' },
    { name: 'Materials', href: '/admin/materials' },
    { name: 'Finishes', href: '/admin/finishes' },
  ]

  return (
    <div className="min-h-screen bg-ivory">
      {/* Admin Header */}
      <header className="bg-charcoal text-ivory shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="flex items-center gap-3 group">
                <h1 className="text-2xl font-serif font-bold tracking-wide">GLISTER ADMIN</h1>
              </Link>
              <p className="text-sm text-brass mt-1">Product Management System</p>
            </div>
            <Link
              href="/"
              className="px-6 py-2.5 bg-brass text-charcoal text-sm font-medium tracking-wide rounded-sm hover:bg-olive transition-all duration-300"
            >
              View Site
            </Link>
          </div>
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="bg-white border-b border-brass/20">
        <div className="container mx-auto px-6">
          <div className="flex gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`py-4 text-sm font-medium tracking-wide border-b-2 transition-colors duration-300 ${
                  pathname === item.href
                    ? 'border-brass text-brass'
                    : 'border-transparent text-charcoal hover:text-brass'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}

