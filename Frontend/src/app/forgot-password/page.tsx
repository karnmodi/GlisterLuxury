'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { authApi } from '@/lib/auth'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      await authApi.forgotPassword({ email })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setLoading(false)
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
              Forgot Password
            </h1>
            <p className="text-brass text-sm tracking-luxury">
              Enter your email to reset your password
            </p>
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-8 shadow-2xl"
          >
            {success ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-serif text-ivory mb-2">Check Your Email</h3>
                <p className="text-ivory/70 text-sm mb-6">
                  We&apos;ve sent a password reset link to <span className="text-brass">{email}</span>
                </p>
                <Link
                  href="/login"
                  className="inline-block px-6 py-3 bg-brass text-charcoal font-medium tracking-wide rounded-md hover:bg-olive transition-all duration-300"
                >
                  Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-900/20 border border-red-500/50 rounded-md p-4"
                  >
                    <p className="text-red-400 text-sm">{error}</p>
                  </motion.div>
                )}

                <div>
                  <label htmlFor="email" className="block text-ivory text-sm font-medium mb-2">
                    Email Address <span className="text-brass">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass transition-colors"
                    placeholder="john@example.com"
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full px-6 py-3 bg-brass text-charcoal font-medium tracking-wide rounded-md hover:bg-olive transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            )}

            {!success && (
              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-brass text-sm hover:text-olive transition-colors duration-300"
                >
                  Back to Login
                </Link>
              </div>
            )}
          </motion.div>
        </motion.div>
      </main>

      <LuxuryFooter />
    </div>
  )
}

