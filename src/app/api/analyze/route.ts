import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getServiceClient } from '@/lib/supabase'
import {
  geocodeLocation,
  getNatalChart,
  calculateSynastryAspects,
  formatChartForPrompt,
  formatAspectsForPrompt,
} from '@/lib/astrology'
import {
  type ArchetypeName,
  type ScoringCtx,
  SCORE_CAPS,
  scoreAllArchetypes,
  selectArchetype,
} from '@/lib/scoring'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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

    const [geo1, geo2] = await Promise.all([
      geocodeLocation(person1.location),
      geocodeLocation(person2.location)
    ])

    const [chart1, chart2] = await Promise.all([
      getNatalChart({ date: person1.date, time: person1.time, latitude: geo1.latitude, longitude: geo1.longitude }),
      getNatalChart({ date: person2.date, time: person2.time, latitude: geo2.latitude, longitude: geo2.longitude })
    ])

    const aspects = calculateSynastryAspects(chart1, chart2)

    const chartSummary1  = formatChartForPrompt('You', chart1)
    const chartSummary2  = formatChartForPrompt(person2.name, chart2)
    const aspectsSummary = formatAspectsForPrompt(aspects, 'You', person2.name)

    const harmonious  = aspects.filter(a => a.nature === 'harmonious').length
    const challenging = aspects.filter(a => a.nature === 'challenging').length
    const baseScore   = Math.round(50 + (harmonious * 5) - (challenging * 3) + Math.floor(Math.random() * 10))

    // Score all archetypes
    const ctx: ScoringCtx = { aspects, chart1, chart2 }
    const archetypeScores = scoreAllArchetypes(ctx)
    const { archetype: selectedArchetype, score: archetypeRawScore, reason: selectionReason } =
      selectArchetype(archetypeScores)

    const compatibilityScore = Math.min(SCORE_CAPS[selectedArchetype], Math.max(45, baseScore))

    // Build debug info for response
    const debugInfo = {
      archetypeScores: Object.fromEntries(
        Object.entries(archetypeScores)
          .sort(([, a], [, b]) => b.score - a.score)
          .map(([name, r]) => [name, r.score])
      ) as Record<ArchetypeName, number>,
      winner: { archetype: selectedArchetype, score: archetypeRawScore, reason: selectionReason },
      winnerBreakdown: archetypeScores[selectedArchetype].breakdown,
      charts: {
        person1: { sun: chart1.sun.sign, moon: chart1.moon.sign, venus: chart1.venus.sign, saturn: chart1.saturn.sign },
        person2: { sun: chart2.sun.sign, moon: chart2.moon.sign, venus: chart2.venus.sign, saturn: chart2.saturn.sign },
      }
    }

    // Full scoring log
    console.log('\n╔═══════════════════════════════════════════════════════╗')
    console.log('║         ARCHETYPIST ARCHETYPE SCORING AUDIT          ║')
    console.log('╚═══════════════════════════════════════════════════════╝')
    console.log(`Charts: ${person1.name} (${person1.date}) + ${person2.name} (${person2.date})`)
    console.log(`  P1: Sun ${chart1.sun.sign}, Moon ${chart1.moon.sign}, Venus ${chart1.venus.sign}, Saturn ${chart1.saturn.sign}`)
    console.log(`  P2: Sun ${chart2.sun.sign}, Moon ${chart2.moon.sign}, Venus ${chart2.venus.sign}, Saturn ${chart2.saturn.sign}`)
    console.log('\nALL ARCHETYPE SCORES:')
    Object.entries(archetypeScores)
      .sort(([, a], [, b]) => b.score - a.score)
      .forEach(([name, r], i) => console.log(`  ${i + 1}. ${name}: ${r.score}pts`))
    console.log(`\n► WINNER: "${selectedArchetype}" — ${selectionReason}`)
    console.log('\nWINNER BREAKDOWN:')
    Object.entries(archetypeScores[selectedArchetype].breakdown)
      .forEach(([k, v]) => console.log(`  ${v > 0 ? '+' : ''}${v}  ${k}`))
    console.log('═══════════════════════════════════════════════════════\n')

    const archetypeBlock = `
ARCHETYPE (pre-selected by scoring system):
"${selectedArchetype}" — score: ${archetypeRawScore}pts | ${selectionReason}

The "archetype" field in your JSON MUST be exactly: "${selectedArchetype}"
Write an archetypeDescription and insights that authentically explain why this archetype fits the confirmed aspects below.
`

    const ARCHETYPE_LIST = `(healthy → intense, for reference — archetype already selected)
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
3. When citing an aspect, always include the sign, degree, and orb exactly as listed.
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
      parsed.archetype = selectedArchetype // enforce server selection

      try {
        const supabase = getServiceClient()
        await supabase.from('analyses').upsert({
          session_id: sessionId,
          person1_name: person1.name, person2_name: person2.name,
          person1_data: { ...person1, latitude: geo1.latitude, longitude: geo1.longitude },
          person2_data: { ...person2, latitude: geo2.latitude, longitude: geo2.longitude },
          free_analysis: { ...parsed, compatibilityScore },
          payment_status: 'pending', tier: 'free',
          created_at: new Date().toISOString()
        }, { onConflict: 'session_id' })
      } catch (dbError) { console.error('DB error (non-fatal):', dbError) }

      return NextResponse.json({
        sessionId,
        archetype: parsed.archetype,
        archetypeDescription: parsed.archetypeDescription,
        insights: parsed.insights,
        compatibilityScore,
        debugInfo
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
3. When citing any aspect, include sign, degree, and orb.
4. If a planetary area has no confirmed aspect, note that instead of inventing one.
5. Score fields (0–100) should reflect actual aspect quality: tight harmonious = high, no aspect = 50, challenging = lower.

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
  "sunCompatibility": { "aspect": "Confirmed Sun aspect or 'no major Sun aspect detected'", "description": "2-3 sentences", "score": 75 },
  "moonCompatibility": { "aspect": "Confirmed Moon aspect or 'no major Moon aspect detected'", "description": "2-3 sentences", "score": 82 },
  "venusCompatibility": { "aspect": "Confirmed Venus aspect or 'no major Venus aspect detected'", "description": "2-3 sentences", "score": 88 },
  "marsCompatibility": { "aspect": "Confirmed Mars aspect or 'no major Mars aspect detected'", "description": "2-3 sentences", "score": 71 },
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
      parsed.archetype = selectedArchetype // enforce server selection

      try {
        const supabase = getServiceClient()
        await supabase.from('analyses').upsert({
          session_id: sessionId,
          person1_name: person1.name, person2_name: person2.name,
          person1_data: { ...person1, latitude: geo1.latitude, longitude: geo1.longitude },
          person2_data: { ...person2, latitude: geo2.latitude, longitude: geo2.longitude },
          free_analysis: { archetype: parsed.archetype, archetypeDescription: parsed.archetypeDescription,
                           insights: parsed.insights, compatibilityScore },
          full_analysis: parsed,
          payment_status: 'completed', tier: 'premium',
          updated_at: new Date().toISOString()
        }, { onConflict: 'session_id' })
      } catch (dbError) { console.error('DB error (non-fatal):', dbError) }

      return NextResponse.json({
        sessionId,
        archetype: parsed.archetype,
        archetypeDescription: parsed.archetypeDescription,
        insights: parsed.insights,
        compatibilityScore,
        debugInfo,
        fullAnalysis: {
          overview: parsed.overview,
          sunCompatibility: parsed.sunCompatibility, moonCompatibility: parsed.moonCompatibility,
          venusCompatibility: parsed.venusCompatibility, marsCompatibility: parsed.marsCompatibility,
          communicationStyle: parsed.communicationStyle, emotionalDynamics: parsed.emotionalDynamics,
          romanticPotential: parsed.romanticPotential, growthOpportunities: parsed.growthOpportunities,
          challenges: parsed.challenges, coreStrengths: parsed.coreStrengths,
          longTermPotential: parsed.longTermPotential, practicalAdvice: parsed.practicalAdvice
        }
      })
    }
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 })
  }
}
