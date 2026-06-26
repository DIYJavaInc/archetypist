/**
 * Integration tests: full chart positions → aspects → scoring → archetype
 *
 * These tests prove the deterministic production path using real planetary
 * positions computed via the same Keplerian orbital mechanics as the app.
 * They do NOT mock calculateSynastryAspects — the full aspect pipeline runs.
 *
 * Birth data used (same as manual regression cases):
 *   Dee  — Feb 24 1987, 12:22am, Miami FL     (UTC: Feb 24 05:22)
 *   Ki   — May 17 1976, Atlanta GA             (UTC: May 17 16:00 est.)
 *   DW   — Dec 27 1978, Atlanta GA             (UTC: Dec 27 17:00 est.)
 *   Ltni — Jan 3  1994, Birmingham AL          (UTC: Jan 3  18:00 est.)
 */

import { describe, it, expect } from 'vitest'
import { calculateSynastryAspects } from '../astrology'
import { computeArchetypeScores } from '../archetype-scoring'
import type { NatalChart, PlanetPosition } from '../astrology'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SIGN_START: Record<string, number> = {
  Aries: 0, Taurus: 30, Gemini: 60, Cancer: 90, Leo: 120, Virgo: 150,
  Libra: 180, Scorpio: 210, Sagittarius: 240, Capricorn: 270, Aquarius: 300, Pisces: 330,
}

function pos(name: string, sign: string, deg: number): PlanetPosition {
  return { name, sign, degree: deg, absoluteDegree: SIGN_START[sign] + deg }
}

// ---------------------------------------------------------------------------
// Charts — positions from Keplerian calc.js (same formulas as astrology.ts)
// ---------------------------------------------------------------------------

const DEE: NatalChart = {
  sun:      pos('Sun',        'Pisces',       5.07),
  moon:     pos('Moon',       'Capricorn',   12.98),
  mercury:  pos('Mercury',    'Pisces',      12.02),
  venus:    pos('Venus',      'Capricorn',   21.74),
  mars:     pos('Mars',       'Taurus',       2.49),
  jupiter:  pos('Jupiter',    'Pisces',      28.53),
  saturn:   pos('Saturn',     'Sagittarius', 20.34),
  neptune:  pos('Neptune',    'Capricorn',    7.45),
  pluto:    pos('Pluto',      'Scorpio',      9.64),
  northNode:pos('North Node', 'Aries',       13.55),
}

const KI: NatalChart = {
  sun:      pos('Sun',        'Taurus',      26.86),
  moon:     pos('Moon',       'Capricorn',   18.40),
  mercury:  pos('Mercury',    'Gemini',       1.19),
  venus:    pos('Venus',      'Taurus',      18.35),
  mars:     pos('Mars',       'Leo',          0.68),
  jupiter:  pos('Jupiter',    'Taurus',      12.29),
  saturn:   pos('Saturn',     'Cancer',      28.62),
  neptune:  pos('Neptune',    'Sagittarius', 13.02),
  pluto:    pos('Pluto',      'Libra',        9.19),
  northNode:pos('North Node', 'Scorpio',     11.90),
}

const DW: NatalChart = {
  sun:      pos('Sun',        'Capricorn',    5.60),
  moon:     pos('Moon',       'Sagittarius',  6.17),
  mercury:  pos('Mercury',    'Sagittarius', 13.85),
  venus:    pos('Venus',      'Scorpio',     20.85),
  mars:     pos('Mars',       'Capricorn',   11.42),
  jupiter:  pos('Jupiter',    'Leo',          7.33),
  saturn:   pos('Saturn',     'Virgo',       14.33),
  neptune:  pos('Neptune',    'Sagittarius', 18.69),
  pluto:    pos('Pluto',      'Libra',       18.98),
  northNode:pos('North Node', 'Virgo',       21.38),
}

const LTNI: NatalChart = {
  sun:      pos('Sun',        'Capricorn',   13.14),
  moon:     pos('Moon',       'Virgo',       26.90),
  mercury:  pos('Mercury',    'Capricorn',   13.09),
  venus:    pos('Venus',      'Capricorn',    9.96),
  mars:     pos('Mars',       'Capricorn',   11.18),
  jupiter:  pos('Jupiter',    'Scorpio',     10.04),
  saturn:   pos('Saturn',     'Aquarius',    27.20),
  neptune:  pos('Neptune',    'Capricorn',   20.57),
  pluto:    pos('Pluto',      'Scorpio',     26.75),
  northNode:pos('North Node', 'Sagittarius',  0.87),
}

