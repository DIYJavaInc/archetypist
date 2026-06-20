import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getServiceClient } from '@/lib/supabase'
import {
  geocodeLocation,
  getNatalChart,
  calculateSynastryAspects,
  formatChartForPrompt,
  formatAspectsForPrompt,
  type SynastryAspect
} from '@/lib/astrology'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// ── Archetype Scoring System ──────────────────────────────────────────────────
// Goal: Identify HEALTHY, LONG-TERM COMPATIBILITY — not relationship intensity.
// Healthy archetypes score higher by design; intensity archetypes score lower.
// The hierarchy is the TIEBREAKER only — primary selection is by raw score.
// ─────────────────────────────────────────────────────────────────────────────

type ArchetypeName =
  | 'Highest Timeline Soulmate'
  | 'Life Builder Soulmate'
  | 'Safe Love Soulmate'
  | 'Power Couple'
  | 'Healing Partner Soulmate'
  | 'Spiritual Catalyst Soulmate'
  | 'Twin Flame Soulmate'
  | 'Addictive Chemistry Soulmate'
  | 'Karmic Soulmate'
  | 'Intense but Temporary Soulmate'

// Healthy → intense — used ONLY to break ties; does not override scores
const ARCHETYPE_HIERARCHY: ArchetypeName[] = [
  'Highest Timeline Soulmate',
  'Life Builder Soulmate',
  'Safe Love Soulmate',
  'Power Couple',
  'Healing Partner Soulmate',
  'Spiritual Catalyst Soulmate',
  'Twin Flame Soulmate',
  'Addictive Chemistry Soulmate',
  'Karmic Soulmate',
  'Intense but Temporary Soulmate',
]

// Compatibility score caps per archetype — reflects realistic long-term potential
const SCORE_CAPS: Record<ArchetypeName, number> = {
  'Highest Timeline Soulmate':        97,
  'Life Builder Soulmate':            95,
  'Safe Love Soulmate':               93,
  'Power Couple':                     90,
  'Healing Partner Soulmate':         90,
  'Spiritual Catalyst Soulmate':      85,
  'Twin Flame Soulmate':              88,
  'Addictive Chemistry Soulmate':     75,
  'Karmic Soulmate':                  70,
  'Intense but Temporary Soulmate':   65,
}

// ── Aspect helpers ────────────────────────────────────────────────────────────

function has(aspects: SynastryAspect[], k1: string, k2: string, asp: string, maxOrb: number): boolean {
  return aspects.some(a =>
    ((a.planet1Key === k1 && a.planet2Key === k2) || (a.planet1Key === k2 && a.planet2Key === k1)) &&
    a.aspect === asp && a.orb <= maxOrb
  )
}

function hasAny(aspects: SynastryAspect[], k1: string, k2: string, asps: string[], maxOrb: number): boolean {
  return asps.some(asp => has(aspects, k1, k2, asp, maxOrb))
}

const HARMONY     = ['Conjunction', 'Trine', 'Sextile']
const CHALLENGING = ['Square', 'Opposition']
const SOFT        = ['Trine', 'Sextile']

// ── Per-archetype scoring functions ──────────────────────────────────────────
// Max possible scores are intentionally graduated:
//   Healthy archetypes: 130–145  |  Intense: 60–95
// This ensures healthy connections naturally outrank intense ones.

