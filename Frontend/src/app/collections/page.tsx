'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { collectionsApi } from '@/lib/api'
import type { Collection } from '@/types'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<'name' | 'productCount' | 'displayOrder'>('displayOrder')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    fetchCollections()
  }, [])

  const fetchCollections = async () => {
    try {
      setLoading(true)
      const data = await collectionsApi.getAll({ 
        isActive: true, 
        includeProductCount: true 
      })
      if (data && Array.isArray(data)) {
      setCollections(data)
      } else {
        setCollections([])
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error)
      setCollections([])
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort collections
  const filteredAndSortedCollections = collections
    .filter(collection => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        collection.name.toLowerCase().includes(query) ||
        collection.description?.toLowerCase().includes(query) ||
        collection.slug.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'productCount':
          return (b.productCount || 0) - (a.productCount || 0)
        case 'displayOrder':
        default:
          return a.displayOrder - b.displayOrder
      }
    })

  return (
    <div className="min-h-screen bg-ivory relative overflow-hidden">
      {/* Luxury Background Design */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Animated Gradient Orbs */}
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-brass/5 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-96 h-96 bg-charcoal/3 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-brass/4 rounded-full blur-3xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -60, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Subtle Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 69, 19, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 69, 19, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Decorative Lines */}
        <motion.div
          className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brass/10 to-transparent"
          animate={{
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <LuxuryNavigation />
      
      <main className="pt-24 pb-16 relative z-10">
        {/* Header Section */}
        <section className="bg-gradient-charcoal text-ivory py-8 relative overflow-hidden">
          {/* Header Background Animation */}
          <motion.div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(218, 165, 32, 0.3) 0%, transparent 50%),
                               radial-gradient(circle at 80% 50%, rgba(218, 165, 32, 0.2) 0%, transparent 50%)`,
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          
          <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold mb-2 tracking-wide">
                Our Collections
              </h1>
              <p className="text-base sm:text-lg text-brass tracking-luxury">
                Discover Curated Selections of Premium Products
              </p>
            </motion.div>
          </div>
        </section>

        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-6 sm:pt-8 pb-4 sm:pb-8">
          {/* Filters and Sort */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:max-w-md">
              <input
                type="text"
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-charcoal/70 whitespace-nowrap">Sort by:</label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as typeof sortOption)}
                className="px-3 py-2 text-sm bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all"
              >
                <option value="displayOrder">Default Order</option>
                <option value="name">Name A-Z</option>
                <option value="productCount">Most Products</option>
              </select>
            </div>
          </div>

          {/* Collections Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-10 h-10 border-3 border-brass border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <div className="text-charcoal/60 text-sm">Loading collections...</div>
              </div>
            </div>
          ) : filteredAndSortedCollections.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center px-4">
                <p className="text-charcoal/60 text-base sm:text-lg mb-4">
                  {searchQuery ? 'No collections found matching your search' : 'No collections available'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-brass hover:underline text-sm"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Advanced Luxury Magazine Index Layout */
            <div className="w-full max-w-6xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
              {/* Magazine-style header */}
              <div className="mb-12 sm:mb-16 pb-6 sm:pb-8 border-b-2 border-brass/20">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-charcoal/40 mb-2 font-mono">Index</p>
                    <h2 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-light text-charcoal tracking-tight">
                      Collections
                    </h2>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-charcoal/60 font-mono">
                      {filteredAndSortedCollections.length} {filteredAndSortedCollections.length === 1 ? 'Entry' : 'Entries'}
                    </p>
                  </div>
                </div>
                {/* Decorative divider line */}
                <div className="flex items-center gap-3 mt-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-brass/40 to-transparent"></div>
                  <div className="text-xs tracking-[0.3em] text-brass/60 font-mono">
                    {new Date().getFullYear()}
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-l from-brass/40 to-transparent"></div>
                </div>
              </div>

              {/* Collections List - Magazine Table of Contents Style */}
              <div className="space-y-0">
                {filteredAndSortedCollections.map((collection, index) => {
                  const isHovered = hoveredIndex === index

                  return (
                    <Link
                      key={collection._id}
                      href={`/collections/${collection.slug}`}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                        className="group relative"
                      >
                        {/* Hover background overlay */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity: isHovered ? 1 : 0,
                          }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0 bg-gradient-to-r from-brass/[0.02] via-brass/[0.04] to-brass/[0.02] pointer-events-none"
                        />

                        {/* Main Entry Row */}
                        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 py-6 sm:py-8 lg:py-10 border-b border-charcoal/10 group-hover:border-brass/30 transition-all duration-300">

                          {/* Left section: Number + Name (Mobile/Desktop) */}
                          <div className="flex items-start sm:items-center gap-4 sm:gap-6 flex-1 min-w-0">
                            {/* Display Order Number */}
                            <motion.div
                              animate={{
                                scale: isHovered ? 1.1 : 1,
                                opacity: isHovered ? 1 : 0.4,
                              }}
                              transition={{ duration: 0.3 }}
                              className="flex-shrink-0 w-12 sm:w-14 lg:w-16 relative"
                            >
                              <span className="text-3xl sm:text-4xl lg:text-5xl font-serif font-light text-charcoal/30 group-hover:text-brass/60 transition-colors duration-300 leading-none">
                                {String(collection.displayOrder).padStart(2, '0')}
                              </span>
                              {/* Decorative dot */}
                              <motion.div
                                animate={{
                                  scale: isHovered ? 1 : 0,
                                  opacity: isHovered ? 1 : 0,
                                }}
                                transition={{ duration: 0.2 }}
                                className="absolute -right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-brass rounded-full"
                              />
                            </motion.div>

                            {/* Collection Name & Details */}
                            <div className="flex-1 min-w-0">
                              {/* Name with arrow on same line for desktop */}
                              <div className="flex items-center gap-3 mb-1 sm:mb-2">
                                <h3 className="text-xl sm:text-2xl lg:text-4xl font-serif font-normal text-charcoal group-hover:text-brass transition-colors duration-300 tracking-tight">
                                  {collection.name}
                                </h3>
                                {/* Arrow - positioned after name, only desktop */}
                                <motion.div
                                  initial={{ opacity: 0, x: -5 }}
                                  animate={{
                                    opacity: isHovered ? 1 : 0,
                                    x: isHovered ? 0 : -5,
                                  }}
                                  transition={{ duration: 0.2 }}
                                  className="hidden lg:block flex-shrink-0"
                                >
                                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                  </svg>
                                </motion.div>
                              </div>

                              {/* Slug & metadata row */}
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                <span className="text-xs uppercase tracking-[0.2em] text-charcoal/30 font-mono">
                                  {collection.slug}
                                </span>
                                {collection.createdAt && (
                                  <>
                                    <span className="text-charcoal/20 hidden sm:inline">•</span>
                                    <span className="text-xs text-charcoal/30 font-mono hidden sm:inline">
                                      Est. {new Date(collection.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* Description - Shows on hover */}
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{
                                  height: isHovered ? 'auto' : 0,
                                  opacity: isHovered ? 1 : 0,
                                }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className="overflow-hidden"
                              >
                                {collection.description && (
                                  <div className="pt-2 sm:pt-3 pr-4">
                                    <p className="text-sm sm:text-base text-charcoal/70 leading-relaxed max-w-3xl italic border-l-2 border-brass/30 pl-4">
                                      {collection.description}
                                    </p>
                                  </div>
                                )}
                              </motion.div>
                            </div>
                          </div>

                          {/* Right section: Product Count */}
                          <div className="flex items-center justify-between sm:justify-end gap-4 pl-16 sm:pl-0">
                            <motion.div
                              animate={{
                                scale: isHovered ? 1.05 : 1,
                              }}
                              transition={{ duration: 0.3 }}
                              className="flex-shrink-0"
                            >
                              {collection.productCount !== undefined && (
                                <div className="flex items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0">
                                  <span className="text-2xl sm:text-3xl lg:text-4xl font-serif font-light text-brass leading-none">
                                    {collection.productCount}
                                  </span>
                                  <span className="text-xs uppercase tracking-[0.2em] text-charcoal/40 sm:mt-1 whitespace-nowrap">
                                    {collection.productCount === 1 ? 'Item' : 'Items'}
                                  </span>
                                </div>
                              )}
                            </motion.div>

                            {/* Arrow for mobile/tablet */}
                            <motion.div
                              initial={{ opacity: 0, x: -5 }}
                              animate={{
                                opacity: isHovered ? 1 : 0,
                                x: isHovered ? 0 : -5,
                              }}
                              transition={{ duration: 0.2 }}
                              className="lg:hidden flex-shrink-0"
                            >
                              <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                            </motion.div>
                          </div>
                        </div>

                        {/* Elegant accent line on hover */}
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{
                            scaleX: isHovered ? 1 : 0,
                          }}
                          transition={{ duration: 0.4, ease: 'easeInOut' }}
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brass/0 via-brass to-brass/0 origin-center"
                        />

                        {/* Corner accent marks on hover */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{
                            opacity: isHovered ? 0.3 : 0,
                            scale: isHovered ? 1 : 0.8,
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-brass/40" />
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-brass/40" />
                        </motion.div>
                      </motion.div>
                    </Link>
                  )
                })}
              </div>

              {/* Magazine footer */}
              <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-brass/20">
                <div className="flex items-center justify-between text-xs text-charcoal/40 font-mono">
                  <span className="uppercase tracking-[0.2em]">
                    End of Index
                  </span>
                  <span>
                    {filteredAndSortedCollections.length} {filteredAndSortedCollections.length === 1 ? 'Collection' : 'Collections'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Results Count */}
          {!loading && filteredAndSortedCollections.length > 0 && (
            <div className="mt-6 text-center text-sm text-charcoal/60">
              Showing {filteredAndSortedCollections.length} {filteredAndSortedCollections.length === 1 ? 'collection' : 'collections'}
            </div>
          )}
        </div>
      </main>

      <LuxuryFooter />
    </div>
  )
}

