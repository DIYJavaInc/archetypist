import Link from 'next/link'
import { Stars } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy — Archetypist',
  description: 'How Archetypist collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-slate-400 text-sm mb-12">Last updated: January 1, 2026</p>

        <div className="space-y-10 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              Nova Digital (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates Archetypist
              (&ldquo;the Service&rdquo;). This Privacy Policy explains how we collect, use, disclose, and
              protect information about you when you use our Service. By using Archetypist, you agree
              to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <h3 className="text-base font-medium text-purple-300 mb-2">Information You Provide</h3>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>Names (first name or nickname) for synastry analysis</li>
              <li>Birth dates, birth times (optional), and birth locations</li>
              <li>Email address when provided during payment checkout</li>
            </ul>
            <h3 className="text-base font-medium text-purple-300 mb-2">Information Collected Automatically</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Browser type, IP address, and device information</li>
              <li>Pages visited and actions taken on the Service</li>
              <li>Session identifiers generated for each analysis</li>
              <li>Cookies and similar tracking technologies (see Section 7)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Generate synastry chart calculations and AI-powered relationship analyses</li>
              <li>Process payments and manage subscriptions via Stripe</li>
              <li>Store and retrieve your analysis results within the same session</li>
              <li>Improve the accuracy and quality of our Service</li>
              <li>Respond to support inquiries</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Services</h2>
            <p className="mb-4">
              Archetypist integrates with the following third-party services that have their own privacy policies:
            </p>
            <div className="space-y-4">
              <div className="glass-card rounded-xl p-4">
                <h3 className="font-medium text-white mb-1">Stripe</h3>
                <p className="text-sm">
                  We use Stripe to process payments. When you make a purchase, your payment information
                  is transmitted directly to Stripe and is never stored on our servers. Stripe is PCI-DSS
                  compliant. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">stripe.com/privacy</a>.
                </p>
              </div>
              <div className="glass-card rounded-xl p-4">
                <h3 className="font-medium text-white mb-1">Anthropic (Claude AI)</h3>
                <p className="text-sm">
                  We use Anthropic&apos;s API to generate relationship interpretations. Birth data and chart
                  summaries are transmitted to Anthropic for processing. Anthropic may use this data
                  per their API usage policy. See <a href="https://anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">anthropic.com/privacy</a>.
                </p>
              </div>
              <div className="glass-card rounded-xl p-4">
                <h3 className="font-medium text-white mb-1">Astrology API</h3>
                <p className="text-sm">
                  Birth date, time, and location data are sent to our astrology calculation provider
                  to determine precise planetary positions. No personally identifying information
                  beyond birth data is transmitted.
                </p>
              </div>
              <div className="glass-card rounded-xl p-4">
                <h3 className="font-medium text-white mb-1">Supabase</h3>
                <p className="text-sm">
                  Analysis results are stored in Supabase, a cloud database provider. Data is encrypted
                  at rest and in transit. See <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">supabase.com/privacy</a>.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention</h2>
            <p>
              Analysis results associated with your session are retained for up to 90 days to allow
              you to revisit your reading. Birth data used for calculations is not stored permanently
              after the analysis is complete. Payment records are retained as required by Stripe and
              applicable financial regulations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Security</h2>
            <p>
              We implement industry-standard security measures including HTTPS encryption for all data
              in transit, encrypted database storage, and access controls. However, no method of
              transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Cookies</h2>
            <p>
              Archetypist uses essential cookies necessary for the Service to function, including
              session identifiers. We do not use advertising or tracking cookies. You may disable
              cookies in your browser settings, but this may affect Service functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Your Rights</h2>
            <p className="mb-3">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of certain data processing activities</li>
              <li>Data portability (receive your data in a structured format)</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at{' '}
              <a href="mailto:support@archetypist.pro" className="text-purple-400 hover:underline">
                support@archetypist.pro
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Children&apos;s Privacy</h2>
            <p>
              Archetypist is not directed to children under the age of 13. We do not knowingly collect
              personal information from children under 13. If you believe we have inadvertently collected
              such information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes
              by updating the &ldquo;Last updated&rdquo; date at the top of this page. Continued use of the
              Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at:{' '}
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
