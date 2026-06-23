import { NextResponse } from 'next/server'
import type { NatalChart, PlanetPosition, SynastryAspect } from '@/lib/astrology'
import {
  type ArchetypeName,
  type ScoringCtx,
  ARCHETYPE_HIERARCHY,
  scoreAllArchetypes,
  selectArchetype,
} from '@/lib/scoring'

// ── Minimal helpers to build synthetic test data ──────────────────────────────

type AspectType = 'Conjunction' | 'Trine' | 'Sextile' | 'Square' | 'Opposition'

function pl(name: string, sign: string, degree = 15): PlanetPosition {
  return { name, sign, degree, absoluteDegree: 0 }
}

function chart(
  sun: string, moon: string, mercury: string, venus: string,
  mars: string, jupiter: string, saturn: string,
  extra?: { neptune?: string; pluto?: string; northNode?: string },
): NatalChart {
  return {
    sun:      pl('Sun', sun),
    moon:     pl('Moon', moon),
    mercury:  pl('Mercury', mercury),
    venus:    pl('Venus', venus),
    mars:     pl('Mars', mars),
    jupiter:  pl('Jupiter', jupiter),
    saturn:   pl('Saturn', saturn),
    ...(extra?.neptune   && { neptune:   pl('Neptune', extra.neptune) }),
    ...(extra?.pluto     && { pluto:     pl('Pluto', extra.pluto) }),
    ...(extra?.northNode && { northNode: pl('North Node', extra.northNode) }),
  }
}

function asp(p1: string, p2: string, type: AspectType, orb: number): SynastryAspect {
  const nature: 'harmonious' | 'challenging' =
    type === 'Square' || type === 'Opposition' ? 'challenging' : 'harmonious'
  return {
    planet1Key: p1, planet2Key: p2,
    planet1Label: p1, planet2Label: p2,
    planet1Sign: '', planet2Sign: '',
    planet1Degree: 0, planet2Degree: 0,
    aspect: type, orb, nature,
  }
}

// ── 25 Diverse Test Profiles ──────────────────────────────────────────────────

interface Profile {
  id: number
  label: string
  expectedWinner: ArchetypeName
  ctx: ScoringCtx
}

