import { describe, it, expect } from 'vitest'
import { computeArchetypeScores } from '../archetype-scoring'
import type { SynastryAspect } from '../astrology'

// Minimal fixture builder — only the fields that affect scoring logic
function asp(
  p1Key: string,
  p2Key: string,
  aspectName: string,
  orb: number,
  nature: 'harmonious' | 'challenging' | 'neutral'
): SynastryAspect {
  return {
    planet1Key: p1Key,
    planet2Key: p2Key,
    planet1Label: p1Key,
    planet2Label: p2Key,
    planet1Sign: 'Aries',
    planet2Sign: 'Aries',
    planet1Degree: 0,
    planet2Degree: 0,
    aspect: aspectName,
    orb,
    nature,
  }
}

// ---------------------------------------------------------------------------
// Regression test: Dee (Feb 24 1987, Miami FL) vs Ki (May 17 1976, Atlanta GA)
// Real synastry aspects calculated from Keplerian orbital mechanics.
// Expected: Highest Timeline Soulmate
// Reasoning: 3 tight warmth indicators + 2 growth aspects + only 1 karmic friction
// ---------------------------------------------------------------------------
const DEE_KI_ASPECTS: SynastryAspect[] = [
  // Warmth: personal-to-personal harmonious / conjunction, orb ≤ 6°
  asp('venus', 'moon',    'Conjunction', 3.3, 'neutral'),     // ← Venus conj Ki's Moon
  asp('venus', 'venus',   'Trine',       3.4, 'harmonious'),  // ← Venus trine Ki's Venus
  asp('moon',  'moon',    'Conjunction', 5.4, 'neutral'),     // ← Moon conj Ki's Moon

  // Growth: Jupiter/North Node harmonious to personal planet, orb ≤ 5°
  asp('moon',    'jupiter',   'Trine', 0.7, 'harmonious'),   // ← Moon trine Ki's Jupiter
  asp('mercury', 'northNode', 'Trine', 0.1, 'harmonious'),   // ← Mercury trine Ki's North Node

  // Karmic friction: Saturn/Pluto challenging to personal, orb ≤ 6°
  asp('moon', 'pluto', 'Square', 3.8, 'challenging'),        // ← Moon sq Ki's Pluto

  // Other aspects (should not affect warmth/karma/growth counts)
  asp('jupiter', 'saturn', 'Trine',      0.1, 'harmonious'), // Jupiter-Saturn: neither is PERSONAL
  asp('mars',    'mars',   'Square',     1.8, 'challenging'), // Mars-Mars: personal-personal challenging (not karmic)
  asp('venus',   'saturn', 'Opposition', 6.9, 'challenging'), // Venus-Saturn outside 6° orb
]

describe('Dee vs Ki — regression', () => {
  const scores = computeArchetypeScores(DEE_KI_ASPECTS)

  it('warmth = 3', () => expect(scores.warmth).toBe(3))
  it('karma = 1', () => expect(scores.karma).toBe(1))
  it('growth = 2', () => expect(scores.growth).toBe(2))
  it('scoringRule = PEAK_HARMONY', () => expect(scores.scoringRule).toBe('PEAK_HARMONY'))
  it('recommendedArchetype = Highest Timeline Soulmate', () =>
    expect(scores.recommendedArchetype).toBe('Highest Timeline Soulmate'))
  it('recommendedArchetype is NOT Karmic Soulmate', () =>
    expect(scores.recommendedArchetype).not.toBe('Karmic Soulmate'))
})

// ---------------------------------------------------------------------------
// Regression test: Dee (Feb 24 1987, Miami FL) vs Ltni (Jan 3 1994, Birmingham AL)
// Real synastry aspects calculated from Keplerian orbital mechanics.
// Expected: Life Builder Soulmate
// Reasoning: 4 warmth indicators + very low karma — stability without transcendent growth signals
// ---------------------------------------------------------------------------
const DEE_LTNI_ASPECTS: SynastryAspect[] = [
  // Warmth: personal-to-personal harmonious / conjunction, orb ≤ 6°
  asp('moon',  'sun',    'Conjunction', 0.2, 'neutral'),     // ← Moon conj Ltni's Sun
  asp('moon',  'mercury','Conjunction', 0.1, 'neutral'),     // ← Moon conj Ltni's Mercury
  asp('moon',  'venus',  'Conjunction', 3.0, 'neutral'),     // ← Moon conj Ltni's Venus
  asp('venus', 'moon',   'Trine',       5.2, 'harmonious'),  // ← Venus trine Ltni's Moon

  // Karmic friction: Saturn challenging to personal, orb ≤ 6°
  asp('saturn', 'moon', 'Square', 4.5, 'challenging'),       // ← Saturn sq Ltni's Moon (estimated orb)

  // Other (Jupiter-Pluto: Jupiter is GROWTH but Pluto is NOT PERSONAL → not a growth aspect)
  asp('jupiter', 'pluto', 'Trine', 1.8, 'harmonious'),
]

