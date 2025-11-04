'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { finishesApi } from '@/lib/api'
import type { Finish } from '@/types'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'

export default function FinishesPage() {
  const router = useRouter()
  const [finishes, setFinishes] = useState<Finish[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFinishes()
  }, [])

  const fetchFinishes = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await finishesApi.getAll({ includeUsage: true })
      setFinishes(data)
    } catch (err) {
      console.error('Failed to fetch finishes:', err)
      setError('Failed to load finishes. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory via-cream to-ivory">
        <LuxuryNavigation />
        <div className="pt-32 flex items-center justify-center h-96">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brass"></div>
        </div>
        <LuxuryFooter />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory via-cream to-ivory">
        <LuxuryNavigation />
        <div className="pt-32 flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-charcoal mb-4">{error}</p>
            <button
              onClick={fetchFinishes}
              className="px-6 py-2 bg-brass text-white rounded-lg hover:bg-brass/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
        <LuxuryFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory via-cream to-ivory relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.03, 0.05, 0.03],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-64 -right-64 w-[500px] h-[500px] bg-brass rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.02, 0.04, 0.02],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-64 -left-64 w-[600px] h-[600px] bg-olive rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            x: [0, 10, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute top-16 left-8 w-24 h-24 bg-brass/8 rounded-full blur-xl"
        />
        <motion.div
          animate={{ 
            y: [0, 15, 0],
            x: [0, -8, 0],
            rotate: [0, -3, 0]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute top-32 right-12 w-32 h-32 bg-olive/6 rounded-full blur-2xl"
        />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #C9A66B 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }} />
        </div>
      </div>

      <LuxuryNavigation />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-8 sm:pt-24 sm:pb-12 overflow-hidden z-10">
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-charcoal mb-4 tracking-luxury"
          >
            Our Finishes
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-charcoal/70 max-w-2xl mx-auto leading-relaxed"
          >
            Discover our exquisite collection of finishes, each crafted with precision and luxury. 
            Explore where each finish can be applied to enhance your interior design.
          </motion.p>
        </div>
      </section>

      {/* Finishes Table Section */}
      <section className="relative z-10 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {finishes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-12 text-center border border-brass/20 shadow-lg"
            >
              <p className="text-charcoal text-lg">No finishes available at the moment.</p>
            </motion.div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-brass/20 shadow-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-brass/10 to-olive/10 border-b border-brass/20">
                        <th className="px-6 py-4 text-left text-sm font-serif font-bold text-charcoal tracking-wide">
                          Finish
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-serif font-bold text-charcoal tracking-wide">
                          Description
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-serif font-bold text-charcoal tracking-wide">
                          Applied To
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {finishes.map((finish, index) => (
                          <motion.tr
                            key={finish._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            whileHover={{ 
                              backgroundColor: 'rgba(201, 166, 107, 0.05)',
                              transition: { duration: 0.2 }
                            }}
                            className="border-b border-brass/10 hover:bg-brass/5 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                {finish.photoURL ? (
                                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-brass/20 shadow-md">
                                    <Image
                                      src={finish.photoURL}
                                      alt={finish.name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-brass/20 to-olive/20 border border-brass/20 flex items-center justify-center">
                                    <span className="text-2xl">✨</span>
                                  </div>
                                )}
                                <div>
                                  <h3 className="font-serif font-semibold text-charcoal text-lg tracking-wide">
                                    {finish.name}
                                  </h3>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-charcoal/70 text-sm leading-relaxed max-w-md">
                                {finish.description || 'No description available'}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                {finish.productCount !== undefined && finish.productCount > 0 ? (
                                  <>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-semibold text-brass">
                                        {finish.productCount} {finish.productCount === 1 ? 'Product' : 'Products'}
                                      </span>
                                      {finish.categoryCount !== undefined && finish.categoryCount > 0 && (
                                        <>
                                          <span className="text-charcoal/40">•</span>
                                          <span className="text-sm font-semibold text-olive">
                                            {finish.categoryCount} {finish.categoryCount === 1 ? 'Category' : 'Categories'}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    {finish.categories && finish.categories.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        {finish.categories.slice(0, 3).map((category, idx) => (
                                          <span
                                            key={idx}
                                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brass/10 text-brass border border-brass/20"
                                          >
                                            {category.name}
                                          </span>
                                        ))}
                                        {finish.categories.length > 3 && (
                                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-charcoal/60">
                                            +{finish.categories.length - 3} more
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-sm text-charcoal/50 italic">
                                    Not currently applied to any products
                                  </span>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden space-y-4">
                <AnimatePresence>
                  {finishes.map((finish, index) => (
                    <motion.div
                      key={finish._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-brass/20 shadow-lg"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        {finish.photoURL ? (
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-brass/20 shadow-md flex-shrink-0">
                            <Image
                              src={finish.photoURL}
                              alt={finish.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-brass/20 to-olive/20 border border-brass/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-3xl">✨</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-serif font-semibold text-charcoal text-xl tracking-wide mb-2">
                            {finish.name}
                          </h3>
                          {finish.description && (
                            <p className="text-charcoal/70 text-sm leading-relaxed">
                              {finish.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-brass/10">
                        <h4 className="text-sm font-semibold text-charcoal mb-2">Applied To:</h4>
                        {finish.productCount !== undefined && finish.productCount > 0 ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-brass">
                                {finish.productCount} {finish.productCount === 1 ? 'Product' : 'Products'}
                              </span>
                              {finish.categoryCount !== undefined && finish.categoryCount > 0 && (
                                <>
                                  <span className="text-charcoal/40">•</span>
                                  <span className="text-sm font-semibold text-olive">
                                    {finish.categoryCount} {finish.categoryCount === 1 ? 'Category' : 'Categories'}
                                  </span>
                                </>
                              )}
                            </div>
                            {finish.categories && finish.categories.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {finish.categories.map((category, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brass/10 text-brass border border-brass/20"
                                  >
                                    {category.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-charcoal/50 italic">
                            Not currently applied to any products
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </section>

      <LuxuryFooter />
    </div>
  )
}
