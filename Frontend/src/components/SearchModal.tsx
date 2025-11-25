'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions'
import Image from 'next/image'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const { products, categories, subcategories, isLoading, error } = useSearchSuggestions(
    searchQuery,
    isOpen
  )

  // Calculate total suggestions count
  const totalSuggestions = categories.length + subcategories.length + products.length
  const hasResults = totalSuggestions > 0

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setSelectedIndex(-1)
    }
  }, [isOpen])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
      onClose()
    }
  }

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/products?category=${categoryId}`)
    onClose()
  }

  const handleSubcategoryClick = (categoryId: string, subcategoryId: string) => {
    router.push(`/products?category=${categoryId}&subcategory=${subcategoryId}`)
    onClose()
  }

  const handleProductClick = (productId: string) => {
    router.push(`/products/${productId}`)
    onClose()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!hasResults) {
      if (e.key === 'Enter') {
        handleSearch()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < totalSuggestions - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex === -1) {
          handleSearch()
        } else {
          handleSelectSuggestion(selectedIndex)
        }
        break
    }
  }

  const handleSelectSuggestion = (index: number) => {
    let currentIndex = 0

    // Check categories
    if (index < categories.length) {
      handleCategoryClick(categories[index]._id)
      return
    }
    currentIndex += categories.length

    // Check subcategories
    if (index < currentIndex + subcategories.length) {
      const subIndex = index - currentIndex
      const subcategory = subcategories[subIndex]
      handleSubcategoryClick(subcategory.categoryId!, subcategory._id)
      return
    }
    currentIndex += subcategories.length

    // Check products
    if (index < currentIndex + products.length) {
      const prodIndex = index - currentIndex
      handleProductClick(products[prodIndex]._id)
      return
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="relative border-b border-gray-200">
                <svg className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search products, categories..."
                  className="w-full py-5 pl-14 pr-14 text-lg bg-transparent focus:outline-none text-gray-900 placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {isLoading && (
                  <div className="absolute right-5 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Suggestions */}
              <div
                ref={suggestionsRef}
                className="max-h-[60vh] overflow-y-auto overscroll-contain"
              >
                {error && (
                  <div className="p-8 text-center">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}

                {!error && searchQuery && !isLoading && !hasResults && (
                  <div className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-500 mb-4">
                      We couldn&apos;t find anything matching &quot;{searchQuery}&quot;
                    </p>
                    <button
                      onClick={handleSearch}
                      className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Search anyway
                    </button>
                  </div>
                )}

                {!error && hasResults && (
                  <div className="py-4">
                    {/* Categories */}
                    {categories.length > 0 && (
                      <div className="mb-4">
                        <div className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Categories
                        </div>
                        {categories.map((category, index) => {
                          const isSelected = selectedIndex === index
                          return (
                            <button
                              key={category._id}
                              onClick={() => handleCategoryClick(category._id)}
                              className={`w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                                isSelected ? 'bg-gray-100' : ''
                              }`}
                            >
                              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-medium text-gray-900">{category.name}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Subcategories */}
                    {subcategories.length > 0 && (
                      <div className="mb-4">
                        <div className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Subcategories
                        </div>
                        {subcategories.map((subcategory, index) => {
                          const globalIndex = categories.length + index
                          const isSelected = selectedIndex === globalIndex
                          return (
                            <button
                              key={subcategory._id}
                              onClick={() =>
                                handleSubcategoryClick(subcategory.categoryId!, subcategory._id)
                              }
                              className={`w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                                isSelected ? 'bg-gray-100' : ''
                              }`}
                            >
                              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h8M12 8v8" opacity="0.5" />
                                </svg>
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-medium text-gray-900">{subcategory.name}</p>
                                {subcategory.categoryName && (
                                  <p className="text-sm text-gray-500">{subcategory.categoryName}</p>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Products */}
                    {products.length > 0 && (
                      <div>
                        <div className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Products
                        </div>
                        {products.map((product, index) => {
                          const globalIndex = categories.length + subcategories.length + index
                          const isSelected = selectedIndex === globalIndex
                          return (
                            <button
                              key={product._id}
                              onClick={() => handleProductClick(product._id)}
                              className={`w-full px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors ${
                                isSelected ? 'bg-gray-100' : ''
                              }`}
                            >
                              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
                                {product.thumbnailImage ? (
                                  <Image
                                    src={product.thumbnailImage}
                                    alt={product.name}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                                <p className="text-sm text-gray-500 line-clamp-1">
                                  {product.productID}
                                </p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Empty state when no query */}
                {!searchQuery && !isLoading && (
                  <div className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Search Products</h3>
                    <p className="text-gray-500">
                      Start typing to search for products, categories, or subcategories
                    </p>
                  </div>
                )}
              </div>

              {/* Footer hint */}
              {hasResults && (
                <div className="border-t border-gray-200 px-5 py-3 bg-gray-50">
                  <p className="text-xs text-gray-500 text-center">
                    Use <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">↑</kbd>{' '}
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">↓</kbd> to navigate,{' '}
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">Enter</kbd> to select,{' '}
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">Esc</kbd> to close
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