function scoreHighestTimeline(a: SynastryAspect[]): number {
  let s = 0
  // North Node (life-path destiny) to personal planets
  for (const p of ['sun', 'moon', 'venus']) {
    if (has(a, 'northNode', p, 'Conjunction', 3)) s += 30
    else if (hasAny(a, 'northNode', p, SOFT, 6))  s += 20
  }
  // Jupiter (expansion, luck, growth together)
  for (const p of ['sun', 'moon', 'venus']) {
    if (has(a, 'jupiter', p, 'Conjunction', 3)) s += 25
    else if (hasAny(a, 'jupiter', p, SOFT, 6))  s += 18
  }
  // Moon–Moon harmony (emotional alignment — essential for long term)
  if (has(a, 'moon', 'moon', 'Conjunction', 6)) s += 20
  else if (has(a, 'moon', 'moon', 'Trine', 6))  s += 20
  else if (has(a, 'moon', 'moon', 'Sextile', 6)) s += 15
  // Venus–Sun mutual warmth
  if (hasAny(a, 'venus', 'sun', HARMONY, 3)) s += 20
  // Mercury conjunction (communication partnership)
  if (has(a, 'mercury', 'mercury', 'Conjunction', 3)) s += 15
  else if (hasAny(a, 'mercury', 'mercury', SOFT, 6)) s += 10
  // Deduct for volatile / dangerous dynamics
  if (hasAny(a, 'pluto', 'mars', CHALLENGING, 3)) s -= 25
  if (hasAny(a, 'mars', 'mars', CHALLENGING, 3))  s -= 15
  return Math.max(0, s) // max ≈ 145
}

function scoreLifeBuilder(a: SynastryAspect[]): number {
  let s = 0
  // Saturn–Saturn (shared life structure and commitment)
  if (has(a, 'saturn', 'saturn', 'Conjunction', 6)) s += 30
  // Saturn to personal planets (lasting bonds, real commitment)
  for (const p of ['venus', 'moon', 'sun']) {
    if (has(a, 'saturn', p, 'Conjunction', 3))    s += 20
    else if (hasAny(a, 'saturn', p, SOFT, 6))      s += 15
  }
  // Venus harmony (shared values, affection)
  if (has(a, 'venus', 'venus', 'Conjunction', 6))  s += 20
  else if (hasAny(a, 'venus', 'venus', SOFT, 6))   s += 15
  // Moon harmony (emotional security at home)
  if (has(a, 'moon', 'moon', 'Conjunction', 6))    s += 15
  else if (hasAny(a, 'moon', 'moon', SOFT, 6))     s += 15
  // Mercury (daily practical communication)
  if (has(a, 'mercury', 'mercury', 'Conjunction', 3)) s += 15
  // Jupiter expanding the foundation
  if (hasAny(a, 'jupiter', 'saturn', HARMONY, 6))  s += 10
  return Math.max(0, s) // max ≈ 140
}

function scoreSafeLove(a: SynastryAspect[]): number {
  let s = 0
  // Venus–Venus (shared values and affection — cornerstone of safe love)
  if (has(a, 'venus', 'venus', 'Conjunction', 3))    s += 25
  else if (hasAny(a, 'venus', 'venus', SOFT, 6))     s += 18
  // Venus to Sun / Moon (attraction meets emotional bond)
  for (const p of ['sun', 'moon']) {
    if (hasAny(a, 'venus', p, HARMONY, 3))  s += 20
    else if (hasAny(a, 'venus', p, SOFT, 6)) s += 15
  }
  // Saturn–Venus harmony (committed love with healthy structure)
  if (hasAny(a, 'saturn', 'venus', SOFT, 6)) s += 20
  // Mercury (open, honest communication)
  if (has(a, 'mercury', 'mercury', 'Conjunction', 3))  s += 15
  else if (hasAny(a, 'mercury', 'mercury', SOFT, 6))   s += 10
  // Moon harmony (emotional safety)
  if (hasAny(a, 'moon', 'moon', HARMONY, 6)) s += 15
  // Deduct for unsafe power dynamics
  if (hasAny(a, 'pluto', 'mars', CHALLENGING, 3))  s -= 20
  if (hasAny(a, 'pluto', 'moon', CHALLENGING, 3))  s -= 15
  if (hasAny(a, 'saturn', 'moon', CHALLENGING, 3)) s -= 10
  return Math.max(0, s) // max ≈ 135
}