describe('Dee vs Ltni — regression', () => {
  const scores = computeArchetypeScores(DEE_LTNI_ASPECTS)

  it('warmth = 4', () => expect(scores.warmth).toBe(4))
  it('karma = 1', () => expect(scores.karma).toBe(1))
  it('growth = 0', () => expect(scores.growth).toBe(0))
  it('scoringRule = STRONG_WARMTH', () => expect(scores.scoringRule).toBe('STRONG_WARMTH'))
  it('recommendedArchetype = Life Builder Soulmate', () =>
    expect(scores.recommendedArchetype).toBe('Life Builder Soulmate'))
  it('recommendedArchetype is NOT Karmic Soulmate', () =>
    expect(scores.recommendedArchetype).not.toBe('Karmic Soulmate'))
})

// ---------------------------------------------------------------------------
// Regression test: Dee (Feb 24 1987, Miami FL) vs DW (Dec 27 1978, Atlanta GA)
// Real synastry aspects calculated from Keplerian orbital mechanics.
// Expected: NOT automatically Karmic — chart is mixed with meaningful growth.
// Recommended: Spiritual Catalyst Soulmate (MIXED_WITH_GROWTH rule)
// Reasoning: warmth=2, karma=2, growth=2 — neither warmth nor karma clearly dominate
// ---------------------------------------------------------------------------
const DEE_DW_ASPECTS: SynastryAspect[] = [
  // Warmth: personal-to-personal harmonious / conjunction, orb ≤ 6°
  asp('sun',  'sun',  'Sextile',     0.5, 'harmonious'), // ← Sun sextile DW's Sun
  asp('moon', 'mars', 'Conjunction', 1.6, 'neutral'),    // ← Moon conj DW's Mars

  // Karmic friction: Saturn/Pluto challenging to personal, orb ≤ 6°
  asp('venus', 'pluto', 'Square', 2.8, 'challenging'),   // ← Venus sq DW's Pluto
  asp('moon',  'pluto', 'Square', 6.0, 'challenging'),   // ← Moon sq DW's Pluto (boundary: exactly 6°)

  // Growth: Jupiter/Node harmonious to personal planet, orb ≤ 5°
  asp('venus',    'northNode', 'Trine', 0.4, 'harmonious'), // ← Venus trine DW's North Node
  asp('northNode','mercury',   'Trine', 0.3, 'harmonious'), // ← North Node trine DW's Mercury

  // Other (should not affect counts)
  asp('saturn', 'northNode', 'Square', 1.0, 'challenging'), // Saturn-Node: northNode NOT PERSONAL
  asp('sun',    'moon',      'Square', 1.1, 'challenging'), // Sun-Moon: personal-personal but NOT karmic planet
  asp('moon',   'saturn',    'Trine',  1.4, 'harmonious'), // Moon-Saturn: harmonious, not warmth (saturn not PERSONAL)
  asp('saturn', 'saturn',    'Square', 6.0, 'challenging'), // Saturn-Saturn: neither is PERSONAL
]

describe('Dee vs DW — regression', () => {
  const scores = computeArchetypeScores(DEE_DW_ASPECTS)

  it('warmth = 2', () => expect(scores.warmth).toBe(2))
  it('karma = 2', () => expect(scores.karma).toBe(2))
  it('growth = 2', () => expect(scores.growth).toBe(2))
  it('scoringRule = MIXED_WITH_GROWTH', () => expect(scores.scoringRule).toBe('MIXED_WITH_GROWTH'))
  it('recommendedArchetype = Spiritual Catalyst Soulmate', () =>
    expect(scores.recommendedArchetype).toBe('Spiritual Catalyst Soulmate'))
  it('recommendedArchetype is NOT Karmic Soulmate', () =>
    expect(scores.recommendedArchetype).not.toBe('Karmic Soulmate'))
})

