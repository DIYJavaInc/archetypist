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
// Regression: Dee + Ki  (Highest Timeline — score 95)
// Real chart: warmth=5, karma=1, growth=7
// Formula: 27 + min(5,5)*6 + 7*6 − 1*4 = 27 + 30 + 42 − 4 = 95
// ---------------------------------------------------------------------------
const DEE_KI_ASPECTS: SynastryAspect[] = [
  // Warmth (5): personal-to-personal harmonious/conjunction, orb ≤ 6°
  asp('venus',   'moon',    'Conjunction', 3.3, 'neutral'),    // w1
  asp('venus',   'venus',   'Trine',       3.4, 'harmonious'), // w2
  asp('moon',    'moon',    'Conjunction', 5.4, 'neutral'),    // w3
  asp('sun',     'moon',    'Trine',       2.0, 'harmonious'), // w4
  asp('mercury', 'venus',   'Trine',       1.5, 'harmonious'), // w5

  // Growth (7): Jupiter/Node harmonious to personal planet, orb ≤ 5°
  asp('moon',    'jupiter',   'Trine',   0.7, 'harmonious'),   // g1
  asp('mercury', 'northNode', 'Trine',   0.1, 'harmonious'),   // g2
  asp('sun',     'jupiter',   'Trine',   2.3, 'harmonious'),   // g3
  asp('venus',   'northNode', 'Sextile', 1.8, 'harmonious'),   // g4
  asp('mars',    'jupiter',   'Sextile', 3.2, 'harmonious'),   // g5 — mars is PERSONAL
  asp('sun',     'northNode', 'Trine',   4.5, 'harmonious'),   // g6
  asp('moon',    'northNode', 'Sextile', 2.1, 'harmonious'),   // g7

  // Karma (1): Saturn/Pluto challenging to VULNERABLE (sun/moon/venus/mercury), orb ≤ 6°
  asp('moon',    'pluto',   'Square',     3.8, 'challenging'), // k1

  // Mars-Saturn sq: drive tension — NOT karma because Mars ∉ VULNERABLE
  asp('mars',    'saturn',  'Square',     3.9, 'challenging'), // excluded from karma

  // Other (neither warmth, karma, nor growth)
  asp('jupiter', 'saturn',  'Trine',      0.1, 'harmonious'), // no personal planet
  asp('venus',   'saturn',  'Opposition', 6.9, 'challenging'), // orb > 6°
]

describe('Dee + Ki regression — Highest Timeline (score 95)', () => {
  const s = computeArchetypeScores(DEE_KI_ASPECTS)

  it('warmth = 5', () => expect(s.warmth).toBe(5))
  it('karma = 1 (Mars-Saturn sq excluded — Mars ∉ VULNERABLE)', () => expect(s.karma).toBe(1))
  it('growth = 7', () => expect(s.growth).toBe(7))
  it('compatibilityScore = 95', () => expect(s.compatibilityScore).toBe(95))
  it('scoringRule = SCORE_95_PLUS', () => expect(s.scoringRule).toBe('SCORE_95_PLUS'))
  it('recommendedArchetype = Highest Timeline Soulmate', () =>
    expect(s.recommendedArchetype).toBe('Highest Timeline Soulmate'))
})

// ---------------------------------------------------------------------------
// Regression: Dee + Ltni  (Life Builder — score 75)
// Real chart: warmth=10→capped at 5, karma=0, growth=3
// Formula: 27 + 5*6 + 3*6 − 0 = 27 + 30 + 18 = 75
// (The fixture uses 5 warmth aspects; real chart has 10 but warmth is capped at 5.)
// ---------------------------------------------------------------------------
const DEE_LTNI_ASPECTS: SynastryAspect[] = [
  // Warmth (5): personal-to-personal, orb ≤ 6°
  asp('moon',  'sun',     'Conjunction', 0.2, 'neutral'),    // w1
  asp('moon',  'mercury', 'Conjunction', 0.1, 'neutral'),    // w2
  asp('moon',  'venus',   'Conjunction', 3.0, 'neutral'),    // w3
  asp('venus', 'moon',    'Trine',       5.2, 'harmonious'), // w4
  asp('sun',   'mercury', 'Sextile',     2.4, 'harmonious'), // w5

  // Growth (3)
  asp('sun',     'jupiter', 'Trine',   4.9, 'harmonious'),  // g1
  asp('moon',    'jupiter', 'Trine',   2.7, 'harmonious'),  // g2
  asp('mercury', 'jupiter', 'Sextile', 1.2, 'harmonious'),  // g3

  // Karma (0): no qualifying Saturn/Pluto hard aspects to VULNERABLE planets
]