function scorePowerCouple(a: SynastryAspect[]): number {
  let s = 0
  // Mars–Venus (passion balanced with drive)
  if (has(a, 'mars', 'venus', 'Conjunction', 3))     s += 25
  else if (hasAny(a, 'mars', 'venus', SOFT, 6))      s += 18
  // Sun–Sun (identity resonance, shared mission)
  if (has(a, 'sun', 'sun', 'Conjunction', 6))        s += 20
  else if (hasAny(a, 'sun', 'sun', SOFT, 6))         s += 15
  // Jupiter to Sun / Mars (ambition and expansion)
  for (const p of ['sun', 'mars']) {
    if (hasAny(a, 'jupiter', p, HARMONY, 6)) s += 18
  }
  // Mercury (strategic, effective communication)
  if (has(a, 'mercury', 'mercury', 'Conjunction', 3)) s += 15
  else if (hasAny(a, 'mercury', 'mercury', SOFT, 6))  s += 10
  // Saturn giving structure (discipline, not control)
  if (hasAny(a, 'saturn', 'sun', SOFT, 6)) s += 10
  // Venus–Sun mutual support
  if (hasAny(a, 'venus', 'sun', HARMONY, 6)) s += 10
  // Deduct for power struggles / combative friction
  if (has(a, 'mars', 'mars', 'Square', 3))      s -= 15
  if (has(a, 'mars', 'mars', 'Opposition', 3))   s -= 10
  return Math.max(0, s) // max ≈ 130
}

function scoreHealingPartner(a: SynastryAspect[]): number {
  let s = 0
  // Neptune to personal planets (compassion, emotional healing)
  for (const p of ['moon', 'venus', 'sun']) {
    if (has(a, 'neptune', p, 'Conjunction', 3))    s += 25
    else if (hasAny(a, 'neptune', p, SOFT, 6))    s += 18
  }
  // North Node to personal planets (healing as growth path)
  for (const p of ['moon', 'venus', 'sun']) {
    if (has(a, 'northNode', p, 'Conjunction', 3))  s += 20
    else if (hasAny(a, 'northNode', p, SOFT, 6))   s += 15
  }
  // Venus–Moon (nurturing, caring bond)
  if (hasAny(a, 'venus', 'moon', HARMONY, 6)) s += 20
  // Moon–Moon harmony (deep emotional attunement)
  if (hasAny(a, 'moon', 'moon', HARMONY, 6))  s += 20
  // Saturn in harmony (safety through structure, not control)
  if (hasAny(a, 'saturn', 'moon', SOFT, 6))   s += 15
  if (hasAny(a, 'saturn', 'venus', SOFT, 6))  s += 15
  // Mercury–Moon harmony (compassionate dialogue)
  if (hasAny(a, 'mercury', 'moon', HARMONY, 6)) s += 10
  // Deduct for obsessive / controlling dynamics
  if (hasAny(a, 'pluto', 'moon', CHALLENGING, 3))   s -= 15
  if (hasAny(a, 'pluto', 'venus', CHALLENGING, 3))  s -= 15
  return Math.max(0, s) // max ≈ 140
}

function scoreSpiritualCatalyst(a: SynastryAspect[]): number {
  let s = 0
  // Neptune to personal planets (spiritual merging, transcendence)
  for (const p of ['sun', 'moon', 'venus', 'mercury']) {
    if (has(a, 'neptune', p, 'Conjunction', 3))  s += 25
    else if (hasAny(a, 'neptune', p, SOFT, 6))   s += 18
  }
  // North Node (conscious spiritual growth direction)
  for (const p of ['sun', 'moon', 'mercury']) {
    if (has(a, 'northNode', p, 'Conjunction', 3)) s += 20
    else if (hasAny(a, 'northNode', p, SOFT, 6))  s += 15
  }
  // Jupiter–Neptune (spiritual / philosophical expansion)
  if (has(a, 'jupiter', 'neptune', 'Conjunction', 6)) s += 25
  else if (hasAny(a, 'jupiter', 'neptune', SOFT, 6))  s += 18
  // Pluto in HARMONIOUS aspect (conscious transformation — not forced)
  if (hasAny(a, 'pluto', 'sun', SOFT, 6))     s += 15
  if (hasAny(a, 'pluto', 'moon', SOFT, 6))    s += 15
  // Mercury harmony (truth-seeking dialogue)
  if (hasAny(a, 'mercury', 'mercury', HARMONY, 6)) s += 10
  // Deduct for deceptive dynamics hiding behind spiritual language
  if (hasAny(a, 'neptune', 'mercury', CHALLENGING, 3)) s -= 15
  if (hasAny(a, 'pluto', 'mercury', CHALLENGING, 3))   s -= 10
  return Math.max(0, s) // max ≈ 130
}

