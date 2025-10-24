'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'

export default function RegisterPage() {
  const { register, loading } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const errors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    } else if (formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    if (!validateForm()) {
      return
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-charcoal">
      <LuxuryNavigation />
      
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-serif font-bold text-ivory mb-2 tracking-wide">
              Create Account
            </h1>
            <p className="text-brass text-sm tracking-luxury">
              Join the Glister London family
            </p>
          </div>

          {/* Registration Form */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-8 shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-900/20 border border-red-500/50 rounded-md p-4"
                >
                  <p className="text-red-400 text-sm">{error}</p>
                </motion.div>
              )}

              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-ivory text-sm font-medium mb-2">
                  Full Name <span className="text-brass">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-charcoal border ${
                    fieldErrors.name ? 'border-red-500' : 'border-brass/30'
                  } text-ivory rounded-md focus:outline-none focus:border-brass transition-colors`}
                  placeholder="John Doe"
                  disabled={loading}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-red-400 text-xs">{fieldErrors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-ivory text-sm font-medium mb-2">
                  Email Address <span className="text-brass">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-charcoal border ${
                    fieldErrors.email ? 'border-red-500' : 'border-brass/30'
                  } text-ivory rounded-md focus:outline-none focus:border-brass transition-colors`}
                  placeholder="john@example.com"
                  disabled={loading}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-red-400 text-xs">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-ivory text-sm font-medium mb-2">
                  Password <span className="text-brass">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-charcoal border ${
                    fieldErrors.password ? 'border-red-500' : 'border-brass/30'
                  } text-ivory rounded-md focus:outline-none focus:border-brass transition-colors`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-red-400 text-xs">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-ivory text-sm font-medium mb-2">
                  Confirm Password <span className="text-brass">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-charcoal border ${
                    fieldErrors.confirmPassword ? 'border-red-500' : 'border-brass/30'
                  } text-ivory rounded-md focus:outline-none focus:border-brass transition-colors`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-red-400 text-xs">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-brass text-charcoal font-medium tracking-wide rounded-md hover:bg-olive transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-ivory/70 text-sm">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-brass hover:text-olive transition-colors duration-300 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </motion.div>

          {/* Additional Info */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-center text-ivory/50 text-xs mt-6"
          >
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </motion.p>
        </motion.div>
      </main>

      <LuxuryFooter />
    </div>
  )
}

