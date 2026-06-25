import type { SynastryAspect } from './astrology'

export interface ArchetypeScores {
  warmth: number
  karma: number
  growth: number
  totalHarmonious: number
  totalChallenging: number
  compatibilityScore: number   // deterministic 0–100; primary archetype selector
  recommendedArchetype: string
  scoringRule: string          // SCORE_<range> label
}

// All personal planets — used for warmth (bonding) detection
const PERSONAL = new Set(['sun', 'moon', 'venus', 'mars', 'mercury'])

// Core identity/emotional/relational planets — used for karmic friction detection.
// Mars is intentionally excluded: Saturn/Pluto sq Mars represents drive-tension, not
// karmic wounding to identity, emotions, or love (which is what Karmic Soulmate reflects).
const VULNERABLE = new Set(['sun', 'moon', 'venus', 'mercury'])

const KARMIC_PLANETS = new Set(['saturn', 'pluto'])
const GROWTH_PLANETS = new Set(['jupiter', 'northNode'])

// Personal-planet bonding: both planets are personal, aspect is harmonious or conjunction, orb ≤ 6°
function isWarmth(a: SynastryAspect): boolean {
  return (
    a.orb <= 6 &&
    PERSONAL.has(a.planet1Key) &&
    PERSONAL.has(a.planet2Key) &&
    (a.nature === 'harmonious' || a.aspect === 'Conjunction')
  )
}

// Saturn/Pluto hard aspect to a core personal planet (Sun/Moon/Venus/Mercury), orb ≤ 6°.
// Mars is excluded from the receiving set — see VULNERABLE definition above.
function isKarmicFriction(a: SynastryAspect): boolean {
  const k1 = KARMIC_PLANETS.has(a.planet1Key), v2 = VULNERABLE.has(a.planet2Key)
  const k2 = KARMIC_PLANETS.has(a.planet2Key), v1 = VULNERABLE.has(a.planet1Key)
  return a.nature === 'challenging' && a.orb <= 6 && ((k1 && v2) || (k2 && v1))
}

// Jupiter or North Node in harmonious aspect to a personal planet, orb ≤ 5°
function isGrowth(a: SynastryAspect): boolean {
  return (
    a.nature === 'harmonious' &&
    a.orb <= 5 &&
    (PERSONAL.has(a.planet1Key) || PERSONAL.has(a.planet2Key)) &&
    (GROWTH_PLANETS.has(a.planet1Key) || GROWTH_PLANETS.has(a.planet2Key))
  )
}

// ---------------------------------------------------------------------------
// Score formula
//
// Calibrated to three confirmed regression charts (from Keplerian orbital calc):
//   Dee + Ki   (warmth=5, karma=1, growth=7) → 27 + 30 + 42 −  4 = 95 → Highest Timeline
//   Dee + Ltni (warmth≥5, karma=0, growth=3) → 27 + 30 + 18 −  0 = 75 → Life Builder
//   Dee + DW   (warmth=5, karma=2, growth=2) → 27 + 30 + 12 −  8 = 61 → Spiritual Catalyst
//
// Design decisions:
//   • warmth is capped at 5 aspects: having 10 tight bonding aspects is not "twice as good"
//     as 5 — it means the same bonding energy expressed multiple ways.
//   • growth is uncapped: Jupiter/Node activation is the primary driver of upper tiers.
//     A chart without growth indicators cannot reach Life Builder or above on warmth alone.
//   • karma penalty is modest (4 pts each): friction matters but should not collapse a
//     chart with strong warmth + growth unless friction is severe.
// ---------------------------------------------------------------------------
function computeScore(warmth: number, karma: number, growth: number): number {
  const warmthPts = Math.min(warmth, 5) * 6   // first 5 warmth aspects = 6 pts each (max 30)
  const growthPts = growth * 6                  // each growth/destiny aspect = 6 pts (no cap)
  const karmaPts  = karma * 4                   // each karmic friction aspect costs 4 pts
  return Math.min(100, Math.max(0, 27 + warmthPts + growthPts - karmaPts))
}

// Score range → archetype. Score is the sole selector; evidence is expressed through the score.
function scoreToCategory(score: number): { archetype: string; scoringRule: string } {
  if (score >= 95) return { archetype: 'Highest Timeline Soulmate',                  scoringRule: 'SCORE_95_PLUS' }
  if (score >= 80) return { archetype: 'Safe Love Soulmate',                         scoringRule: 'SCORE_80_94'   }
  if (score >= 70) return { archetype: 'Life Builder Soulmate',                      scoringRule: 'SCORE_70_79'   }
  if (score >= 55) return { archetype: 'Spiritual Catalyst',                         scoringRule: 'SCORE_55_69'   }
  if (score >= 40) return { archetype: 'Romantic Soulmate with Spiritual Chemistry', scoringRule: 'SCORE_40_54'   }
  return                   { archetype: 'Karmic Soulmate',                           scoringRule: 'SCORE_0_39'    }
}

const SCORE_RANGE_LABEL: Record<string, string> = {
  SCORE_95_PLUS: '95–100',
  SCORE_80_94:   '80–94',
  SCORE_70_79:   '70–79',
  SCORE_55_69:   '55–69',
  SCORE_40_54:   '40–54',
  SCORE_0_39:    '0–39',
}

export function computeArchetypeScores(aspects: SynastryAspect[]): ArchetypeScores {
  const warmth           = aspects.filter(isWarmth).length
  const karma            = aspects.filter(isKarmicFriction).length
  const growth           = aspects.filter(isGrowth).length
  const totalHarmonious  = aspects.filter(a => a.nature === 'harmonious').length
  const totalChallenging = aspects.filter(a => a.nature === 'challenging').length

  const compatibilityScore = computeScore(warmth, karma, growth)
  const { archetype: recommendedArchetype, scoringRule } = scoreToCategory(compatibilityScore)

  return {
    warmth, karma, growth,
    totalHarmonious, totalChallenging,
    compatibilityScore,
    recommendedArchetype,
    scoringRule,
  }
}

export function buildArchetypeContext(scores: ArchetypeScores): string {
  const {
    warmth, karma, growth,
    totalHarmonious, totalChallenging,
    compatibilityScore, recommendedArchetype, scoringRule,
  } = scores

  const rangeLabel = SCORE_RANGE_LABEL[scoringRule] ?? scoringRule

  return [
    `ARCHETYPE (determined by compatibility score — do not change): "${recommendedArchetype}"`,
    `Compatibility score: ${compatibilityScore}/100 (score range: ${rangeLabel})`,
    `Scoring signals:`,
    `- Warmth (personal-planet bonding, orb≤6°): ${warmth}`,
    `- Karmic friction (Saturn/Pluto hard aspect to core personal planet, orb≤6°): ${karma}`,
    `- Growth/destiny (Jupiter/North Node harmonious to personal planet, orb≤5°): ${growth}`,
    `- Overall: ${totalHarmonious} harmonious vs ${totalChallenging} challenging aspects`,
    ``,
    `INSTRUCTION: The archetype is already chosen based on the compatibility score. Write the description and insights AS IF "${recommendedArchetype}" is definitively correct for this chart. Reference the strongest confirmed aspects as evidence. Do not suggest or imply a different archetype.`,
  ].join('\n')
}
