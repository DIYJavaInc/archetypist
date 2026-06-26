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
// Regression: Dee + Ki  (Highest Timeline)
// Real chart: warmth=5, karma=1, growth=7 → score 95, narrative GROWTH_DOMINANT
// ---------------------------------------------------------------------------
const DEE_KI_ASPECTS: SynastryAspect[] = [
  // Warmth (5)
  asp('venus',   'moon',    'Conjunction', 3.3, 'neutral'),
  asp('venus',   'venus',   'Trine',       3.4, 'harmonious'),
  asp('moon',    'moon',    'Conjunction', 5.4, 'neutral'),
  asp('sun',     'moon',    'Trine',       2.0, 'harmonious'),
  asp('mercury', 'venus',   'Trine',       1.5, 'harmonious'),
  // Growth (7)
  asp('moon',    'jupiter',   'Trine',   0.7, 'harmonious'),
  asp('mercury', 'northNode', 'Trine',   0.1, 'harmonious'),
  asp('sun',     'jupiter',   'Trine',   2.3, 'harmonious'),
  asp('venus',   'northNode', 'Sextile', 1.8, 'harmonious'),
  asp('mars',    'jupiter',   'Sextile', 3.2, 'harmonious'),
  asp('sun',     'northNode', 'Trine',   4.5, 'harmonious'),
  asp('moon',    'northNode', 'Sextile', 2.1, 'harmonious'),
  // Karma (1)
  asp('moon',  'pluto',  'Square', 3.8, 'challenging'),
  // Mars-Saturn: drive tension, NOT karma (Mars ∉ VULNERABLE)
  asp('mars',  'saturn', 'Square', 3.9, 'challenging'),
  // Other
  asp('jupiter', 'saturn',  'Trine',      0.1, 'harmonious'),
  asp('venus',   'saturn',  'Opposition', 6.9, 'challenging'), // orb > 6° — excluded
]

describe('Dee + Ki regression — Highest Timeline', () => {
  const s = computeArchetypeScores(DEE_KI_ASPECTS)

  it('warmth = 5', () => expect(s.warmth).toBe(5))
  it('karma = 1 (Mars-Saturn sq excluded — Mars ∉ VULNERABLE)', () => expect(s.karma).toBe(1))
  it('growth = 7', () => expect(s.growth).toBe(7))
  it('compatibilityScore = 95', () => expect(s.compatibilityScore).toBe(95))
  it('scoringRule = GROWTH_DOMINANT', () => expect(s.scoringRule).toBe('GROWTH_DOMINANT'))
  it('recommendedArchetype = Highest Timeline Soulmate', () =>
    expect(s.recommendedArchetype).toBe('Highest Timeline Soulmate'))
})

// ---------------------------------------------------------------------------
// Regression: Dee + Ltni  (Life Builder)
// Real chart: warmth≥5, karma=0, growth=3
// Narrative: warmth≥5 + karma=0 + growth≥1 → WARMTH_COMMITMENT → Life Builder
// Score: 27+30+18-0=75
// ---------------------------------------------------------------------------
const DEE_LTNI_ASPECTS: SynastryAspect[] = [
  // Warmth (5)
  asp('moon',  'sun',     'Conjunction', 0.2, 'neutral'),
  asp('moon',  'mercury', 'Conjunction', 0.1, 'neutral'),
  asp('moon',  'venus',   'Conjunction', 3.0, 'neutral'),
  asp('venus', 'moon',    'Trine',       5.2, 'harmonious'),
  asp('sun',   'mercury', 'Sextile',     2.4, 'harmonious'),
  // Growth (3) — present but not at transcendent level (growth < 4)
  asp('sun',     'jupiter', 'Trine',   4.9, 'harmonious'),
  asp('moon',    'jupiter', 'Trine',   2.7, 'harmonious'),
  asp('mercury', 'jupiter', 'Sextile', 1.2, 'harmonious'),
  // Karma (0) — zero karmic friction
]

