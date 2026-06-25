import type { SynastryAspect } from './astrology'

export interface ArchetypeScores {
  warmth: number
  karma: number
  growth: number
  totalHarmonious: number
  totalChallenging: number
  recommendedArchetype: string
  scoringRule: string
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

export function computeArchetypeScores(aspects: SynastryAspect[]): ArchetypeScores {
  const warmth = aspects.filter(isWarmth).length
  const karma = aspects.filter(isKarmicFriction).length
  const growth = aspects.filter(isGrowth).length
  const totalHarmonious = aspects.filter(a => a.nature === 'harmonious').length
  const totalChallenging = aspects.filter(a => a.nature === 'challenging').length

  let recommendedArchetype: string
  let scoringRule: string

  if (karma >= 3 && warmth <= 2) {
    recommendedArchetype = 'Karmic Soulmate'
    scoringRule = 'HIGH_FRICTION'
  } else if (warmth >= 3 && karma <= 1 && growth >= 4) {
    // Requires strong growth signal (≥4) to distinguish from Life Builder.
    // A modest Jupiter trine or two (growth 2-3) indicates good partnership, not peak destiny.
    recommendedArchetype = 'Highest Timeline Soulmate'
    scoringRule = 'PEAK_HARMONY'
  } else if (warmth >= 4 && karma <= 1) {
    recommendedArchetype = 'Life Builder Soulmate'
    scoringRule = 'STRONG_WARMTH'
  } else if (warmth >= 3 && karma <= 1) {
    recommendedArchetype = 'Life Builder Soulmate'
    scoringRule = 'GOOD_WARMTH'
  } else if (warmth >= 2 && karma >= 2 && growth >= 2) {
    recommendedArchetype = 'Spiritual Catalyst Soulmate'
    scoringRule = 'MIXED_WITH_GROWTH'
  } else if (warmth >= 3 && karma >= 2) {
    recommendedArchetype = 'Life Builder Soulmate'
    scoringRule = 'WARMTH_OVER_FRICTION'
  } else if (warmth >= 2) {
    recommendedArchetype = 'Healing Partner Soulmate'
    scoringRule = 'MODERATE_WARMTH'
  } else if (totalHarmonious > totalChallenging) {
    recommendedArchetype = 'Safe Love Soulmate'
    scoringRule = 'HARMONIOUS_BALANCE'
  } else {
    recommendedArchetype = 'Karmic Soulmate'
    scoringRule = 'DEFAULT_LOW_WARMTH'
  }

  return { warmth, karma, growth, totalHarmonious, totalChallenging, recommendedArchetype, scoringRule }
}

function getPermittedOverrides(scoringRule: string): string[] {
  switch (scoringRule) {
    case 'PEAK_HARMONY':
      return [
        `"OVERRIDE:STABILITY" — chart emphasizes practical security and stability over transcendent growth → select "Life Builder Soulmate"`,
        `"OVERRIDE:PEACEFUL_SECURITY" — Sun-Moon harmonious contacts dominate with calm, secure energy → select "Safe Love Soulmate"`,
      ]
    case 'STRONG_WARMTH':
    case 'GOOD_WARMTH':
      return [
        `"OVERRIDE:HEALING_THEME" — mutual emotional healing and recovery are the chart's primary theme → select "Healing Partner Soulmate"`,
        `"OVERRIDE:PEACEFUL_SECURITY" — chart emphasizes comfort, peace, and settled security → select "Safe Love Soulmate"`,
        `"OVERRIDE:PEAK_GROWTH" — strong Jupiter/North Node aspects signal transcendent destiny connection → select "Highest Timeline Soulmate"`,
      ]
    case 'MIXED_WITH_GROWTH':
      return [
        `"OVERRIDE:STABILITY_DOMINANT" — Saturn trines or Sun-Moon harmonious aspects clearly indicate stable partnership → select "Life Builder Soulmate"`,
      ]
    case 'WARMTH_OVER_FRICTION':
      return [
        `"OVERRIDE:GROWTH_DOMINANT" — Jupiter/North Node activation energy clearly leads over practical bonding → select "Spiritual Catalyst Soulmate"`,
        `"OVERRIDE:HEALING_THEME" — mutual emotional healing and recovery are the chart's primary theme → select "Healing Partner Soulmate"`,
      ]
    case 'HIGH_FRICTION':
    case 'DEFAULT_LOW_WARMTH':
      return [
        `"OVERRIDE:ADDICTIVE_PULL" — Venus-Pluto or Moon-Pluto conjunctions create magnetic but destabilizing pull → select "Addictive Chemistry Soulmate"`,
        `"OVERRIDE:MARS_CLASH" — Mars-dominant clash pattern with heat but no stability foundation → select "Intense but Temporary Soulmate"`,
      ]
    case 'MODERATE_WARMTH':
      return [
        `"OVERRIDE:STABILITY_DOMINANT" — strong practical Venus-Saturn or Sun-Saturn harmonious aspects → select "Life Builder Soulmate"`,
        `"OVERRIDE:PEACEFUL_SECURITY" — chart emphasizes comfort, peace, and settled security → select "Safe Love Soulmate"`,
        `"OVERRIDE:GROWTH_DOMINANT" — Jupiter/North Node activation energy clearly leads → select "Spiritual Catalyst Soulmate"`,
      ]
    case 'HARMONIOUS_BALANCE':
      return [
        `"OVERRIDE:STABILITY_DOMINANT" — strong Venus-Saturn or Sun-Moon harmonious contacts → select "Life Builder Soulmate"`,
        `"OVERRIDE:HEALING_THEME" — mutual emotional healing and recovery are the chart's primary theme → select "Healing Partner Soulmate"`,
      ]
    default:
      return [
        `"OVERRIDE:CHART_SPECIFIC" — compelling astrological reason not captured by scoring (describe briefly)`,
      ]
  }
}

const POSITIVE_ARCHETYPES = new Set([
  'Highest Timeline Soulmate',
  'Life Builder Soulmate',
  'Safe Love Soulmate',
  'Healing Partner Soulmate',
  'Spiritual Catalyst Soulmate',
])

export function buildArchetypeContext(scores: ArchetypeScores): string {
  const { warmth, karma, growth, totalHarmonious, totalChallenging, recommendedArchetype, scoringRule } = scores

  return [
    `ARCHETYPE (determined by scoring — do not change): "${recommendedArchetype}"`,
    `Scoring context:`,
    `- Overall: ${totalHarmonious} harmonious vs ${totalChallenging} challenging aspects`,
    `- Warmth (personal-planet bonding, orb≤6°): ${warmth}`,
    `- Karmic friction (Saturn/Pluto hard to personal planet, orb≤6°): ${karma}`,
    `- Growth/destiny (Jupiter/North Node harmonious to personal planet, orb≤5°): ${growth}`,
    `- Rule applied: ${scoringRule}`,
    ``,
    `INSTRUCTION: The archetype is already chosen. Write the description and insights AS IF "${recommendedArchetype}" is definitively correct for this chart. Do not suggest or imply a different archetype.`,
  ].join('\n')
}