// ---------------------------------------------------------------------------
// Unit: scoring rule coverage
// ---------------------------------------------------------------------------
describe('scoring rules — unit', () => {
  it('HIGH_FRICTION → Karmic when karma≥3 and warmth≤2', () => {
    const aspects = [
      asp('saturn', 'sun',   'Square',     1.0, 'challenging'),
      asp('saturn', 'moon',  'Opposition', 2.0, 'challenging'),
      asp('pluto',  'venus', 'Square',     3.0, 'challenging'),
    ]
    const s = computeArchetypeScores(aspects)
    expect(s.scoringRule).toBe('HIGH_FRICTION')
    expect(s.recommendedArchetype).toBe('Karmic Soulmate')
  })

  it('HARMONIOUS_BALANCE → Safe Love when no strong personal bonding but overall harmonious', () => {
    const aspects = [
      asp('jupiter', 'saturn', 'Trine', 1.0, 'harmonious'),
      asp('neptune', 'jupiter','Trine', 2.0, 'harmonious'),
      asp('pluto',   'neptune','Trine', 1.5, 'harmonious'),
    ]
    const s = computeArchetypeScores(aspects)
    expect(s.scoringRule).toBe('HARMONIOUS_BALANCE')
    expect(s.recommendedArchetype).toBe('Safe Love Soulmate')
  })

  it('MODERATE_WARMTH → Healing Partner when warmth=2 and low karma', () => {
    const aspects = [
      asp('moon',  'sun',   'Conjunction', 2.0, 'neutral'),
      asp('venus', 'venus', 'Trine',       3.0, 'harmonious'),
    ]
    const s = computeArchetypeScores(aspects)
    expect(s.scoringRule).toBe('MODERATE_WARMTH')
    expect(s.recommendedArchetype).toBe('Healing Partner Soulmate')
  })

  it('warmth orb boundary: 6.0° counts, 6.1° does not', () => {
    const at6  = [asp('venus', 'moon', 'Conjunction', 6.0, 'neutral')]
    const over = [asp('venus', 'moon', 'Conjunction', 6.1, 'neutral')]
    expect(computeArchetypeScores(at6).warmth).toBe(1)
    expect(computeArchetypeScores(over).warmth).toBe(0)
  })

  it('karma orb boundary: 6.0° counts, 6.1° does not', () => {
    const at6  = [asp('saturn', 'sun', 'Square', 6.0, 'challenging')]
    const over = [asp('saturn', 'sun', 'Square', 6.1, 'challenging')]
    expect(computeArchetypeScores(at6).karma).toBe(1)
    expect(computeArchetypeScores(over).karma).toBe(0)
  })

  it('growth orb boundary: 5.0° counts, 5.1° does not', () => {
    const at5  = [asp('jupiter', 'moon', 'Trine', 5.0, 'harmonious')]
    const over = [asp('jupiter', 'moon', 'Trine', 5.1, 'harmonious')]
    expect(computeArchetypeScores(at5).growth).toBe(1)
    expect(computeArchetypeScores(over).growth).toBe(0)
  })

  it('Saturn harmonious to personal planet does NOT count as karmic friction', () => {
    const aspects = [asp('saturn', 'moon', 'Trine', 2.0, 'harmonious')]
    expect(computeArchetypeScores(aspects).karma).toBe(0)
  })

  it('Mars square does NOT count as karmic friction (Mars is not in KARMIC_PLANETS)', () => {
    const aspects = [asp('mars', 'sun', 'Square', 1.0, 'challenging')]
    expect(computeArchetypeScores(aspects).karma).toBe(0)
  })

  it('Jupiter conjunction to personal planet IS a growth aspect', () => {
    const aspects = [asp('jupiter', 'venus', 'Conjunction', 2.0, 'neutral')]
    // Conjunction is 'neutral', not 'harmonious', so it should NOT count as growth (growth requires nature === 'harmonious')
    expect(computeArchetypeScores(aspects).growth).toBe(0)
  })

  it('Pluto square to outer planet does NOT count as karma (outer planet not PERSONAL)', () => {
    const aspects = [asp('pluto', 'jupiter', 'Square', 1.0, 'challenging')]
    expect(computeArchetypeScores(aspects).karma).toBe(0)
  })
})
