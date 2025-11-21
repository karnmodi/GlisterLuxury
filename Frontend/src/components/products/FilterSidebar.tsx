'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Input from '../ui/Input'
import type { Category, Finish, MaterialMaster } from '@/types'

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'productid-asc' | 'productid-desc' | 'price-asc' | 'price-desc'

interface FilterSidebarProps {
  // State values
  searchQuery: string
  selectedCategory: string
  selectedSubcategory: string
  selectedMaterial: string
  selectedFinish: string
  hasSize: boolean
  hasDiscount: boolean
  sortOption: SortOption
  groupByCategory?: boolean

  // Change handlers
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onSubcategoryChange: (value: string) => void
  onMaterialChange: (value: string) => void
  onFinishChange: (value: string) => void
  onHasSizeChange: (value: boolean) => void
  onHasDiscountChange: (value: boolean) => void
  onSortChange: (value: SortOption) => void
  onGroupByCategoryChange?: (value: boolean) => void
  onClearFilters: () => void

  // Data
  categories: Category[]
  materials: MaterialMaster[]
  finishes: Finish[]
  availableSubcategories: any[]

  // UI state
  mobileOpen: boolean
  onMobileClose: () => void
  sidebarRef: React.RefObject<HTMLDivElement>
  sidebarTop: number
  useStaticPositioning?: boolean

  // Display options
  activeFilterCount: number
  showGroupToggle?: boolean
  debouncedSearchQuery?: string
}

