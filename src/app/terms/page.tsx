import Link from 'next/link'
import { Stars } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service — Archetypist',
  description: 'Terms and conditions for using the Archetypist synastry analysis service.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Stars className="text-purple-400 w-6 h-6" />
          <span className="text-xl font-bold gradient-text">Archetypist</span>
        </Link>
        <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
          ← Back to Home
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-slate-400 text-sm mb-12">Last updated: January 1, 2026</p>

        <div className="space-y-10 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Archetypist (&ldquo;the Service&rdquo;), operated by Nova Digital
              (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do not use the Service.
              We reserve the right to update these terms at any time. Continued use of the Service
              constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>
              Archetypist provides AI-powered astrological synastry analysis for entertainment and
              personal insight purposes. The Service calculates planetary positions based on birth
              data and generates relationship interpretations using artificial intelligence. Results
              are delivered as digital reports accessible through our web application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Astrology Disclaimer</h2>
            <div className="glass-card rounded-xl p-5 border border-purple-700/30">
              <p className="text-white font-medium mb-2">Important Notice</p>
              <p>
                Archetypist provides astrological content for <strong>entertainment and personal
                reflection purposes only</strong>. Astrological readings are not a substitute for
                professional advice in matters of mental health, relationships, legal issues, or
                any other professional domain. We make no guarantee, representation, or warranty
                that any astrological interpretation is accurate, complete, or applicable to your
                specific circumstances. Do not make significant life decisions based solely on
                astrological analysis.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. User Responsibilities</h2>
            <p className="mb-3">By using the Service, you agree to:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Provide accurate birth data to the best of your knowledge</li>
              <li>Use the Service only for lawful purposes</li>
              <li>Not attempt to reverse-engineer, scrape, or misuse the Service</li>
              <li>Not share or resell analysis results for commercial purposes without our written consent</li>
              <li>Not use the Service to harass, stalk, or harm any individual</li>
              <li>Ensure you have consent before inputting another person&apos;s birth information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Payment Terms</h2>
            <h3 className="text-base font-medium text-purple-300 mb-2">One-Time Purchase</h3>
            <p className="mb-4">
              The one-time report fee of $19.99 USD grants access to a single full synastry reading
              for the birth data provided at the time of purchase. This fee is charged once and does
              not renew automatically.
            </p>
            <h3 className="text-base font-medium text-purple-300 mb-2">Monthly Subscription</h3>
            <p className="mb-4">
              The monthly subscription fee of $9.99 USD is billed automatically each month. You may
              cancel your subscription at any time. Cancellation takes effect at the end of the
              current billing period; no partial refunds are issued for unused time.
            </p>
            <h3 className="text-base font-medium text-purple-300 mb-2">Pricing Changes</h3>
            <p>
              We reserve the right to change our pricing at any time. Existing subscribers will be
              notified at least 30 days before any price change takes effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Refund Policy</h2>
            <p className="mb-3">
              Due to the digital and immediately delivered nature of our Service:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>One-time reports</strong> are generally non-refundable once the full analysis
                has been generated and delivered.
              </li>
              <li>
                <strong>Monthly subscriptions</strong> may be refunded within 48 hours of the initial
                charge if no analyses have been performed under that subscription period.
              </li>
              <li>
                Refund requests due to technical errors on our part will be evaluated on a case-by-case
                basis. Contact{' '}
                <a href="mailto:support@archetypist.pro" className="text-purple-400 hover:underline">
                  support@archetypist.pro
                </a>.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Intellectual Property</h2>
            <p>
              All content, design, code, and materials on Archetypist are the property of Nova Digital
              and are protected by applicable intellectual property laws. The AI-generated analysis
              content delivered to you is licensed for your personal, non-commercial use only. You may
              not reproduce, distribute, or create derivative works from any part of the Service without
              our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Service Availability</h2>
            <p>
              We strive to maintain the Service but do not guarantee uninterrupted availability.
              We reserve the right to modify, suspend, or discontinue the Service (or any part thereof)
              at any time with or without notice. We shall not be liable to you or any third party for
              any modification, suspension, or discontinuation of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h2>
            <p className="mb-3">
              To the fullest extent permitted by applicable law:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties
                of any kind, express or implied.
              </li>
              <li>
                Nova Digital shall not be liable for any indirect, incidental, special, consequential,
                or punitive damages arising from your use of the Service.
              </li>
              <li>
                Our total liability to you for any claim arising from or related to the Service shall
                not exceed the amount you paid us in the 12 months preceding the claim.
              </li>
              <li>
                We are not responsible for decisions made based on astrological interpretations
                provided by the Service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Privacy</h2>
            <p>
              Your use of the Service is also governed by our{' '}
              <Link href="/privacy" className="text-purple-400 hover:underline">Privacy Policy</Link>,
              which is incorporated into these Terms by reference.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              United States, without regard to its conflict of law provisions. Any disputes arising
              from these Terms shall be resolved through binding arbitration or in a court of
              competent jurisdiction in the United States.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Contact</h2>
            <p>
              Questions about these Terms of Service should be directed to:{' '}
              <a href="mailto:support@archetypist.pro" className="text-purple-400 hover:underline">
                support@archetypist.pro
              </a>
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-slate-800 px-6 py-8 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Stars className="text-purple-400 w-5 h-5" />
            <span className="font-semibold gradient-text">Archetypist</span>
          </Link>
          <p className="text-slate-500 text-sm">© 2026 Archetypist. All rights reserved.</p>
          <div className="flex gap-6 text-slate-500 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