describe('Dee + Ltni regression — Life Builder', () => {
  const s = computeArchetypeScores(DEE_LTNI_ASPECTS)

  it('warmth = 5', () => expect(s.warmth).toBe(5))
  it('karma = 0', () => expect(s.karma).toBe(0))
  it('growth = 3 (present but below Highest Timeline threshold of 4)', () => expect(s.growth).toBe(3))
  it('compatibilityScore = 75', () => expect(s.compatibilityScore).toBe(75))
  it('scoringRule = WARMTH_COMMITMENT (warmth≥5, karma=0, growth≥1)', () =>
    expect(s.scoringRule).toBe('WARMTH_COMMITMENT'))
  it('recommendedArchetype = Life Builder Soulmate', () =>
    expect(s.recommendedArchetype).toBe('Life Builder Soulmate'))
  it('is NOT Highest Timeline (growth=3 < 4, so destiny signal insufficient)', () =>
    expect(s.recommendedArchetype).not.toBe('Highest Timeline Soulmate'))
  it('is NOT Spiritual Catalyst (growth < 4 alone does not trigger Catalyst when karma=0)', () =>
    expect(s.recommendedArchetype).not.toBe('Spiritual Catalyst'))
})

// ---------------------------------------------------------------------------
// Regression: Dee + DW  (Spiritual Catalyst)
// Real chart: warmth=5, karma=2, growth=2
// Narrative: karma≥2 + warmth≥2 → FRICTION_GROWTH → Spiritual Catalyst
// Score: 27+30+12-8=61
// ---------------------------------------------------------------------------
const DEE_DW_ASPECTS: SynastryAspect[] = [
  // Warmth (5)
  asp('sun',     'sun',   'Sextile',     0.5, 'harmonious'),
  asp('moon',    'mars',  'Conjunction', 1.6, 'neutral'),
  asp('mercury', 'moon',  'Trine',       2.8, 'harmonious'),
  asp('venus',   'sun',   'Sextile',     3.1, 'harmonious'),
  asp('moon',    'venus', 'Trine',       4.3, 'harmonious'),
  // Karma (2): Venus sq Pluto + Moon sq Pluto
  asp('venus', 'pluto', 'Square', 2.8, 'challenging'),
  asp('moon',  'pluto', 'Square', 6.0, 'challenging'), // orb exactly 6° — still counts
  // Growth (2)
  asp('venus',     'northNode', 'Trine', 0.4, 'harmonious'),
  asp('northNode', 'mercury',   'Trine', 0.3, 'harmonious'),
]

describe('Dee + DW regression — Spiritual Catalyst', () => {
  const s = computeArchetypeScores(DEE_DW_ASPECTS)

  it('warmth = 5', () => expect(s.warmth).toBe(5))
  it('karma = 2', () => expect(s.karma).toBe(2))
  it('growth = 2', () => expect(s.growth).toBe(2))
  it('compatibilityScore = 61', () => expect(s.compatibilityScore).toBe(61))
  it('scoringRule = FRICTION_GROWTH (karma≥2, warmth≥2)', () =>
    expect(s.scoringRule).toBe('FRICTION_GROWTH'))
  it('recommendedArchetype = Spiritual Catalyst', () =>
    expect(s.recommendedArchetype).toBe('Spiritual Catalyst'))
  it('is NOT Karmic Soulmate — warmth present + growth present', () =>
    expect(s.recommendedArchetype).not.toBe('Karmic Soulmate'))
  it('is NOT Life Builder — karma=2 exceeds the Life Builder threshold', () =>
    expect(s.recommendedArchetype).not.toBe('Life Builder Soulmate'))
})

