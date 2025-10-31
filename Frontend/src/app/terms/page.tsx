'use client'

import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-ivory via-cream to-ivory">
      <LuxuryNavigation />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-8 sm:pt-28 sm:pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-charcoal mb-3 tracking-wide">
              GLISTER LONDON LIMITED – TERMS & CONDITIONS
            </h1>
            <div className="w-20 h-px bg-gradient-to-r from-transparent via-brass to-transparent mx-auto mb-4" />
            <p className="text-sm text-charcoal/60">
              Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="pb-16 sm:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur-sm border border-charcoal/10 rounded-lg shadow-lg p-6 sm:p-8 lg:p-12">
            <div className="prose prose-slate max-w-none text-charcoal/85 leading-relaxed">
              
              {/* Section 1 */}
              <div className="mb-10">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-charcoal mb-4 pb-2 border-b-2 border-brass/30">
                  1. PRICES
                </h2>
                <p className="text-sm sm:text-base leading-relaxed">
                  All prices shown include VAT. Glister London Limited ("the Company") reserves the right to modify prices and general sales conditions at any time without prior notice.
                </p>
              </div>

              <div className="border-t border-charcoal/10 my-10"></div>

              {/* Section 2 */}
              <div className="mb-10">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-charcoal mb-4 pb-2 border-b-2 border-brass/30">
                  2. ORDERS
                </h2>
                <div className="space-y-3">
                  <p className="text-sm sm:text-base leading-relaxed">
                    All orders are subject to the Company's approval and acceptance, and are governed entirely by these Terms and Conditions of Sale.
                  </p>
                  <p className="text-sm sm:text-base leading-relaxed">
                    Orders are confirmed at the prices listed in the current catalogue. Any amendments to orders communicated verbally or by telephone must be confirmed in writing by the customer.
                  </p>
                  <p className="text-sm sm:text-base leading-relaxed">
                    Orders may not be cancelled without the Company's written consent. The Company reserves the right to apply appropriate charges for any agreed cancellations.
                  </p>
                  <p className="text-sm sm:text-base leading-relaxed">
                    The minimum order value for any item is £250.00 excluding VAT. Orders below this value will incur an additional carriage fee.
                  </p>
                </div>
              </div>

              <div className="border-t border-charcoal/10 my-10"></div>

              {/* Section 3 */}
              <div className="mb-10">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-charcoal mb-4 pb-2 border-b-2 border-brass/30">
                  3. DELIVERY
                </h2>
                <p className="text-sm sm:text-base leading-relaxed">
                  The Company will endeavour to deliver goods by the date quoted; however, all delivery dates are estimates and are not guaranteed. Delivery dates may be extended by a reasonable period where delays occur due to circumstances beyond the Company's reasonable control.
                </p>
              </div>

              <div className="border-t border-charcoal/10 my-10"></div>

              {/* Section 4 */}
              <div className="mb-10">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-charcoal mb-4 pb-2 border-b-2 border-brass/30">
                  4. PACKAGING
                </h2>
                <p className="text-sm sm:text-base leading-relaxed">
                  All products are packaged by fully trained warehouse staff to ensure they leave the premises in optimum condition. The Company accepts no liability for damage arising from mishandling during transit.
                </p>
              </div>

              <div className="border-t border-charcoal/10 my-10"></div>

              {/* Section 5 */}
              <div className="mb-10">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-charcoal mb-4 pb-2 border-b-2 border-brass/30">
                  5. PRODUCT COMPATIBILITY
                </h2>
                <div className="space-y-3">
                  <p className="text-sm sm:text-base leading-relaxed">
                    Most Glister London products are compatible with UK specifications. Customers are advised to ensure product suitability prior to ordering to prevent installation issues.
                  </p>
                  <p className="text-sm sm:text-base leading-relaxed">
                    The Company reserves the right to make technical changes, modify, or discontinue models at any time. All product details and dimensions are approximate; therefore, pre-drilling or preparation for installation should not occur prior to delivery.
                  </p>
                  <p className="text-sm sm:text-base leading-relaxed">
                    The Company will not be liable for any fitting issues resulting from pre-installation work completed before receipt of goods.
                  </p>
                </div>
              </div>

              <div className="border-t border-charcoal/10 my-10"></div>

              {/* Section 6 */}
              <div className="mb-10">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-charcoal mb-4 pb-2 border-b-2 border-brass/30">
                  6. PAYMENT TERMS
                </h2>
                <div className="space-y-3">
                  <p className="text-sm sm:text-base leading-relaxed">
                    Payment for goods must be made no later than the end of the calendar month following the invoice date. All payments must be made in full, without any deduction or set-off.
                  </p>
                  <p className="text-sm sm:text-base leading-relaxed">
                    Failure to adhere to these terms entitles the Company to suspend further deliveries or cancel any outstanding contracts.
                  </p>
                  <p className="text-sm sm:text-base leading-relaxed">
                    Overdue payments will attract interest at 5% above the HSBC Bank base rate, calculated daily until payment is received in full.
                  </p>
                </div>
              </div>

              <div className="border-t border-charcoal/10 my-10"></div>

              {/* Section 7 */}
              <div className="mb-10">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-charcoal mb-4 pb-2 border-b-2 border-brass/30">
                  7. RETENTION OF TITLE
                </h2>
                <p className="text-sm sm:text-base leading-relaxed">
                  All goods remain the exclusive property of Glister London Limited until full payment has been received by the Company.
                </p>
              </div>

              <div className="border-t border-charcoal/10 my-10"></div>

              {/* Section 8 */}
              <div className="mb-10">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-charcoal mb-4 pb-2 border-b-2 border-brass/30">
                  8. COMPANY LIABILITY
                </h2>

                {/* 8.1 */}
                <div className="ml-4 sm:ml-6 mb-8 mt-6">
                  <h3 className="text-base sm:text-lg font-serif font-semibold text-charcoal mb-3">
                    8.1 Statutory Exclusions
                  </h3>
                  <p className="text-sm sm:text-base mb-3 leading-relaxed">
                    Nothing in these Terms shall exclude or restrict the Company's liability:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-sm sm:text-base leading-relaxed">
                    <li>For death or personal injury resulting from the Company's negligence;</li>
                    <li>For fraud or fraudulent misrepresentation; or</li>
                    <li>Under Section 2(3) of the Consumer Protection Act 1987, or any other matter where exclusion would be unlawful.</li>
                  </ul>
                </div>

                {/* 8.2 */}
                <div className="ml-4 sm:ml-6 mb-8">
                  <h3 className="text-base sm:text-lg font-serif font-semibold text-charcoal mb-3">
                    8.2 Warranties on Delivery
                  </h3>
                  <p className="text-sm sm:text-base mb-3 leading-relaxed">
                    Subject to the provisions below, upon delivery the Company warrants that:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-sm sm:text-base leading-relaxed">
                    <li>The goods shall be of satisfactory materials and workmanship; and</li>
                    <li>The goods shall be reasonably fit for any particular purpose made known in writing by the buyer and confirmed in writing by an authorised representative of the Company.</li>
                  </ul>
                </div>

                {/* 8.3 */}
                <div className="ml-4 sm:ml-6 mb-8">
                  <h3 className="text-base sm:text-lg font-serif font-semibold text-charcoal mb-3">
                    8.3 Notice of Defects
                  </h3>
                  <p className="text-sm sm:text-base mb-3 leading-relaxed">
                    The Company shall not be liable for breach of the warranties in Clause 8.2 unless:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-sm sm:text-base leading-relaxed mb-3">
                    <li>The defect is discovered within 7 days of delivery and reported in writing to the Company within 7 days of discovery;</li>
                    <li>The buyer does not continue to use the goods after giving notice of the defect;</li>
                    <li>The buyer has complied with all payment terms; and</li>
                    <li>The Company is given a reasonable opportunity to inspect the goods before they are used, fixed, or altered. If requested, the buyer must return the goods (at their cost) for inspection. If the defect is accepted, the Company will reimburse reasonable return costs.</li>
                  </ul>
                  <p className="text-sm sm:text-base leading-relaxed">
                    The Company shall not be liable if defects arise due to misuse, negligence, fair wear and tear, unauthorised alterations, improper installation, or use in abnormal conditions.
                  </p>
                </div>

                {/* 8.4 */}
                <div className="ml-4 sm:ml-6 mb-8">
                  <h3 className="text-base sm:text-lg font-serif font-semibold text-charcoal mb-3">
                    8.4 Remedies
                  </h3>
                  <p className="text-sm sm:text-base mb-3 leading-relaxed">
                    Subject to Clause 8.3, if goods fail to meet the warranties in Clause 8.2, the Company will, at its sole discretion:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-sm sm:text-base leading-relaxed">
                    <li>Repair or replace the goods (or defective parts); or</li>
                    <li>Refund the price of the goods at the pro-rata contract rate.</li>
                  </ul>
                  <p className="text-sm sm:text-base mt-3 leading-relaxed">
                    Once the Company complies with this clause, it shall have no further liability for such goods.
                  </p>
                </div>

                {/* 8.5 */}
                <div className="ml-4 sm:ml-6 mb-8">
                  <h3 className="text-base sm:text-lg font-serif font-semibold text-charcoal mb-3">
                    8.5 Goods Manufactured to Buyer Specifications
                  </h3>
                  <p className="text-sm sm:text-base mb-3 leading-relaxed">
                    Where goods are manufactured or processed according to the buyer's design, specification, or approval:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-sm sm:text-base leading-relaxed">
                    <li>The Company shall have no liability (except for fraud or authorised misrepresentation) for defects or infringement of third-party intellectual property rights; and</li>
                    <li>The buyer shall indemnify the Company in full against all related losses, damages, and costs.</li>
                  </ul>
                </div>

                {/* 8.6 */}
                <div className="ml-4 sm:ml-6 mb-8">
                  <h3 className="text-base sm:text-lg font-serif font-semibold text-charcoal mb-3">
                    8.6 Limitation of Liability
                  </h3>
                  <p className="text-sm sm:text-base mb-3 leading-relaxed">
                    Subject to Clauses 8.1 and 8.12, the Company shall not be liable for:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2 text-sm sm:text-base leading-relaxed mb-3">
                    <li>Any financial loss, third-party liability, or loss of profit, revenue, business, reputation, or goodwill; or</li>
                    <li>Any special, indirect, or consequential loss or damage of any nature whatsoever.</li>
                  </ul>
                  <p className="text-sm sm:text-base leading-relaxed">
                    The buyer shall indemnify the Company against any third-party claims arising from the supply or use of the goods, except to the extent that such losses are due to the Company's negligence.
                  </p>
                </div>

                {/* 8.7 */}
                <div className="ml-4 sm:ml-6 mb-8">
                  <h3 className="text-base sm:text-lg font-serif font-semibold text-charcoal mb-3">
                    8.7 Maximum Liability
                  </h3>
                  <p className="text-sm sm:text-base leading-relaxed">
                    Without prejudice to the above, the Company's total liability for any claim (whether arising from negligence or otherwise) shall not exceed twice the contract price.
                  </p>
                </div>

                {/* 8.8 */}
                <div className="ml-4 sm:ml-6">
                  <h3 className="text-base sm:text-lg font-serif font-semibold text-charcoal mb-3">
                    8.8 Entire Agreement
                  </h3>
                  <div className="space-y-3">
                    <p className="text-sm sm:text-base leading-relaxed">
                      This contract constitutes the entire agreement between the Company and the buyer. The buyer acknowledges that they have not relied on any statement, promise, or representation not expressly set out in this contract, except where otherwise required by law.
                    </p>
                    <p className="text-sm sm:text-base leading-relaxed">
                      All warranties, conditions, or terms implied by statute or common law are excluded to the fullest extent permitted by law (subject to Clause 8.1 and Section 12 of the Sale of Goods Act 1979).
                    </p>
                    <p className="text-sm sm:text-base leading-relaxed">
                      Where goods are sold under a consumer transaction (as defined by the Consumer Transactions (Restrictions on Statements) Order 1976), the statutory rights of consumers remain unaffected.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-gradient-charcoal py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-ivory mb-3 sm:mb-4">
            Questions About Our Terms & Conditions?
          </h2>
          <p className="text-ivory/70 mb-6 sm:mb-8 max-w-2xl mx-auto text-sm leading-relaxed">
            Our team is here to help clarify any questions you may have about our terms and conditions.
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
