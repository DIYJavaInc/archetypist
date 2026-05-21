import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getServiceClient } from '@/lib/supabase'
import {
  geocodeLocation,
  getNatalChart,
  calculateSynastryAspects,
  formatChartForPrompt,
  formatAspectsForPrompt
} from '@/lib/astrology'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { person1, person2, tier = 'free', existingSessionId } = body

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

    const chartSummary1 = formatChartForPrompt(person1.name, chart1)
    const chartSummary2 = formatChartForPrompt(person2.name, chart2)
    const aspectsSummary = formatAspectsForPrompt(aspects, person1.name, person2.name)

    const harmonious = aspects.filter(a => a.nature === 'harmonious').length
    const challenging = aspects.filter(a => a.nature === 'challenging').length
    const compatibilityScore = Math.min(100, Math.round(
      50 + (harmonious * 5) - (challenging * 3) + Math.floor(Math.random() * 10)
    ))

    if (tier === 'free') {
      // Free analysis: archetype + 3 insights
      const freePrompt = `You are an expert astrologer analyzing synastry between two people. Based on their birth charts, provide a concise free preview analysis.

CHART DATA:
${chartSummary1}

${chartSummary2}

KEY SYNASTRY ASPECTS:
${aspectsSummary}

Provide a JSON response with exactly this structure:
{
  "archetype": "A 2-4 word mythic archetype name for this relationship (e.g., 'The Sacred Mirror', 'The Twin Flames', 'The Alchemical Union')",
  "archetypeDescription": "One compelling sentence describing this archetype's essence (max 25 words)",
  "insights": [
    "First key synastry insight about their connection (2 sentences max)",
    "Second key insight about their emotional or romantic dynamic (2 sentences max)",
    "Third key insight about their growth potential together (2 sentences max)"
  ]
}

Be evocative, specific to their chart data, and psychologically insightful.`

      const message = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 600,
        messages: [{ role: 'user', content: freePrompt }]
      })

      const content = message.content[0].type === 'text' ? message.content[0].text : ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Invalid AI response')

      const parsed = JSON.parse(jsonMatch[0])

      // Store in Supabase
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
      // Premium analysis: full reading
      const premiumPrompt = `You are a master astrologer providing a comprehensive synastry reading. Analyze the birth charts below with depth, nuance, and psychological insight.

CHART DATA:
${chartSummary1}

${chartSummary2}

KEY SYNASTRY ASPECTS:
${aspectsSummary}

Provide a detailed JSON response with this EXACT structure (all fields required):
{
  "archetype": "2-4 word mythic archetype",
  "archetypeDescription": "One sentence essence description",
  "insights": ["insight1", "insight2", "insight3"],
  "overview": "3-4 sentence overview of the relationship's core dynamic and soul-level purpose",
  "sunCompatibility": {
    "aspect": "The main Sun-Sun or cross-planet aspect",
    "description": "2-3 sentences on core identity and ego compatibility",
    "score": 75
  },
  "moonCompatibility": {
    "aspect": "Main Moon aspect between charts",
    "description": "2-3 sentences on emotional needs and nurturing patterns",
    "score": 82
  },
  "venusCompatibility": {
    "aspect": "Main Venus aspect",
    "description": "2-3 sentences on love styles, values, and aesthetic harmony",
    "score": 88
  },
  "marsCompatibility": {
    "aspect": "Main Mars aspect",
    "description": "2-3 sentences on desire, drive, and physical chemistry",
    "score": 71
  },
  "communicationStyle": "2-3 sentences on how they communicate, Mercury aspects, and intellectual connection",
  "emotionalDynamics": "2-3 sentences on the emotional flow, Moon dynamics, and how they support each other",
  "romanticPotential": "2-3 sentences on the romantic and passionate potential of this union",
  "growthOpportunities": [
    "Growth opportunity 1",
    "Growth opportunity 2",
    "Growth opportunity 3"
  ],
  "challenges": [
    "Challenge 1 with constructive framing",
    "Challenge 2 with constructive framing",
    "Challenge 3 with constructive framing"
  ],
  "coreStrengths": [
    "Core strength 1",
    "Core strength 2",
    "Core strength 3",
    "Core strength 4"
  ],
  "longTermPotential": "2-3 sentences on the long-term viability and evolution of this relationship",
  "practicalAdvice": [
    "Practical advice 1",
    "Practical advice 2",
    "Practical advice 3"
  ]
}

Use specific planetary data from their charts. Be insightful, precise, and compassionate.`

      const message = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: premiumPrompt }]
      })

      const content = message.content[0].type === 'text' ? message.content[0].text : ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Invalid AI response')

      const parsed = JSON.parse(jsonMatch[0])

      // Update Supabase record
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
          overview: parsed.overview,
          sunCompatibility: parsed.sunCompatibility,
          moonCompatibility: parsed.moonCompatibility,
          venusCompatibility: parsed.venusCompatibility,
          marsCompatibility: parsed.marsCompatibility,
          communicationStyle: parsed.communicationStyle,
          emotionalDynamics: parsed.emotionalDynamics,
          romanticPotential: parsed.romanticPotential,
          growthOpportunities: parsed.growthOpportunities,
          challenges: parsed.challenges,
          coreStrengths: parsed.coreStrengths,
          longTermPotential: parsed.longTermPotential,
          practicalAdvice: parsed.practicalAdvice
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
