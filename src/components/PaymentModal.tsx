'use client'

import { useState } from 'react'
import { X, Loader2, Lock, Shield, Star } from 'lucide-react'

interface PaymentModalProps {
  priceId: string
  sessionId: string
  onSuccess: (sessionId: string) => void
  onClose: () => void
}

export default function PaymentModal({ priceId, sessionId, onSuccess, onClose }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const isMonthly = priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY

  const handleCheckout = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, sessionId })
      })

      if (!response.ok) throw new Error('Checkout failed')

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // onSuccess is available for future use (e.g. webhook-confirmed success flow)
  void onSuccess

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative glass-card rounded-2xl p-8 max-w-md w-full border border-purple-700/50 glow-purple">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 mb-4">
            <Star className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-1">
            {isMonthly ? 'Unlimited Monthly Access' : 'Full Synastry Reading'}
          </h2>
          <p className="text-3xl font-bold gradient-text mt-2">
            {isMonthly ? '$9.99/month' : '$19.99'}
          </p>
          {isMonthly && <p className="text-slate-500 text-xs mt-1">Cancel anytime</p>}
        </div>

        <ul className="space-y-2.5 mb-6">
          {(isMonthly ? [
            'Unlimited synastry analyses',
            'Complete planetary compatibility',
            'All relationship insights',
            'Monthly transit updates',
            'Priority AI processing',
          ] : [
            'Complete synastry analysis',
            'All planetary aspects',
            'Romantic & emotional deep-dive',
            'Communication style guide',
            'Strengths & challenges report',
            'Practical relationship advice',
          ]).map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
              <span className="text-purple-400 flex-shrink-0">&#10003;</span> {item}
            </li>
          ))}
        </ul>

        <button
          onClick={handleCheckout}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold text-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Redirecting...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Proceed to Secure Checkout
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 mt-4 text-slate-500 text-xs">
          <Shield className="w-3.5 h-3.5" />
          Secured by Stripe &middot; SSL encrypted
        </div>
      </div>
    </div>
  )
}