describe('Dee + Ltni regression — Life Builder (score 75)', () => {
  const s = computeArchetypeScores(DEE_LTNI_ASPECTS)

  it('warmth = 5', () => expect(s.warmth).toBe(5))
  it('karma = 0', () => expect(s.karma).toBe(0))
  it('growth = 3', () => expect(s.growth).toBe(3))
  it('compatibilityScore = 75', () => expect(s.compatibilityScore).toBe(75))
  it('scoringRule = SCORE_70_79', () => expect(s.scoringRule).toBe('SCORE_70_79'))
  it('recommendedArchetype = Life Builder Soulmate', () =>
    expect(s.recommendedArchetype).toBe('Life Builder Soulmate'))
  it('is NOT Highest Timeline (growth < 7 with karma=0)', () =>
    expect(s.recommendedArchetype).not.toBe('Highest Timeline Soulmate'))
})

// ---------------------------------------------------------------------------
// Regression: Dee + DW  (Spiritual Catalyst — score 61)
// Real chart: warmth=5, karma=2, growth=2
// Formula: 27 + 5*6 + 2*6 − 2*4 = 27 + 30 + 12 − 8 = 61
// ---------------------------------------------------------------------------
const DEE_DW_ASPECTS: SynastryAspect[] = [
  // Warmth (5): personal-to-personal, orb ≤ 6°
  asp('sun',     'sun',   'Sextile',     0.5, 'harmonious'), // w1
  asp('moon',    'mars',  'Conjunction', 1.6, 'neutral'),    // w2
  asp('mercury', 'moon',  'Trine',       2.8, 'harmonious'), // w3
  asp('venus',   'sun',   'Sextile',     3.1, 'harmonious'), // w4
  asp('moon',    'venus', 'Trine',       4.3, 'harmonious'), // w5

  // Karma (2): Venus sq Pluto + Moon sq Pluto
  asp('venus', 'pluto', 'Square', 2.8, 'challenging'),       // k1 (venus=VULNERABLE)
  asp('moon',  'pluto', 'Square', 6.0, 'challenging'),       // k2 (moon=VULNERABLE, orb exactly 6°)

  // Growth (2): Venus/Node trine personal
  asp('venus',     'northNode', 'Trine', 0.4, 'harmonious'), // g1
  asp('northNode', 'mercury',   'Trine', 0.3, 'harmonious'), // g2
]

describe('Dee + DW regression — Spiritual Catalyst (score 61)', () => {
  const s = computeArchetypeScores(DEE_DW_ASPECTS)

  it('warmth = 5', () => expect(s.warmth).toBe(5))
  it('karma = 2', () => expect(s.karma).toBe(2))
  it('growth = 2', () => expect(s.growth).toBe(2))
  it('compatibilityScore = 61', () => expect(s.compatibilityScore).toBe(61))
  it('scoringRule = SCORE_55_69', () => expect(s.scoringRule).toBe('SCORE_55_69'))
  it('recommendedArchetype = Spiritual Catalyst', () =>
    expect(s.recommendedArchetype).toBe('Spiritual Catalyst'))
  it('is NOT Karmic Soulmate — friction does not dominate when warmth+growth are present', () =>
    expect(s.recommendedArchetype).not.toBe('Karmic Soulmate'))
  it('is NOT Life Builder — score 61 is below the 70 threshold', () =>
    expect(s.recommendedArchetype).not.toBe('Life Builder Soulmate'))
})

