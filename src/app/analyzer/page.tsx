'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Stars, Mail, Loader2, Lock } from 'lucide-react'
import StripeProvider from '@/components/StripeProvider'
import AnalyzerForm from '@/components/AnalyzerForm'
import ResultsDisplay from '@/components/ResultsDisplay'
import PaymentModal from '@/components/PaymentModal'
import type { PersonData } from '@/lib/supabase'

const EMAIL_KEY = 'archetypist_email_captured'

export interface AnalysisScoring {
  warmth: number
  karma: number
  growth: number
  totalHarmonious: number
  totalChallenging: number
  compatibilityScore: number
  scoringRule: string
  recommendedArchetype: string
  finalArchetype: string
}

export interface AnalysisResult {
  sessionId: string
  archetype: string             // top-level convenience field — always equals scoring.finalArchetype
  archetypeDescription: string
  insights: string[]
  compatibilityScore: number
  scoring?: AnalysisScoring     // source of truth for archetype classification
  fullAnalysis?: {
    overview: string
    sunCompatibility: { aspect: string; description: string; score: number }
    moonCompatibility: { aspect: string; description: string; score: number }
    venusCompatibility: { aspect: string; description: string; score: number }
    marsCompatibility: { aspect: string; description: string; score: number }
    communicationStyle: string
    emotionalDynamics: string
    romanticPotential: string
    growthOpportunities: string[]
    challenges: string[]
    coreStrengths: string[]
    longTermPotential: string
    practicalAdvice: string[]
  }
}

// Three explicit view states — no overlay, no z-index, no modal CSS tricks
type View = 'form' | 'email-gate' | 'results'

export default function AnalyzerPage() {
  const [view, setView] = useState<View>('form')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailValue, setEmailValue] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPriceId, setSelectedPriceId] = useState<string>('')
  const [formData, setFormData] = useState<{ person1: PersonData; person2: PersonData } | null>(null)

  const handleAnalyze = async (person1: PersonData, person2: PersonData) => {
    setIsLoading(true)
    setFormData({ person1, person2 })

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person1, person2, tier: 'free' })
      })

      if (!response.ok) throw new Error('Analysis failed')

      const data = await response.json()
      setResult(data)

      // Debug: confirm archetype source of truth
      console.log('[scoring] recommendedArchetype:', data.scoring?.recommendedArchetype)
      console.log('[scoring] finalArchetype:', data.scoring?.finalArchetype)
      console.log('[scoring] top-level archetype:', data.archetype)
      console.log('[display] archetype shown:', data.scoring?.finalArchetype ?? data.archetype)

      // Read localStorage fresh — no stale state issues
      const alreadyCaptured = localStorage.getItem(EMAIL_KEY) === 'true'
      console.log('[email-gate] captured previously:', alreadyCaptured)
      setView(alreadyCaptured ? 'results' : 'email-gate')
    } catch (error) {
      console.error('Analysis error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = emailValue.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Please enter a valid email address.')
      return
    }
    setEmailError('')
    setEmailLoading(true)

    try {
      const res = await fetch('/api/capture-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed })
      })
      const json = await res.json()
      console.log('[email-gate] API response:', json)
    } catch (err) {
      console.warn('[email-gate] API error (non-fatal):', err)
    }

    localStorage.setItem(EMAIL_KEY, 'true')
    setEmailLoading(false)
    setView('results')
  }


  const handleUnlock = (priceId: string) => {
    setSelectedPriceId(priceId)
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = async (sessionId: string) => {
    setShowPaymentModal(false)
    if (!formData || !result) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person1: formData.person1,
          person2: formData.person2,
          tier: 'premium',
          paymentSessionId: sessionId,
          existingSessionId: result.sessionId
        })
      })
      if (!response.ok) throw new Error('Failed to fetch full analysis')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Premium analysis error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setView('form')
    setResult(null)
    setEmailValue('')
    setEmailError('')
  }

  return (
    <StripeProvider>
      <div className="min-h-screen bg-slate-900">
        <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <Stars className="text-purple-400 w-6 h-6" />
            <span className="text-xl font-bold gradient-text">Archetypist</span>
          </Link>
          <Link href="/#pricing" className="text-slate-400 hover:text-white text-sm transition-colors">
            Pricing
          </Link>
        </nav>

        <main className="max-w-4xl mx-auto px-6 py-12">

          {/* ── STATE 1: Input form ── */}
          {view === 'form' && (
            <div>
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-3">
                  Synastry <span className="gradient-text">Analysis</span>
                </h1>
                <p className="text-slate-400">
                  Enter birth details for both people to reveal your cosmic connection
                </p>
              </div>
              <AnalyzerForm onAnalyze={handleAnalyze} isLoading={isLoading} />
            </div>
          )}

          {/* ── STATE 2: Email gate (shown instead of results, not on top) ── */}
          {view === 'email-gate' && result && (
            <div className="max-w-lg mx-auto">
              {/* Archetype teaser */}
              <div className="glass-card rounded-2xl p-8 text-center border border-purple-700/30 mb-6">
                <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-700/50 rounded-full px-4 py-1 text-xs text-purple-300 mb-4">
                  <Stars className="w-3 h-3" /> Reading Complete
                </div>
                <h2 className="text-2xl md:text-3xl font-bold gradient-text mb-2">
                  {result.scoring?.finalArchetype ?? result.archetype}
                </h2>
                <p className="text-slate-400 text-sm">{result.archetypeDescription}</p>

                {/* Blurred preview hints */}
                <div className="mt-6 space-y-2 select-none pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="blur-sm bg-slate-700/40 rounded-lg h-4 mx-auto"
                      style={{ width: `${85 - i * 10}%` }} />
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 text-slate-500 text-xs">
                  <Lock className="w-3 h-3" /> Enter your email to read your full preview
                </div>
              </div>

              {/* Email form */}
              <div className="glass-card rounded-2xl p-8 border border-purple-700/50">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 mx-auto mb-5">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-center mb-2">Your Reading Is Ready</h3>
                <p className="text-slate-400 text-sm text-center mb-6">
                  Enter your email to unlock the free preview. No spam — ever.
                </p>

                <form onSubmit={handleEmailSubmit} noValidate>
                  <div className="relative mb-3">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="email"
                      value={emailValue}
                      onChange={e => { setEmailValue(e.target.value); setEmailError('') }}
                      placeholder="you@example.com"
                      autoFocus
                      className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 focus:outline-none rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 transition-colors"
                    />
                  </div>

                  {emailError && (
                    <p className="text-red-400 text-xs mb-3">{emailError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={emailLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                  >
                    {emailLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                      'See My Reading →'
                    )}
                  </button>
                </form>

              </div>
            </div>
          )}

          {/* ── STATE 3: Full results ── */}
          {view === 'results' && result && (
            <ResultsDisplay
              result={result}
              onUnlock={handleUnlock}
              onReset={handleReset}
            />
          )}

        </main>

        {showPaymentModal && (
          <PaymentModal
            priceId={selectedPriceId}
            sessionId={result?.sessionId || ''}
            onSuccess={handlePaymentSuccess}
            onClose={() => setShowPaymentModal(false)}
          />
        )}
      </div>
    </StripeProvider>
  )
}
