'use client'

import Link from 'next/link'
import { Stars, Heart, Zap, Shield, ChevronRight, Star, Moon, Sun } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 overflow-hidden">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Stars className="text-purple-400 w-6 h-6" />
          <span className="text-xl font-bold gradient-text">Archetypist</span>
        </div>
        <Link
          href="/analyzer"
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Try Free
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative px-6 py-24 max-w-7xl mx-auto text-center">
        {/* Background decorations */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-pink-900/20 rounded-full blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-700/50 rounded-full px-4 py-1.5 text-sm text-purple-300 mb-6">
            <Star className="w-3.5 h-3.5" />
            AI-Powered Synastry Analysis
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Discover Your{' '}
            <span className="gradient-text">Cosmic Connection</span>
          </h1>

          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Uncover the archetypal patterns shaping your relationship through the ancient wisdom
            of synastry astrology, powered by modern AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/analyzer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:opacity-90 transition-opacity glow-purple"
            >
              Analyze Your Relationship
              <ChevronRight className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 border border-slate-700 text-slate-300 px-8 py-4 rounded-full text-lg font-semibold hover:border-purple-600 hover:text-white transition-all"
            >
              How It Works
            </a>
          </div>

          <p className="mt-4 text-slate-500 text-sm">Free preview · No account required</p>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="px-6 py-20 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-4">How Archetypist Works</h2>
        <p className="text-slate-400 text-center mb-16 max-w-xl mx-auto">
          Three simple steps to uncover the cosmic blueprint of your relationship
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Sun className="w-8 h-8 text-purple-400" />,
              step: '01',
              title: 'Enter Birth Data',
              description: 'Input birth dates and locations for you and your partner. Birth time improves accuracy but is optional.'
            },
            {
              icon: <Stars className="w-8 h-8 text-pink-400" />,
              step: '02',
              title: 'Chart Calculation',
              description: 'Our system calculates precise planetary positions and synastry aspects between your natal charts.'
            },
            {
              icon: <Heart className="w-8 h-8 text-purple-400" />,
              step: '03',
              title: 'AI Interpretation',
              description: 'Our AI synthesizes the astrological data into meaningful insights about your relationship dynamics.'
            }
          ].map((item) => (
            <div key={item.step} className="glass-card rounded-2xl p-8 text-center hover:border-purple-700/50 transition-all">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/80 mb-4">
                {item.icon}
              </div>
              <div className="text-purple-400 text-sm font-bold mb-2">STEP {item.step}</div>
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What You Get */}
      <section className="px-6 py-20 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">What You&apos;ll Discover</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: <Star className="w-5 h-5 text-yellow-400" />,
                title: 'Partner Archetype',
                description: 'Discover your soulmate archetype — the cosmic blueprint of your connection.'
              },
              {
                icon: <Heart className="w-5 h-5 text-pink-400" />,
                title: 'Venus & Mars Compatibility',
                description: 'Explore how your love languages, desires, and drives interact and complement each other.'
              },
              {
                icon: <Moon className="w-5 h-5 text-blue-400" />,
                title: 'Emotional Dynamics',
                description: 'Understand how your Moon signs shape your emotional responses and needs in the relationship.'
              },
              {
                icon: <Zap className="w-5 h-5 text-purple-400" />,
                title: 'Growth Opportunities',
                description: 'Identify areas where your relationship can evolve and where you challenge each other to grow.'
              }
            ].map((item) => (
              <div key={item.title} className="flex gap-4 p-6 glass-card rounded-xl">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-20 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
        <p className="text-slate-400 text-center mb-16">Start for free, unlock the full reading when you&apos;re ready</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free */}
          <div className="glass-card rounded-2xl p-8">
            <div className="text-slate-400 text-sm font-semibold mb-2">FREE PREVIEW</div>
            <div className="text-4xl font-bold mb-1">$0</div>
            <div className="text-slate-500 text-sm mb-6">Always free</div>
            <ul className="space-y-3 mb-8">
              {[
                'Partner archetype name',
                '3 key synastry insights',
                'Compatibility score preview',
                'Basic chart overview'
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="text-purple-400">&#10003;</span> {item}
                </li>
              ))}
            </ul>
            <Link
              href="/analyzer"
              className="block w-full text-center border border-slate-600 text-slate-300 py-3 rounded-full font-medium hover:border-purple-600 hover:text-white transition-all"
            >
              Start Free
            </Link>
          </div>

          {/* One-time */}
          <div className="relative glass-card rounded-2xl p-8 border-purple-600/50 glow-purple">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</span>
            </div>
            <div className="text-purple-400 text-sm font-semibold mb-2">FULL READING</div>
            <div className="text-4xl font-bold mb-1">$19.99</div>
            <div className="text-slate-500 text-sm mb-6">One-time payment</div>
            <ul className="space-y-3 mb-8">
              {[
                'Everything in Free',
                'Complete synastry analysis',
                'All planetary aspects',
                'Romantic potential deep-dive',
                'Communication style guide',
                'Challenge & growth report',
                'Practical relationship advice',
                'Downloadable PDF report'
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="text-purple-400">&#10003;</span> {item}
                </li>
              ))}
            </ul>
            <Link
              href="/analyzer"
              className="block w-full text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Get Full Reading
            </Link>
          </div>

          {/* Monthly */}
          <div className="glass-card rounded-2xl p-8">
            <div className="text-pink-400 text-sm font-semibold mb-2">UNLIMITED</div>
            <div className="text-4xl font-bold mb-1">$9.99<span className="text-lg text-slate-400">/mo</span></div>
            <div className="text-slate-500 text-sm mb-6">Cancel anytime</div>
            <ul className="space-y-3 mb-8">
              {[
                'Everything in Full Reading',
                'Unlimited analyses',
                'Multiple relationship tracking',
                'Monthly transit updates',
                'Priority AI processing',
                'Email report delivery'
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="text-pink-400">&#10003;</span> {item}
                </li>
              ))}
            </ul>
            <Link
              href="/analyzer"
              className="block w-full text-center border border-pink-600/50 text-pink-300 py-3 rounded-full font-medium hover:bg-pink-600/10 transition-all"
            >
              Subscribe Monthly
            </Link>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="px-6 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-8 items-center">
          {[
            { icon: <Shield className="w-5 h-5" />, text: 'Secure Payments via Stripe' },
            { icon: <Zap className="w-5 h-5" />, text: 'Powered by AI' },
            { icon: <Star className="w-5 h-5" />, text: 'Precise Swiss Ephemeris Data' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2 text-slate-400 text-sm">
              <span className="text-purple-400">{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Stars className="text-purple-400 w-5 h-5" />
            <span className="font-semibold gradient-text">Archetypist</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 Archetypist. All rights reserved.</p>
          <div className="flex gap-6 text-slate-500 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