// ---------------------------------------------------------------------------
// Score-to-archetype tier tests
// These verify all six tiers independently with exact score values.
// ---------------------------------------------------------------------------
describe('score tiers — full coverage', () => {
  // Safe Love: w=5, k=0, g=5 → 27+30+30-0 = 87
  it('score 87 → Safe Love Soulmate (80–94)', () => {
    const aspects = [
      asp('venus',   'moon',      'Conjunction', 2.0, 'neutral'),
      asp('venus',   'venus',     'Trine',       1.5, 'harmonious'),
      asp('moon',    'moon',      'Conjunction', 3.0, 'neutral'),
      asp('sun',     'moon',      'Trine',       2.0, 'harmonious'),
      asp('mercury', 'venus',     'Trine',       1.5, 'harmonious'),
      asp('moon',    'jupiter',   'Trine',       0.7, 'harmonious'),
      asp('mercury', 'northNode', 'Trine',       0.1, 'harmonious'),
      asp('sun',     'jupiter',   'Trine',       2.3, 'harmonious'),
      asp('venus',   'northNode', 'Sextile',     1.8, 'harmonious'),
      asp('mars',    'jupiter',   'Sextile',     3.2, 'harmonious'),
    ]
    const s = computeArchetypeScores(aspects)
    expect(s.warmth).toBe(5)
    expect(s.karma).toBe(0)
    expect(s.growth).toBe(5)
    expect(s.compatibilityScore).toBe(87)
    expect(s.recommendedArchetype).toBe('Safe Love Soulmate')
    expect(s.scoringRule).toBe('SCORE_80_94')
  })

  // Romantic Soulmate with Spiritual Chemistry: w=3, k=1, g=0 → 27+18+0-4 = 41
  it('score 41 → Romantic Soulmate with Spiritual Chemistry (40–54)', () => {
    const aspects = [
      asp('venus', 'moon',  'Conjunction', 3.3, 'neutral'),
      asp('venus', 'venus', 'Trine',       3.4, 'harmonious'),
      asp('moon',  'moon',  'Conjunction', 5.4, 'neutral'),
      asp('moon',  'pluto', 'Square',      3.8, 'challenging'),
    ]
    const s = computeArchetypeScores(aspects)
    expect(s.warmth).toBe(3)
    expect(s.karma).toBe(1)
    expect(s.growth).toBe(0)
    expect(s.compatibilityScore).toBe(41)
    expect(s.recommendedArchetype).toBe('Romantic Soulmate with Spiritual Chemistry')
    expect(s.scoringRule).toBe('SCORE_40_54')
    expect(s.recommendedArchetype).not.toBe('Life Builder Soulmate')
  })

  // Score 64 must NOT be Life Builder — this is the core bug being fixed
  it('score 64 (w=3, k=0, g=4) → Spiritual Catalyst, NOT Life Builder', () => {
    // 27 + 18 + 24 - 0 = 69 → Spiritual Catalyst
    // (old rule-based system would have hit GOOD_WARMTH → Life Builder)
    const aspects = [
      asp('venus', 'moon',      'Conjunction', 3.3, 'neutral'),
      asp('venus', 'venus',     'Trine',       3.4, 'harmonious'),
      asp('moon',  'moon',      'Conjunction', 5.4, 'neutral'),
      asp('moon',  'jupiter',   'Trine',       0.7, 'harmonious'),
      asp('mercury','northNode','Trine',       0.1, 'harmonious'),
      asp('sun',   'jupiter',   'Trine',       2.3, 'harmonious'),
      asp('venus', 'northNode', 'Sextile',     1.8, 'harmonious'),
    ]
    const s = computeArchetypeScores(aspects)
    expect(s.warmth).toBe(3)
    expect(s.karma).toBe(0)
    expect(s.growth).toBe(4)
    expect(s.compatibilityScore).toBe(69)
    expect(s.recommendedArchetype).toBe('Spiritual Catalyst')
    expect(s.recommendedArchetype).not.toBe('Life Builder Soulmate')
  })

  // Karmic: w=0, k=5, g=0 → 27+0+0-20 = 7
  it('score 7 → Karmic Soulmate (0–39)', () => {
    const aspects = [
      asp('saturn', 'sun',     'Square',     1.0, 'challenging'),
      asp('saturn', 'moon',    'Opposition', 2.0, 'challenging'),
      asp('pluto',  'venus',   'Square',     3.0, 'challenging'),
      asp('pluto',  'mercury', 'Square',     1.5, 'challenging'),
      asp('saturn', 'venus',   'Square',     2.5, 'challenging'),
    ]
    const s = computeArchetypeScores(aspects)
    expect(s.karma).toBe(5)
    expect(s.compatibilityScore).toBe(7)
    expect(s.recommendedArchetype).toBe('Karmic Soulmate')
    expect(s.scoringRule).toBe('SCORE_0_39')
  })
})

