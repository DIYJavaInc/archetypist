import Link from 'next/link'
import { Stars, Mail, Clock, MessageCircle } from 'lucide-react'

export const metadata = {
  title: 'Contact — Archetypist',
  description: 'Get in touch with the Archetypist support team.',
}

export default function ContactPage() {
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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Have a question about your reading, a billing issue, or feedback?
            We&apos;re here to help.
          </p>
        </div>

        {/* Contact cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-900/40 mb-3">
              <Mail className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-semibold mb-1">Email Support</h3>
            <a
              href="mailto:support@archetypist.pro"
              className="text-purple-400 hover:text-purple-300 text-sm transition-colors break-all"
            >
              support@archetypist.pro
            </a>
          </div>

          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-pink-900/40 mb-3">
              <Clock className="w-5 h-5 text-pink-400" />
            </div>
            <h3 className="font-semibold mb-1">Response Time</h3>
            <p className="text-slate-400 text-sm">Within 24–48 hours<br />Monday – Friday</p>
          </div>

          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-900/40 mb-3">
              <MessageCircle className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-semibold mb-1">What We Help With</h3>
            <p className="text-slate-400 text-sm">Billing, refunds,<br />technical issues, feedback</p>
          </div>
        </div>

        {/* About section */}
        <div className="glass-card rounded-2xl p-8 mb-10">
          <h2 className="text-xl font-semibold mb-4">About Archetypist</h2>
          <p className="text-slate-400 leading-relaxed mb-4">
            Archetypist is a relationship synastry analyzer built by Nova Digital. We combine precise
            astronomical chart calculations with AI interpretation to reveal the archetypal patterns
            shaping your relationships.
          </p>
          <p className="text-slate-400 leading-relaxed">
            Our mission is to give people meaningful, grounded insight into their connections — not
            vague horoscope generalities, but specific, degree-accurate synastry readings that reflect
            the real interplay between two birth charts.
          </p>
        </div>

        {/* Common questions */}
        <div>
          <h2 className="text-xl font-semibold mb-5">Common Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'I was charged but my full report didn\'t appear. What do I do?',
                a: 'Email us at support@archetypist.pro with your order confirmation and the names/dates you entered. We\'ll restore your reading or issue a refund within 24 hours.'
              },
              {
                q: 'How accurate are the birth chart calculations?',
                a: 'We use a Keplerian orbital mechanics algorithm (Paul Schlyter\'s method) accurate to within ~1° for inner planets and better for outer planets. When available, we also query an external astrology API for additional precision.'
              },
              {
                q: 'Can I cancel my monthly subscription?',
                a: 'Yes, at any time. Email us and we\'ll cancel it immediately. You\'ll retain access through the end of your current billing period.'
              },
              {
                q: 'The location I entered wasn\'t recognized. What should I try?',
                a: 'Try entering a nearby larger city, or use the format "City, Country" (e.g., "Miami, USA" or "London, UK"). Very small towns may not be in our geocoding database.'
              },
            ].map(item => (
              <details
                key={item.q}
                className="glass-card rounded-xl group"
              >
                <summary className="px-6 py-4 cursor-pointer font-medium text-sm list-none flex items-center justify-between hover:text-purple-300 transition-colors">
                  {item.q}
                  <span className="text-slate-500 group-open:rotate-180 transition-transform text-lg leading-none">›</span>
                </summary>
                <p className="px-6 pb-5 text-slate-400 text-sm leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-slate-400 mb-4">Ready to explore your cosmic connection?</p>
          <Link
            href="/analyzer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity"
          >
            Try Free Analysis
          </Link>
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