function scoreTwinFlame(a: SynastryAspect[]): number {
  let s = 0
  // Sun–Moon conjunction (rarest, most definitive twin flame marker)
  if (has(a, 'sun', 'moon', 'Conjunction', 3)) s += 30
  // Venus–Mars conjunction (magnetic, fated attraction)
  if (has(a, 'venus', 'mars', 'Conjunction', 3)) s += 20
  // North Node conjunction to personal planets (fated meeting)
  for (const p of ['sun', 'moon', 'venus']) {
    if (has(a, 'northNode', p, 'Conjunction', 3)) s += 20
  }
  // Saturn harmonious to personal planets (commitment, not just intensity)
  for (const p of ['sun', 'moon', 'venus']) {
    if (has(a, 'saturn', p, 'Conjunction', 3))   s += 15
    else if (hasAny(a, 'saturn', p, SOFT, 6))    s += 10
  }
  // Neptune conjunction (spiritual soul merging)
  for (const p of ['sun', 'moon', 'venus']) {
    if (has(a, 'neptune', p, 'Conjunction', 3)) s += 12
  }
  // Pluto CONJUNCTION only — transformation without dominance
  for (const p of ['sun', 'moon', 'venus']) {
    if (has(a, 'pluto', p, 'Conjunction', 3)) s += 12
  }
  // Bonus if 4+ twin flame indicators compound
  if (countTwinFlameIndicators(a) >= 4) s += 15
  // Critical safety deductions — hard Pluto-Mars signals abuse potential
  if (hasAny(a, 'pluto', 'mars', CHALLENGING, 3)) s -= 25
  if (hasAny(a, 'mars', 'mars', CHALLENGING, 3))  s -= 15
  return Math.max(0, s) // max ≈ 140 (same ceiling as healthy archetypes, not higher)
}

function countTwinFlameIndicators(a: SynastryAspect[]): number {
  let n = 0
  if (has(a, 'sun', 'moon', 'Conjunction', 3))   n += 2 // double — rarest
  if (has(a, 'venus', 'mars', 'Conjunction', 3))  n++
  for (const p of ['sun', 'moon', 'venus']) {
    if (has(a, 'northNode', p, 'Conjunction', 3)) n++
    if (has(a, 'neptune', p, 'Conjunction', 3))   n++
    if (has(a, 'pluto', p, 'Conjunction', 3))     n++
    if (has(a, 'saturn', p, 'Conjunction', 3))    n++
  }
  return n
}

function scoreAddictiveChemistry(a: SynastryAspect[]): number {
  let s = 0
  // Pluto–Mars (obsession, power dynamics — primary indicator)
  if (has(a, 'pluto', 'mars', 'Conjunction', 3))    s += 25
  else if (hasAny(a, 'pluto', 'mars', CHALLENGING, 3)) s += 20
  // Venus–Pluto (obsessive romantic attachment)
  if (has(a, 'venus', 'pluto', 'Conjunction', 3))   s += 25
  else if (hasAny(a, 'venus', 'pluto', CHALLENGING, 3)) s += 20
  // Mars–Mars hard (volatile friction / combative tension)
  if (has(a, 'mars', 'mars', 'Square', 3))          s += 20
  else if (has(a, 'mars', 'mars', 'Opposition', 3)) s += 15
  // Moon–Pluto hard (emotional obsession / cycles)
  if (hasAny(a, 'moon', 'pluto', CHALLENGING, 3))   s += 15
  // Mars–Moon hard (volatile emotional dynamic)
  if (hasAny(a, 'mars', 'moon', CHALLENGING, 3))    s += 10
  return Math.max(0, s) // max ≈ 95 (intentionally lower than healthy archetypes)
}

