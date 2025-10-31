'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function LuxuryFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-charcoal relative overflow-hidden">
      {/* Thin golden line at top */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-brass to-transparent" />

      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-brass/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-olive/5 rounded-full blur-3xl" />

      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-20 relative z-10">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6 group">
              <div className="relative w-12 h-12 transition-transform duration-300 group-hover:scale-110">
                <Image
                  src="/images/business/G.png"
                  alt="Glister London Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-ivory tracking-wide">GLISTER LONDON</h3>
                <p className="text-xs text-brass tracking-luxury">The Soul of Interior</p>
              </div>
            </div>
            <p className="text-ivory/70 leading-relaxed mb-6">
              Crafting the finest solid brass hardware and interior accessories since 2025.
            </p>
            
            {/* Social Media */}
            <div className="flex space-x-4">
              {[
                { name: 'Instagram', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
                { name: 'Facebook', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
                { name: 'LinkedIn', icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' }
              ].map((social, index) => (
                <motion.a
                  key={social.name}
                  href="#"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-ivory/50 hover:text-brass transition-all duration-300 group"
                  aria-label={social.name}
                >
                  <svg className="w-6 h-6 glow-brass-hover" fill="currentColor" viewBox="0 0 24 24">
                    <path d={social.icon} />
                  </svg>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-ivory font-semibold mb-6 tracking-wide">Products</h4>
            <ul className="space-y-3">
              {['Cabinet Hardware', 'Bathroom Accessories', 'Mortise Handles', 'Sockets & Switches', 'Interior Accessories'].map((item) => (
                <li key={item}>
                  <Link 
                    href={`/products/${item.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-ivory/70 hover:text-brass transition-colors duration-300 golden-underline text-sm"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-ivory font-semibold mb-6 tracking-wide">Company</h4>
            <ul className="space-y-3">
              {['About Us', 'Our Story', 'Sustainability', 'Craftsmanship', 'Trade Program'].map((item) => (
                <li key={item}>
                  <Link 
                    href={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-ivory/70 hover:text-brass transition-colors duration-300 golden-underline text-sm"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-ivory font-semibold mb-6 tracking-wide">Support</h4>
            <ul className="space-y-3">
              {['Contact Us', 'FAQs', 'Finishes & Samples', 'Delivery', 'Returns', 'Care Guide'].map((item) => (
                <li key={item}>
                  <Link 
                    href={item === 'FAQs' ? '/faqs' : `/${item.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-ivory/70 hover:text-brass transition-colors duration-300 golden-underline text-sm"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-brass/30 to-transparent mb-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-ivory/50 text-sm">
            © {currentYear} Glister London. All rights reserved.
          </p>
          
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-ivory/50 hover:text-brass transition-colors duration-300">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-ivory/50 hover:text-brass transition-colors duration-300">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-ivory/50 hover:text-brass transition-colors duration-300">
              Cookie Policy
            </Link>
          </div>
        </div>

        {/* Embossed Logo Mark */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          transition={{ duration: 2 }}
          className="absolute bottom-10 right-10 pointer-events-none"
        >
          <div className="relative w-96 h-96">
            <Image
              src="/images/business/G.png"
              alt="Glister London Logo"
              fill
              className="object-contain"
            />
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

