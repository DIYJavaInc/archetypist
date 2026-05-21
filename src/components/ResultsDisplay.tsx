'use client'

import { Star, Heart, Lock, RotateCcw, Zap, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import type { AnalysisResult } from '@/app/analyzer/page'

interface ResultsDisplayProps {
  result: AnalysisResult
  onUnlock: (priceId: string) => void
  onReset: () => void
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (score / 100) * circumference

  const color = score >= 75 ? '#a855f7' : score >= 55 ? '#f472b6' : '#64748b'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle
            cx="48" cy="48" r={radius}
            fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold">{score}</span>
        </div>
      </div>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  )
}

function AspectCard({ title, aspect, description, score }: {
  title: string
  aspect: string
  description: string
  score: number
}) {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-sm">{title}</h4>
        <span className="text-purple-400 text-sm font-bold">{score}/100</span>
      </div>
      <p className="text-purple-300 text-xs mb-2 italic">{aspect}</p>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
      <div className="mt-3 bg-slate-800 rounded-full h-1.5">
        <div
          className="bg-gradient-to-r from-purple-600 to-pink-500 h-1.5 rounded-full transition-all duration-1000"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

export default function ResultsDisplay({ result, onUnlock, onReset }: ResultsDisplayProps) {
  return (
    <div className="space-y-8">
      {/* Archetype Card */}
      <div className="glass-card rounded-2xl p-8 text-center border border-purple-700/30 glow-purple">
        <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-700/50 rounded-full px-4 py-1 text-xs text-purple-300 mb-4">
          <Star className="w-3 h-3" /> Your Relationship Archetype
        </div>
        <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-3">{result.archetype}</h2>
        <p className="text-slate-300 text-lg max-w-xl mx-auto">{result.archetypeDescription}</p>

        <div className="mt-6 flex justify-center">
          <ScoreRing score={result.compatibilityScore} label="Compatibility" />
        </div>
      </div>

      {/* Free Insights */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          Key Synastry Insights
        </h3>
        <div className="space-y-4">
          {result.insights.map((insight, i) => (
            <div key={i} className="glass-card rounded-xl p-5 flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-900/50 border border-purple-700/50 flex items-center justify-center text-purple-300 text-sm font-bold">
                {i + 1}
              </span>
              <p className="text-slate-300 text-sm leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Full Analysis (Premium) */}
      {result.fullAnalysis ? (
        <div className="space-y-6">
          {/* Overview */}
          <div className="glass-card rounded-2xl p-6 border border-purple-700/20">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-400" /> Relationship Overview
            </h3>
            <p className="text-slate-300 leading-relaxed">{result.fullAnalysis.overview}</p>
          </div>

          {/* Planet Compatibility Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Planetary Compatibility</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AspectCard
                title="Sun Compatibility"
                aspect={result.fullAnalysis.sunCompatibility.aspect}
                description={result.fullAnalysis.sunCompatibility.description}
                score={result.fullAnalysis.sunCompatibility.score}
              />
              <AspectCard
                title="Moon Compatibility"
                aspect={result.fullAnalysis.moonCompatibility.aspect}
                description={result.fullAnalysis.moonCompatibility.description}
                score={result.fullAnalysis.moonCompatibility.score}
              />
              <AspectCard
                title="Venus Compatibility"
                aspect={result.fullAnalysis.venusCompatibility.aspect}
                description={result.fullAnalysis.venusCompatibility.description}
                score={result.fullAnalysis.venusCompatibility.score}
              />
              <AspectCard
                title="Mars Compatibility"
                aspect={result.fullAnalysis.marsCompatibility.aspect}
                description={result.fullAnalysis.marsCompatibility.description}
                score={result.fullAnalysis.marsCompatibility.score}
              />
            </div>
          </div>

          {/* Dynamics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Communication', content: result.fullAnalysis.communicationStyle },
              { title: 'Emotional Dynamics', content: result.fullAnalysis.emotionalDynamics },
              { title: 'Romantic Potential', content: result.fullAnalysis.romanticPotential },
            ].map((item) => (
              <div key={item.title} className="glass-card rounded-xl p-5">
                <h4 className="font-semibold text-sm mb-3">{item.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{item.content}</p>
              </div>
            ))}
          </div>

          {/* Strengths & Challenges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" /> Core Strengths
              </h4>
              <ul className="space-y-2.5">
                {result.fullAnalysis.coreStrengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-green-400 mt-0.5">&#10003;</span> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card rounded-xl p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" /> Growth Challenges
              </h4>
              <ul className="space-y-2.5">
                {result.fullAnalysis.challenges.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-amber-400 mt-0.5">&#9651;</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Growth Opportunities */}
          <div className="glass-card rounded-xl p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" /> Growth Opportunities
            </h4>
            <ul className="space-y-2.5">
              {result.fullAnalysis.growthOpportunities.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-purple-400 mt-0.5">&#8594;</span> {g}
                </li>
              ))}
            </ul>
          </div>

          {/* Long-term & Advice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-6">
              <h4 className="font-semibold mb-3">Long-term Potential</h4>
              <p className="text-slate-400 text-sm leading-relaxed">{result.fullAnalysis.longTermPotential}</p>
            </div>
            <div className="glass-card rounded-xl p-6">
              <h4 className="font-semibold mb-4">Practical Advice</h4>
              <ul className="space-y-2.5">
                {result.fullAnalysis.practicalAdvice.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-pink-400 mt-0.5">&#8226;</span> {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* Paywall */
        <div className="relative glass-card rounded-2xl p-8 text-center border border-purple-700/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/80 to-slate-900/95 pointer-events-none" />

          {/* Blurred preview */}
          <div className="blur-sm mb-6 space-y-3 pointer-events-none">
            <div className="h-4 bg-slate-700 rounded w-3/4 mx-auto" />
            <div className="h-4 bg-slate-700 rounded w-full mx-auto" />
            <div className="h-4 bg-slate-700 rounded w-5/6 mx-auto" />
            <div className="h-4 bg-slate-700 rounded w-2/3 mx-auto" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-900/50 border border-purple-600/50 mb-4">
              <Lock className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Unlock Your Full Reading</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto text-sm">
              Get the complete synastry analysis: all planetary aspects, romantic potential,
              communication style, challenges, strengths, and personalized advice.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onUnlock(process.env.NEXT_PUBLIC_STRIPE_PRICE_ONETIME!)}
                className="inline-flex flex-col items-center bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                <span className="text-lg">Full Reading &mdash; $19.99</span>
                <span className="text-xs opacity-75">One-time payment</span>
              </button>
              <button
                onClick={() => onUnlock(process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!)}
                className="inline-flex flex-col items-center border border-pink-600/50 text-pink-300 px-8 py-4 rounded-xl font-semibold hover:bg-pink-900/20 transition-all"
              >
                <span className="text-lg">Unlimited &mdash; $9.99/mo</span>
                <span className="text-xs opacity-75">Cancel anytime</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Button */}
      <div className="text-center">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Start New Analysis
        </button>
      </div>
    </div>
  )
}
