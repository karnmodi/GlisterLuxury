'use client'

import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'

/**
 * Render text with markdown-style bold (**text**) converted to HTML
 */
const renderBoldText = (text: string) => {
  // Split by **text** patterns while preserving them
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const boldText = part.slice(2, -2)
      return <strong key={index} className="font-semibold text-charcoal">{boldText}</strong>
    }
    return <span key={index}>{part}</span>
  })
}

export default function CookiePolicyPage() {
  const sections = [
    {
      id: 'introduction',
      title: '1. Introduction',
      content: 'This Cookie Policy explains how Glister Luxury Limited ("we", "us", "our") uses cookies and similar tracking technologies on our website www.glisterlondon.co.uk (the "Site"). This policy should be read alongside our Privacy Policy.\n\nBy using our Site, you consent to the use of cookies in accordance with this Cookie Policy.'
    },
    {
      id: 'what-are-cookies',
      title: '2. What Are Cookies',
      content: 'Cookies are small text files that are placed on your device (computer, tablet, or mobile) when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.\n\nCookies can be:\n\n• Session cookies: Temporary cookies that expire when you close your browser\n• Persistent cookies: Cookies that remain on your device for a set period or until you delete them\n• First-party cookies: Set by the website you are visiting\n• Third-party cookies: Set by a domain other than the website you are visiting'
    },
    {
      id: 'cookie-categories',
      title: '3. Types of Cookies We Use',
      content: 'We use the following categories of cookies:\n\n**Essential Cookies:** These cookies are necessary for the website to function and cannot be switched off. They are usually set in response to actions you take, such as logging in or filling in forms.\n\n**Functional Cookies:** These cookies enable enhanced functionality and personalization, such as remembering your preferences and maintaining your shopping cart.\n\n**Analytics Cookies:** These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.'
    },
    {
      id: 'cookies-we-use',
      title: '4. Cookies We Use',
      content: 'Below is a detailed list of cookies and tracking technologies used on our website:\n\n**Essential Cookies:**\n\n• **sessionID** (First-party)\n  - Purpose: Tracks website visits for analytics and session management\n  - Duration: 30 days\n  - Type: HTTP-only cookie, secure in production\n  - Category: Essential\n\n• **glister_auth_token** (First-party)\n  - Purpose: Maintains user authentication status\n  - Duration: 7 days\n  - Type: Secure, HTTP-only cookie\n  - Category: Essential\n\n**Functional/Performance Storage:**\n\n• **glister_session_id** (LocalStorage)\n  - Purpose: Maintains session tracking for shopping cart, wishlist, and analytics. This is stored in your browser\'s localStorage rather than as a cookie.\n  - Duration: 30 days or until manually cleared\n  - Type: LocalStorage (browser storage)\n  - Category: Functional'
    },
    {
      id: 'tracking-technologies',
      title: '5. Tracking Technologies',
      content: 'In addition to cookies, we use the following tracking technologies:\n\n**Website Visit Tracking:**\n\nOur website automatically tracks page visits to help us understand how users interact with our site. This includes:\n\n• Page views and navigation patterns\n• Unique visitor identification using session IDs\n• Device type detection (desktop, mobile, tablet)\n• Referrer information (where visitors came from)\n\nThis tracking helps us improve our website functionality and user experience. Data collected is anonymized and used solely for analytical purposes.\n\n**Google Analytics:**\n\nWe may use Google Analytics or similar analytics services to help us understand website usage. If implemented, these services use cookies to collect information about your use of our website. For more information, visit Google\'s Privacy Policy.'
    },
    {
      id: 'third-party-cookies',
      title: '6. Third-Party Cookies',
      content: 'We may use third-party services that set cookies on your device:\n\n**Payment Processors:** When you make a purchase, our payment processors may set cookies necessary for processing your transaction securely.\n\n**Analytics Providers:** If we use Google Analytics or similar services, they may set cookies to track and analyze website usage.\n\nThese third-party cookies are subject to the respective third party\'s privacy and cookie policies. We do not have control over these cookies.'
    },
    {
      id: 'manage-cookies',
      title: '7. How to Manage Cookies',
      content: 'You have several options to manage or disable cookies:\n\n**Browser Settings:**\n\nMost web browsers allow you to control cookies through their settings. You can:\n\n• Block all cookies\n• Block third-party cookies only\n• Delete existing cookies\n• Set your browser to notify you when cookies are set\n\nNote: Disabling essential cookies may affect your ability to use certain features of our website, such as logging in or making purchases.\n\n**LocalStorage Management:**\n\nTo clear localStorage data (including glister_session_id), you can:\n\n• Clear your browser\'s browsing data through browser settings\n• Use browser developer tools to remove specific localStorage items\n• Clear all site data for glisterlondon.co.uk\n\n**Mobile Devices:**\n\nOn mobile devices, cookie settings are typically found in your browser app settings or device settings.'
    },
    {
      id: 'cookie-preferences',
      title: '8. Your Cookie Preferences',
      content: 'Essential cookies are required for our website to function properly and cannot be disabled. However, you can manage non-essential cookies through your browser settings.\n\nIf you have questions about our use of cookies or would like more information, please contact us using the details provided in the "Contact Us" section.'
    },
    {
      id: 'updates',
      title: '9. Updates to This Policy',
      content: 'We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. Any changes will be posted on this page with an updated "last modified" date.\n\nWe encourage you to review this Cookie Policy periodically to stay informed about how we use cookies.'
    },
    {
      id: 'contact',
      title: '10. Contact Us',
      content: 'If you have any questions, concerns, or requests regarding our use of cookies, please contact us at:\n\nEmail: enquiries@glisterlondon.com\n\nAddress: Glister Luxury Limited, 16 Northfield Park, Hayes, England, UB3 4NU'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-ivory via-cream to-ivory">
      <LuxuryNavigation />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-8 sm:pt-28 sm:pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-charcoal mb-3 tracking-wide">
              Cookie Policy
            </h1>
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-brass to-transparent mx-auto mb-4" />
            <p className="text-sm sm:text-base text-charcoal/70 mb-4 max-w-2xl mx-auto leading-relaxed">
              Learn how we use cookies and similar technologies to improve your experience on our website.
            </p>
            <p className="text-xs text-charcoal/60">
              Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="pb-16 sm:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur-sm border border-charcoal/10 rounded-lg shadow-lg p-6 sm:p-8 lg:p-12">
            <div className="space-y-10">
              {sections.map((section) => (
                <div key={section.id} className="pb-10 border-b border-charcoal/10 last:border-b-0 last:pb-0">
                  <h2 className="text-lg sm:text-xl font-serif font-bold text-charcoal mb-4 pb-2 border-b-2 border-brass/30">
                    {section.title}
                  </h2>
                  <div className="text-sm sm:text-base text-charcoal/85 leading-relaxed whitespace-pre-wrap">
                    {section.content.split('\n').map((line, lineIndex) => {
                      // Check if line contains bold markdown
                      if (line.includes('**')) {
                        return (
                          <div key={lineIndex} className="mb-2 last:mb-0">
                            {renderBoldText(line)}
                          </div>
                        )
                      }
                      // Regular line with line breaks preserved
                      return line ? (
                        <div key={lineIndex} className="mb-2 last:mb-0">{line}</div>
                      ) : (
                        <br key={lineIndex} />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-gradient-charcoal py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-ivory mb-3 sm:mb-4">
            Questions About Our Cookie Policy?
          </h2>
          <p className="text-ivory/70 mb-6 sm:mb-8 max-w-2xl mx-auto text-sm leading-relaxed">
            Our team is here to help clarify any questions you may have about how we use cookies and tracking technologies.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <a
              href="/contact"
              className="px-6 py-3 bg-brass text-charcoal font-medium text-sm rounded-sm hover:bg-olive transition-all duration-300 hover:shadow-lg hover:shadow-brass/50"
            >
              Contact Us
            </a>
            <a
              href="/privacy"
              className="px-6 py-3 border border-brass text-brass font-medium text-sm rounded-sm hover:bg-brass hover:text-charcoal transition-all duration-300"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </section>

      <LuxuryFooter />
    </div>
  )
}

