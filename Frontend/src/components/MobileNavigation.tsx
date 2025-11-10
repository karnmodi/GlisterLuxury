'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useCategories } from '@/contexts/CategoriesContext'
import { collectionsApi } from '@/lib/api'
import type { Category, Collection } from '@/types'

export default function MobileNavigation() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { categories, loading: categoriesLoading } = useCategories()
  const [collections, setCollections] = useState<Collection[]>([])
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [expandedCollection, setExpandedCollection] = useState<string | null>(null)
  const [collectionsWithProducts, setCollectionsWithProducts] = useState<Set<string>>(new Set())
  const { user, isAuthenticated } = useAuth()

  const closeMenu = () => setIsOpen(false)

  // Fetch collections - categories are now provided by CategoriesContext
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const collectionsData = await collectionsApi.getAll({ isActive: true, includeProductCount: true })
        
        if (collectionsData && Array.isArray(collectionsData)) {
          const sortedCollections = collectionsData.sort((a, b) => a.displayOrder - b.displayOrder)
          setCollections(sortedCollections)
          
          // Track collections with products
          const collectionSet = new Set<string>()
          collectionsData.forEach((collection: Collection) => {
            if (collection.productCount && collection.productCount > 0) {
              collectionSet.add(collection._id)
            }
          })
          
          setCollectionsWithProducts(collectionSet)
        } else {
          setCollections([])
          setCollectionsWithProducts(new Set())
        }
      } catch (error) {
        console.error('Failed to fetch collections:', error)
        setCollections([])
        setCollectionsWithProducts(new Set())
      }
    }
    fetchCollections()
  }, [])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
  }

  const toggleCollection = (collectionId: string) => {
    setExpandedCollection(expandedCollection === collectionId ? null : collectionId)
  }

  // Filter collections to only show those with products
  const filteredCollections = collections.filter(collection => 
    collectionsWithProducts.has(collection._id)
  )

  return (
    <div className="lg:hidden">
      {/* Mobile Menu Button */}
      <button 
        className="text-ivory hover:text-brass p-2 transition-colors duration-300 z-50 relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle mobile menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Full Screen Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay - Full Screen */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999]" 
              onClick={closeMenu}
            />

            {/* Sidebar Panel - Right Hand Side */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-screen w-[320px] max-w-[85vw] bg-gradient-to-br from-charcoal via-zinc-900 to-charcoal shadow-2xl z-[10000]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative Border */}
              <div className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-transparent via-brass to-transparent opacity-50" />

              {/* Scrollable Content Container */}
              <div className="h-full overflow-y-auto overflow-x-hidden">
                <div className="flex flex-col min-h-full p-6">
                  
                  {/* Header Section */}
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-brass/20">
                    <div className="flex items-center space-x-3">
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <Image
                          src="/images/business/G.png"
                          alt="Glister London"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="text-ivory font-serif font-bold text-sm tracking-wide">GLISTER LONDON</h3>
                        <p className="text-brass text-xs">The Soul of Interior</p>
                      </div>
                    </div>
                    
                    {/* Close Button */}
                    <button 
                      className="text-ivory hover:text-brass transition-colors duration-300 p-1"
                      onClick={closeMenu}
                      aria-label="Close menu"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Navigation Menu */}
                  <nav className="flex-1 space-y-1">

                    {/* Admin Panel Button - Show only for admin users */}
                    {isAuthenticated && user?.role === 'admin' && (
                      <Link
                        href="/admin/products"
                        className="block w-full px-4 py-3 mb-3 bg-gradient-to-r from-brass to-olive text-charcoal text-center font-semibold tracking-wide rounded-sm hover:shadow-lg hover:shadow-brass/50 transition-all duration-300 border-2 border-brass"
                        onClick={closeMenu}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Admin Panel
                        </span>
                      </Link>
                    )}

                    {/* About Link */}
                    <Link
                      href="/about"
                      className="block text-base font-medium text-ivory hover:text-brass hover:bg-brass/5 transition-all duration-300 py-3 px-4 rounded-sm border-b border-brass/10"
                      onClick={closeMenu}
                    >
                      About
                    </Link>

                    {/* Products Section - Dynamic Categories */}
                    <div className="border-b border-brass/10">
                      <Link
                        href="/products"
                        className="block text-base font-semibold text-ivory py-3 px-4 hover:text-brass hover:bg-brass/5 transition-all duration-300"
                        onClick={(e) => {
                          e.preventDefault()
                          router.push('/products')
                          closeMenu()
                        }}
                      >
                        Products
                      </Link>
                      <div className="space-y-1 pb-2">
                        {categoriesLoading ? (
                          <div className="px-4 py-2 text-sm text-ivory/50 ml-4">
                            Loading categories...
                          </div>
                        ) : categories.length > 0 ? (
                          // Backend already filters to only show categories/subcategories with products
                          categories.map((category) => {
                              // Subcategories are already filtered by backend
                              const filteredSubcategories = category.subcategories || []

                              return (
                                <div key={category._id}>
                                  {/* Category with toggle */}
                                  <div className="flex items-center justify-between">
                                    <Link
                                      href={`/products?category=${category._id}`}
                                      className="flex-1 block text-sm text-brass font-medium hover:bg-brass/5 transition-all duration-300 py-2 px-4 ml-4 rounded-sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        closeMenu()
                                      }}
                                    >
                                      {category.name}
                                    </Link>
                                    {filteredSubcategories.length > 0 && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          toggleCategory(category._id)
                                        }}
                                        className="px-3 py-2 text-ivory hover:text-brass transition-colors duration-300"
                                        aria-label={`Toggle ${category.name} subcategories`}
                                      >
                                        <svg
                                          className={`w-4 h-4 transition-transform duration-300 ${
                                            expandedCategory === category._id ? 'rotate-180' : ''
                                          }`}
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>

                                  {/* Subcategories - Expandable (only show those with products) */}
                                  {filteredSubcategories.length > 0 && (
                                    <AnimatePresence>
                                      {expandedCategory === category._id && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="overflow-hidden"
                                        >
                                          {filteredSubcategories.map((subcategory) => {
                                            const params = new URLSearchParams({
                                              category: category._id,
                                              subcategory: subcategory._id
                                            })
                                            return (
                                            <Link
                                              key={subcategory._id}
                                              href={`/products?${params.toString()}`}
                                              className="block text-sm text-ivory/70 hover:text-brass hover:bg-brass/5 transition-all duration-300 py-2 px-4 ml-12 rounded-sm"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                closeMenu()
                                              }}
                                            >
                                              {subcategory.name}
                                            </Link>
                                            )
                                          })}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  )}
                                </div>
                              )
                            })
                        ) : (
                          <div className="px-4 py-2 text-sm text-ivory/50 ml-4">
                            Loading categories...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Finishes Link */}
                    <Link 
                      href="/finishes" 
                      className="block text-base font-medium text-ivory hover:text-brass hover:bg-brass/5 transition-all duration-300 py-3 px-4 rounded-sm border-b border-brass/10" 
                      onClick={closeMenu}
                    >
                      Finishes
                    </Link>
                    
                    {/* Contact Link */}
                    <Link 
                      href="/contact" 
                      className="block text-base font-medium text-ivory hover:text-brass hover:bg-brass/5 transition-all duration-300 py-3 px-4 rounded-sm border-b border-brass/10" 
                      onClick={closeMenu}
                    >
                      Contact
                    </Link>
                  </nav>

                  {/* Explore Collections Section at Bottom */}
                  <div className="mt-auto pt-6 border-t border-brass/20">
                    {filteredCollections.length > 0 ? (
                      <div className="space-y-2">
                        {/* Explore Collections Toggle Button */}
                        <button
                          onClick={() => toggleCollection('explore-collections')}
                          className="w-full px-6 py-4 bg-brass text-charcoal text-center font-semibold tracking-wide rounded-sm hover:bg-olive transition-all duration-300 shadow-lg hover:shadow-brass/50 flex items-center justify-center gap-2"
                        >
                          Explore Collections
                          <svg
                            className={`w-5 h-5 transition-transform duration-300 ${
                              expandedCollection === 'explore-collections' ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Expandable Collections List */}
                        <AnimatePresence>
                          {expandedCollection === 'explore-collections' && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden bg-charcoal/50 rounded-sm border border-brass/20"
                            >
                              <div className="py-2">
                                {filteredCollections.slice(0, 4).map((collection) => (
                                  <Link
                                    key={collection._id}
                                    href={`/collections/${collection.slug}`}
                                    className="block px-6 py-3 text-sm text-brass font-medium hover:bg-brass/10 transition-all duration-300"
                                    onClick={closeMenu}
                                  >
                                    {collection.name}
                                    {collection.productCount !== undefined && (
                                      <span className="ml-2 text-xs text-ivory/60">({collection.productCount})</span>
                                    )}
                                  </Link>
                                ))}
                                <Link
                                  href="/collections"
                                  className="block px-6 py-3 text-sm text-olive font-semibold hover:bg-brass/10 transition-all duration-300 border-t border-brass/20"
                                  onClick={closeMenu}
                                >
                                  View All Collections →
                                </Link>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link 
                        href="/collections"
                        className="block w-full px-6 py-4 bg-brass text-charcoal text-center font-semibold tracking-wide rounded-sm hover:bg-olive transition-all duration-300 shadow-lg hover:shadow-brass/50"
                        onClick={closeMenu}
                      >
                        Explore Collections
                      </Link>
                    )}
                    
                    {/* Decorative Element */}
                    <div className="mt-6 text-center">
                      <div className="inline-block w-16 h-[2px] bg-gradient-to-r from-transparent via-brass/50 to-transparent" />
                    </div>
                  </div>

                </div>
              </div>

              {/* Corner Accents */}
              <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-brass/30 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-brass/30 pointer-events-none" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
