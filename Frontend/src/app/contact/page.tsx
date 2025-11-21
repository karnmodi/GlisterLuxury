'use client'

import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import ScrollProgressIndicator from '@/components/ScrollProgressIndicator'
import BackToTopButton from '@/components/BackToTopButton'
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
    category: 'general_inquiry',
    subject: '',
    message: ''
  })

  // Category options for the dropdown
  const categoryOptions = [
    { value: 'general_inquiry', label: 'General Inquiry' },
    { value: 'product_inquiry', label: 'Product Inquiry' },
    { value: 'order_status', label: 'Order Status' },
    { value: 'refund_request', label: 'Refund Request' },
    { value: 'bulk_order', label: 'Bulk Order' },
    { value: 'technical_support', label: 'Technical Support' },
    { value: 'shipping_delivery', label: 'Shipping & Delivery' },
    { value: 'payment_issue', label: 'Payment Issue' },
    { value: 'complaint', label: 'Complaint' },
    { value: 'other', label: 'Other' }
  ]

  // Hooks must be called before any conditional returns
  const { scrollYProgress } = useScroll()
  const parallaxY1 = useTransform(scrollYProgress, [0, 1], [0, -150])
  const parallaxY2 = useTransform(scrollYProgress, [0, 1], [0, -100])
  const parallaxY3 = useTransform(scrollYProgress, [0, 1], [0, -200])

  // Use separate refs for each section
  const [contactInfoRef, contactInfoInView] = useInView({
    triggerOnce: false,
    threshold: 0.05,
    rootMargin: '50px 0px'
  })
  const [formRef, formInView] = useInView({
    triggerOnce: false,
    threshold: 0.05,
    rootMargin: '50px 0px'
  })

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        setLoading(true)
        const data = await contactApi.getInfo({ isActive: true })
        // Ensure data is always an array
        setContactInfo(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch contact information')
        // Set to empty array on error to prevent null issues
        setContactInfo([])
      } finally {
        setLoading(false)
      }
    }

    fetchContactInfo()
  }, [])

  // Group contact info by type - ensure contactInfo is always an array
  const safeContactInfo = Array.isArray(contactInfo) ? contactInfo : []
  const addresses = safeContactInfo.filter(item => item.type === 'address').sort((a, b) => a.displayOrder - b.displayOrder)
  const phones = safeContactInfo.filter(item => item.type === 'phone').sort((a, b) => a.displayOrder - b.displayOrder)
  const emails = safeContactInfo.filter(item => item.type === 'email').sort((a, b) => a.displayOrder - b.displayOrder)
  const socials = safeContactInfo.filter(item => item.type === 'social').sort((a, b) => a.displayOrder - b.displayOrder)
  
  // Get WhatsApp number from any contact info item
  const whatsAppNumber = safeContactInfo.find(item => item.businessWhatsApp && item.businessWhatsApp.trim() !== '')?.businessWhatsApp

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
        category: formData.category,
        subject: formData.subject,
        message: formData.message
      })

      toast.success('Your inquiry has been submitted successfully! We will get back to you soon.')

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        category: 'general_inquiry',
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
      <ScrollProgressIndicator />
      
      {/* Hero Section - Redesigned with About page style */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-charcoal">
        {/* Base Background Layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal via-zinc-900 to-charcoal" />

        {/* Animated Gradient Mesh - Layer 1 */}
          <motion.div
          className="absolute inset-0 opacity-20"
            animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
            ease: 'linear',
          }}
            style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(201, 166, 107, 0.3) 0%, transparent 50%),
                              radial-gradient(circle at 80% 70%, rgba(154, 151, 116, 0.25) 0%, transparent 50%),
                              radial-gradient(circle at 50% 50%, rgba(201, 166, 107, 0.15) 0%, transparent 60%)`,
            backgroundSize: '200% 200%',
          }}
        />

        {/* Animated Gradient Mesh - Layer 2 */}
          <motion.div
          className="absolute inset-0 opacity-15"
            animate={{
            backgroundPosition: ['100% 100%', '0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            backgroundImage: `radial-gradient(circle at 60% 20%, rgba(154, 151, 116, 0.3) 0%, transparent 50%),
                              radial-gradient(circle at 30% 80%, rgba(201, 166, 107, 0.2) 0%, transparent 50%)`,
            backgroundSize: '150% 150%',
          }}
        />

        {/* Gradient Orbs with Parallax */}
          <motion.div
          style={{ y: parallaxY1 }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-brass/15 via-olive/10 to-transparent rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
            }}
            transition={{
            duration: 12,
              repeat: Infinity,
            ease: 'easeInOut',
            }}
          />
          <motion.div
          style={{ y: parallaxY2 }}
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-tl from-olive/12 via-brass/8 to-transparent rounded-full blur-3xl"
            animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.12, 0.2, 0.12],
            }}
            transition={{
            duration: 10,
              repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
            }}
          />
          <motion.div
          style={{ y: parallaxY3 }}
          className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-gradient-to-br from-brass/10 to-olive/8 rounded-full blur-3xl"
            animate={{
            scale: [1, 1.15, 1],
            opacity: [0.1, 0.18, 0.1],
            }}
            transition={{
            duration: 14,
              repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />

        {/* Animated Brass Grid Lines */}
        {[...Array(6)].map((_, i) => (
            <motion.div
            key={`grid-h-${i}`}
            className="absolute h-px bg-gradient-to-r from-transparent via-brass/8 to-transparent"
            style={{
              top: `${15 + i * 14}%`,
              left: 0,
              right: 0,
            }}
              animate={{
              opacity: [0.05, 0.2, 0.05],
              scaleX: [0.7, 1, 0.7],
              }}
              transition={{
              duration: 5 + i * 0.5,
                repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.6,
              }}
            />
        ))}
        {[...Array(4)].map((_, i) => (
            <motion.div
            key={`grid-v-${i}`}
            className="absolute w-px bg-gradient-to-b from-transparent via-brass/8 to-transparent"
            style={{
              left: `${20 + i * 20}%`,
              top: 0,
              bottom: 0,
            }}
              animate={{
              opacity: [0.05, 0.15, 0.05],
              scaleY: [0.8, 1, 0.8],
              }}
              transition={{
              duration: 6 + i * 0.5,
                repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.8,
              }}
            />
        ))}

        {/* Floating Geometric Shapes - Hexagons */}
        {[...Array(3)].map((_, i) => (
            <motion.div
            key={`hex-${i}`}
            className="absolute group cursor-pointer hidden md:block"
            style={{
              left: `${65 + i * 12}%`,
              top: `${20 + i * 25}%`,
            }}
              animate={{
              rotate: [0, 360],
                scale: [1, 1.1, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            whileHover={{
              scale: 1.3,
              opacity: 0.4,
              transition: { duration: 0.3 },
              }}
              transition={{
              duration: 20 + i * 5,
                repeat: Infinity,
              ease: 'linear',
              delay: i * 2,
            }}
          >
            <svg width="80" height="80" viewBox="0 0 80 80" className="text-brass/20 group-hover:text-brass/40 transition-colors duration-300">
              <polygon
                points="40,5 70,20 70,50 40,65 10,50 10,20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </motion.div>
        ))}

        {/* Floating Geometric Shapes - Diamonds */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`diamond-${i}`}
            className="absolute group cursor-pointer hidden md:block"
              style={{
              left: `${70 + i * 8}%`,
              top: `${35 + i * 15}%`,
            }}
            animate={{
              rotate: [0, -360],
              scale: [0.8, 1.2, 0.8],
              opacity: [0.08, 0.18, 0.08],
            }}
            whileHover={{
              scale: 1.4,
              opacity: 0.3,
              transition: { duration: 0.3 },
            }}
            transition={{
              duration: 15 + i * 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 1.5,
            }}
          >
            <div className="w-12 h-12 border border-brass/25 rotate-45 group-hover:border-brass/50 group-hover:shadow-lg group-hover:shadow-brass/20 transition-all duration-300" />
            </motion.div>
        ))}

        {/* Enhanced Particle System */}
        {[...Array(20)].map((_, i) => (
                <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full bg-brass/30"
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ 
              y: [0, -60 - Math.random() * 40, 0],
              x: [0, (Math.random() - 0.5) * 30, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5 + Math.random(), 1],
            }}
            transition={{ 
              duration: 6 + Math.random() * 8,
              repeat: Infinity, 
              ease: 'easeInOut',
              delay: Math.random() * 5,
            }}
          />
        ))}

        {/* Enhanced Corner Decorative Elements */}
        <motion.div
          className="absolute top-0 left-0 w-80 h-80 z-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-full h-full border-t-2 border-l-2 border-brass/10 rounded-tl-full" />
          <div className="absolute top-8 left-8 w-24 h-24 border-t border-l border-brass/15" />
                </motion.div>
                <motion.div
          className="absolute bottom-0 right-0 w-80 h-80 z-0"
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-full h-full border-b-2 border-r-2 border-brass/10 rounded-br-full" />
          <div className="absolute bottom-8 right-8 w-24 h-24 border-b border-r border-brass/15" />
                </motion.div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center min-h-[80vh] py-16 lg:py-0">
            {/* Left Side - Content */}
            <div className="lg:col-span-3 space-y-6 lg:space-y-8">
              {/* Label */}
                <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex items-center gap-4"
              >
                <div className="w-12 h-px bg-gradient-to-r from-transparent to-brass" />
                <span className="text-brass text-sm font-medium tracking-luxury uppercase">
                  Get in Touch
                </span>
                <div className="w-12 h-px bg-gradient-to-l from-transparent to-brass" />
              </motion.div>

              {/* Hero Title */}
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-serif font-bold text-ivory leading-tight"
              >
                {['Contact', 'Us'].map((word, wordIdx) => (
                  <motion.span
                    key={wordIdx}
                    className="inline-block mr-3"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: 0.6 + wordIdx * 0.2,
                      ease: 'easeOut',
                    }}
                  >
                    {word.split('').map((letter, letterIdx) => (
                      <motion.span
                        key={letterIdx}
                        className="inline-block"
                        initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: 0.8 + wordIdx * 0.2 + letterIdx * 0.05,
                          ease: 'easeOut',
                        }}
              style={{
                          textShadow: wordIdx === 0 ? '0 0 20px rgba(201, 166, 107, 0.3)' : 'none',
                        }}
                      >
                        {letter === ' ' ? '\u00A0' : letter}
                      </motion.span>
                    ))}
                  </motion.span>
                ))}
              </motion.h1>

              {/* Glassmorphism Subtitle Card */}
                <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brass/10 via-olive/5 to-brass/10 rounded-lg blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
                <div className="relative backdrop-blur-md bg-charcoal/40 border border-brass/20 rounded-lg p-6 lg:p-8 shadow-xl shadow-brass/10 group-hover:border-brass/40 transition-all duration-500">
                  <motion.p
                    className="text-ivory/90 text-lg sm:text-xl lg:text-2xl leading-relaxed font-light"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.4 }}
                  >
                    We'd love to hear from you. Reach out and let's start a <span className="text-brass font-medium">conversation</span>.
            </motion.p>
                  <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-brass/30 rounded-tr-lg" />
                  <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-brass/30 rounded-bl-lg" />
                  </div>
                </motion.div>
        </div>

            {/* Right Side - Visual Elements */}
            <div className="lg:col-span-2 relative h-[300px] md:h-[400px] lg:h-[500px] hidden md:block">
              <motion.div
                className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-3/4 bg-gradient-to-b from-transparent via-brass/30 to-transparent"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 1, delay: 1.6 }}
              />

              {/* Floating Brass Elements */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`float-${i}`}
                  className="absolute group cursor-pointer"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${15 + i * 12}%`,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    rotate: [0, 180, 360],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  whileHover={{
                    scale: 1.3,
                    opacity: 0.6,
                    transition: { duration: 0.3 },
                  }}
                  transition={{
                    duration: 8 + i * 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.5,
                  }}
                >
                  <div className="w-16 h-16 border-2 border-brass/20 rounded-lg rotate-45 group-hover:border-brass/50 group-hover:shadow-lg group-hover:shadow-brass/30 transition-all duration-300" />
                </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>

        {/* Bottom Wave Transition */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="relative block w-full h-16"
            style={{ fill: '#FAF8F3' }}
          >
            <path d="M0,0 C150,60 350,60 600,30 C850,0 1050,0 1200,30 L1200,120 L0,120 Z" opacity="0.8" />
            <path d="M0,20 C150,80 350,80 600,50 C850,20 1050,20 1200,50 L1200,120 L0,120 Z" />
          </svg>
          </div>
        </section>

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
            style={{ y: parallaxY1 }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-brass/10 rounded-full blur-3xl" 
          />
          <motion.div
            style={{ y: parallaxY2 }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-olive/10 rounded-full blur-3xl" 
          />

          {/* Floating particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`form-particle-${i}`}
              className="absolute w-1.5 h-1.5 bg-brass/20 rounded-full"
              style={{
                left: `${15 + (i * 10)}%`,
                top: `${20 + (i * 8)}%`,
              }}
            animate={{
                y: [0, -40, 0],
                opacity: [0.1, 0.4, 0.1],
                scale: [1, 1.5, 1],
            }}
            transition={{
                duration: 5 + Math.random() * 5,
              repeat: Infinity,
              ease: "easeInOut",
                delay: i * 0.5,
            }}
          />
          ))}
          
          {/* Subtle pattern overlay */}
          <div 
            className="absolute inset-0 opacity-5 pointer-events-none"
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
            ref={formRef}
            initial={{ opacity: 0, y: 30 }}
            animate={formInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
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
            animate={formInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
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
              <label htmlFor="category" className="block text-ivory font-medium mb-2">
                Inquiry Category <span className="text-brass">*</span>
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full px-4 py-3 bg-zinc-900 border border-brass/20 rounded-lg text-ivory focus:outline-none focus:ring-2 focus:ring-brass/50 focus:border-brass transition-all duration-300"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-zinc-900 text-ivory">
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-ivory/50">
                Please select the category that best describes your inquiry
              </p>
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
        {/* Bottom wave transition to Contact Information Section */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
          <svg 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none" 
            className="relative block w-full h-16"
            style={{ fill: '#FAF8F3' }}
          >
            <path d="M0,0 C150,60 350,60 600,30 C850,0 1050,0 1200,30 L1200,120 L0,120 Z" opacity="0.8" />
            <path d="M0,20 C150,80 350,80 600,50 C850,20 1050,20 1200,50 L1200,120 L0,120 Z" />
          </svg>
        </div>
      </section>

      {/* Contact Information Section */}
      {(addresses.length > 0 || phones.length > 0 || emails.length > 0 || socialPlatforms.length > 0 || whatsAppNumber) && (
        <section className="min-h-screen bg-ivory relative overflow-hidden">
          {/* Top wave transition - removed since Contact Form is now above */}

          {/* Animated Brass Texture Overlay */}
            <motion.div
            className="absolute inset-0 opacity-3 pointer-events-none"
              animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }}
              transition={{
              duration: 30,
                repeat: Infinity,
              ease: 'linear',
              }}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A66B' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '80px 80px',
            }}
            />

          {/* Subtle Gradient Orbs */}
            <motion.div
            className="absolute top-1/4 right-1/4 w-96 h-96 bg-brass/5 rounded-full blur-3xl"
              animate={{
              scale: [1, 1.1, 1],
              opacity: [0.05, 0.08, 0.05],
              }}
              transition={{
              duration: 15,
                repeat: Infinity,
              ease: 'easeInOut',
              }}
            />
            <motion.div
            className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-olive/5 rounded-full blur-3xl"
              animate={{
              scale: [1.1, 1, 1.1],
              opacity: [0.04, 0.07, 0.04],
              }}
              transition={{
              duration: 12,
                repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
          />

          {/* Animated lines */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={`contact-line-${i}`}
              className="absolute h-px bg-gradient-to-r from-transparent via-brass/4 to-transparent"
              style={{
                top: `${25 + i * 18}%`,
                left: 0,
                right: 0,
              }}
              animate={{
                opacity: [0.03, 0.12, 0.03],
                scaleX: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 1.5,
              }}
            />
          ))}

          {/* Floating Particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`contact-particle-${i}`}
              className="absolute w-1.5 h-1.5 bg-brass/15 rounded-full"
              style={{
                left: `${15 + i * 12}%`,
                top: `${20 + i * 10}%`,
              }}
              animate={{
                y: [0, -25, 0],
                opacity: [0.08, 0.2, 0.08],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 6 + Math.random() * 4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.8,
              }}
            />
          ))}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-24 lg:py-32">
            <div className="text-center mb-16 lg:mb-20">
              <span className="text-brass text-sm font-medium tracking-luxury uppercase">Ways to Connect</span>
              <div className="w-16 h-0.5 bg-brass mx-auto mt-3 mb-8" />
              <h2 className="font-serif text-4xl lg:text-5xl text-charcoal mb-4">
                Let's Start a Conversation
              </h2>
              <p className="text-charcoal/60 text-lg max-w-3xl mx-auto">
                Choose your preferred way to reach us
              </p>
            </div>

            {/* White Card Container for Better Readability - Sticky */}
            <div className="bg-white rounded-2xl shadow-2xl border border-brass/10 p-8 lg:p-12 relative overflow-hidden sticky top-8">
              {/* Subtle background pattern overlay */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A66B' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundSize: '60px 60px'
                }}
              />
              
              {/* Decorative corner elements */}
              <div className="absolute top-6 right-6 w-16 h-16 border-t-2 border-r-2 border-brass/20 rounded-tr-xl" />
              <div className="absolute bottom-6 left-6 w-16 h-16 border-b-2 border-l-2 border-brass/20 rounded-bl-xl" />

              {/* Two-Sided Layout: Contact Methods (Left) + Google Maps (Right) */}
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 min-h-[600px] lg:min-h-[700px] relative z-10">
              {/* Left Side - Contact Methods (Non-Card Design) */}
                <div className="space-y-8 lg:space-y-12">
                {/* Email Section */}
                {emails.length > 0 && (
                  <div className="group relative">
                    <div className="flex items-start gap-6 pb-8 border-b border-brass/20 group-hover:border-brass/40 transition-colors duration-500">
                <motion.div
                        className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-brass/20 to-brass/10 flex items-center justify-center group-hover:from-brass/30 group-hover:to-brass/20 transition-all duration-500"
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      >
                        <svg className="w-8 h-8 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-2xl text-brass mb-4 tracking-wide">Email</h3>
                        <div className="space-y-3">
                          {emails.map((item, idx) => (
                            <div
                              key={item._id}
                              className="group/item"
                            >
                            {item.label && (
                                <p className="text-charcoal/70 font-medium mb-1 text-xs uppercase tracking-wide">{item.label}</p>
                              )}
                              {item.value && (
                                <a 
                                  href={`mailto:${item.value}`}
                                  className="text-charcoal/90 hover:text-brass transition-colors duration-300 text-lg font-medium break-all block group-hover/item:translate-x-2 transition-transform"
                                >
                                  {item.value}
                                </a>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

                {/* Phone Section */}
              {phones.length > 0 && phones.some(item => (item.phones && Array.isArray(item.phones) && item.phones.length > 0) || item.value) && (
                <div className="group relative">
                    <div className="flex items-start gap-6 pb-8 border-b border-brass/20 group-hover:border-brass/40 transition-colors duration-500">
                <motion.div
                        className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-brass/20 to-brass/10 flex items-center justify-center group-hover:from-brass/30 group-hover:to-brass/20 transition-all duration-500"
                        whileHover={{ rotate: 15, scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <svg className="w-8 h-8 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-2xl text-brass mb-4 tracking-wide">Phone</h3>
                        <div className="space-y-4">
                          {phones
                            .filter(item => (item.phones && Array.isArray(item.phones) && item.phones.length > 0) || item.value)
                            .map((item, idx) => {
                            // New format: use phones array if available
                            if (item.phones && Array.isArray(item.phones) && item.phones.length > 0) {
                              return item.phones.map((phone, phoneIdx) => (
                                <div
                                  key={`${item._id}-${phoneIdx}`}
                                  className="group/item"
                                >
                                  {(phone.label || phone.type) && (
                                    <p className="text-charcoal/70 font-medium mb-2 text-xs uppercase tracking-wide">
                                      {phone.label || phone.type.charAt(0).toUpperCase() + phone.type.slice(1)}
                                    </p>
                                  )}
                                  <a 
                                    href={`tel:${phone.number.replace(/\s/g, '')}`}
                                    className="text-charcoal/90 hover:text-brass transition-colors duration-300 text-lg font-medium block group-hover/item:translate-x-2 transition-transform"
                                  >
                                    {phone.number}
                                  </a>
                                </div>
                              ))
                            }
                            // Backward compatibility: use value field if phones array not available
                            else if (item.value) {
                              return (
                                <div
                                  key={item._id}
                                  className="group/item"
                                >
                                  {item.label && (
                                    <p className="text-charcoal/70 font-medium mb-2 text-xs uppercase tracking-wide">{item.label}</p>
                                  )}
                                  <a 
                                    href={`tel:${item.value.replace(/\s/g, '')}`}
                                    className="text-charcoal/90 hover:text-brass transition-colors duration-300 text-lg font-medium block group-hover/item:translate-x-2 transition-transform"
                                  >
                                    {item.value}
                                  </a>
                                </div>
                              )
                            }
                            return null
                          })}
                          </div>
                    </div>
                  </div>
                </div>
              )}

                {/* WhatsApp Section */}
                {whatsAppNumber && (
                  <div className="group relative">
                    <div className="flex items-start gap-6 pb-8 border-b border-brass/20 group-hover:border-brass/40 transition-colors duration-500">
                <motion.div
                        className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-brass/20 to-brass/10 flex items-center justify-center group-hover:from-brass/30 group-hover:to-brass/20 transition-all duration-500"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <svg className="w-8 h-8 text-brass" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-2xl text-brass mb-3 tracking-wide">WhatsApp</h3>
                        <a 
                          href={`https://wa.me/${whatsAppNumber.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-charcoal/90 hover:text-brass transition-colors duration-300 text-lg font-medium block group-hover:translate-x-2 transition-transform"
                        >
                          {whatsAppNumber}
                        </a>
                        <p className="text-charcoal/60 text-sm mt-2">Instant messaging</p>
                          </div>
                      </div>
                    </div>
              )}

                {/* Follow Us Section */}
              {socialPlatforms.length > 0 && (
                  <div className="group relative">
                    <div className="flex items-start gap-6">
                <motion.div
                        className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-olive/20 to-olive/10 flex items-center justify-center group-hover:from-olive/30 group-hover:to-olive/20 transition-all duration-500"
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      >
                        <svg className="w-8 h-8 text-olive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-2xl text-olive mb-6 tracking-wide">Follow Us</h3>
                        <div className="space-y-3">
                        {socialPlatforms.map((platform, index) => (
                            <a
                            key={`${platform.icon}-${index}`}
                            href={platform.url}
                            target="_blank"
                            rel="noopener noreferrer"
                              className="group/item flex items-center gap-3 p-3 rounded-lg hover:bg-olive/10 transition-all duration-300"
                          >
                              <SocialMediaIcon platform={platform.icon} className="w-6 h-6 text-charcoal/70 group-hover/item:text-olive transition-colors flex-shrink-0" />
                              <span className="text-charcoal/90 group-hover/item:text-olive transition-colors text-base font-medium">{platform.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </div>

              {/* Right Side - Google Maps + Address */}
              {addresses.length > 0 && (
                <div className="relative h-full min-h-[600px] lg:min-h-[700px]">
                  <div className="sticky top-8 space-y-6">
                    {/* Address Text */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-olive/20 to-olive/10 flex items-center justify-center">
                          <svg className="w-6 h-6 text-olive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
            </div>
                        <h3 className="font-serif text-2xl text-olive tracking-wide">Address</h3>
                      </div>
                      <div className="space-y-4 pl-16">
                        {addresses.map((item) => (
                          <div key={item._id} className="space-y-2">
                            {item.label && (
                              <p className="text-charcoal font-semibold text-sm uppercase tracking-wide">{item.label}</p>
                            )}
                            {item.value && (
                              <p className="text-charcoal/80 leading-relaxed whitespace-pre-wrap text-base">{item.value}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Google Maps Container */}
                    <div className="relative w-full h-[400px] lg:h-[500px] rounded-2xl overflow-hidden border-2 border-brass/20 shadow-xl group hover:border-brass/40 transition-all duration-500">
                      {/* Google Maps iframe - Ready for API integration */}
                      {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && addresses.length > 0 ? (
                        <iframe
                          className="w-full h-full border-0"
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(addresses[0]?.value || '')}`}
                          title="Location Map"
                        />
                      ) : (
                        /* Placeholder when API key is not configured */
                        <div className="absolute inset-0 bg-gradient-to-br from-charcoal/10 via-charcoal/5 to-olive/5 flex items-center justify-center">
                          <div className="text-center space-y-4 p-8">
                            <motion.div
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            >
                              <svg className="w-16 h-16 text-brass/40 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </motion.div>
                            <div className="space-y-2">
                              <p className="text-charcoal/70 text-base font-medium">Google Maps Integration</p>
                              <p className="text-charcoal/50 text-sm">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file</p>
                              <p className="text-charcoal/40 text-xs mt-4 p-3 bg-charcoal/5 rounded border border-brass/10">
                                The map will automatically display when the API key is configured
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Decorative corner elements */}
                      <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-brass/20 rounded-tr-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-brass/20 rounded-bl-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </section>
      )}

      <BackToTopButton />
      <LuxuryFooter />
    </div>
  )
}