function scoreKarmic(a: SynastryAspect[]): number {
  let s = 0
  // Saturn–Saturn (shared karmic burden)
  if (has(a, 'saturn', 'saturn', 'Conjunction', 3)) s += 20
  // Saturn challenging personal planets (lessons through restriction)
  for (const p of ['sun', 'moon', 'venus']) {
    if (hasAny(a, 'saturn', p, CHALLENGING, 3)) s += 15
  }
  // Pluto challenging personal planets (transformation through pain)
  for (const p of ['sun', 'moon', 'venus']) {
    if (hasAny(a, 'pluto', p, CHALLENGING, 3)) s += 15
  }
  // Saturn–Pluto hard aspects (heavy fate, major life restructuring)
  if (hasAny(a, 'saturn', 'pluto', CHALLENGING, 6)) s += 15
  // Many challenging aspects overall reinforce karmic pattern
  const hardCount = a.filter(x => x.nature === 'challenging' && x.orb <= 3).length
  if (hardCount >= 4) s += 10
  return Math.max(0, s) // max ≈ 85
}

function scoreIntenseTemporary(a: SynastryAspect[]): number {
  let s = 0
  // Mars–Mars hard squares/oppositions (volatile, friction-driven)
  if (has(a, 'mars', 'mars', 'Square', 3))      s += 20
  else if (has(a, 'mars', 'mars', 'Opposition', 3)) s += 15
  // Mars challenging personal planets (explosive tension)
  for (const p of ['sun', 'moon', 'venus']) {
    if (hasAny(a, 'mars', p, CHALLENGING, 3)) s += 10
  }
  // Pluto–Mars hard (destructive intensity)
  if (hasAny(a, 'pluto', 'mars', CHALLENGING, 3)) s += 15
  // Very few stabilizing factors = more volatile / temporary
  const stabilizers = a.filter(x =>
    x.nature === 'harmonious' &&
    (['venus', 'moon', 'jupiter', 'saturn'].includes(x.planet1Key) ||
     ['venus', 'moon', 'jupiter', 'saturn'].includes(x.planet2Key))
  ).length
  if (stabilizers === 0) s += 10
  return Math.max(0, s) // max ≈ 60 (intentionally lowest)
}

// ── Aggregate scoring and selection ──────────────────────────────────────────

function scoreAllArchetypes(aspects: SynastryAspect[]): Record<ArchetypeName, number> {
  return {
    'Highest Timeline Soulmate':      scoreHighestTimeline(aspects),
    'Life Builder Soulmate':          scoreLifeBuilder(aspects),
    'Safe Love Soulmate':             scoreSafeLove(aspects),
    'Power Couple':                   scorePowerCouple(aspects),
    'Healing Partner Soulmate':       scoreHealingPartner(aspects),
    'Spiritual Catalyst Soulmate':    scoreSpiritualCatalyst(aspects),
    'Twin Flame Soulmate':            scoreTwinFlame(aspects),
    'Addictive Chemistry Soulmate':   scoreAddictiveChemistry(aspects),
    'Karmic Soulmate':                scoreKarmic(aspects),
    'Intense but Temporary Soulmate': scoreIntenseTemporary(aspects),
  }
}

