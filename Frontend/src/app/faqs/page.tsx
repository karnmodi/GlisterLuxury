'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import { faqApi } from '@/lib/api'
import type { FAQ } from '@/types'

// Helper function to convert HTML to plain text with preserved line breaks
const htmlToPlainText = (html: string): string => {
  return html
    .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> tags to newlines
    .replace(/<\/p>/gi, '\n\n')      // Convert closing </p> to double newlines
    .replace(/<p>/gi, '')            // Remove opening <p>
    .replace(/<strong>(.*?)<\/strong>/gi, '$1') // Remove <strong> but keep content
    .replace(/<em>(.*?)<\/em>/gi, '$1')         // Remove <em> but keep content
    .replace(/<b>(.*?)<\/b>/gi, '$1')           // Remove <b> but keep content
    .replace(/<i>(.*?)<\/i>/gi, '$1')           // Remove <i> but keep content
    .replace(/<[^>]*>/g, '')         // Remove any remaining HTML tags
    .replace(/&nbsp;/g, ' ')         // Convert &nbsp; to space
    .replace(/&amp;/g, '&')          // Convert &amp; to &
    .replace(/&lt;/g, '<')           // Convert &lt; to <
    .replace(/&gt;/g, '>')           // Convert &gt; to >
    .replace(/&quot;/g, '"')         // Convert &quot; to "
    .trim()
}

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true)
        const data = await faqApi.getAll({ isActive: true, sortBy: 'order' })
        setFaqs(data)
        setFilteredFaqs(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch FAQs')
      } finally {
        setLoading(false)
      }
    }

    fetchFAQs()
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFaqs(faqs)
    } else {
      const filtered = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        htmlToPlainText(faq.answer).toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredFaqs(filtered)
    }
  }, [searchQuery, faqs])

  const toggleFaq = (faqId: string) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId)
  }

  const handleLinkClick = (linkType: string, linkUrl?: string) => {
    if (!linkUrl) return
    
    if (linkType === 'internal') {
      window.location.href = linkUrl
    } else if (linkType === 'external') {
      // Ensure external URLs have a protocol
      const url = linkUrl.startsWith('http://') || linkUrl.startsWith('https://') 
        ? linkUrl 
        : `https://${linkUrl}`
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory">
        <LuxuryNavigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-brass border-t-transparent rounded-full"
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
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-serif text-charcoal mb-4">Something went wrong</h2>
            <p className="text-charcoal/70">{error}</p>
          </div>
        </div>
        <LuxuryFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ivory">
      <LuxuryNavigation />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-8 sm:pt-24 sm:pb-12 overflow-hidden">
        {/* Enhanced Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Animated floating elements */}
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
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              x: [0, 5, 0]
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute bottom-16 left-16 w-20 h-20 bg-brass/5 rounded-full blur-lg"
          />
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.02]">
            <div className="w-full h-full" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #C9A66B 1px, transparent 0)`,
              backgroundSize: '20px 20px'
            }} />
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-charcoal mb-4 sm:mb-6 tracking-wide">
              Frequently Asked Questions
            </h1>
            <p className="text-base sm:text-lg text-charcoal/70 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4">
              Find answers to common questions about our luxury hardware and interior accessories.
            </p>
          </motion.div>

          {/* Enhanced Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl mx-auto mb-6 sm:mb-8 px-4"
          >
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <motion.svg 
                  className="w-5 h-5 text-charcoal/40 group-focus-within:text-brass transition-colors duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  animate={{ rotate: searchQuery ? 360 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </motion.svg>
              </div>
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white/90 backdrop-blur-sm border border-charcoal/10 rounded-lg text-charcoal placeholder-charcoal/50 focus:outline-none focus:ring-2 focus:ring-brass/50 focus:border-brass transition-all duration-300 shadow-lg hover:shadow-xl"
              />
              {/* Search animation indicator */}
              {searchQuery && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <div className="w-2 h-2 bg-brass rounded-full animate-pulse" />
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="pb-12 sm:pb-20 relative">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ 
              duration: 15, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute -top-20 -right-20 w-80 h-80 bg-brass/3 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1, 0.9, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ 
              duration: 12, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 3
            }}
            className="absolute -bottom-20 -left-20 w-96 h-96 bg-olive/2 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredFaqs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-12 sm:py-16"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, 0]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="w-16 h-16 sm:w-20 sm:h-20 bg-brass/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
              >
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.div>
              <h3 className="text-xl sm:text-2xl font-serif text-charcoal mb-2 sm:mb-3">No FAQs found</h3>
              <p className="text-charcoal/60 text-sm sm:text-base">
                {searchQuery ? 'Try adjusting your search terms.' : 'No FAQs are available at the moment.'}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredFaqs.map((faq, index) => (
                  <motion.div
                    key={faq._id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: "0 10px 25px rgba(201, 166, 107, 0.1)"
                    }}
                    className="bg-white/70 backdrop-blur-sm border border-charcoal/10 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group"
                  >
                    <button
                      onClick={() => toggleFaq(faq._id)}
                      className="w-full px-4 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between hover:bg-brass/5 transition-all duration-300 group"
                    >
                      <h3 className="text-base sm:text-lg font-medium text-charcoal pr-3 sm:pr-4 leading-relaxed group-hover:text-brass transition-colors duration-300">
                        {faq.question}
                      </h3>
                      <motion.div
                        animate={{ rotate: expandedFaq === faq._id ? 180 : 0 }}
                        transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                        className="flex-shrink-0 p-1"
                      >
                        <svg className="w-5 h-5 text-brass group-hover:text-olive transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {expandedFaq === faq._id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ 
                            duration: 0.4,
                            type: "spring",
                            stiffness: 100,
                            damping: 20
                          }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 sm:px-6 pb-4 sm:pb-5 border-t border-charcoal/10 bg-gradient-to-br from-brass/2 to-transparent">
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2, duration: 0.3 }}
                              className="pt-4"
                            >
                              <p className="text-charcoal/80 leading-relaxed mb-4 text-sm sm:text-base whitespace-pre-wrap">
                                {htmlToPlainText(faq.answer)}
                              </p>
                              
                              {/* FAQ Link */}
                              {faq.linkType !== 'none' && faq.linkUrl && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleLinkClick(faq.linkType, faq.linkUrl)}
                                  className="inline-flex items-center gap-2 text-brass hover:text-olive transition-all duration-300 font-medium text-sm sm:text-base group/link"
                                >
                                  <span>{faq.linkText || (faq.linkType === 'internal' ? 'Learn More' : 'Visit Link')}</span>
                                  {faq.linkType === 'external' ? (
                                    <motion.svg 
                                      className="w-4 h-4 group-hover/link:translate-x-1 transition-transform duration-300" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </motion.svg>
                                  ) : (
                                    <motion.svg 
                                      className="w-4 h-4 group-hover/link:translate-x-1 transition-transform duration-300" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </motion.svg>
                                  )}
                                </motion.button>
                              )}
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-gradient-charcoal py-12 sm:py-16 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-brass/10 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-ivory mb-3 sm:mb-4">
              Still have questions?
            </h2>
            <p className="text-ivory/70 mb-6 sm:mb-8 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              Our team of experts is here to help you find the perfect hardware solutions for your project.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/contact"
                className="px-6 sm:px-8 py-3 bg-brass text-charcoal font-medium rounded-sm hover:bg-olive transition-all duration-300 hover:shadow-lg hover:shadow-brass/50 text-sm sm:text-base"
              >
                Contact Us
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="tel:+44123456789"
                className="px-6 sm:px-8 py-3 border border-brass text-brass font-medium rounded-sm hover:bg-brass hover:text-charcoal transition-all duration-300 text-sm sm:text-base"
              >
                Call +44 123 456 789
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      <LuxuryFooter />
    </div>
  )
}