const PROFILES: Profile[] = [
  // ── Highest Timeline (3 profiles) ──────────────────────────────────────────

  {
    id: 1,
    label: 'Fire Trinity — classic Highest Timeline',
    expectedWinner: 'Highest Timeline Soulmate',
    ctx: {
      chart1: chart('Aries', 'Sagittarius', 'Aries', 'Leo', 'Gemini', 'Capricorn', 'Capricorn'),
      chart2: chart('Leo', 'Aries', 'Gemini', 'Sagittarius', 'Libra', 'Aquarius', 'Aquarius'),
      aspects: [
        asp('northNode', 'moon', 'Conjunction', 2),
        asp('northNode', 'venus', 'Sextile', 5),
        asp('jupiter', 'moon', 'Conjunction', 3),
        asp('moon', 'moon', 'Trine', 4),
        asp('venus', 'sun', 'Conjunction', 2),
        asp('mercury', 'mercury', 'Sextile', 4),
      ],
    },
  },
  {
    id: 11,
    label: 'Water Souls — Highest Timeline with triple North Node',
    expectedWinner: 'Highest Timeline Soulmate',
    ctx: {
      chart1: chart('Scorpio', 'Pisces', 'Scorpio', 'Cancer', 'Virgo', 'Taurus', 'Capricorn'),
      chart2: chart('Cancer', 'Scorpio', 'Virgo', 'Pisces', 'Leo', 'Virgo', 'Aquarius'),
      aspects: [
        asp('northNode', 'moon', 'Conjunction', 2),
        asp('northNode', 'sun', 'Conjunction', 3),
        asp('northNode', 'venus', 'Sextile', 5),
        asp('jupiter', 'venus', 'Conjunction', 3),
        asp('moon', 'moon', 'Trine', 4),
        asp('venus', 'sun', 'Trine', 4),
      ],
    },
  },
  {
    id: 22,
    label: 'Destiny Partnership — Highest Timeline, massive North Node',
    expectedWinner: 'Highest Timeline Soulmate',
    ctx: {
      chart1: chart('Sagittarius', 'Gemini', 'Aquarius', 'Leo', 'Virgo', 'Scorpio', 'Capricorn'),
      chart2: chart('Aries', 'Sagittarius', 'Aries', 'Sagittarius', 'Cancer', 'Virgo', 'Aquarius'),
      aspects: [
        asp('northNode', 'sun', 'Conjunction', 1),
        asp('northNode', 'moon', 'Conjunction', 2),
        asp('northNode', 'venus', 'Sextile', 5),
        asp('jupiter', 'moon', 'Conjunction', 3),
        asp('moon', 'moon', 'Trine', 4),
        asp('venus', 'sun', 'Trine', 3),
      ],
    },
  },

  // ── Life Builder (4 profiles) ───────────────────────────────────────────────

  {
    id: 2,
    label: 'Cap Duo — Life Builder with maximum earth emphasis',
    expectedWinner: 'Life Builder Soulmate',
    ctx: {
      chart1: chart('Capricorn', 'Taurus', 'Sagittarius', 'Capricorn', 'Scorpio', 'Libra', 'Capricorn'),
      chart2: chart('Capricorn', 'Capricorn', 'Capricorn', 'Capricorn', 'Aries', 'Virgo', 'Aquarius'),
      aspects: [
        asp('saturn', 'saturn', 'Conjunction', 3),
        asp('saturn', 'venus', 'Conjunction', 2),
        asp('venus', 'venus', 'Conjunction', 2),
        asp('moon', 'moon', 'Trine', 4),
      ],
    },
  },
  {
    id: 12,
    label: 'Earth Sextile — Life Builder via Taurus-Virgo synergy',
    expectedWinner: 'Life Builder Soulmate',
    ctx: {
      chart1: chart('Taurus', 'Cancer', 'Gemini', 'Taurus', 'Aries', 'Libra', 'Capricorn'),
      chart2: chart('Virgo', 'Taurus', 'Leo', 'Virgo', 'Scorpio', 'Aquarius', 'Virgo'),
      aspects: [
        asp('saturn', 'saturn', 'Conjunction', 3),
        asp('saturn', 'venus', 'Conjunction', 2),
        asp('venus', 'venus', 'Trine', 5),
        asp('moon', 'moon', 'Trine', 4),
        asp('saturn', 'moon', 'Trine', 5),
        asp('jupiter', 'saturn', 'Trine', 5),
      ],
    },
  },
  {
    id: 21,
    label: 'Earth-Water Stable — Life Builder with compatible elements',
    expectedWinner: 'Life Builder Soulmate',
    ctx: {
      chart1: chart('Taurus', 'Cancer', 'Gemini', 'Capricorn', 'Scorpio', 'Virgo', 'Capricorn'),
      chart2: chart('Cancer', 'Pisces', 'Leo', 'Virgo', 'Capricorn', 'Aquarius', 'Virgo'),
      aspects: [
        asp('saturn', 'saturn', 'Conjunction', 5),
        asp('saturn', 'venus', 'Conjunction', 2),
        asp('venus', 'venus', 'Trine', 5),
        asp('moon', 'moon', 'Trine', 4),
      ],
    },
  },
  {
    id: 25,
    label: 'Dee + LTni — the original debug case (Pisces Sun + Cap Sun)',
    expectedWinner: 'Life Builder Soulmate',
    ctx: {
      chart1: chart('Pisces', 'Aries', 'Aquarius', 'Capricorn', 'Taurus', 'Taurus', 'Sagittarius'),
      chart2: chart('Capricorn', 'Capricorn', 'Aquarius', 'Capricorn', 'Scorpio', 'Scorpio', 'Capricorn'),
      aspects: [
        asp('venus', 'venus', 'Conjunction', 3),
        asp('saturn', 'venus', 'Trine', 5),
        asp('moon', 'moon', 'Trine', 5),
        asp('neptune', 'sun', 'Sextile', 3),   // SC would score only 15 (soft, best-only)
      ],
    },
  },

  // ── Safe Love (2 profiles) ──────────────────────────────────────────────────

  {
    id: 9,
    label: 'Air Harmony — Safe Love with Venus-centric non-earth signs',
    expectedWinner: 'Safe Love Soulmate',
    ctx: {
      chart1: chart('Gemini', 'Libra', 'Gemini', 'Libra', 'Sagittarius', 'Scorpio', 'Aquarius'),
      chart2: chart('Aquarius', 'Gemini', 'Aquarius', 'Libra', 'Aries', 'Cancer', 'Gemini'),
      aspects: [
        asp('venus', 'venus', 'Conjunction', 1),
        asp('venus', 'sun', 'Trine', 2),
        asp('venus', 'moon', 'Trine', 2),
        asp('saturn', 'venus', 'Trine', 5),
        asp('moon', 'moon', 'Trine', 3),
        asp('mercury', 'mercury', 'Conjunction', 2),
      ],
    },
  },
  {
    id: 13,
    label: 'Venus Refuge — Safe Love, Venus conjunct + Saturn-Venus soft',
    expectedWinner: 'Safe Love Soulmate',
    ctx: {
      chart1: chart('Gemini', 'Libra', 'Taurus', 'Gemini', 'Aries', 'Leo', 'Aquarius'),
      chart2: chart('Aquarius', 'Gemini', 'Cancer', 'Libra', 'Libra', 'Virgo', 'Gemini'),
      aspects: [
        asp('venus', 'venus', 'Trine', 4),
        asp('venus', 'sun', 'Conjunction', 2),
        asp('venus', 'moon', 'Conjunction', 2),
        asp('saturn', 'venus', 'Conjunction', 3),
        asp('moon', 'moon', 'Trine', 3),
        asp('mercury', 'mercury', 'Conjunction', 2),
      ],
    },
  },

  // ── Power Couple (3 profiles) ───────────────────────────────────────────────

  {
    id: 10,
    label: 'Business Warriors — Power Couple, Mars-Venus + Jupiter-Sun',
    expectedWinner: 'Power Couple',
    ctx: {
      chart1: chart('Leo', 'Aries', 'Virgo', 'Gemini', 'Sagittarius', 'Aquarius', 'Virgo'),
      chart2: chart('Sagittarius', 'Leo', 'Sagittarius', 'Aquarius', 'Gemini', 'Capricorn', 'Capricorn'),
      aspects: [
        asp('mars', 'venus', 'Conjunction', 2),
        asp('sun', 'sun', 'Trine', 4),
        asp('jupiter', 'sun', 'Conjunction', 2),
        asp('mercury', 'mercury', 'Conjunction', 1),
        asp('saturn', 'sun', 'Trine', 5),
      ],
    },
  },
  {
    id: 14,
    label: 'Ambitious Pair — Power Couple, Mars-Venus + Sun trine',
    expectedWinner: 'Power Couple',
    ctx: {
      chart1: chart('Capricorn', 'Aries', 'Aquarius', 'Capricorn', 'Leo', 'Sagittarius', 'Cancer'),
      chart2: chart('Leo', 'Aquarius', 'Leo', 'Leo', 'Sagittarius', 'Taurus', 'Capricorn'),
      aspects: [
        asp('mars', 'venus', 'Conjunction', 1),
        asp('sun', 'sun', 'Trine', 4),
        asp('jupiter', 'mars', 'Sextile', 5),
        asp('mercury', 'mercury', 'Sextile', 3),
        asp('venus', 'sun', 'Trine', 5),
      ],
    },
  },
  {
    id: 23,
    label: 'Bold Achievers — Power Couple, non-earth sun, no LB earth bonus',
    expectedWinner: 'Power Couple',
    ctx: {
      chart1: chart('Leo', 'Capricorn', 'Virgo', 'Scorpio', 'Aries', 'Gemini', 'Virgo'),
      chart2: chart('Aries', 'Aquarius', 'Aries', 'Gemini', 'Leo', 'Libra', 'Capricorn'),
      aspects: [
        asp('mars', 'venus', 'Conjunction', 1),
        asp('sun', 'sun', 'Trine', 4),
        asp('jupiter', 'sun', 'Conjunction', 2),
        asp('mercury', 'mercury', 'Sextile', 3),
        asp('saturn', 'sun', 'Trine', 5),
        asp('venus', 'sun', 'Trine', 5),
      ],
    },
  },

  // ── Healing Partner (3 profiles) ────────────────────────────────────────────

  {
    id: 3,
    label: 'Water Moon — Healing Partner, Neptune + North Node water',
    expectedWinner: 'Healing Partner Soulmate',
    ctx: {
      chart1: chart('Virgo', 'Pisces', 'Libra', 'Cancer', 'Gemini', 'Aquarius', 'Scorpio'),
      chart2: chart('Pisces', 'Cancer', 'Pisces', 'Pisces', 'Virgo', 'Leo', 'Capricorn'),
      aspects: [
        asp('neptune', 'moon', 'Conjunction', 2),
        asp('northNode', 'moon', 'Conjunction', 2),
        asp('northNode', 'venus', 'Trine', 4),
        asp('venus', 'moon', 'Trine', 3),
        asp('moon', 'moon', 'Trine', 5),
        asp('saturn', 'moon', 'Trine', 5),
        asp('saturn', 'venus', 'Sextile', 5),
      ],
    },
  },
  {
    id: 15,
    label: 'Deep Compassion — Healing Partner, multi-layer soft aspects',
    expectedWinner: 'Healing Partner Soulmate',
    ctx: {
      chart1: chart('Cancer', 'Pisces', 'Gemini', 'Cancer', 'Aries', 'Scorpio', 'Scorpio'),
      chart2: chart('Virgo', 'Cancer', 'Leo', 'Pisces', 'Libra', 'Taurus', 'Capricorn'),
      aspects: [
        asp('neptune', 'moon', 'Conjunction', 1),
        asp('northNode', 'venus', 'Conjunction', 2),
        asp('northNode', 'sun', 'Sextile', 4),
        asp('venus', 'moon', 'Trine', 2),
        asp('moon', 'moon', 'Trine', 4),
        asp('saturn', 'moon', 'Trine', 5),
        asp('mercury', 'moon', 'Trine', 4),
      ],
    },
  },
  {
    id: 24,
    label: 'Healing vs Spiritual — Healing Partner wins on NorthNode-venus',
    expectedWinner: 'Healing Partner Soulmate',
    ctx: {
      chart1: chart('Aquarius', 'Scorpio', 'Capricorn', 'Cancer', 'Sagittarius', 'Virgo', 'Leo'),
      chart2: chart('Pisces', 'Aquarius', 'Pisces', 'Pisces', 'Gemini', 'Libra', 'Virgo'),
      aspects: [
        asp('neptune', 'moon', 'Conjunction', 2),   // HP +25; SC sees neptune-moon = +25 too
        asp('northNode', 'venus', 'Conjunction', 3), // HP +20 (NN to venus); SC ignores venus in node best-aspect
        asp('venus', 'moon', 'Trine', 3),
        asp('moon', 'moon', 'Trine', 5),
        asp('saturn', 'moon', 'Trine', 5),
        asp('saturn', 'venus', 'Trine', 5),
        asp('mercury', 'mercury', 'Trine', 5),      // SC +10; HP has mercury-moon? No, so SC gets 10 extra
      ],
    },
  },

  // ── Spiritual Catalyst (2 profiles) ─────────────────────────────────────────

  {
    id: 4,
    label: 'Neptune Wisdom — Spiritual Catalyst, Neptune-Sun + Jupiter-Neptune',
    expectedWinner: 'Spiritual Catalyst Soulmate',
    ctx: {
      chart1: chart('Pisces', 'Scorpio', 'Aquarius', 'Aquarius', 'Sagittarius', 'Leo', 'Capricorn'),
      chart2: chart('Scorpio', 'Capricorn', 'Scorpio', 'Pisces', 'Cancer', 'Gemini', 'Aquarius'),
      aspects: [
        asp('neptune', 'sun', 'Conjunction', 2),
        asp('jupiter', 'neptune', 'Conjunction', 4),
        asp('mercury', 'mercury', 'Trine', 5),
        asp('pluto', 'moon', 'Trine', 4),
      ],
    },
  },
  {
    id: 16,
    label: 'Mystic Pair — Spiritual Catalyst, Neptune-Venus + Pluto-Moon soft',
    expectedWinner: 'Spiritual Catalyst Soulmate',
    ctx: {
      chart1: chart('Aquarius', 'Sagittarius', 'Capricorn', 'Pisces', 'Libra', 'Taurus', 'Virgo'),
      chart2: chart('Scorpio', 'Aquarius', 'Scorpio', 'Aquarius', 'Cancer', 'Gemini', 'Capricorn'),
      aspects: [
        asp('neptune', 'venus', 'Conjunction', 2),   // SC: sun first (no), moon (no), venus → +25
        asp('jupiter', 'neptune', 'Trine', 5),
        asp('pluto', 'moon', 'Trine', 4),
        asp('mercury', 'mercury', 'Trine', 5),
      ],
    },
  },

  // ── Twin Flame (2 profiles) ──────────────────────────────────────────────────

  {
    id: 5,
    label: 'Sun-Moon Rarity — Twin Flame with 4+ indicators',
    expectedWinner: 'Twin Flame Soulmate',
    ctx: {
      chart1: chart('Gemini', 'Aries', 'Cancer', 'Cancer', 'Virgo', 'Scorpio', 'Leo'),
      chart2: chart('Aries', 'Gemini', 'Gemini', 'Cancer', 'Pisces', 'Aquarius', 'Virgo'),
      aspects: [
        asp('sun', 'moon', 'Conjunction', 1),    // n += 2
        asp('venus', 'mars', 'Conjunction', 2),  // n += 1
        asp('northNode', 'sun', 'Conjunction', 3), // n += 1 → total 4
        asp('saturn', 'venus', 'Conjunction', 3),
        asp('saturn', 'moon', 'Sextile', 5),
      ],
    },
  },
  {
    id: 17,
    label: 'Multi-layer Twin Flame — Sun-Moon + double North Node',
    expectedWinner: 'Twin Flame Soulmate',
    ctx: {
      chart1: chart('Taurus', 'Pisces', 'Aries', 'Scorpio', 'Gemini', 'Capricorn', 'Leo'),
      chart2: chart('Scorpio', 'Taurus', 'Aquarius', 'Taurus', 'Virgo', 'Cancer', 'Aquarius'),
      aspects: [
        asp('sun', 'moon', 'Conjunction', 2),      // n += 2
        asp('northNode', 'moon', 'Conjunction', 1), // n += 1
        asp('northNode', 'venus', 'Conjunction', 3),// n += 1 → total 4
        asp('saturn', 'venus', 'Sextile', 5),
        asp('neptune', 'sun', 'Conjunction', 3),
      ],
    },
  },

  // ── Addictive Chemistry (2 profiles) ────────────────────────────────────────

  {
    id: 6,
    label: 'Pluto Grip — Addictive Chemistry, Pluto-Mars + Venus-Pluto',
    expectedWinner: 'Addictive Chemistry Soulmate',
    ctx: {
      chart1: chart('Scorpio', 'Scorpio', 'Libra', 'Libra', 'Scorpio', 'Virgo', 'Capricorn'),
      chart2: chart('Aries', 'Aries', 'Aries', 'Aries', 'Aries', 'Cancer', 'Leo'),
      aspects: [
        asp('pluto', 'mars', 'Conjunction', 2),
        asp('venus', 'pluto', 'Conjunction', 1),
        asp('mars', 'mars', 'Square', 2),
        asp('moon', 'pluto', 'Square', 2),
        asp('mars', 'moon', 'Square', 3),
      ],
    },
  },
  {
    id: 18,
    label: 'Venus-Pluto Obsession — Addictive Chemistry driven by Venus-Pluto',
    expectedWinner: 'Addictive Chemistry Soulmate',
    ctx: {
      chart1: chart('Scorpio', 'Libra', 'Scorpio', 'Scorpio', 'Aries', 'Cancer', 'Cancer'),
      chart2: chart('Taurus', 'Taurus', 'Taurus', 'Taurus', 'Scorpio', 'Libra', 'Aquarius'),
      aspects: [
        asp('venus', 'pluto', 'Conjunction', 1),
        asp('pluto', 'mars', 'Square', 2),
        asp('moon', 'pluto', 'Square', 2),
        asp('mars', 'mars', 'Opposition', 2),
        asp('mars', 'moon', 'Square', 2),
      ],
    },
  },

  // ── Karmic (2 profiles) ──────────────────────────────────────────────────────

  {
    id: 7,
    label: 'Saturn Chains — Karmic, Saturn-Pluto with hard aspect wall',
    expectedWinner: 'Karmic Soulmate',
    ctx: {
      chart1: chart('Virgo', 'Scorpio', 'Libra', 'Libra', 'Taurus', 'Pisces', 'Capricorn'),
      chart2: chart('Aries', 'Cancer', 'Aries', 'Taurus', 'Scorpio', 'Libra', 'Gemini'),
      aspects: [
        asp('saturn', 'saturn', 'Conjunction', 3),
        asp('saturn', 'moon', 'Square', 2),
        asp('saturn', 'sun', 'Square', 2),
        asp('pluto', 'sun', 'Square', 2),
        asp('pluto', 'venus', 'Square', 3),
        asp('saturn', 'pluto', 'Square', 5),
      ],
    },
  },
  {
    id: 19,
    label: 'Karmic Debt — Karmic, Saturn opposition + Pluto square barrage',
    expectedWinner: 'Karmic Soulmate',
    ctx: {
      chart1: chart('Gemini', 'Aquarius', 'Taurus', 'Virgo', 'Aries', 'Leo', 'Scorpio'),
      chart2: chart('Sagittarius', 'Leo', 'Sagittarius', 'Pisces', 'Libra', 'Aquarius', 'Taurus'),
      aspects: [
        asp('saturn', 'saturn', 'Conjunction', 3),
        asp('saturn', 'moon', 'Square', 1),
        asp('saturn', 'sun', 'Opposition', 2),
        asp('pluto', 'sun', 'Square', 2),
        asp('pluto', 'venus', 'Square', 3),
        asp('saturn', 'pluto', 'Opposition', 5),
      ],
    },
  },

  // ── Intense but Temporary (2 profiles) ──────────────────────────────────────

  {
    id: 8,
    label: 'Mars Clash — Intense Temporary, no stabilizers',
    expectedWinner: 'Intense but Temporary Soulmate',
    ctx: {
      chart1: chart('Aries', 'Aries', 'Aries', 'Aries', 'Leo', 'Gemini', 'Capricorn'),
      chart2: chart('Libra', 'Libra', 'Libra', 'Libra', 'Aquarius', 'Virgo', 'Capricorn'),
      aspects: [
        asp('mars', 'mars', 'Square', 1),
        asp('mars', 'moon', 'Square', 2),
        asp('mars', 'sun', 'Square', 2),
        asp('pluto', 'mars', 'Square', 3),
      ],
    },
  },
  {
    id: 20,
    label: 'Fire Clash — Intense Temporary, pure opposition energy',
    expectedWinner: 'Intense but Temporary Soulmate',
    ctx: {
      chart1: chart('Aries', 'Leo', 'Aries', 'Aries', 'Aries', 'Sagittarius', 'Aquarius'),
      chart2: chart('Cancer', 'Cancer', 'Cancer', 'Cancer', 'Cancer', 'Virgo', 'Scorpio'),
      aspects: [
        asp('mars', 'mars', 'Square', 2),
        asp('mars', 'sun', 'Square', 2),
        asp('mars', 'moon', 'Square', 2),
        asp('pluto', 'mars', 'Square', 2),
      ],
    },
  },
]

