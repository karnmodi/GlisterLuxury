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
  
  // Get WhatsApp number from any contact info item
  const whatsAppNumber = contactInfo.find(item => item.businessWhatsApp && item.businessWhatsApp.trim() !== '')?.businessWhatsApp

  // Helper function to get social media platforms with URLs
  const getSocialMediaPlatforms = () => {
    const platforms: Array<{ name: string; url: string; icon: string }> = []
    socials.forEach(item => {
      if (item.socialMedia) {
        if (item.socialMedia.instagram) platforms.push({ name: 'Instagram', url: item.socialMedia.instagram, icon: 'instagram' })
        if (item.socialMedia.facebook) platforms.push({ name: 'Facebook', url: item.socialMedia.facebook, icon: 'facebook' })
        if (item.socialMedia.linkedin) platforms.push({ name: 'LinkedIn', url: item.socialMedia.linkedin, icon: 'linkedin' })
        if (item.socialMedia.twitter) platforms.push({ name: 'Twitter', url: item.socialMedia.twitter, icon: 'twitter' })
        if (item.socialMedia.youtube) platforms.push({ name: 'YouTube', url: item.socialMedia.youtube, icon: 'youtube' })
        if (item.socialMedia.pinterest) platforms.push({ name: 'Pinterest', url: item.socialMedia.pinterest, icon: 'pinterest' })
        if (item.socialMedia.tiktok) platforms.push({ name: 'TikTok', url: item.socialMedia.tiktok, icon: 'tiktok' })
      }
    })
    return platforms
  }

  const socialPlatforms = getSocialMediaPlatforms()

  // Social Media Icon Component
  const SocialMediaIcon = ({ platform, className = "w-6 h-6" }: { platform: string; className?: string }) => {
    const icons: Record<string, string> = {
      instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
      facebook: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
      linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
      twitter: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z',
      youtube: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
      pinterest: 'M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.221.085.343-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z',
      tiktok: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z'
    }
    const path = icons[platform.toLowerCase()]
    if (!path) return null
    return (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d={path} />
      </svg>
    )
  }

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
      <section className="relative min-h-[60vh] sm:min-h-[70vh] flex items-center justify-center overflow-hidden bg-charcoal">
        {/* Background Image */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('/images/gallery/Premium Image.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          {/* Dark overlay for better readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 via-charcoal/50 to-charcoal/70" />
        </div>
        
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {/* Animated Gradient Orbs */}
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-brass/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, 80, 0],
              scale: [1, 1.3, 1],
              opacity: [0.08, 0.12, 0.08]
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/3 right-1/4 w-96 h-96 bg-charcoal/5 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, 60, 0],
              y: [0, -60, 0],
              scale: [1, 1.1, 1],
              opacity: [0.06, 0.1, 0.06]
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-brass/8 rounded-full blur-3xl"
          />
          
          {/* Subtle Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(201, 166, 107, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(201, 166, 107, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Brass texture overlay */}
          <div
            className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A66B' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <span className="text-brass text-sm font-medium tracking-luxury uppercase block">Get in Touch</span>
            <div className="w-16 h-0.5 bg-brass mx-auto" />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-ivory tracking-wide"
              style={{
                textShadow: '0 2px 20px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 0, 0, 0.7), 0 4px 8px rgba(0, 0, 0, 0.8)'
              }}
            >
              Contact Us
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-ivory/80 text-base sm:text-lg font-light tracking-wide max-w-2xl mx-auto leading-relaxed"
              style={{
                textShadow: '0 2px 20px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 0, 0, 0.7)'
              }}
            >
              We'd love to hear from you. Reach out and let's start a conversation.
            </motion.p>
          </motion.div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="relative block w-full h-16"
            style={{ fill: '#FAF8F3' }}
          >
            <path d="M0,0 C150,60 350,60 600,30 C850,0 1050,0 1200,30 L1200,120 L0,120 Z" opacity="0.3" />
            <path d="M0,20 C150,80 350,80 600,50 C850,20 1050,20 1200,50 L1200,120 L0,120 Z" />
          </svg>
        </div>
      </section>

      {/* Contact Information Section */}
      {(addresses.length > 0 || phones.length > 0 || emails.length > 0 || socialPlatforms.length > 0 || whatsAppNumber) && (
        <section className="py-24 lg:py-32 bg-ivory relative overflow-hidden">
          {/* Top wave transition */}
          <div className="absolute top-0 left-0 right-0 overflow-hidden">
            <svg 
              viewBox="0 0 1200 120" 
              preserveAspectRatio="none" 
              className="relative block w-full h-16 rotate-180"
              style={{ fill: '#FAF8F3' }}
            >
              <path d="M0,0 C150,60 350,60 600,30 C850,0 1050,0 1200,30 L1200,120 L0,120 Z" opacity="0.5" />
            </svg>
          </div>
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <motion.div
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
              className="absolute top-0 left-1/4 w-96 h-96 bg-brass/5 rounded-full blur-3xl"
            />
            <motion.div
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
              className="absolute top-1/3 right-1/4 w-96 h-96 bg-charcoal/3 rounded-full blur-3xl"
            />
            <motion.div
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
              className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-brass/4 rounded-full blur-3xl"
            />

            {/* Subtle pattern overlay */}
            <div 
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A66B' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '60px 60px'
              }}
            />
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              ref={ref}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16 lg:mb-20"
            >
              <span className="text-brass text-sm font-medium tracking-luxury uppercase">Find Us</span>
              <div className="w-16 h-0.5 bg-brass mx-auto mt-3 mb-8" />
              <h2 className="font-serif text-4xl lg:text-5xl text-charcoal mb-4">
                Contact Information
              </h2>
              <p className="text-charcoal/60 text-lg max-w-3xl mx-auto">
                Get in touch through your preferred method
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-6xl mx-auto">
              {/* WhatsApp - moved to top if exists */}
              {whatsAppNumber && (
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="lg:col-span-1 group relative"
                >
                  <div className="h-full p-6 lg:p-8 bg-gradient-to-br from-white to-charcoal/5 border border-brass/20 rounded-lg hover:border-brass/50 transition-all duration-500 relative overflow-hidden">
                    {/* Decorative shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brass/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-full bg-brass/10 flex items-center justify-center mb-4 group-hover:bg-brass/20 transition-colors duration-500">
                        <svg className="w-6 h-6 text-brass" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </div>
                      <h3 className="font-serif text-xl text-brass mb-3 tracking-wide">WhatsApp</h3>
                      <a 
                        href={`https://wa.me/${whatsAppNumber.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-charcoal/80 hover:text-brass transition-colors duration-300 text-sm font-medium"
                      >
                        {whatsAppNumber}
                      </a>
                      {/* Corner accents */}
                      <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-brass/20 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-brass/20 rounded-bl-lg" />
                    </div>
                  </div>
                </motion.div>
              )}
              {/* Addresses */}
              {addresses.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="sm:col-span-2 lg:col-span-2 group relative"
                >
                  <div className="h-full p-6 lg:p-8 bg-gradient-to-br from-white to-charcoal/5 border border-brass/20 rounded-lg hover:border-brass/50 transition-all duration-500 relative overflow-hidden">
                    {/* Decorative shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brass/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-full bg-brass/10 flex items-center justify-center mb-4 group-hover:bg-brass/20 transition-colors duration-500">
                        <svg className="w-6 h-6 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h3 className="font-serif text-xl text-brass mb-4 tracking-wide">Address</h3>
                      <div className="space-y-4">
                        {addresses.map((item, index) => (
                          <div key={item._id} className="group/item">
                            {item.label && (
                              <p className="text-charcoal font-semibold mb-2 text-sm">{item.label}</p>
                            )}
                            <p className="text-charcoal/80 leading-relaxed whitespace-pre-wrap text-sm">{item.value}</p>
                          </div>
                        ))}
                      </div>
                      {/* Corner accents */}
                      <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-brass/20 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-brass/20 rounded-bl-lg" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Phones */}
              {phones.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="group relative"
                >
                  <div className="h-full p-6 lg:p-8 bg-gradient-to-br from-white to-charcoal/5 border border-brass/20 rounded-lg hover:border-brass/50 transition-all duration-500 relative overflow-hidden">
                    {/* Decorative shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brass/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-full bg-brass/10 flex items-center justify-center mb-4 group-hover:bg-brass/20 transition-colors duration-500">
                        <svg className="w-6 h-6 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <h3 className="font-serif text-xl text-brass mb-4 tracking-wide">Phone</h3>
                      <div className="space-y-3">
                        {phones.map((item, index) => (
                          <div key={item._id} className="group/item">
                            {item.label && (
                              <p className="text-charcoal font-semibold mb-1 text-sm">{item.label}</p>
                            )}
                            <a 
                              href={`tel:${item.value.replace(/\s/g, '')}`}
                              className="text-charcoal/80 hover:text-brass transition-colors duration-300 inline-flex items-center gap-2 text-sm"
                            >
                              {item.value}
                            </a>
                          </div>
                        ))}
                      </div>
                      {/* Corner accents */}
                      <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-brass/20 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-brass/20 rounded-bl-lg" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Emails */}
              {emails.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="group relative"
                >
                  <div className="h-full p-6 lg:p-8 bg-gradient-to-br from-white to-charcoal/5 border border-brass/20 rounded-lg hover:border-brass/50 transition-all duration-500 relative overflow-hidden">
                    {/* Decorative shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brass/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-full bg-brass/10 flex items-center justify-center mb-4 group-hover:bg-brass/20 transition-colors duration-500">
                        <svg className="w-6 h-6 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="font-serif text-xl text-brass mb-4 tracking-wide">Email</h3>
                      <div className="space-y-3">
                        {emails.map((item, index) => (
                          <div key={item._id} className="group/item">
                            {item.label && (
                              <p className="text-charcoal font-semibold mb-1 text-sm">{item.label}</p>
                            )}
                            <a 
                              href={`mailto:${item.value}`}
                              className="text-charcoal/80 hover:text-brass transition-colors duration-300 text-sm break-all"
                            >
                              {item.value}
                            </a>
                          </div>
                        ))}
                      </div>
                      {/* Corner accents */}
                      <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-brass/20 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-brass/20 rounded-bl-lg" />
                    </div>
                  </div>
                </motion.div>
              )}


              {/* Social Media */}
              {socialPlatforms.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="sm:col-span-2 lg:col-span-1 group relative"
                >
                  <div className="h-full p-6 lg:p-8 bg-gradient-to-br from-white to-charcoal/5 border border-brass/20 rounded-lg hover:border-brass/50 transition-all duration-500 relative overflow-hidden">
                    {/* Decorative shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brass/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-full bg-brass/10 flex items-center justify-center mb-4 group-hover:bg-brass/20 transition-colors duration-500">
                        <svg className="w-6 h-6 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <h3 className="font-serif text-xl text-brass mb-4 tracking-wide">Follow Us</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
                        {socialPlatforms.map((platform, index) => (
                          <motion.a
                            key={`${platform.icon}-${index}`}
                            href={platform.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 20 }}
                            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                            transition={{ duration: 0.5, delay: 0.6 + (index * 0.1) }}
                            className="group/item flex items-center gap-2 p-2 rounded hover:bg-brass/10 transition-all duration-300"
                          >
                            <SocialMediaIcon platform={platform.icon} className="w-5 h-5 text-charcoal/70 group-hover/item:text-brass transition-colors flex-shrink-0" />
                            <span className="text-charcoal/80 group-hover/item:text-brass transition-colors text-sm font-medium truncate">{platform.name}</span>
                          </motion.a>
                        ))}
                      </div>
                      {/* Corner accents */}
                      <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-brass/20 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-brass/20 rounded-bl-lg" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Contact Form Section */}
      <section className="py-24 lg:py-32 bg-charcoal relative overflow-hidden">
        {/* Top wave transition */}
        <div className="absolute top-0 left-0 right-0 overflow-hidden">
          <svg 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none" 
            className="relative block w-full h-16 rotate-180"
            style={{ fill: '#2D2D2D' }}
          >
            <path d="M0,0 C150,60 350,60 600,30 C850,0 1050,0 1200,30 L1200,120 L0,120 Z" opacity="0.5" />
          </svg>
        </div>
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1],
              opacity: [0.05, 0.08, 0.05]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-brass/5 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, 80, 0],
              scale: [1, 1.3, 1],
              opacity: [0.03, 0.06, 0.03]
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/3 right-1/4 w-96 h-96 bg-charcoal/10 rounded-full blur-3xl"
          />
          
          {/* Subtle pattern overlay */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A66B' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          />

          {/* Decorative Lines */}
          <motion.div
            animate={{ 
              opacity: [0.03, 0.06, 0.03],
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brass/10 to-transparent"
          />
        </div>
        
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16 lg:mb-20"
          >
            <span className="text-brass text-sm font-medium tracking-luxury uppercase">Send a Message</span>
            <div className="w-16 h-0.5 bg-brass mx-auto mt-3 mb-8" />
            <h2 className="font-serif text-4xl lg:text-5xl text-ivory mb-4">
              Get in Touch
            </h2>
            <p className="text-ivory/60 text-lg max-w-3xl mx-auto">
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
            <div className="grid sm:grid-cols-2 gap-6">
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

