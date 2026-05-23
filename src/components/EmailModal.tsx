'use client'

import { useState } from 'react'
import { Stars, Loader2, Mail } from 'lucide-react'

interface EmailModalProps {
  onSubmit: (email: string) => Promise<void>
  onSkip: () => void
}

export default function EmailModal({ onSubmit, onSkip }: EmailModalProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter your email address.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      await onSubmit(trimmed)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative glass-card rounded-2xl p-8 max-w-md w-full border border-purple-700/50 glow-purple text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 mb-5">
          <Stars className="w-7 h-7 text-white" />
        </div>

        <h2 className="text-2xl font-bold mb-2">Your Reading Is Ready</h2>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Enter your email to unlock your free synastry preview. We&apos;ll never
          spam you — just occasional cosmic insights.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="relative mb-3">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="you@example.com"
              autoFocus
              className="w-full bg-slate-800 border border-slate-700 focus:border-purple-500 focus:outline-none rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs mb-3 text-left">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'See My Reading'
            )}
          </button>
        </form>

      </div>
    </div>
  )
}
