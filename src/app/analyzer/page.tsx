'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Stars } from 'lucide-react'
import StripeProvider from '@/components/StripeProvider'
import AnalyzerForm from '@/components/AnalyzerForm'
import ResultsDisplay from '@/components/ResultsDisplay'
import PaymentModal from '@/components/PaymentModal'
import type { PersonData } from '@/lib/supabase'

export interface AnalysisResult {
  sessionId: string
  archetype: string
  archetypeDescription: string
  insights: string[]
  compatibilityScore: number
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

export default function AnalyzerPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
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

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Analysis error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
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

  return (
    <StripeProvider>
      <div className="min-h-screen bg-slate-900">
        {/* Nav */}
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
          {!result ? (
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
          ) : (
            <ResultsDisplay
              result={result}
              onUnlock={handleUnlock}
              onReset={() => setResult(null)}
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
