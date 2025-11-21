'use client'

import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'

export default function PrivacyPolicyPage() {
  const sections = [
    {
      id: 'introduction',
      title: '1. Introduction',
      content: 'Welcome to Glister Luxury Limited ("we", "us", "our").\n\nWe respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and share your information when you visit our website www.glisterlondon.co.uk (the "Site") or otherwise interact with us.\n\nBy using our Site, you agree to the terms of this Privacy Policy.'
    },
    {
      id: 'who-we-are',
      title: '2. Who We Are',
      content: 'Glister Luxury Limited\n\nRegistered in: United Kingdom\n\nIf you have any questions about this Privacy Policy or your data, please contact us at:\n\nEmail: enquiries@glisterluxury.com'
    },
    {
      id: 'data-collection',
      title: '3. Data We Collect',
      content: 'We may collect and process the following types of personal data:\n\n• Identity Data: first name, last name.\n\n• Contact Data: email address, phone number (if provided).\n\n• Payment Data: payment card details and billing information (processed securely via third-party payment providers).\n\n• Technical Data: IP address, browser type, device information, cookies, and usage data.'
    },
    {
      id: 'data-use',
      title: '4. How We Use Your Data',
      content: 'We use your personal data for the following purposes:\n\n• To provide and manage our products or services.\n\n• To process payments and fulfil orders.\n\n• To communicate with you (e.g., responding to enquiries via email or contact form).\n\n• To send marketing communications (only where you have given consent).\n\n• To analyse website usage and improve our Site and services.\n\n• To comply with legal or regulatory obligations.'
    },
    {
      id: 'data-sharing',
      title: '5. Sharing Your Data',
      content: 'We may share your personal data with:\n\n• Service providers (e.g., payment processors, delivery partners, email and hosting services).\n\n• Analytics providers (such as Google Analytics) to help us understand website usage.\n\n• Professional advisers (e.g., accountants, legal advisers) where necessary.\n\n• Regulatory authorities where required by law.\n\nWe do not sell your personal data. All third parties are required to respect the security of your data and to process it in accordance with the law.'
    },
    {
      id: 'international-transfers',
      title: '6. International Data Transfers',
      content: 'Some of our third-party service providers may be based outside the UK. In such cases, we ensure your data is protected by requiring that they follow the UK\'s data protection laws or equivalent safeguards.'
    },
    {
      id: 'data-retention',
      title: '7. Data Retention',
      content: 'We will keep your personal data only for as long as necessary to fulfil the purposes we collected it for, including any legal, accounting, or reporting requirements.'
    },
    {
      id: 'your-rights',
      title: '8. Your Rights',
      content: 'Under UK data protection law, you have the right to:\n\n• Request access to your personal data.\n\n• Request correction or deletion of your data.\n\n• Object to or restrict processing of your data.\n\n• Withdraw consent at any time (for example, to unsubscribe from marketing).\n\n• Lodge a complaint with the Information Commissioner\'s Office (ICO) if you believe your data has been mishandled.\n\nFor more information, visit www.ico.org.uk.'
    },
    {
      id: 'cookies',
      title: '9. Cookies',
      content: 'Our website uses cookies and similar technologies to improve user experience and analyse traffic. You can manage cookie preferences through your browser settings. For more details, please see our Cookie Policy (if applicable).'
    },
    {
      id: 'security',
      title: '10. Security',
      content: 'We use appropriate technical and organisational measures to protect your personal data against unauthorised access, loss, or misuse. However, no online transmission is completely secure, and we cannot guarantee absolute security.'
    },
    {
      id: 'changes',
      title: '11. Changes to This Policy',
      content: 'We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "last modified" date.'
    },
    {
      id: 'contact',
      title: '12. Contact Us',
      content: 'If you have any questions, requests, or complaints regarding this Privacy Policy, please contact us at:\n\nEmail: enquiries@glisterluxury.com\n\nAddress: Glister Luxury Limited, 16 Northfield Park, Hayes, England, UB3 4NU'
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
              Privacy Policy
            </h1>
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-brass to-transparent mx-auto mb-4" />
            <p className="text-sm sm:text-base text-charcoal/70 mb-4 max-w-2xl mx-auto leading-relaxed">
              Your privacy is important to us. Learn how we collect, use, and protect your personal information.
            </p>
            <p className="text-xs text-charcoal/60">
              Last updated: 31 October 2025
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
                    {section.content}
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
            Questions About Our Privacy Policy?
          </h2>
          <p className="text-ivory/70 mb-6 sm:mb-8 max-w-2xl mx-auto text-sm leading-relaxed">
            Our team is here to help clarify any questions you may have about how we handle your personal information.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <a
              href="/contact"
              className="px-6 py-3 bg-brass text-charcoal font-medium text-sm rounded-sm hover:bg-olive transition-all duration-300 hover:shadow-lg hover:shadow-brass/50"
            >
              Contact Us
            </a>
            <a
              href="/faqs"
              className="px-6 py-3 border border-brass text-brass font-medium text-sm rounded-sm hover:bg-brass hover:text-charcoal transition-all duration-300"
            >
              View FAQs
            </a>
          </div>
        </div>
      </section>

      <LuxuryFooter />
    </div>
  )
}
