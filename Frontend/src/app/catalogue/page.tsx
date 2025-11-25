'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import { settingsApi } from '@/lib/api'
import type { Catalog } from '@/types'

export default function CatalogPage() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCatalogIndex, setSelectedCatalogIndex] = useState<number>(0)
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    fetchCatalogs()
  }, [])

  // Reset to index 0 when catalogs are loaded
  useEffect(() => {
    if (catalogs.length > 0 && selectedCatalogIndex >= catalogs.length) {
      setSelectedCatalogIndex(0)
    }
  }, [catalogs, selectedCatalogIndex])

  const fetchCatalogs = async () => {
    try {
      setLoading(true)
      const settings = await settingsApi.get()
      const catalogsList = settings.catalogs || []
      // Filter to only enabled catalogs (backend should already do this, but double-check)
      const enabledCatalogs = catalogsList.filter(catalog => catalog.enabled)
      setCatalogs(enabledCatalogs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch catalogs')
    } finally {
      setLoading(false)
    }
  }

  const handleCatalogChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = parseInt(e.target.value, 10)
    if (!isNaN(index) && index >= 0 && index < catalogs.length) {
      setSelectedCatalogIndex(index)
    }
  }

  const handleDownload = () => {
    const catalog = catalogs[selectedCatalogIndex]
    if (catalog) {
      const url = catalog.downloadUrl || catalog.url
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    }
  }

  const handleViewOnline = () => {
    const catalog = catalogs[selectedCatalogIndex]
    if (catalog) {
      const url = catalog.previewUrl || catalog.url
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory">
        <LuxuryNavigation />
        <div className="pt-32 flex items-center justify-center h-96">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-2 border-brass border-t-transparent rounded-full"
          />
        </div>
        <LuxuryFooter />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ivory">
        <LuxuryNavigation />
        <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-12 xl:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-serif font-bold text-charcoal mb-4">
              Product Catalogues
            </h1>
            <p className="text-charcoal/70 text-lg">
              {error}
            </p>
          </div>
        </div>
        <LuxuryFooter />
      </div>
    )
  }

  if (catalogs.length === 0) {
    return (
      <div className="min-h-screen bg-ivory">
        <LuxuryNavigation />
        <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-12 xl:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl font-serif font-bold text-charcoal mb-4">
                Product Catalogues
              </h1>
              <p className="text-charcoal/70 text-lg">
                No catalogues are currently available. Please check back later or contact us for assistance.
              </p>
            </motion.div>
          </div>
        </div>
        <LuxuryFooter />
      </div>
    )
  }

  const selectedCatalog = catalogs[selectedCatalogIndex]

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <LuxuryNavigation />
      <main className="flex-1 flex flex-col pt-24 pb-4 px-4 sm:px-6">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-charcoal">
            Product Catalogues
          </h1>
        </motion.div>

        {/* Controls Bar: Selection, Buttons, Info */}
        {selectedCatalog && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4 flex flex-col sm:flex-row items-center gap-4 justify-center"
          >
            {/* Catalog Selection */}
            <div className="flex-1 max-w-md w-full">
              <select
                id="catalog-select"
                value={selectedCatalogIndex}
                onChange={handleCatalogChange}
                className="w-full px-4 py-2.5 text-base bg-white border-2 border-brass/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brass focus:border-brass transition-all text-charcoal font-medium"
              >
                {catalogs.map((catalog, index) => (
                  <option key={index} value={index}>
                    {catalog.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {selectedCatalog.previewUrl && (
                <button
                  onClick={handleViewOnline}
                  className="px-4 py-2.5 bg-charcoal text-ivory rounded-lg hover:bg-charcoal/90 transition-colors duration-300 font-semibold flex items-center gap-2 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="hidden sm:inline">View Online</span>
                  <span className="sm:hidden">View</span>
                </button>
              )}
              <button
                onClick={handleDownload}
                className="px-4 py-2.5 bg-brass text-charcoal rounded-lg hover:bg-brass/90 transition-colors duration-300 font-semibold flex items-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">Download</span>
              </button>
              
              {/* Instructions Icon */}
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="p-2.5 bg-charcoal/10 hover:bg-charcoal/20 rounded-lg transition-colors duration-300 text-charcoal"
                title="Instructions"
                aria-label="Show instructions"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}

        {/* Instructions Tooltip */}
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 mx-auto max-w-2xl bg-white border-2 border-brass/30 rounded-lg p-4 shadow-lg"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-charcoal">Instructions</h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-charcoal/50 hover:text-charcoal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ul className="text-sm text-charcoal/70 space-y-2 list-disc list-inside">
              <li>Select a catalogue from the dropdown menu above</li>
              <li>Use the preview below to browse through the catalogue</li>
              <li>Click "View Online" to open the catalogue in a new tab</li>
              <li>Click "Download PDF" to download the catalogue file</li>
              <li>The catalogue is a large PDF file. Download may take a few moments depending on your connection speed.</li>
            </ul>
          </motion.div>
        )}

        {/* Preview Section - Full Screen with Margin */}
        {selectedCatalog && selectedCatalog.previewUrl && (
          <motion.div
            key={selectedCatalogIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex-1 w-full mx-auto my-4"
            style={{ maxWidth: 'calc(100% - 2rem)' }}
          >
            <div className="relative w-full border border-charcoal/10 rounded-lg overflow-hidden bg-charcoal/5 shadow-lg" style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}>
              <iframe
                src={selectedCatalog.previewUrl}
                className="w-full h-full"
                title={`${selectedCatalog.title} Preview`}
                allow="fullscreen"
              />
            </div>
          </motion.div>
        )}
      </main>
      <LuxuryFooter />
    </div>
  )
}