// ---------------------------------------------------------------------------
// DEE + KI — expected: Highest Timeline Soulmate
// Strong warmth + very high growth + low karma → score ≥ 95
// ---------------------------------------------------------------------------
describe('Integration: Dee + Ki', () => {
  const aspects = calculateSynastryAspects(DEE, KI)
  const scores = computeArchetypeScores(aspects)

  it('warmth ≥ 5 (Venus-Moon conj, Venus-Venus trine, Moon-Moon conj, + more)', () =>
    expect(scores.warmth).toBeGreaterThanOrEqual(5))

  it('karma ≤ 1 (only Moon-Pluto sq qualifies after VULNERABLE filter)', () =>
    expect(scores.karma).toBeLessThanOrEqual(1))

  it('growth ≥ 7 (Moon-Jupiter trine, Mercury-Node trine, and multiple others)', () =>
    expect(scores.growth).toBeGreaterThanOrEqual(7))

  it('compatibilityScore ≥ 95 (qualifies for Highest Timeline tier)', () =>
    expect(scores.compatibilityScore).toBeGreaterThanOrEqual(95))

  it('scoringRule = GROWTH_DOMINANT', () =>
    expect(scores.scoringRule).toBe('GROWTH_DOMINANT'))

  it('recommendedArchetype = Highest Timeline Soulmate', () =>
    expect(scores.recommendedArchetype).toBe('Highest Timeline Soulmate'))

  it('is NOT Karmic Soulmate', () =>
    expect(scores.recommendedArchetype).not.toBe('Karmic Soulmate'))
})

// ---------------------------------------------------------------------------
// DEE + LTNI — expected: Life Builder Soulmate
// Dominant warmth + zero karmic friction + modest growth → score 70–79
// Growth is below the Highest Timeline threshold — score stays in Life Builder range.
// ---------------------------------------------------------------------------
describe('Integration: Dee + Ltni', () => {
  const aspects = calculateSynastryAspects(DEE, LTNI)
  const scores = computeArchetypeScores(aspects)

  it('warmth ≥ 5 (multiple Moon conjunctions to Ltni personal planets, Venus trine Moon)', () =>
    expect(scores.warmth).toBeGreaterThanOrEqual(5))

  it('karma = 0 (no Saturn/Pluto hard aspects to VULNERABLE planets within 6°)', () =>
    expect(scores.karma).toBe(0))

  it('growth ≤ 4 (modest Jupiter activation — not enough for Highest Timeline)', () =>
    expect(scores.growth).toBeLessThanOrEqual(4))

  it('compatibilityScore is in the 70–79 range', () => {
    expect(scores.compatibilityScore).toBeGreaterThanOrEqual(70)
    expect(scores.compatibilityScore).toBeLessThanOrEqual(79)
  })

  it('scoringRule = WARMTH_COMMITMENT', () =>
    expect(scores.scoringRule).toBe('WARMTH_COMMITMENT'))

  it('recommendedArchetype = Life Builder Soulmate', () =>
    expect(scores.recommendedArchetype).toBe('Life Builder Soulmate'))

  it('is NOT Highest Timeline Soulmate (growth too low to drive score above 94)', () =>
    expect(scores.recommendedArchetype).not.toBe('Highest Timeline Soulmate'))

  it('is NOT Karmic Soulmate', () =>
    expect(scores.recommendedArchetype).not.toBe('Karmic Soulmate'))
})

// ---------------------------------------------------------------------------
// DEE + DW — expected: Spiritual Catalyst (NOT Karmic, NOT Life Builder)
// Mixed: warmth and growth are present but karma (2) brings score into 55–69.
// ---------------------------------------------------------------------------
describe('Integration: Dee + DW', () => {
  const aspects = calculateSynastryAspects(DEE, DW)
  const scores = computeArchetypeScores(aspects)

  it('warmth ≥ 2', () =>
    expect(scores.warmth).toBeGreaterThanOrEqual(2))

  it('karma ≥ 2 (Venus sq Pluto + Moon sq Pluto)', () =>
    expect(scores.karma).toBeGreaterThanOrEqual(2))

  it('growth ≥ 2 (Venus trine DW Node + Node trine DW Mercury)', () =>
    expect(scores.growth).toBeGreaterThanOrEqual(2))

  it('compatibilityScore is in the 55–69 range', () => {
    expect(scores.compatibilityScore).toBeGreaterThanOrEqual(55)
    expect(scores.compatibilityScore).toBeLessThanOrEqual(69)
  })

  it('scoringRule = FRICTION_GROWTH', () =>
    expect(scores.scoringRule).toBe('FRICTION_GROWTH'))

  it('recommendedArchetype = Spiritual Catalyst', () =>
    expect(scores.recommendedArchetype).toBe('Spiritual Catalyst'))

  it('is NOT Karmic Soulmate — friction alone does not override warmth + growth', () =>
    expect(scores.recommendedArchetype).not.toBe('Karmic Soulmate'))

  it('is NOT Life Builder — score is below 70', () =>
    expect(scores.recommendedArchetype).not.toBe('Life Builder Soulmate'))
})

// ---------------------------------------------------------------------------
// Sanity: total aspect counts are non-trivial (proves real calculation ran)
// ---------------------------------------------------------------------------
describe('Integration: aspect calculation sanity', () => {
  it('Dee+Ki has 15+ total aspects', () =>
    expect(calculateSynastryAspects(DEE, KI).length).toBeGreaterThan(15))

  it('Dee+Ltni has 15+ total aspects', () =>
    expect(calculateSynastryAspects(DEE, LTNI).length).toBeGreaterThan(15))

  it('Dee+DW has 15+ total aspects', () =>
    expect(calculateSynastryAspects(DEE, DW).length).toBeGreaterThan(15))
})