// ── Aggregate computation ─────────────────────────────────────────────────────

interface ProfileResult {
  id: number
  label: string
  expectedWinner: ArchetypeName
  person1: { sun: string; moon: string; venus: string; saturn: string }
  person2: { sun: string; moon: string; venus: string; saturn: string }
  allScores: Record<string, number>
  winner: ArchetypeName
  winnerScore: number
  reason: string
  breakdown: Record<string, number>
  expectedMatch: boolean
}

export async function GET() {
  const results: ProfileResult[] = PROFILES.map(p => {
    const scores = scoreAllArchetypes(p.ctx)
    const { archetype, score, reason } = selectArchetype(scores)
    return {
      id: p.id,
      label: p.label,
      expectedWinner: p.expectedWinner,
      person1: {
        sun:    p.ctx.chart1.sun.sign,
        moon:   p.ctx.chart1.moon.sign,
        venus:  p.ctx.chart1.venus.sign,
        saturn: p.ctx.chart1.saturn.sign,
      },
      person2: {
        sun:    p.ctx.chart2.sun.sign,
        moon:   p.ctx.chart2.moon.sign,
        venus:  p.ctx.chart2.venus.sign,
        saturn: p.ctx.chart2.saturn.sign,
      },
      allScores: Object.fromEntries(
        Object.entries(scores)
          .sort(([, a], [, b]) => b.score - a.score)
          .map(([name, r]) => [name, r.score])
      ),
      winner: archetype,
      winnerScore: score,
      reason,
      breakdown: scores[archetype].breakdown,
      expectedMatch: archetype === p.expectedWinner,
    }
  })

  // Sort by id for clean output
  results.sort((a, b) => a.id - b.id)

  const N = results.length

  const winCount  = Object.fromEntries(ARCHETYPE_HIERARCHY.map(a => [a, 0])) as Record<ArchetypeName, number>
  const scoreSum  = Object.fromEntries(ARCHETYPE_HIERARCHY.map(a => [a, 0])) as Record<ArchetypeName, number>
  const scoreMax  = Object.fromEntries(ARCHETYPE_HIERARCHY.map(a => [a, 0])) as Record<ArchetypeName, number>

  for (const r of results) {
    winCount[r.winner]++
    for (const [arch, raw] of Object.entries(r.allScores)) {
      const a = arch as ArchetypeName
      scoreSum[a] = (scoreSum[a] ?? 0) + raw
      scoreMax[a] = Math.max(scoreMax[a] ?? 0, raw)
    }
  }

  const winPercent = Object.fromEntries(
    ARCHETYPE_HIERARCHY.map(a => [a, Math.round((winCount[a] / N) * 1000) / 10])
  )
  const avgScore = Object.fromEntries(
    ARCHETYPE_HIERARCHY.map(a => [a, Math.round((scoreSum[a] / N) * 10) / 10])
  )

  // Life Builder top-3 components if it wins >50%
  let lifeBuilderTopComponents: { component: string; avgPoints: number }[] | null = null
  if (winCount['Life Builder Soulmate'] / N > 0.5) {
    const totals: Record<string, number> = {}
    for (const r of results) {
      if (r.winner === 'Life Builder Soulmate') {
        for (const [comp, pts] of Object.entries(r.breakdown)) {
          totals[comp] = (totals[comp] ?? 0) + pts
        }
      }
    }
    const lbWins = winCount['Life Builder Soulmate']
    lifeBuilderTopComponents = Object.entries(totals)
      .map(([component, total]) => ({
        component,
        avgPoints: Math.round((total / lbWins) * 10) / 10,
      }))
      .sort((a, b) => b.avgPoints - a.avgPoints)
      .slice(0, 3)
  }

  const expectedMatchCount = results.filter(r => r.expectedMatch).length

  return NextResponse.json({
    profiles: results,
    aggregate: {
      profileCount: N,
      winCount,
      winPercent,
      avgScore,
      highestScore: scoreMax,
      expectedMatchRate: `${expectedMatchCount}/${N}`,
      lifeBuilderTopComponents,
    },
    meta: {
      description: 'Live scoring engine diagnostic — all 25 profiles run through actual scoreAllArchetypes()',
      generatedAt: new Date().toISOString(),
    },
  })
}