export default function FilterSidebar({
  searchQuery,
  selectedCategory,
  selectedSubcategory,
  selectedMaterial,
  selectedFinish,
  hasSize,
  hasDiscount,
  sortOption,
  groupByCategory = false,
  onSearchChange,
  onCategoryChange,
  onSubcategoryChange,
  onMaterialChange,
  onFinishChange,
  onHasSizeChange,
  onHasDiscountChange,
  onSortChange,
  onGroupByCategoryChange,
  onClearFilters,
  categories,
  materials,
  finishes,
  availableSubcategories,
  mobileOpen,
  onMobileClose,
  sidebarRef,
  sidebarTop,
  useStaticPositioning = false,
  activeFilterCount,
  showGroupToggle = false,
  debouncedSearchQuery,
}: FilterSidebarProps) {
  // Helper to get category name by ID
  const getCategoryName = (id: string) => {
    return (categories || []).find(c => c._id === id)?.name || id
  }

  // Helper to get subcategory name by ID
  const getSubcategoryName = (id: string) => {
    return (availableSubcategories || []).find((s: any) => s._id === id)?.name || id
  }

  // Helper to get finish name by ID
  const getFinishName = (id: string) => {
    return (finishes || []).find(f => f._id === id)?.name || id
  }

  // Filter content component (reused in mobile and desktop)
  const FilterContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`${isMobile ? 'p-4 sm:p-6 pb-24' : 'p-6'} space-y-5 sm:space-y-6`}>
      {activeFilterCount > 0 && (
        <p className="text-sm text-charcoal/60 mb-2">
          {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
        </p>
      )}

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-2.5">
          Search Products
        </label>
        <Input
          placeholder="Search by name, ID..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`w-full ${isMobile ? 'min-h-[44px] text-base' : ''}`}
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-2.5">
          Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={`w-full px-3 ${isMobile ? 'sm:px-4' : ''} py-${isMobile ? '3' : '2'} text-sm ${isMobile ? 'sm:text-base' : ''} bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all ${isMobile ? 'min-h-[44px]' : ''}`}
        >
          <option value="">All Categories</option>
          {(categories || []).map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subcategory */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-2.5">
          Subcategory
        </label>
        <select
          value={selectedSubcategory}
          onChange={(e) => onSubcategoryChange(e.target.value)}
          disabled={!selectedCategory || availableSubcategories.length === 0}
          className={`w-full px-3 ${isMobile ? 'sm:px-4' : ''} py-${isMobile ? '3' : '2'} text-sm ${isMobile ? 'sm:text-base' : ''} bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isMobile ? 'min-h-[44px]' : ''}`}
        >
          <option value="">All Subcategories</option>
          {availableSubcategories.map((sub: any) => (
            <option key={sub._id} value={sub._id}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>

      {/* Material */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-2.5">
          Material
        </label>
        <select
          value={selectedMaterial}
          onChange={(e) => onMaterialChange(e.target.value)}
          className={`w-full px-3 ${isMobile ? 'sm:px-4' : ''} py-${isMobile ? '3' : '2'} text-sm ${isMobile ? 'sm:text-base' : ''} bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all ${isMobile ? 'min-h-[44px]' : ''}`}
        >
          <option value="">All Materials</option>
          {(materials || []).map((mat) => (
            <option key={mat._id} value={mat.name}>
              {mat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Finish */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-2.5">
          Finish
        </label>
        <select
          value={selectedFinish}
          onChange={(e) => onFinishChange(e.target.value)}
          className={`w-full px-3 ${isMobile ? 'sm:px-4' : ''} py-${isMobile ? '3' : '2'} text-sm ${isMobile ? 'sm:text-base' : ''} bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all ${isMobile ? 'min-h-[44px]' : ''}`}
        >
          <option value="">All Finishes</option>
          {(finishes || []).map((fin) => (
            <option key={fin._id} value={fin._id}>
              {fin.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-sm font-medium text-charcoal mb-2.5">
          Sort By
        </label>
        <select
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className={`w-full px-3 ${isMobile ? 'sm:px-4' : ''} py-${isMobile ? '3' : '2'} text-sm ${isMobile ? 'sm:text-base' : ''} bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all ${isMobile ? 'min-h-[44px]' : ''}`}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="productid-asc">Product ID A-Z</option>
          <option value="productid-desc">Product ID Z-A</option>
          <option value="price-asc">Price Low-High</option>
          <option value="price-desc">Price High-Low</option>
        </select>
      </div>

      {/* Toggle Filters */}
      <div className={`space-y-${isMobile ? '4' : '3'} border-t border-brass/20 pt-${isMobile ? '4 sm:pt-5' : '4'}`}>
        <label className={`flex items-center gap-3 cursor-pointer group ${isMobile ? 'min-h-[44px]' : ''}`}>
          <input
            type="checkbox"
            checked={hasSize}
            onChange={(e) => onHasSizeChange(e.target.checked)}
            className={`w-${isMobile ? '6' : '5'} h-${isMobile ? '6' : '5'} text-brass border-brass/30 rounded focus:ring-brass transition-all group-hover:border-brass ${isMobile ? 'flex-shrink-0' : ''}`}
          />
          <span className={`text-sm ${isMobile ? 'sm:text-base' : ''} text-charcoal group-hover:text-brass transition-colors`}>
            Has Size Options
          </span>
        </label>

        <label className={`flex items-center gap-3 cursor-pointer group ${isMobile ? 'min-h-[44px]' : ''}`}>
          <input
            type="checkbox"
            checked={hasDiscount}
            onChange={(e) => onHasDiscountChange(e.target.checked)}
            className={`w-${isMobile ? '6' : '5'} h-${isMobile ? '6' : '5'} text-brass border-brass/30 rounded focus:ring-brass transition-all group-hover:border-brass ${isMobile ? 'flex-shrink-0' : ''}`}
          />
          <span className={`text-sm ${isMobile ? 'sm:text-base' : ''} text-charcoal group-hover:text-brass transition-colors`}>
            Discounted Items
          </span>
        </label>
      </div>

      {/* Group by Category Toggle */}
      {showGroupToggle && onGroupByCategoryChange && (
        <div className={`border-t border-brass/20 pt-${isMobile ? '4 sm:pt-5' : '4'}`}>
          <label className={`flex items-center gap-3 cursor-pointer group ${isMobile ? 'min-h-[44px]' : ''}`}>
            <input
              type="checkbox"
              checked={groupByCategory}
              onChange={(e) => onGroupByCategoryChange(e.target.checked)}
              className={`w-${isMobile ? '6' : '5'} h-${isMobile ? '6' : '5'} text-brass border-brass/30 rounded focus:ring-brass transition-all group-hover:border-brass ${isMobile ? 'flex-shrink-0' : ''}`}
            />
            <span className={`text-sm ${isMobile ? 'sm:text-base' : ''} font-medium text-charcoal group-hover:text-brass transition-colors`}>
              Group by Category
            </span>
          </label>
        </div>
      )}

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <div className={`border-t border-brass/20 pt-${isMobile ? '4 sm:pt-5' : '4'}`}>
          <button
            onClick={() => {
              onClearFilters()
              if (isMobile) onMobileClose()
            }}
            className={`w-full px-4 py-${isMobile ? '3' : '2.5'} ${isMobile ? 'min-h-[44px]' : ''} bg-brass/10 hover:bg-brass/20 text-brass border border-brass/40 rounded-sm text-sm ${isMobile ? 'sm:text-base' : ''} font-medium transition-all duration-200 flex items-center justify-center gap-2 group`}
          >
            <svg className={`w-4 h-4 ${isMobile ? 'sm:w-5 sm:h-5' : ''} group-hover:rotate-90 transition-transform duration-200`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear All Filters
            <span className={`bg-brass/20 px-${isMobile ? '2' : '1.5'} py-0.5 rounded text-xs ${isMobile ? 'sm:text-sm' : ''} font-semibold`}>
              {activeFilterCount}
            </span>
          </button>
        </div>
      )}

      {/* Active Filter Badges */}
      {(selectedCategory || selectedSubcategory || (debouncedSearchQuery || searchQuery) || selectedMaterial || selectedFinish || hasSize || hasDiscount) && (
        <div className={`border-t border-brass/20 pt-${isMobile ? '4 sm:pt-5' : '4'}`}>
          <p className="text-xs font-medium text-charcoal/60 mb-${isMobile ? '3' : '2'}">Active Filters:</p>
          <div className="flex flex-wrap gap-2">
            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 px-${isMobile ? '3' : '2'} py-${isMobile ? '1.5' : '1'} bg-brass/10 text-brass text-xs ${isMobile ? 'sm:text-sm' : ''} rounded-full border border-brass/30">
                <span className={isMobile ? 'truncate max-w-[150px]' : ''}>{getCategoryName(selectedCategory)}</span>
                <button
                  onClick={() => {
                    onCategoryChange('')
                    onSubcategoryChange('')
                  }}
                  className={`hover:text-charcoal transition-colors ${isMobile ? 'min-w-[20px] min-h-[20px] flex items-center justify-center' : ''}`}
                  aria-label="Remove category filter"
                >
                  ×
                </button>
              </span>
            )}
            {selectedSubcategory && (
              <span className="inline-flex items-center gap-1.5 px-${isMobile ? '3' : '2'} py-${isMobile ? '1.5' : '1'} bg-brass/10 text-brass text-xs ${isMobile ? 'sm:text-sm' : ''} rounded-full border border-brass/30">
                <span className={isMobile ? 'truncate max-w-[150px]' : ''}>{getSubcategoryName(selectedSubcategory)}</span>
                <button
                  onClick={() => onSubcategoryChange('')}
                  className={`hover:text-charcoal transition-colors ${isMobile ? 'min-w-[20px] min-h-[20px] flex items-center justify-center' : ''}`}
                  aria-label="Remove subcategory filter"
                >
                  ×
                </button>
              </span>
            )}
            {(debouncedSearchQuery || searchQuery) && (
              <span className="inline-flex items-center gap-1.5 px-${isMobile ? '3' : '2'} py-${isMobile ? '1.5' : '1'} bg-brass/10 text-brass text-xs ${isMobile ? 'sm:text-sm' : ''} rounded-full border border-brass/30">
                <span className={isMobile ? 'truncate max-w-[150px]' : ''}>"{debouncedSearchQuery || searchQuery}"</span>
                <button
                  onClick={() => onSearchChange('')}
                  className={`hover:text-charcoal transition-colors ${isMobile ? 'min-w-[20px] min-h-[20px] flex items-center justify-center' : ''}`}
                  aria-label="Remove search filter"
                >
                  ×
                </button>
              </span>
            )}
            {selectedMaterial && (
              <span className="inline-flex items-center gap-1.5 px-${isMobile ? '3' : '2'} py-${isMobile ? '1.5' : '1'} bg-brass/10 text-brass text-xs ${isMobile ? 'sm:text-sm' : ''} rounded-full border border-brass/30">
                <span className={isMobile ? 'truncate max-w-[150px]' : ''}>{selectedMaterial}</span>
                <button
                  onClick={() => onMaterialChange('')}
                  className={`hover:text-charcoal transition-colors ${isMobile ? 'min-w-[20px] min-h-[20px] flex items-center justify-center' : ''}`}
                  aria-label="Remove material filter"
                >
                  ×
                </button>
              </span>
            )}
            {selectedFinish && (
              <span className="inline-flex items-center gap-1.5 px-${isMobile ? '3' : '2'} py-${isMobile ? '1.5' : '1'} bg-brass/10 text-brass text-xs ${isMobile ? 'sm:text-sm' : ''} rounded-full border border-brass/30">
                <span className={isMobile ? 'truncate max-w-[150px]' : ''}>{getFinishName(selectedFinish)}</span>
                <button
                  onClick={() => onFinishChange('')}
                  className={`hover:text-charcoal transition-colors ${isMobile ? 'min-w-[20px] min-h-[20px] flex items-center justify-center' : ''}`}
                  aria-label="Remove finish filter"
                >
                  ×
                </button>
              </span>
            )}
            {hasSize && (
              <span className="inline-flex items-center gap-1.5 px-${isMobile ? '3' : '2'} py-${isMobile ? '1.5' : '1'} bg-brass/10 text-brass text-xs ${isMobile ? 'sm:text-sm' : ''} rounded-full border border-brass/30">
                Size Options
                <button
                  onClick={() => onHasSizeChange(false)}
                  className={`hover:text-charcoal transition-colors ${isMobile ? 'min-w-[20px] min-h-[20px] flex items-center justify-center' : ''}`}
                  aria-label="Remove size filter"
                >
                  ×
                </button>
              </span>
            )}
            {hasDiscount && (
              <span className="inline-flex items-center gap-1.5 px-${isMobile ? '3' : '2'} py-${isMobile ? '1.5' : '1'} bg-brass/10 text-brass text-xs ${isMobile ? 'sm:text-sm' : ''} rounded-full border border-brass/30">
                Discounted
                <button
                  onClick={() => onHasDiscountChange(false)}
                  className={`hover:text-charcoal transition-colors ${isMobile ? 'min-w-[20px] min-h-[20px] flex items-center justify-center' : ''}`}
                  aria-label="Remove discount filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile Filters Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-[9997] lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-[80px] h-[calc(100vh-80px)] w-full max-w-[min(380px,90vw)] bg-white shadow-2xl z-[9998] lg:hidden overflow-y-auto filter-sidebar"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(218, 165, 32, 0.3) transparent',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }}
            >
              <style dangerouslySetInnerHTML={{
                __html: `
                  .filter-sidebar::-webkit-scrollbar {
                    width: 6px;
                  }
                  .filter-sidebar::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  .filter-sidebar::-webkit-scrollbar-thumb {
                    background: rgba(218, 165, 32, 0.3);
                    border-radius: 3px;
                  }
                  .filter-sidebar::-webkit-scrollbar-thumb:hover {
                    background: rgba(218, 165, 32, 0.5);
                  }
                `
              }} />
              <div className="sticky top-0 bg-white border-b border-brass/20 p-4 sm:p-5 flex items-center justify-between z-10">
                <h2 className="text-lg sm:text-xl font-serif font-semibold text-charcoal flex items-center gap-2">
                  <span className="w-1 h-6 bg-brass"></span>
                  Filters
                </h2>
                <button
                  onClick={onMobileClose}
                  className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-brass/10 rounded-full transition-colors"
                  aria-label="Close filters"
                >
                  <svg className="w-6 h-6 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <FilterContent isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - Floating Card */}
      <aside
        ref={sidebarRef}
        className={`hidden lg:block filter-sidebar w-72 lg:w-80 flex-shrink-0 ${useStaticPositioning ? 'relative' : 'fixed z-30'} overflow-y-auto pr-2`}
        style={useStaticPositioning ? {
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(218, 165, 32, 0.3) transparent',
        } : {
          top: `${sidebarTop}px`,
          left: 'calc((100vw - min(1920px, 100vw)) / 2 + 2rem)',
          maxHeight: 'calc(100vh - 160px)',
          transition: 'top 0.3s ease-out',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(218, 165, 32, 0.3) transparent',
        }}
        onScroll={(e) => {
          e.stopPropagation()
        }}
      >
        <style dangerouslySetInnerHTML={{
          __html: `
            .filter-sidebar::-webkit-scrollbar {
              width: 6px;
            }
            .filter-sidebar::-webkit-scrollbar-track {
              background: transparent;
            }
            .filter-sidebar::-webkit-scrollbar-thumb {
              background: rgba(218, 165, 32, 0.3);
              border-radius: 3px;
            }
            .filter-sidebar::-webkit-scrollbar-thumb:hover {
              background: rgba(218, 165, 32, 0.5);
            }
          `
        }} />
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-brass/30 hover:shadow-2xl transition-shadow duration-300"
        >
          <div className="border-b border-brass/20 pb-4 p-6">
            <h2 className="text-xl font-serif font-semibold text-charcoal flex items-center gap-2">
              <span className="w-1 h-6 bg-brass"></span>
              Filters
            </h2>
            {activeFilterCount > 0 && (
              <p className="text-sm text-charcoal/60 mt-1">
                {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
              </p>
            )}
          </div>
          <FilterContent isMobile={false} />
        </motion.div>
      </aside>
    </>
  )
}
