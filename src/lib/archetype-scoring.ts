import type { SynastryAspect } from './astrology'

export interface ArchetypeScores {
  warmth: number
  karma: number
  growth: number
  totalHarmonious: number
  totalChallenging: number
  compatibilityScore: number   // independent 0–100 compatibility metric
  recommendedArchetype: string // determined by synastry narrative, validated by score
  scoringRule: string          // describes the dominant pattern that chose the archetype
}

// ---------------------------------------------------------------------------
// Planet sets
// ---------------------------------------------------------------------------

// All personal planets — used for warmth (bonding) detection
const PERSONAL = new Set(['sun', 'moon', 'venus', 'mars', 'mercury'])

// Core identity/emotional/relational planets — used for karmic friction detection.
// Mars is intentionally excluded: Saturn/Pluto sq Mars represents drive-tension, not
// karmic wounding to identity, emotions, or love (which is what Karmic Soulmate reflects).
const VULNERABLE = new Set(['sun', 'moon', 'venus', 'mercury'])

const KARMIC_PLANETS = new Set(['saturn', 'pluto'])
const GROWTH_PLANETS = new Set(['jupiter', 'northNode'])

// ---------------------------------------------------------------------------
// Signal detectors
// ---------------------------------------------------------------------------

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
// Compatibility score (independent of archetype)
//
// Answers: "How compatible are these two people overall?" (0–100)
// The score is a weighted combination of quality-filtered signals.
// It is NOT the archetype selector — it is a validation input.
//
// Calibrated so known charts produce reasonable values:
//   Dee + Ki   (w=5, k=1, g=7) → 95   (exceptional)
//   Dee + Ltni (w≥5, k=0, g=3) → 75   (solid)
//   Dee + DW   (w=5, k=2, g=2) → 61   (mixed)
// ---------------------------------------------------------------------------
function computeScore(warmth: number, karma: number, growth: number): number {
  const warmthPts = Math.min(warmth, 5) * 6   // capped: redundant bonding above 5 adds no new info
  const growthPts = growth * 6                  // uncapped: destiny activation drives the upper range
  const karmaPts  = karma * 4                   // friction deduction
  return Math.min(100, Math.max(0, 27 + warmthPts + growthPts - karmaPts))
}

// ---------------------------------------------------------------------------
// Narrative classifier
//
// Answers: "What is the dominant relationship pattern?" (categorical archetype)
// The five archetypes and their primary signals:
//
//   Highest Timeline Soulmate
//     Exceptional growth/destiny + strong bonding + very low friction
//     Requires warmth≥4 (not just ≥3) so emotional depth matches the destiny signal
//
//   Life Builder Soulmate
//     Strong, stable commitment energy: high warmth, zero or minimal friction,
//     at least some forward growth — building a life together
//
//   Safe Love Soulmate
//     Secure attachment: clear warmth, low friction, no transformative turbulence
//     Comfortable, consistent, emotionally reliable
//
//   Spiritual Catalyst
//     Transformation through friction + growth/warmth present
//     The relationship forces evolution; both connection and challenge exist
//
//   Karmic Soulmate
//     Friction dominates with minimal personal bonding
//     Repeating lessons, difficult patterns, unresolved karma
// ---------------------------------------------------------------------------
function narrativeClassifier(
  warmth: number, karma: number, growth: number
): { archetype: string; scoringRule: string } {

  // 1. Highest Timeline — exceptional destiny + depth of bonding + clean chart
  //    Requires warmth≥4 to ensure emotional depth, not just destiny without connection
  if (growth >= 4 && warmth >= 4 && karma <= 1)
    return { archetype: 'Highest Timeline Soulmate', scoringRule: 'GROWTH_DOMINANT' }

  // 2. Life Builder — committed partnership energy
  //    (a) Very high warmth (≥5) + acceptable friction + meaningful growth
  //    (b) Strong warmth (≥4) + zero friction + some growth
  //    The growth≥1 requirement separates active building from comfortable stasis
  if ((warmth >= 5 && karma <= 1 && growth >= 1) || (warmth >= 4 && karma === 0 && growth >= 1))
    return { archetype: 'Life Builder Soulmate', scoringRule: 'WARMTH_COMMITMENT' }

  // 3. Safe Love — secure attachment, emotionally clean
  //    Warmth present, friction low, no disruptive transformation signal
  if (warmth >= 3 && karma <= 1)
    return { archetype: 'Safe Love Soulmate', scoringRule: 'SECURE_ATTACHMENT' }

  // 4. Spiritual Catalyst — transformation driven by friction + some warmth or growth
  //    The chart has both challenge AND some basis for growth/connection
  if (karma >= 2 && (warmth >= 2 || growth >= 2))
    return { archetype: 'Spiritual Catalyst', scoringRule: 'FRICTION_GROWTH' }

  // 5. Karmic — friction dominates, bonding is minimal
  //    High friction alone, or moderate friction with almost no personal connection
  if (karma >= 3 || (karma >= 2 && warmth <= 1))
    return { archetype: 'Karmic Soulmate', scoringRule: 'FRICTION_DOMINANT' }

  // Default: Safe Love — no dominant pattern detected; neutral chart defaults to
  //          comfortable stability rather than implying friction or difficulty
  return { archetype: 'Safe Love Soulmate', scoringRule: 'NEUTRAL_CHART' }
}

// ---------------------------------------------------------------------------
// Score sanity check (guard rails at extremes only)
//
// The chart narrative is the primary classifier. The score acts only as a
// sanity check to prevent impossible combinations at the extremes:
//   • A score < 50 chart cannot be Highest Timeline
//   • A score > 80 chart should not be Karmic
// Middle-range scores (40–80) do NOT override the narrative.
// ---------------------------------------------------------------------------
function applyScoreSanityCheck(archetype: string, score: number): string {
  if (archetype === 'Highest Timeline Soulmate' && score < 50) return 'Safe Love Soulmate'
  if (archetype === 'Karmic Soulmate' && score > 80)           return 'Spiritual Catalyst'
  return archetype
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function computeArchetypeScores(aspects: SynastryAspect[]): ArchetypeScores {
  const warmth           = aspects.filter(isWarmth).length
  const karma            = aspects.filter(isKarmicFriction).length
  const growth           = aspects.filter(isGrowth).length
  const totalHarmonious  = aspects.filter(a => a.nature === 'harmonious').length
  const totalChallenging = aspects.filter(a => a.nature === 'challenging').length

  const compatibilityScore = computeScore(warmth, karma, growth)
  const { archetype: rawArchetype, scoringRule } = narrativeClassifier(warmth, karma, growth)
  const recommendedArchetype = applyScoreSanityCheck(rawArchetype, compatibilityScore)

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

  return [
    `ARCHETYPE (determined by synastry narrative — do not change): "${recommendedArchetype}"`,
    `Compatibility score: ${compatibilityScore}/100`,
    `Dominant pattern: ${scoringRule}`,
    `Scoring signals:`,
    `- Warmth (personal-planet bonding, orb≤6°): ${warmth}`,
    `- Karmic friction (Saturn/Pluto hard aspect to core personal planet, orb≤6°): ${karma}`,
    `- Growth/destiny (Jupiter/North Node harmonious to personal planet, orb≤5°): ${growth}`,
    `- Overall: ${totalHarmonious} harmonious vs ${totalChallenging} challenging aspects`,
    ``,
    `INSTRUCTION: The archetype is already chosen based on the synastry narrative. Write the description and insights AS IF "${recommendedArchetype}" is definitively correct for this chart. Reference the strongest confirmed aspects as evidence. Do not suggest or imply a different archetype.`,
  ].join('\n')
}
