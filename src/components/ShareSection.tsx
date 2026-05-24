'use client'

import { useCallback, useRef, useState } from 'react'

// Fixed star positions — avoids Math.random in event path
const STARS: [number, number, number][] = [
  [100, 80, 2], [300, 50, 1.5], [700, 90, 2.5], [900, 60, 1.5], [200, 200, 1],
  [850, 200, 2], [50, 400, 1.5], [1000, 350, 1], [150, 700, 2], [950, 700, 1.5],
  [400, 30, 1], [600, 100, 2], [800, 150, 1.5], [250, 500, 1], [780, 450, 2],
  [500, 180, 1], [120, 550, 1.5], [920, 500, 1], [650, 800, 2], [350, 900, 1.5],
]

async function generateShareImage(archetype: string, score: number): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1080
  const ctx = canvas.getContext('2d')!

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 1080, 1080)
  bg.addColorStop(0, '#0f0a1e')
  bg.addColorStop(0.5, '#1a0f3a')
  bg.addColorStop(1, '#0f172a')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 1080, 1080)

  // Purple centre glow
  const glow = ctx.createRadialGradient(540, 460, 60, 540, 460, 520)
  glow.addColorStop(0, 'rgba(147, 51, 234, 0.2)')
  glow.addColorStop(1, 'rgba(147, 51, 234, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, 1080, 1080)

  // Stars
  for (const [x, y, r] of STARS) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.textAlign = 'center'

  // Brand
  ctx.font = 'bold 42px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = 'rgba(167, 139, 250, 0.9)'
  ctx.fillText('✦  ARCHETYPIST  ✦', 540, 136)

  // Top divider
  ctx.strokeStyle = 'rgba(147, 51, 234, 0.35)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(200, 172); ctx.lineTo(880, 172); ctx.stroke()

  // Label
  ctx.font = '400 38px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = 'rgba(148, 163, 184, 0.75)'
  ctx.fillText("My Partner's Archetype", 540, 370)

  // Archetype name — shrink font if too wide
  let fontSize = 92
  ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`
  while (ctx.measureText(archetype).width > 1000 && fontSize > 52) {
    fontSize -= 4
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`
  }

  const nameGrad = ctx.createLinearGradient(180, 0, 900, 0)
  nameGrad.addColorStop(0, '#c084fc')
  nameGrad.addColorStop(0.5, '#f472b6')
  nameGrad.addColorStop(1, '#818cf8')
  ctx.fillStyle = nameGrad
  ctx.fillText(archetype, 540, 530)

  // Score
  ctx.font = '500 44px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = 'rgba(148, 163, 184, 0.65)'
  ctx.fillText(`${score}% Compatibility`, 540, 630)

  // Bottom divider
  ctx.strokeStyle = 'rgba(147, 51, 234, 0.35)'
  ctx.beginPath(); ctx.moveTo(200, 870); ctx.lineTo(880, 870); ctx.stroke()

  // URL
  ctx.font = '500 44px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = 'rgba(167, 139, 250, 0.85)'
  ctx.fillText('archetypist.pro', 540, 946)

  return canvas.toDataURL('image/png')
}

// ── Minimal SVG icons ────────────────────────────────────────────────────────

function XLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-white">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function PinterestLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  )
}

function TikTokLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-white">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  )
}

function InstagramLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-pink-400">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface ShareSectionProps {
  archetype: string
  compatibilityScore: number
}

export default function ShareSection({ archetype, compatibilityScore }: ShareSectionProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const imageRef = useRef<string | null>(null)

  const siteUrl = 'https://archetypist.pro'
  const shareText = `✨ My partner's archetype is "${archetype}" — ${compatibilityScore}% compatibility!\n\nDiscover yours at ${siteUrl}`

  const getImage = useCallback(async () => {
    if (!imageRef.current) {
      imageRef.current = await generateShareImage(archetype, compatibilityScore)
    }
    return imageRef.current
  }, [archetype, compatibilityScore])

  const copyText = useCallback(async (platform: string) => {
    await navigator.clipboard.writeText(shareText)
    setCopied(platform)
    setTimeout(() => setCopied(null), 2200)
  }, [shareText])

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handlePinterest = () => {
    const url = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(siteUrl)}&description=${encodeURIComponent(shareText.replace('\n\n', ' '))}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleTikTok = () => copyText('tiktok')

  const handleInstagram = async () => {
    const dataUrl = await getImage()
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `archetypist-${archetype.toLowerCase().replace(/\s+/g, '-')}.png`
    a.click()
    await copyText('instagram')
  }

  const buttons = [
    { id: 'twitter',   label: 'Twitter / X',                              icon: <XLogo />,         onClick: handleTwitter   },
    { id: 'pinterest', label: 'Pinterest',                                 icon: <PinterestLogo />, onClick: handlePinterest },
    { id: 'tiktok',    label: copied === 'tiktok'    ? 'Copied!'  : 'TikTok',    icon: <TikTokLogo />,    onClick: handleTikTok    },
    { id: 'instagram', label: copied === 'instagram' ? 'Saved! ✓' : 'Instagram', icon: <InstagramLogo />, onClick: handleInstagram },
  ]

  return (
    <div className="glass-card rounded-2xl p-6 border border-purple-700/20">
      <h3 className="text-center font-semibold mb-1">Share Your Soulmate Archetype</h3>
      <p className="text-slate-400 text-sm text-center mb-5">Let the stars guide your friends too ✨</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {buttons.map(({ id, label, icon, onClick }) => (
          <button
            key={id}
            onClick={onClick}
            className="flex flex-col items-center gap-2.5 py-4 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-purple-700/40 transition-all"
          >
            {icon}
            <span className="text-xs text-slate-300">{label}</span>
          </button>
        ))}
      </div>

      {/* Caption preview */}
      <div className="bg-slate-800/40 rounded-lg px-4 py-3 border border-slate-700/40">
        <p className="text-slate-500 text-xs mb-1 font-medium uppercase tracking-wide">Caption</p>
        <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">{shareText}</p>
      </div>

      <p className="text-center text-slate-600 text-xs mt-3">
        Instagram: saves image to your device · TikTok: copies caption · Twitter &amp; Pinterest: opens share dialog
      </p>
    </div>
  )
}