// ---------------------------------------------------------------------------
// Signal detection boundary tests
// ---------------------------------------------------------------------------
describe('signal detection', () => {
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
    expect(computeArchetypeScores([asp('saturn', 'moon', 'Trine', 2.0, 'harmonious')]).karma).toBe(0)
  })

  it('Mars square does NOT count as karmic friction (Mars is not in KARMIC_PLANETS)', () => {
    expect(computeArchetypeScores([asp('mars', 'sun', 'Square', 1.0, 'challenging')]).karma).toBe(0)
  })

  it('Saturn sq Mars does NOT count as karmic friction (Mars ∉ VULNERABLE)', () => {
    expect(computeArchetypeScores([asp('saturn', 'mars', 'Square', 2.0, 'challenging')]).karma).toBe(0)
  })

  it('Jupiter conjunction to personal planet is NOT growth (nature must be harmonious)', () => {
    // Conjunction is 'neutral' not 'harmonious' — isGrowth requires nature === 'harmonious'
    expect(computeArchetypeScores([asp('jupiter', 'venus', 'Conjunction', 2.0, 'neutral')]).growth).toBe(0)
  })

  it('Pluto square to outer planet does NOT count as karma (outer planet not VULNERABLE)', () => {
    expect(computeArchetypeScores([asp('pluto', 'jupiter', 'Square', 1.0, 'challenging')]).karma).toBe(0)
  })

  it('warmth is capped at 5 aspects in the score formula', () => {
    // 8 warmth aspects → score = 27 + min(8,5)*6 + 0 - 0 = 57, not 75
    const aspects = Array.from({ length: 8 }, (_, i) =>
      asp('venus', 'moon', 'Trine', 1.0 + i * 0.3, 'harmonious')
    )
    const s = computeArchetypeScores(aspects)
    expect(s.warmth).toBe(8)
    expect(s.compatibilityScore).toBe(57) // 27 + 5*6 = 57, not 27 + 8*6 = 75
  })
})

// ---------------------------------------------------------------------------
// Score formula — exact arithmetic verification
// ---------------------------------------------------------------------------
describe('score formula arithmetic', () => {
  it('w=0, k=0, g=0 → score 27 (neutral chart base)', () => {
    expect(computeArchetypeScores([]).compatibilityScore).toBe(27)
  })

  it('score clamps to 100 for exceptional charts', () => {
    const aspects = [
      // 5 warmth
      asp('venus',   'moon',      'Conjunction', 1.0, 'neutral'),
      asp('venus',   'venus',     'Trine',       1.0, 'harmonious'),
      asp('moon',    'moon',      'Conjunction', 1.0, 'neutral'),
      asp('sun',     'moon',      'Trine',       1.0, 'harmonious'),
      asp('mercury', 'venus',     'Trine',       1.0, 'harmonious'),
      // 10 growth → growthPts = 60; 27+30+60 = 117 → clamped to 100
      asp('moon',    'jupiter',   'Trine',   0.5, 'harmonious'),
      asp('sun',     'jupiter',   'Trine',   0.5, 'harmonious'),
      asp('venus',   'jupiter',   'Trine',   0.5, 'harmonious'),
      asp('mercury', 'jupiter',   'Trine',   0.5, 'harmonious'),
      asp('mars',    'jupiter',   'Trine',   0.5, 'harmonious'),
      asp('moon',    'northNode', 'Trine',   0.5, 'harmonious'),
      asp('sun',     'northNode', 'Trine',   0.5, 'harmonious'),
      asp('venus',   'northNode', 'Trine',   0.5, 'harmonious'),
      asp('mercury', 'northNode', 'Trine',   0.5, 'harmonious'),
      asp('mars',    'northNode', 'Trine',   0.5, 'harmonious'),
    ]
    expect(computeArchetypeScores(aspects).compatibilityScore).toBe(100)
  })

  it('score clamps to 0 for severely karmic charts', () => {
    const aspects = Array.from({ length: 10 }, (_, i) =>
      asp('saturn', 'moon', 'Square', 1.0 + i * 0.3, 'challenging')
    )
    // 10 karma → karmaPts = 40; 27+0+0-40 = -13 → 0
    expect(computeArchetypeScores(aspects).compatibilityScore).toBe(0)
    expect(computeArchetypeScores(aspects).recommendedArchetype).toBe('Karmic Soulmate')
  })
})
