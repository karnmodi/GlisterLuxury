'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import { contactApi } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import type { ContactInfo } from '@/types'

export default function ContactPage() {
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        setLoading(true)
        const data = await contactApi.getInfo({ isActive: true })
        setContactInfo(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch contact information')
      } finally {
        setLoading(false)
      }
    }

    fetchContactInfo()
  }, [])

  // Group contact info by type
  const addresses = contactInfo.filter(item => item.type === 'address').sort((a, b) => a.displayOrder - b.displayOrder)
  const phones = contactInfo.filter(item => item.type === 'phone').sort((a, b) => a.displayOrder - b.displayOrder)
  const emails = contactInfo.filter(item => item.type === 'email').sort((a, b) => a.displayOrder - b.displayOrder)
  const socials = contactInfo.filter(item => item.type === 'social').sort((a, b) => a.displayOrder - b.displayOrder)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all required fields')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      setSubmitting(true)
      await contactApi.submitInquiry({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject,
        message: formData.message
      })

      toast.success('Your inquiry has been submitted successfully! We will get back to you soon.')
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit inquiry. Please try again.')
    } finally {
      setSubmitting(false)
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
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 overflow-hidden bg-gradient-to-b from-ivory to-charcoal">
        <div className="absolute inset-0">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-brass/10 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-brass text-sm font-medium tracking-luxury uppercase mb-4 block">Get in Touch</span>
            <div className="w-16 h-0.5 bg-brass mx-auto mb-6" />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-ivory mb-6 tracking-wide">
              Contact Us
            </h1>
            <p className="text-ivory/80 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              We'd love to hear from you. Reach out and let's start a conversation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Information Section */}
      {(addresses.length > 0 || phones.length > 0 || emails.length > 0 || socials.length > 0) && (
        <section className="py-16 sm:py-24 bg-ivory relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              ref={ref}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <span className="text-brass text-sm font-medium tracking-luxury uppercase">Find Us</span>
              <div className="w-16 h-0.5 bg-brass mx-auto mt-3 mb-6" />
              <h2 className="font-serif text-3xl lg:text-4xl text-charcoal mb-4">
                Contact Information
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {/* Addresses */}
              {addresses.length > 0 && (
                <div className="lg:col-span-2">
                  <h3 className="text-brass font-semibold mb-4 tracking-wide uppercase text-sm">Address</h3>
                  <div className="space-y-3">
                    {addresses.map((item) => (
                      <div key={item._id} className="group">
                        {item.label && (
                          <p className="text-charcoal font-medium mb-1">{item.label}</p>
                        )}
                        <p className="text-charcoal/80 leading-relaxed whitespace-pre-wrap">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Phones */}
              {phones.length > 0 && (
                <div>
                  <h3 className="text-brass font-semibold mb-4 tracking-wide uppercase text-sm">Phone</h3>
                  <div className="space-y-3">
                    {phones.map((item) => (
                      <div key={item._id} className="group">
                        {item.label && (
                          <p className="text-charcoal font-medium mb-1">{item.label}</p>
                        )}
                        <a 
                          href={`tel:${item.value.replace(/\s/g, '')}`}
                          className="text-charcoal/80 hover:text-brass transition-colors duration-300"
                        >
                          {item.value}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Emails */}
              {emails.length > 0 && (
                <div>
                  <h3 className="text-brass font-semibold mb-4 tracking-wide uppercase text-sm">Email</h3>
                  <div className="space-y-3">
                    {emails.map((item) => (
                      <div key={item._id} className="group">
                        {item.label && (
                          <p className="text-charcoal font-medium mb-1">{item.label}</p>
                        )}
                        <a 
                          href={`mailto:${item.value}`}
                          className="text-charcoal/80 hover:text-brass transition-colors duration-300"
                        >
                          {item.value}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Media */}
              {socials.length > 0 && (
                <div>
                  <h3 className="text-brass font-semibold mb-4 tracking-wide uppercase text-sm">Follow Us</h3>
                  <div className="space-y-3">
                    {socials.map((item) => (
                      <div key={item._id} className="group">
                        <a 
                          href={item.value.startsWith('http') ? item.value : `https://${item.value}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-charcoal/80 hover:text-brass transition-colors duration-300 inline-flex items-center gap-2"
                        >
                          <span>{item.label}</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Contact Form Section */}
      <section className="py-16 sm:py-24 bg-charcoal relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-brass text-sm font-medium tracking-luxury uppercase">Send a Message</span>
            <div className="w-16 h-0.5 bg-brass mx-auto mt-3 mb-6" />
            <h2 className="font-serif text-3xl lg:text-4xl text-ivory mb-4">
              Get in Touch
            </h2>
            <p className="text-ivory/70 text-lg">
              Fill out the form below and we'll respond as soon as possible.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-ivory font-medium mb-2">
                  Name <span className="text-brass">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-zinc-900 border border-brass/20 rounded-lg text-ivory placeholder-ivory/50 focus:outline-none focus:ring-2 focus:ring-brass/50 focus:border-brass transition-all duration-300"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-ivory font-medium mb-2">
                  Email <span className="text-brass">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-zinc-900 border border-brass/20 rounded-lg text-ivory placeholder-ivory/50 focus:outline-none focus:ring-2 focus:ring-brass/50 focus:border-brass transition-all duration-300"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-ivory font-medium mb-2">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-zinc-900 border border-brass/20 rounded-lg text-ivory placeholder-ivory/50 focus:outline-none focus:ring-2 focus:ring-brass/50 focus:border-brass transition-all duration-300"
                placeholder="+44 123 456 789"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-ivory font-medium mb-2">
                Subject <span className="text-brass">*</span>
              </label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                className="w-full px-4 py-3 bg-zinc-900 border border-brass/20 rounded-lg text-ivory placeholder-ivory/50 focus:outline-none focus:ring-2 focus:ring-brass/50 focus:border-brass transition-all duration-300"
                placeholder="What is your inquiry about?"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-ivory font-medium mb-2">
                Message <span className="text-brass">*</span>
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={6}
                className="w-full px-4 py-3 bg-zinc-900 border border-brass/20 rounded-lg text-ivory placeholder-ivory/50 focus:outline-none focus:ring-2 focus:ring-brass/50 focus:border-brass transition-all duration-300 resize-none"
                placeholder="Tell us how we can help..."
              />
            </div>

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: submitting ? 1 : 1.05 }}
              whileTap={{ scale: submitting ? 1 : 0.95 }}
              className="w-full px-8 py-4 bg-brass text-charcoal font-medium rounded-sm hover:bg-olive transition-all duration-300 hover:shadow-lg hover:shadow-brass/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </motion.button>
          </motion.form>
        </div>
      </section>

      <LuxuryFooter />
    </div>
  )
}