// ---------------------------------------------------------------------------
// Narrative rule coverage — one test per archetype
// ---------------------------------------------------------------------------
describe('narrative rules — archetype coverage', () => {
  it('Highest Timeline: growth≥4 + warmth≥4 + karma≤1', () => {
    // w=4, k=0, g=4 → rule 1 fires
    const aspects = [
      asp('venus',   'moon',    'Trine',   2.0, 'harmonious'), // w
      asp('moon',    'moon',    'Trine',   1.5, 'harmonious'), // w
      asp('sun',     'moon',    'Trine',   2.0, 'harmonious'), // w
      asp('mercury', 'venus',   'Trine',   1.0, 'harmonious'), // w
      asp('moon',    'jupiter',   'Trine', 0.7, 'harmonious'), // g
      asp('mercury', 'northNode', 'Trine', 0.1, 'harmonious'), // g
      asp('sun',     'jupiter',   'Trine', 2.3, 'harmonious'), // g
      asp('venus',   'northNode', 'Trine', 1.8, 'harmonious'), // g
    ]
    const s = computeArchetypeScores(aspects)
    expect(s.warmth).toBe(4)
    expect(s.karma).toBe(0)
    expect(s.growth).toBe(4)
    expect(s.recommendedArchetype).toBe('Highest Timeline Soulmate')
    expect(s.scoringRule).toBe('GROWTH_DOMINANT')
  })

  it('Life Builder (variant a): warmth≥5 + karma≤1 + growth≥1', () => {
    // w=5, k=1, g=1 — lots of bonding, slight friction, some forward movement
    const aspects = [
      asp('venus',   'moon',    'Conjunction', 2.0, 'neutral'),
      asp('venus',   'venus',   'Trine',       1.5, 'harmonious'),
      asp('moon',    'moon',    'Conjunction', 3.0, 'neutral'),
      asp('sun',     'moon',    'Trine',       2.0, 'harmonious'),
      asp('mercury', 'venus',   'Trine',       1.5, 'harmonious'),
      asp('moon',    'jupiter', 'Trine',       0.7, 'harmonious'), // growth
      asp('moon',    'pluto',   'Square',      3.5, 'challenging'), // karma=1
    ]
    const s = computeArchetypeScores(aspects)
    expect(s.warmth).toBe(5)
    expect(s.karma).toBe(1)
    expect(s.growth).toBe(1)
    expect(s.recommendedArchetype).toBe('Life Builder Soulmate')
    expect(s.scoringRule).toBe('WARMTH_COMMITMENT')
  })

  it('Life Builder (variant b): warmth≥4 + karma===0 + growth≥1', () => {
    // w=4, k=0, g=2 — strong bonding, no friction, steady growth
    const aspects = [
      asp('venus',   'moon',    'Trine',   2.0, 'harmonious'),
      asp('moon',    'moon',    'Trine',   1.5, 'harmonious'),
      asp('sun',     'moon',    'Trine',   2.0, 'harmonious'),
      asp('mercury', 'venus',   'Trine',   1.0, 'harmonious'),
      asp('moon',    'jupiter', 'Trine',   0.7, 'harmonious'), // g
      asp('sun',     'jupiter', 'Trine',   2.3, 'harmonious'), // g
    ]
    const s = computeArchetypeScores(aspects)
    expect(s.warmth).toBe(4)
    expect(s.karma).toBe(0)
    expect(s.growth).toBe(2)
    expect(s.recommendedArchetype).toBe('Life Builder Soulmate')
    expect(s.scoringRule).toBe('WARMTH_COMMITMENT')
  })

  it('Safe Love: warmth≥3 + karma≤1, no strong building signal', () => {
    const aspects = [
      asp('venus', 'moon', 'Conjunction', 3.3, 'neutral'),
      asp('venus', 'venus', 'Trine', 3.4, 'harmonious'),
      asp('moon',  'moon',  'Conjunction', 5.4, 'neutral'),
    ]
    const s = computeArchetypeScores(aspects)
    expect(s.warmth).toBe(3)
    expect(s.karma).toBe(0)
    expect(s.recommendedArchetype).toBe('Safe Love Soulmate')
    expect(s.scoringRule).toBe('SECURE_ATTACHMENT')
  })

  it('Safe Love: warmth=3 + karma=1 (one friction aspect — still secure)', () => {
    const aspects = [
      asp('venus', 'moon',  'Conjunction', 3.3, 'neutral'),
      asp('venus', 'venus', 'Trine',       3.4, 'harmonious'),
      asp('moon',  'moon',  'Conjunction', 5.4, 'neutral'),
      asp('moon',  'pluto', 'Square',      4.0, 'challenging'), // karma=1
    ]
    const s = computeArchetypeScores(aspects)
    expect(s.warmth).toBe(3)
    expect(s.karma).toBe(1)
    expect(s.recommendedArchetype).toBe('Safe Love Soulmate')
    expect(s.recommendedArchetype).not.toBe('Life Builder Soulmate')
    expect(s.recommendedArchetype).not.toBe('Spiritual Catalyst')
  })

  it('Spiritual Catalyst: karma≥2 + warmth≥2', () => {
    const aspects = [
      asp('venus', 'moon', 'Trine',     2.0, 'harmonious'),
      asp('sun',   'sun',  'Sextile',   1.5, 'harmonious'),
      asp('venus', 'pluto', 'Square',   2.8, 'challenging'),
      asp('moon',  'pluto', 'Square',   3.1, 'challenging'),
    ]
    const s = computeArchetypeScores(aspects)
    expect(s.warmth).toBe(2)
    expect(s.karma).toBe(2)
    expect(s.recommendedArchetype).toBe('Spiritual Catalyst')
    expect(s.scoringRule).toBe('FRICTION_GROWTH')
  })

  it('Karmic: karma≥3 regardless of warmth', () => {
    const aspects = [
      asp('saturn', 'sun',     'Square',     1.0, 'challenging'),
      asp('saturn', 'moon',    'Opposition', 2.0, 'challenging'),
      asp('pluto',  'venus',   'Square',     3.0, 'challenging'),
      asp('venus',  'moon',    'Trine',      2.0, 'harmonious'), // warmth=1 — doesn't rescue
    ]
    const s = computeArchetypeScores(aspects)
    expect(s.karma).toBe(3)
    expect(s.recommendedArchetype).toBe('Karmic Soulmate')
    expect(s.scoringRule).toBe('FRICTION_DOMINANT')
  })

  it('Karmic: karma=2 + warmth≤1', () => {
    const aspects = [
      asp('saturn', 'sun',   'Square',     1.5, 'challenging'),
      asp('pluto',  'venus', 'Square',     2.0, 'challenging'),
    ]
    const s = computeArchetypeScores(aspects)
    expect(s.karma).toBe(2)
    expect(s.warmth).toBe(0)
    expect(s.recommendedArchetype).toBe('Karmic Soulmate')
    expect(s.scoringRule).toBe('FRICTION_DOMINANT')
  })

  // Key regression: warmth=3 + karma=0 + growth≥4 should NOT become Life Builder
  // (warmth < 4, so rule 1 Highest Timeline requires warmth≥4 — fails here)
  // Rule 2 also fails (warmth < 4 for variant b, warmth < 5 for variant a)
  // Falls through to Safe Love (warmth≥3, karma≤1)
  it('warmth=3 + karma=0 + growth=4 → Safe Love (not Life Builder, not Highest Timeline)', () => {
    const aspects = [
      asp('venus',   'moon',    'Conjunction', 3.3, 'neutral'),
      asp('venus',   'venus',   'Trine',       3.4, 'harmonious'),
      asp('moon',    'moon',    'Conjunction', 5.4, 'neutral'),
      asp('moon',    'jupiter',   'Trine',   0.7, 'harmonious'),
      asp('mercury', 'northNode', 'Trine',   0.1, 'harmonious'),
      asp('sun',     'jupiter',   'Trine',   2.3, 'harmonious'),
      asp('venus',   'northNode', 'Sextile', 1.8, 'harmonious'),
    ]
    const s = computeArchetypeScores(aspects)
    expect(s.warmth).toBe(3)
    expect(s.growth).toBe(4)
    expect(s.karma).toBe(0)
    expect(s.recommendedArchetype).toBe('Safe Love Soulmate')
    expect(s.recommendedArchetype).not.toBe('Life Builder Soulmate')
    expect(s.recommendedArchetype).not.toBe('Highest Timeline Soulmate')
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

  it('Mars square does NOT count as karmic friction (Mars ∉ KARMIC_PLANETS)', () => {
    expect(computeArchetypeScores([asp('mars', 'sun', 'Square', 1.0, 'challenging')]).karma).toBe(0)
  })

  it('Saturn sq Mars does NOT count as karmic friction (Mars ∉ VULNERABLE)', () => {
    expect(computeArchetypeScores([asp('saturn', 'mars', 'Square', 2.0, 'challenging')]).karma).toBe(0)
  })

  it('Jupiter conjunction to personal planet is NOT growth (conjunction is neutral, not harmonious)', () => {
    expect(computeArchetypeScores([asp('jupiter', 'venus', 'Conjunction', 2.0, 'neutral')]).growth).toBe(0)
  })

  it('Pluto square to outer planet does NOT count as karma (outer planet not VULNERABLE)', () => {
    expect(computeArchetypeScores([asp('pluto', 'jupiter', 'Square', 1.0, 'challenging')]).karma).toBe(0)
  })

  it('warmth is capped at 5 in the compatibility score formula', () => {
    const aspects = Array.from({ length: 8 }, (_, i) =>
      asp('venus', 'moon', 'Trine', 1.0 + i * 0.3, 'harmonious')
    )
    const s = computeArchetypeScores(aspects)
    expect(s.warmth).toBe(8)
    expect(s.compatibilityScore).toBe(57) // 27 + min(8,5)*6 = 27+30 = 57, not 27+8*6=75
  })
})

// ---------------------------------------------------------------------------
// Score formula — arithmetic spot checks
// ---------------------------------------------------------------------------
describe('compatibility score arithmetic', () => {
  it('empty chart → base score 27', () => {
    expect(computeArchetypeScores([]).compatibilityScore).toBe(27)
  })

  it('w=5, k=1, g=7 → score 95', () => {
    expect(computeArchetypeScores(DEE_KI_ASPECTS).compatibilityScore).toBe(95)
  })

  it('w=5, k=0, g=3 → score 75', () => {
    expect(computeArchetypeScores(DEE_LTNI_ASPECTS).compatibilityScore).toBe(75)
  })

  it('w=5, k=2, g=2 → score 61', () => {
    expect(computeArchetypeScores(DEE_DW_ASPECTS).compatibilityScore).toBe(61)
  })

  it('score clamps to 0 for heavily karmic charts', () => {
    const aspects = Array.from({ length: 10 }, (_, i) =>
      asp('saturn', 'moon', 'Square', 1.0 + i * 0.3, 'challenging')
    )
    expect(computeArchetypeScores(aspects).compatibilityScore).toBe(0)
  })

  it('score clamps to 100 for exceptional charts', () => {
    const aspects = [
      asp('venus', 'moon', 'Conjunction', 1.0, 'neutral'),
      asp('venus', 'venus', 'Trine', 1.0, 'harmonious'),
      asp('moon', 'moon', 'Conjunction', 1.0, 'neutral'),
      asp('sun', 'moon', 'Trine', 1.0, 'harmonious'),
      asp('mercury', 'venus', 'Trine', 1.0, 'harmonious'),
      ...Array.from({ length: 10 }, (_, i) =>
        asp('moon', 'jupiter', 'Trine', 0.5 + i * 0.1, 'harmonious')
      ),
    ]
    expect(computeArchetypeScores(aspects).compatibilityScore).toBe(100)
  })
})
