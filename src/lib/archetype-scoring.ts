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

const PERSONAL = new Set(['sun', 'moon', 'venus', 'mars', 'mercury'])
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

// Saturn/Pluto hard aspect to a personal planet, orb ≤ 6°
function isKarmicFriction(a: SynastryAspect): boolean {
  const k1 = KARMIC_PLANETS.has(a.planet1Key), p2 = PERSONAL.has(a.planet2Key)
  const k2 = KARMIC_PLANETS.has(a.planet2Key), p1 = PERSONAL.has(a.planet1Key)
  return a.nature === 'challenging' && a.orb <= 6 && ((k1 && p2) || (k2 && p1))
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
  } else if (warmth >= 3 && karma <= 1 && growth >= 2) {
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

export function buildPromptHint(scores: ArchetypeScores): string {
  const { warmth, karma, growth, totalHarmonious, totalChallenging, recommendedArchetype, scoringRule } = scores

  const lines: string[] = [
    `SCORING-BASED RECOMMENDATION (computed from actual synastry aspects):`,
    `- Overall aspect balance: ${totalHarmonious} harmonious vs ${totalChallenging} challenging`,
    `- Warmth (personal-planet harmonious/conjunctions, orb≤6°): ${warmth}`,
    `- Karmic friction (Saturn/Pluto hard aspects to personal planets, orb≤6°): ${karma}`,
    `- Growth/destiny (Jupiter/North Node harmonious to personal planet, orb≤5°): ${growth}`,
    `- Scoring rule: ${scoringRule}`,
    `- RECOMMENDED ARCHETYPE: "${recommendedArchetype}"`,
    ``,
    `ARCHETYPE SELECTION RULES:`,
    `1. Default to the RECOMMENDED ARCHETYPE above. Your response should explain why it fits.`,
    `2. You may override ONLY by citing one named PERMITTED OVERRIDE below (verbatim) in the "overrideRule" field.`,
    `3. ABSOLUTE PROHIBITIONS — never choose these regardless of chart interpretation:`,
  ]

  if (warmth >= 3) {
    lines.push(`   ✗ "Karmic Soulmate" is prohibited (warmth=${warmth}≥3 rules it out — strong personal bonding dominates karmic friction)`)
  }
  if (POSITIVE_ARCHETYPES.has(recommendedArchetype)) {
    lines.push(`   ✗ "Karmic Soulmate", "Intense but Temporary Soulmate", "Addictive Chemistry Soulmate" are prohibited when scoring recommends a positive archetype`)
  }

  lines.push(`4. PERMITTED OVERRIDES — cite the exact quoted text in the "overrideRule" field:`)
  getPermittedOverrides(scoringRule).forEach(o => lines.push(`   • ${o}`))

  lines.push(`5. In your JSON response include:`)
  lines.push(`   "followedScoring": true if you selected the recommended archetype, false if you used an override`)
  lines.push(`   "overrideRule": null if you followed scoring, or the exact override text you applied`)

  return lines.join('\n')
}
