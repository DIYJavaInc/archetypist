import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

export async function POST(request: NextRequest) {
  try {
    const { priceId, sessionId } = await request.json()

    if (!priceId || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const isSubscription = priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: `${appUrl}/analyzer?payment=success&session_id=${sessionId}&stripe_session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/analyzer?payment=cancelled`,
      metadata: {
        analysisSessionId: sessionId
      },
      allow_promotion_codes: true,
    }

    const checkoutSession = await stripe.checkout.sessions.create(checkoutParams)

    return NextResponse.json({ url: checkoutSession.url, checkoutSessionId: checkoutSession.id })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