function selectArchetype(scores: Record<ArchetypeName, number>): {
  archetype: ArchetypeName
  score: number
  reason: string
} {
  const entries = Object.entries(scores) as [ArchetypeName, number][]
  const highest = Math.max(...entries.map(([, v]) => v))

  // If all scores are 0 (very sparse chart), default to safest / most positive
  if (highest === 0) {
    return {
      archetype: 'Highest Timeline Soulmate',
      score: 0,
      reason: 'No strong indicators found — defaulting to most positive archetype',
    }
  }

  const tied = entries.filter(([, v]) => v === highest).map(([k]) => k)

  if (tied.length === 1) {
    return { archetype: tied[0], score: highest, reason: 'Highest raw score' }
  }

  // Tiebreak by hierarchy — healthier archetype wins
  const winner = [...tied].sort(
    (a, b) => ARCHETYPE_HIERARCHY.indexOf(a) - ARCHETYPE_HIERARCHY.indexOf(b)
  )[0]
  const others = tied.filter(a => a !== winner).join(', ')
  return {
    archetype: winner,
    score: highest,
    reason: `Tied at ${highest} pts with [${others}]; hierarchy tiebreak → healthier archetype wins`,
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { person1, person2, tier = 'free', existingSessionId } = body

    console.log('[analyze] received person1:', JSON.stringify(person1))
    console.log('[analyze] received person2:', JSON.stringify(person2))

    if (!person1?.name || !person1?.date || !person1?.location) {
      return NextResponse.json({ error: 'Missing Person 1 data' }, { status: 400 })
    }
    if (!person2?.name || !person2?.date || !person2?.location) {
      return NextResponse.json({ error: 'Missing Person 2 data' }, { status: 400 })
    }

    const sessionId = existingSessionId || generateSessionId()

    // Geocode locations
    const [geo1, geo2] = await Promise.all([
      geocodeLocation(person1.location),
      geocodeLocation(person2.location)
    ])

    // Get natal charts
    const [chart1, chart2] = await Promise.all([
      getNatalChart({
        date: person1.date,
        time: person1.time,
        latitude: geo1.latitude,
        longitude: geo1.longitude,
      }),
      getNatalChart({
        date: person2.date,
        time: person2.time,
        latitude: geo2.latitude,
        longitude: geo2.longitude,
      })
    ])

    // Calculate synastry aspects
    const aspects = calculateSynastryAspects(chart1, chart2)

    const chartSummary1  = formatChartForPrompt('You', chart1)
    const chartSummary2  = formatChartForPrompt(person2.name, chart2)
    const aspectsSummary = formatAspectsForPrompt(aspects, 'You', person2.name)

    const harmonious  = aspects.filter(a => a.nature === 'harmonious').length
    const challenging = aspects.filter(a => a.nature === 'challenging').length
    const baseScore   = Math.round(50 + (harmonious * 5) - (challenging * 3) + Math.floor(Math.random() * 10))

    // Score all archetypes — healthy connections weighted higher
    const archetypeScores = scoreAllArchetypes(aspects)
    const { archetype: selectedArchetype, score: archetypeRawScore, reason: selectionReason } =
      selectArchetype(archetypeScores)

    // Compatibility score capped by archetype health tier
    const compatibilityScore = Math.min(SCORE_CAPS[selectedArchetype], Math.max(45, baseScore))

    // Full scoring breakdown log
    console.log('=== ARCHETYPIST ARCHETYPE SCORING ===')
    console.log('Goal: Healthy long-term compatibility > intensity')
    Object.entries(archetypeScores)
      .sort(([, a], [, b]) => b - a)
      .forEach(([name, pts], i) => console.log(`  ${i + 1}. ${name}: ${pts}pts`))
    console.log(`  ► Selected: "${selectedArchetype}" — ${selectionReason}`)
    console.log('=====================================')

    // Archetype selection context for Claude
    const archetypeBlock = `
ARCHETYPE (pre-selected by scoring system):
The chart analysis selected: "${selectedArchetype}"
  Score: ${archetypeRawScore} pts | ${selectionReason}

The "archetype" field in your JSON MUST be exactly: "${selectedArchetype}"
Your task: write an archetypeDescription and insights that authentically explain why this archetype fits the confirmed aspects below.
`

    // Full archetype list — reference only, selection already made above
    const ARCHETYPE_LIST = `(listed healthy → intense, for reference — archetype already selected)
- "Highest Timeline Soulmate"
- "Life Builder Soulmate"
- "Safe Love Soulmate"
- "Power Couple"
- "Healing Partner Soulmate"
- "Spiritual Catalyst Soulmate"
- "Twin Flame Soulmate"
- "Addictive Chemistry Soulmate"
- "Karmic Soulmate"
- "Intense but Temporary Soulmate"`

    if (tier === 'free') {
      const freePrompt = `You are an expert astrologer analyzing synastry. Base your entire analysis STRICTLY on the data below — no assumptions.
${archetypeBlock}
CHART POSITIONS (sign, degree in sign, ecliptic longitude):
${chartSummary1}

${chartSummary2}

CONFIRMED DEGREE-BASED ASPECTS (within standard orbs only):
${aspectsSummary}

CRITICAL RULES — MUST FOLLOW:
1. ONLY reference aspects that appear in the CONFIRMED ASPECTS list above.
2. Do NOT infer aspects from signs alone. Two planets in the same sign are NOT conjunct unless they appear in the list with a confirmed orb.
3. When citing an aspect, always include the sign, degree, and orb exactly as listed (e.g., "Your Moon in Pisces 12.4° conjuncts their Sun in Pisces 18.7° — 6.3° orb").
4. If no aspects are listed for a planet pair, do not mention an aspect between them.

Archetype reference list:
${ARCHETYPE_LIST}

Provide a JSON response with exactly this structure:
{
  "archetype": "${selectedArchetype}",
  "archetypeDescription": "One clear sentence explaining why this archetype fits (max 25 words, plain language)",
  "insights": [
    "Cite a specific confirmed aspect with exact degrees and orb",
    "Cite a second confirmed aspect with exact degrees and orb",
    "Describe a chart pattern or third confirmed aspect with exact degrees"
  ]
}`

      const message = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 600,
        messages: [{ role: 'user', content: freePrompt }]
      })

      const content   = message.content[0].type === 'text' ? message.content[0].text : ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Invalid AI response')

      const parsed = JSON.parse(jsonMatch[0])
      // Enforce server-selected archetype — Claude cannot override it
      parsed.archetype = selectedArchetype

      try {
        const supabase = getServiceClient()
        await supabase.from('analyses').upsert({
          session_id: sessionId,
          person1_name: person1.name,
          person2_name: person2.name,
          person1_data: { ...person1, latitude: geo1.latitude, longitude: geo1.longitude },
          person2_data: { ...person2, latitude: geo2.latitude, longitude: geo2.longitude },
          free_analysis: { ...parsed, compatibilityScore },
          payment_status: 'pending',
          tier: 'free',
          created_at: new Date().toISOString()
        }, { onConflict: 'session_id' })
      } catch (dbError) {
        console.error('DB error (non-fatal):', dbError)
      }

      return NextResponse.json({
        sessionId,
        archetype: parsed.archetype,
        archetypeDescription: parsed.archetypeDescription,
        insights: parsed.insights,
        compatibilityScore
      })

    } else {
      const premiumPrompt = `You are a master astrologer providing a comprehensive synastry reading. Base your entire analysis STRICTLY on the data below — no assumptions.
${archetypeBlock}
CHART POSITIONS (sign, degree in sign, ecliptic longitude):
${chartSummary1}

${chartSummary2}

CONFIRMED DEGREE-BASED ASPECTS (within standard orbs only):
${aspectsSummary}

CRITICAL RULES — MUST FOLLOW:
1. ONLY reference aspects that appear in the CONFIRMED ASPECTS list above.
2. Do NOT infer aspects from signs alone. Two planets in the same sign are NOT conjunct unless confirmed with a tight orb.
3. When citing any aspect, include sign, degree, and orb (e.g., "Your Venus in Capricorn 22.1° trines their Jupiter in Virgo 20.4° — 1.7° orb").
4. If a planetary area (e.g., Mars) has no confirmed aspect, note that instead of inventing one.
5. Score fields (0–100) should reflect actual aspect quality: tight harmonious aspects = high score, no aspect = 50, challenging aspects = lower.

Archetype reference list:
${ARCHETYPE_LIST}

Provide a detailed JSON response with this EXACT structure (all fields required):
{
  "archetype": "${selectedArchetype}",
  "archetypeDescription": "One clear sentence explaining why this archetype fits (max 25 words)",
  "insights": [
    "Cite confirmed aspect 1 with exact degrees and orb",
    "Cite confirmed aspect 2 with exact degrees and orb",
    "Cite confirmed aspect 3 or describe chart patterns"
  ],
  "overview": "3-4 sentence overview grounded in the confirmed aspects above",
  "sunCompatibility": {
    "aspect": "Confirmed Sun aspect (or 'no major Sun aspect detected')",
    "description": "2-3 sentences citing confirmed data",
    "score": 75
  },
  "moonCompatibility": {
    "aspect": "Confirmed Moon aspect (or 'no major Moon aspect detected')",
    "description": "2-3 sentences citing confirmed data",
    "score": 82
  },
  "venusCompatibility": {
    "aspect": "Confirmed Venus aspect (or 'no major Venus aspect detected')",
    "description": "2-3 sentences citing confirmed data",
    "score": 88
  },
  "marsCompatibility": {
    "aspect": "Confirmed Mars aspect (or 'no major Mars aspect detected')",
    "description": "2-3 sentences citing confirmed data",
    "score": 71
  },
  "communicationStyle": "2-3 sentences on Mercury aspects from the confirmed list",
  "emotionalDynamics": "2-3 sentences on Moon aspects from the confirmed list",
  "romanticPotential": "2-3 sentences on Venus/Mars aspects from the confirmed list",
  "growthOpportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "challenges": ["challenge 1", "challenge 2", "challenge 3"],
  "coreStrengths": ["strength 1", "strength 2", "strength 3", "strength 4"],
  "longTermPotential": "2-3 sentences grounded in chart data",
  "practicalAdvice": ["advice 1", "advice 2", "advice 3"]
}`

      const message = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: premiumPrompt }]
      })

      const content   = message.content[0].type === 'text' ? message.content[0].text : ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Invalid AI response')

      const parsed = JSON.parse(jsonMatch[0])
      // Enforce server-selected archetype — Claude cannot override it
      parsed.archetype = selectedArchetype

      try {
        const supabase = getServiceClient()
        await supabase.from('analyses').upsert({
          session_id: sessionId,
          person1_name: person1.name,
          person2_name: person2.name,
          person1_data: { ...person1, latitude: geo1.latitude, longitude: geo1.longitude },
          person2_data: { ...person2, latitude: geo2.latitude, longitude: geo2.longitude },
          free_analysis: {
            archetype: parsed.archetype,
            archetypeDescription: parsed.archetypeDescription,
            insights: parsed.insights,
            compatibilityScore
          },
          full_analysis: parsed,
          payment_status: 'completed',
          tier: 'premium',
          updated_at: new Date().toISOString()
        }, { onConflict: 'session_id' })
      } catch (dbError) {
        console.error('DB error (non-fatal):', dbError)
      }

      return NextResponse.json({
        sessionId,
        archetype: parsed.archetype,
        archetypeDescription: parsed.archetypeDescription,
        insights: parsed.insights,
        compatibilityScore,
        fullAnalysis: {
          overview:            parsed.overview,
          sunCompatibility:    parsed.sunCompatibility,
          moonCompatibility:   parsed.moonCompatibility,
          venusCompatibility:  parsed.venusCompatibility,
          marsCompatibility:   parsed.marsCompatibility,
          communicationStyle:  parsed.communicationStyle,
          emotionalDynamics:   parsed.emotionalDynamics,
          romanticPotential:   parsed.romanticPotential,
          growthOpportunities: parsed.growthOpportunities,
          challenges:          parsed.challenges,
          coreStrengths:       parsed.coreStrengths,
          longTermPotential:   parsed.longTermPotential,
          practicalAdvice:     parsed.practicalAdvice
        }
      })
    }
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    )
  }
}
