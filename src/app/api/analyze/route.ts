import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getServiceClient } from '@/lib/supabase'
import {
  geocodeLocation,
  getNatalChart,
  calculateSynastryAspects,
  formatChartForPrompt,
  formatAspectsForPrompt,
  type SynastryAspect,
  type NatalChart,
} from '@/lib/astrology'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// ── Archetype Scoring System ──────────────────────────────────────────────────
// Goal: HEALTHY LONG-TERM COMPATIBILITY first, intensity second.
// Hierarchy is TIEBREAKER ONLY — primary selection is always highest raw score.
// ─────────────────────────────────────────────────────────────────────────────

type ArchetypeName =
  | 'Highest Timeline Soulmate'
  | 'Life Builder Soulmate'
  | 'Safe Love Soulmate'
  | 'Power Couple'
  | 'Healing Partner Soulmate'
  | 'Spiritual Catalyst Soulmate'
  | 'Twin Flame Soulmate'
  | 'Addictive Chemistry Soulmate'
  | 'Karmic Soulmate'
  | 'Intense but Temporary Soulmate'

interface ScoringCtx {
  aspects: SynastryAspect[]
  chart1: NatalChart
  chart2: NatalChart
}

interface ScoreResult {
  score: number
  breakdown: Record<string, number>
}

// Healthy → intense — used ONLY to break score ties
const ARCHETYPE_HIERARCHY: ArchetypeName[] = [
  'Highest Timeline Soulmate',
  'Life Builder Soulmate',
  'Safe Love Soulmate',
  'Power Couple',
  'Healing Partner Soulmate',
  'Spiritual Catalyst Soulmate',
  'Twin Flame Soulmate',
  'Addictive Chemistry Soulmate',
  'Karmic Soulmate',
  'Intense but Temporary Soulmate',
]

const SCORE_CAPS: Record<ArchetypeName, number> = {
  'Highest Timeline Soulmate':        97,
  'Life Builder Soulmate':            95,
  'Safe Love Soulmate':               93,
  'Power Couple':                     90,
  'Healing Partner Soulmate':         90,
  'Spiritual Catalyst Soulmate':      85,
  'Twin Flame Soulmate':              88,
  'Addictive Chemistry Soulmate':     75,
  'Karmic Soulmate':                  70,
  'Intense but Temporary Soulmate':   65,
}

// ── Aspect helpers ────────────────────────────────────────────────────────────

function has(aspects: SynastryAspect[], k1: string, k2: string, asp: string, maxOrb: number): boolean {
  return aspects.some(a =>
    ((a.planet1Key === k1 && a.planet2Key === k2) || (a.planet1Key === k2 && a.planet2Key === k1)) &&
    a.aspect === asp && a.orb <= maxOrb
  )
}

function hasAny(aspects: SynastryAspect[], k1: string, k2: string, asps: string[], maxOrb: number): boolean {
  return asps.some(asp => has(aspects, k1, k2, asp, maxOrb))
}

const HARMONY     = ['Conjunction', 'Trine', 'Sextile']
const CHALLENGING = ['Square', 'Opposition']
const SOFT        = ['Trine', 'Sextile']

// ── Sign / element helpers for sign-level compatibility ───────────────────────

const EARTH_SIGNS = new Set(['Capricorn', 'Taurus', 'Virgo'])
const WATER_SIGNS = new Set(['Cancer', 'Scorpio', 'Pisces'])
const FIRE_SIGNS  = new Set(['Aries', 'Leo', 'Sagittarius'])
const AIR_SIGNS   = new Set(['Gemini', 'Libra', 'Aquarius'])

function element(sign: string): string {
  if (EARTH_SIGNS.has(sign)) return 'earth'
  if (WATER_SIGNS.has(sign)) return 'water'
  if (FIRE_SIGNS.has(sign))  return 'fire'
  return 'air'
}

// Earth↔Water and Fire↔Air are complementary (sextile-based resonance)
function signCompat(s1: string, s2: string): 'same-sign' | 'same-element' | 'compatible' | 'neutral' {
  if (s1 === s2) return 'same-sign'
  const e1 = element(s1), e2 = element(s2)
  if (e1 === e2) return 'same-element'
  if ((e1 === 'earth' && e2 === 'water') || (e1 === 'water' && e2 === 'earth')) return 'compatible'
  if ((e1 === 'fire'  && e2 === 'air')   || (e1 === 'air'   && e2 === 'fire'))  return 'compatible'
  return 'neutral'
}

// Best-aspect helper — prevents outer-planet (Neptune, Pluto) stacking across personal planets.
// Outer planets move 1–2°/year; people born close together share them generationally,
// so one Neptune-personal conjunction shouldn't inflate scores across all 4 personal planets.
function bestAspect(
  aspects: SynastryAspect[],
  outer: string,
  targets: string[],
  conjOrb: number,
  softOrb: number,
  conjPts: number,
  softPts: number,
): { pts: number; label: string } {
  for (const t of targets) {
    if (has(aspects, outer, t, 'Conjunction', conjOrb)) return { pts: conjPts, label: `${outer}-${t} conjunction` }
  }
  for (const t of targets) {
    if (hasAny(aspects, outer, t, SOFT, softOrb)) return { pts: softPts, label: `${outer}-${t} trine/sextile` }
  }
  return { pts: 0, label: '' }
}

// ── Per-archetype scoring functions ──────────────────────────────────────────

function scoreHighestTimeline({ aspects: a, chart1, chart2 }: ScoringCtx): ScoreResult {
  let s = 0; const bd: Record<string, number> = {}
  const add = (lbl: string, pts: number) => { s += pts; bd[lbl] = pts }

  // North Node to personal planets — destiny alignment (stacks, it's personal)
  for (const p of ['sun', 'moon', 'venus'] as const) {
    if (has(a, 'northNode', p, 'Conjunction', 3))     add(`North Node-${p} conjunction`, 30)
    else if (hasAny(a, 'northNode', p, SOFT, 6))      add(`North Node-${p} trine/sextile`, 20)
  }
  // Jupiter to personal planets — expansion and luck (best only, generational risk)
  const jup = bestAspect(a, 'jupiter', ['sun', 'moon', 'venus'], 3, 6, 25, 18)
  if (jup.pts) add(jup.label, jup.pts)
  // Moon-Moon harmony — emotional alignment essential for long-term
  if (has(a, 'moon', 'moon', 'Conjunction', 6))       add('Moon-Moon conjunction', 22)
  else if (has(a, 'moon', 'moon', 'Trine', 6))        add('Moon-Moon trine', 22)
  else if (has(a, 'moon', 'moon', 'Sextile', 6))      add('Moon-Moon sextile', 16)
  // Venus-Sun warmth
  if (hasAny(a, 'venus', 'sun', HARMONY, 3))          add('Venus-Sun harmony (tight)', 20)
  else if (hasAny(a, 'venus', 'sun', HARMONY, 6))     add('Venus-Sun harmony', 12)
  // Mercury conjunction — communication partnership
  if (has(a, 'mercury', 'mercury', 'Conjunction', 3)) add('Mercury-Mercury conjunction', 15)
  else if (hasAny(a, 'mercury', 'mercury', SOFT, 6))  add('Mercury-Mercury soft', 10)
  // Sign-level: sun elemental resonance
  const sc = signCompat(chart1.sun.sign, chart2.sun.sign)
  if (sc === 'same-sign')    add(`Both Sun in ${chart1.sun.sign}`, 18)
  else if (sc === 'same-element') add('Sun signs same element', 10)
  else if (sc === 'compatible')   add('Sun signs compatible elements', 6)
  // Deductions for dangerous dynamics
  if (hasAny(a, 'pluto', 'mars', CHALLENGING, 3)) add('Pluto-Mars challenge (danger)', -25)
  if (hasAny(a, 'mars', 'mars', CHALLENGING, 3))  add('Mars-Mars challenge', -15)

  return { score: Math.max(0, s), breakdown: bd }
}

function scoreLifeBuilder({ aspects: a, chart1, chart2 }: ScoringCtx): ScoreResult {
  let s = 0; const bd: Record<string, number> = {}
  const add = (lbl: string, pts: number) => { s += pts; bd[lbl] = pts }

  // ── Sign-level compatibility — the core of a Life Builder connection ──────
  // Earth + Earth = ultimate stability and shared values
  const sunCompat   = signCompat(chart1.sun.sign, chart2.sun.sign)
  const venusCompat = signCompat(chart1.venus.sign, chart2.venus.sign)

  if (sunCompat === 'same-sign' && EARTH_SIGNS.has(chart1.sun.sign))
    add(`Both Sun in ${chart1.sun.sign} (earth sign match)`, 35)
  else if (sunCompat === 'same-sign')
    add(`Both Sun in ${chart1.sun.sign}`, 22)
  else if (sunCompat === 'same-element' && element(chart1.sun.sign) === 'earth')
    add('Both Sun signs earth (trine element)', 22)
  else if (sunCompat === 'same-element')
    add('Sun signs same element', 14)
  else if (sunCompat === 'compatible')
    add('Sun signs compatible elements (earth-water or fire-air)', 10)

  if (venusCompat === 'same-sign' && EARTH_SIGNS.has(chart1.venus.sign))
    add(`Both Venus in ${chart1.venus.sign} (earth sign match)`, 32)
  else if (venusCompat === 'same-sign')
    add(`Both Venus in ${chart1.venus.sign}`, 22)
  else if (venusCompat === 'same-element' && element(chart1.venus.sign) === 'earth')
    add('Both Venus signs earth', 20)
  else if (venusCompat === 'same-element')
    add('Venus signs same element', 12)
  else if (venusCompat === 'compatible')
    add('Venus signs compatible elements', 8)

  // Capricorn emphasis bonus — most commitment/structure-oriented sign
  const capPlanets = [chart1.sun.sign, chart2.sun.sign, chart1.venus.sign, chart2.venus.sign,
                      chart1.moon.sign, chart2.moon.sign].filter(s => s === 'Capricorn').length
  if (capPlanets >= 4) add('Very heavy Capricorn emphasis (4+ placements)', 25)
  else if (capPlanets === 3) add('Heavy Capricorn emphasis (3 placements)', 18)
  else if (capPlanets === 2) add('Capricorn emphasis (2 placements)', 10)

  // ── Aspect-based scoring ─────────────────────────────────────────────────
  // Saturn-Saturn — shared life structure
  if (has(a, 'saturn', 'saturn', 'Conjunction', 6)) add('Saturn-Saturn conjunction', 30)

  // Saturn to personal planets — commitment, lasting bonds
  for (const p of ['venus', 'moon', 'sun'] as const) {
    if (has(a, 'saturn', p, 'Conjunction', 3))       add(`Saturn-${p} conjunction (tight ≤3°)`, 22)
    else if (has(a, 'saturn', p, 'Conjunction', 6))  add(`Saturn-${p} conjunction (≤6°)`, 15)
    else if (hasAny(a, 'saturn', p, SOFT, 6))        add(`Saturn-${p} trine/sextile`, 12)
  }
  // Venus aspect harmony
  if (has(a, 'venus', 'venus', 'Conjunction', 3))     add('Venus-Venus conjunction (tight)', 28)
  else if (has(a, 'venus', 'venus', 'Conjunction', 6)) add('Venus-Venus conjunction', 20)
  else if (hasAny(a, 'venus', 'venus', SOFT, 6))       add('Venus-Venus trine/sextile', 14)
  // Moon harmony — emotional home security
  if (has(a, 'moon', 'moon', 'Conjunction', 6))       add('Moon-Moon conjunction', 18)
  else if (hasAny(a, 'moon', 'moon', SOFT, 6))        add('Moon-Moon trine/sextile', 15)
  // Mercury — practical daily communication
  if (has(a, 'mercury', 'mercury', 'Conjunction', 3)) add('Mercury-Mercury conjunction', 15)
  else if (hasAny(a, 'mercury', 'mercury', SOFT, 6))  add('Mercury-Mercury soft', 10)
  // Jupiter expands the foundation
  if (hasAny(a, 'jupiter', 'saturn', HARMONY, 6))     add('Jupiter-Saturn harmony', 10)

  return { score: Math.max(0, s), breakdown: bd }
}

function scoreSafeLove({ aspects: a, chart1, chart2 }: ScoringCtx): ScoreResult {
  let s = 0; const bd: Record<string, number> = {}
  const add = (lbl: string, pts: number) => { s += pts; bd[lbl] = pts }

  // Venus-Venus (shared values — cornerstone of safe love)
  if (has(a, 'venus', 'venus', 'Conjunction', 3))      add('Venus-Venus conjunction (tight)', 28)
  else if (has(a, 'venus', 'venus', 'Conjunction', 6)) add('Venus-Venus conjunction', 20)
  else if (hasAny(a, 'venus', 'venus', SOFT, 6))       add('Venus-Venus soft', 16)
  // Venus to Sun/Moon
  for (const p of ['sun', 'moon'] as const) {
    if (hasAny(a, 'venus', p, HARMONY, 3))  add(`Venus-${p} harmony (tight)`, 22)
    else if (hasAny(a, 'venus', p, SOFT, 6)) add(`Venus-${p} trine/sextile`, 15)
  }
  // Saturn-Venus harmony (committed love with healthy structure)
  if (hasAny(a, 'saturn', 'venus', SOFT, 6))              add('Saturn-Venus trine/sextile', 20)
  else if (has(a, 'saturn', 'venus', 'Conjunction', 6))   add('Saturn-Venus conjunction', 16)
  // Mercury — open honest communication
  if (has(a, 'mercury', 'mercury', 'Conjunction', 3))     add('Mercury-Mercury conjunction', 15)
  else if (hasAny(a, 'mercury', 'mercury', SOFT, 6))      add('Mercury-Mercury soft', 10)
  // Moon harmony — emotional safety
  if (hasAny(a, 'moon', 'moon', HARMONY, 6))              add('Moon-Moon harmony', 15)
  // Venus sign compatibility
  const vc = signCompat(chart1.venus.sign, chart2.venus.sign)
  if (vc === 'same-sign')    add(`Both Venus in ${chart1.venus.sign}`, 18)
  else if (vc === 'same-element') add('Venus signs same element', 10)
  // Deductions
  if (hasAny(a, 'pluto', 'mars', CHALLENGING, 3))   add('Pluto-Mars challenge', -20)
  if (hasAny(a, 'pluto', 'moon', CHALLENGING, 3))   add('Pluto-Moon challenge', -15)
  if (hasAny(a, 'saturn', 'moon', CHALLENGING, 3))  add('Saturn-Moon challenge', -10)

  return { score: Math.max(0, s), breakdown: bd }
}

function scorePowerCouple({ aspects: a }: ScoringCtx): ScoreResult {
  let s = 0; const bd: Record<string, number> = {}
  const add = (lbl: string, pts: number) => { s += pts; bd[lbl] = pts }

  if (has(a, 'mars', 'venus', 'Conjunction', 3))        add('Mars-Venus conjunction (tight)', 28)
  else if (hasAny(a, 'mars', 'venus', SOFT, 6))         add('Mars-Venus trine/sextile', 18)
  if (has(a, 'sun', 'sun', 'Conjunction', 6))           add('Sun-Sun conjunction', 22)
  else if (hasAny(a, 'sun', 'sun', SOFT, 6))            add('Sun-Sun trine/sextile', 15)
  const jup = bestAspect(a, 'jupiter', ['sun', 'mars'], 3, 6, 22, 16)
  if (jup.pts) add(jup.label, jup.pts)
  if (has(a, 'mercury', 'mercury', 'Conjunction', 3))   add('Mercury-Mercury conjunction', 15)
  else if (hasAny(a, 'mercury', 'mercury', SOFT, 6))    add('Mercury-Mercury soft', 10)
  if (hasAny(a, 'saturn', 'sun', SOFT, 6))              add('Saturn-Sun trine/sextile', 10)
  if (hasAny(a, 'venus', 'sun', HARMONY, 6))            add('Venus-Sun harmony', 10)
  if (has(a, 'mars', 'mars', 'Square', 3))              add('Mars-Mars square (power struggle)', -15)
  if (has(a, 'mars', 'mars', 'Opposition', 3))          add('Mars-Mars opposition', -10)

  return { score: Math.max(0, s), breakdown: bd }
}

function scoreHealingPartner({ aspects: a }: ScoringCtx): ScoreResult {
  let s = 0; const bd: Record<string, number> = {}
  const add = (lbl: string, pts: number) => { s += pts; bd[lbl] = pts }

  // Neptune to personal planets — compassion (best only, prevents generational stacking)
  const nep = bestAspect(a, 'neptune', ['moon', 'venus', 'sun'], 3, 5, 25, 16)
  if (nep.pts) add(nep.label, nep.pts)
  // North Node to personal planets — healing as growth path (stacks — it's personal)
  for (const p of ['moon', 'venus', 'sun'] as const) {
    if (has(a, 'northNode', p, 'Conjunction', 3))     add(`North Node-${p} conjunction`, 20)
    else if (hasAny(a, 'northNode', p, SOFT, 5))      add(`North Node-${p} soft`, 14)
  }
  if (hasAny(a, 'venus', 'moon', HARMONY, 6))         add('Venus-Moon harmony', 20)
  if (has(a, 'moon', 'moon', 'Conjunction', 6))       add('Moon-Moon conjunction', 20)
  else if (hasAny(a, 'moon', 'moon', SOFT, 6))        add('Moon-Moon trine/sextile', 16)
  if (hasAny(a, 'saturn', 'moon', SOFT, 6))           add('Saturn-Moon trine/sextile', 15)
  if (hasAny(a, 'saturn', 'venus', SOFT, 6))          add('Saturn-Venus trine/sextile', 15)
  if (hasAny(a, 'mercury', 'moon', HARMONY, 6))       add('Mercury-Moon harmony', 10)
  if (hasAny(a, 'pluto', 'moon', CHALLENGING, 3))     add('Pluto-Moon challenge', -15)
  if (hasAny(a, 'pluto', 'venus', CHALLENGING, 3))    add('Pluto-Venus challenge', -15)

  return { score: Math.max(0, s), breakdown: bd }
}

function scoreSpiritualCatalyst({ aspects: a }: ScoringCtx): ScoreResult {
  let s = 0; const bd: Record<string, number> = {}
  const add = (lbl: string, pts: number) => { s += pts; bd[lbl] = pts }

  // Neptune to personal planets — BEST ONLY (outer planet, generational risk)
  // Tight conjunction orb (3°) only; soft aspects use 4° orb
  const nep = bestAspect(a, 'neptune', ['sun', 'moon', 'venus', 'mercury'], 3, 4, 25, 15)
  if (nep.pts) add(nep.label, nep.pts)

  // North Node to personal planets — BEST ONLY (same generational risk)
  const node = bestAspect(a, 'northNode', ['sun', 'moon', 'mercury'], 3, 4, 20, 12)
  if (node.pts) add(node.label, node.pts)

  // Jupiter-Neptune (philosophical/spiritual expansion) — specific planet pair, can stack
  if (has(a, 'jupiter', 'neptune', 'Conjunction', 6))  add('Jupiter-Neptune conjunction', 25)
  else if (hasAny(a, 'jupiter', 'neptune', SOFT, 6))   add('Jupiter-Neptune trine/sextile', 18)

  // Pluto in HARMONIOUS aspect only (conscious transformation)
  const pluto = bestAspect(a, 'pluto', ['sun', 'moon'], 3, 5, 0, 15)
  if (pluto.pts) add(pluto.label.replace('conjunction', 'trine/sextile'), pluto.pts)

  // Mercury harmony — truth-seeking dialogue
  if (hasAny(a, 'mercury', 'mercury', HARMONY, 6)) add('Mercury-Mercury harmony', 10)

  // Deduct for deceptive / coercive dynamics
  if (hasAny(a, 'neptune', 'mercury', CHALLENGING, 3)) add('Neptune-Mercury challenge (confusion)', -15)
  if (hasAny(a, 'pluto', 'mercury', CHALLENGING, 3))   add('Pluto-Mercury challenge', -10)

  return { score: Math.max(0, s), breakdown: bd }
}

function countTwinFlameIndicators(a: SynastryAspect[]): number {
  let n = 0
  if (has(a, 'sun', 'moon', 'Conjunction', 3))   n += 2
  if (has(a, 'venus', 'mars', 'Conjunction', 3))  n++
  for (const p of ['sun', 'moon', 'venus'] as const) {
    if (has(a, 'northNode', p, 'Conjunction', 3)) n++
    if (has(a, 'neptune', p, 'Conjunction', 3))   n++
    if (has(a, 'pluto', p, 'Conjunction', 3))     n++
    if (has(a, 'saturn', p, 'Conjunction', 3))    n++
  }
  return n
}

function scoreTwinFlame({ aspects: a }: ScoringCtx): ScoreResult {
  let s = 0; const bd: Record<string, number> = {}
  const add = (lbl: string, pts: number) => { s += pts; bd[lbl] = pts }

  if (has(a, 'sun', 'moon', 'Conjunction', 3))         add('Sun-Moon conjunction (rarest)', 30)
  if (has(a, 'venus', 'mars', 'Conjunction', 3))        add('Venus-Mars conjunction', 20)
  for (const p of ['sun', 'moon', 'venus'] as const) {
    if (has(a, 'northNode', p, 'Conjunction', 3))       add(`North Node-${p} conjunction`, 20)
  }
  for (const p of ['sun', 'moon', 'venus'] as const) {
    if (has(a, 'saturn', p, 'Conjunction', 3))          add(`Saturn-${p} conjunction`, 15)
    else if (hasAny(a, 'saturn', p, SOFT, 6))           add(`Saturn-${p} trine/sextile`, 10)
  }
  const nep = bestAspect(a, 'neptune', ['sun', 'moon', 'venus'], 3, 6, 12, 0)
  if (nep.pts) add(nep.label, nep.pts)
  const plu = bestAspect(a, 'pluto', ['sun', 'moon', 'venus'], 3, 6, 12, 0)
  if (plu.pts) add(plu.label, plu.pts)
  if (countTwinFlameIndicators(a) >= 4)                 add('4+ twin flame indicators (composite)', 15)
  if (hasAny(a, 'pluto', 'mars', CHALLENGING, 3))       add('Pluto-Mars hard aspect (abuse risk)', -25)
  if (hasAny(a, 'mars', 'mars', CHALLENGING, 3))        add('Mars-Mars hard aspect', -15)

  return { score: Math.max(0, s), breakdown: bd }
}

function scoreAddictiveChemistry({ aspects: a }: ScoringCtx): ScoreResult {
  let s = 0; const bd: Record<string, number> = {}
  const add = (lbl: string, pts: number) => { s += pts; bd[lbl] = pts }

  if (has(a, 'pluto', 'mars', 'Conjunction', 3))           add('Pluto-Mars conjunction', 25)
  else if (hasAny(a, 'pluto', 'mars', CHALLENGING, 3))     add('Pluto-Mars hard aspect', 20)
  if (has(a, 'venus', 'pluto', 'Conjunction', 3))          add('Venus-Pluto conjunction', 25)
  else if (hasAny(a, 'venus', 'pluto', CHALLENGING, 3))    add('Venus-Pluto hard aspect', 20)
  if (has(a, 'mars', 'mars', 'Square', 3))                 add('Mars-Mars square', 20)
  else if (has(a, 'mars', 'mars', 'Opposition', 3))        add('Mars-Mars opposition', 15)
  if (hasAny(a, 'moon', 'pluto', CHALLENGING, 3))          add('Moon-Pluto hard aspect', 15)
  if (hasAny(a, 'mars', 'moon', CHALLENGING, 3))           add('Mars-Moon hard aspect', 10)

  return { score: Math.max(0, s), breakdown: bd }
}

function scoreKarmic({ aspects: a }: ScoringCtx): ScoreResult {
  let s = 0; const bd: Record<string, number> = {}
  const add = (lbl: string, pts: number) => { s += pts; bd[lbl] = pts }

  if (has(a, 'saturn', 'saturn', 'Conjunction', 3))     add('Saturn-Saturn conjunction', 20)
  for (const p of ['sun', 'moon', 'venus'] as const) {
    if (hasAny(a, 'saturn', p, CHALLENGING, 3))         add(`Saturn-${p} hard aspect`, 15)
  }
  for (const p of ['sun', 'moon', 'venus'] as const) {
    if (hasAny(a, 'pluto', p, CHALLENGING, 3))          add(`Pluto-${p} hard aspect`, 15)
  }
  if (hasAny(a, 'saturn', 'pluto', CHALLENGING, 6))     add('Saturn-Pluto hard aspect', 15)
  const hardCount = a.filter(x => x.nature === 'challenging' && x.orb <= 3).length
  if (hardCount >= 4) add('4+ challenging aspects overall', 10)

  return { score: Math.max(0, s), breakdown: bd }
}

function scoreIntenseTemporary({ aspects: a }: ScoringCtx): ScoreResult {
  let s = 0; const bd: Record<string, number> = {}
  const add = (lbl: string, pts: number) => { s += pts; bd[lbl] = pts }

  if (has(a, 'mars', 'mars', 'Square', 3))             add('Mars-Mars square', 20)
  else if (has(a, 'mars', 'mars', 'Opposition', 3))    add('Mars-Mars opposition', 15)
  for (const p of ['sun', 'moon', 'venus'] as const) {
    if (hasAny(a, 'mars', p, CHALLENGING, 3))          add(`Mars-${p} hard aspect`, 10)
  }
  if (hasAny(a, 'pluto', 'mars', CHALLENGING, 3))      add('Pluto-Mars hard aspect', 15)
  const stabilizers = a.filter(x =>
    x.nature === 'harmonious' &&
    (['venus', 'moon', 'jupiter', 'saturn'].includes(x.planet1Key) ||
     ['venus', 'moon', 'jupiter', 'saturn'].includes(x.planet2Key))
  ).length
  if (stabilizers === 0) add('No stabilizing aspects present', 10)

  return { score: Math.max(0, s), breakdown: bd }
}

// ── Aggregate + selection ─────────────────────────────────────────────────────

function scoreAllArchetypes(ctx: ScoringCtx): Record<ArchetypeName, ScoreResult> {
  return {
    'Highest Timeline Soulmate':      scoreHighestTimeline(ctx),
    'Life Builder Soulmate':          scoreLifeBuilder(ctx),
    'Safe Love Soulmate':             scoreSafeLove(ctx),
    'Power Couple':                   scorePowerCouple(ctx),
    'Healing Partner Soulmate':       scoreHealingPartner(ctx),
    'Spiritual Catalyst Soulmate':    scoreSpiritualCatalyst(ctx),
    'Twin Flame Soulmate':            scoreTwinFlame(ctx),
    'Addictive Chemistry Soulmate':   scoreAddictiveChemistry(ctx),
    'Karmic Soulmate':                scoreKarmic(ctx),
    'Intense but Temporary Soulmate': scoreIntenseTemporary(ctx),
  }
}

function selectArchetype(scores: Record<ArchetypeName, ScoreResult>): {
  archetype: ArchetypeName; score: number; reason: string
} {
  const entries = Object.entries(scores) as [ArchetypeName, ScoreResult][]
  const highest = Math.max(...entries.map(([, r]) => r.score))

  if (highest === 0) {
    return { archetype: 'Highest Timeline Soulmate', score: 0,
             reason: 'No strong indicators — defaulting to most positive archetype' }
  }

  const tied = entries.filter(([, r]) => r.score === highest).map(([k]) => k)

  if (tied.length === 1) {
    return { archetype: tied[0], score: highest, reason: 'Highest raw score' }
  }

  const winner = [...tied].sort(
    (a, b) => ARCHETYPE_HIERARCHY.indexOf(a) - ARCHETYPE_HIERARCHY.indexOf(b)
  )[0]
  const others = tied.filter(a => a !== winner).join(', ')
  return {
    archetype: winner, score: highest,
    reason: `Tied at ${highest} pts with [${others}]; hierarchy tiebreak → healthier archetype wins`,
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { person1, person2, tier = 'free', existingSessionId } = body

    console.log('[analyze] received person1:', JSON.stringify(person1))
    console.log('[analyze] received person2:', JSON.stringify(person2))

    if (!person1?.name || !person1?.date || !person1?.location) {
      return NextResponse.json({ error: 'Missing Person 1 data' }, { status: 400 })
    }
    if (!person2?.name || !person2?.date || !person2?.location) {
      return NextResponse.json({ error: 'Missing Person 2 data' }, { status: 400 })
    }

    const sessionId = existingSessionId || generateSessionId()

    const [geo1, geo2] = await Promise.all([
      geocodeLocation(person1.location),
      geocodeLocation(person2.location)
    ])

    const [chart1, chart2] = await Promise.all([
      getNatalChart({ date: person1.date, time: person1.time, latitude: geo1.latitude, longitude: geo1.longitude }),
      getNatalChart({ date: person2.date, time: person2.time, latitude: geo2.latitude, longitude: geo2.longitude })
    ])

    const aspects = calculateSynastryAspects(chart1, chart2)

    const chartSummary1  = formatChartForPrompt('You', chart1)
    const chartSummary2  = formatChartForPrompt(person2.name, chart2)
    const aspectsSummary = formatAspectsForPrompt(aspects, 'You', person2.name)

    const harmonious  = aspects.filter(a => a.nature === 'harmonious').length
    const challenging = aspects.filter(a => a.nature === 'challenging').length
    const baseScore   = Math.round(50 + (harmonious * 5) - (challenging * 3) + Math.floor(Math.random() * 10))

    // Score all archetypes
    const ctx: ScoringCtx = { aspects, chart1, chart2 }
    const archetypeScores = scoreAllArchetypes(ctx)
    const { archetype: selectedArchetype, score: archetypeRawScore, reason: selectionReason } =
      selectArchetype(archetypeScores)

    const compatibilityScore = Math.min(SCORE_CAPS[selectedArchetype], Math.max(45, baseScore))

    // Build debug info for response
    const debugInfo = {
      archetypeScores: Object.fromEntries(
        Object.entries(archetypeScores)
          .sort(([, a], [, b]) => b.score - a.score)
          .map(([name, r]) => [name, r.score])
      ) as Record<ArchetypeName, number>,
      winner: { archetype: selectedArchetype, score: archetypeRawScore, reason: selectionReason },
      winnerBreakdown: archetypeScores[selectedArchetype].breakdown,
      charts: {
        person1: { sun: chart1.sun.sign, moon: chart1.moon.sign, venus: chart1.venus.sign, saturn: chart1.saturn.sign },
        person2: { sun: chart2.sun.sign, moon: chart2.moon.sign, venus: chart2.venus.sign, saturn: chart2.saturn.sign },
      }
    }

    // Full scoring log
    console.log('\n╔═══════════════════════════════════════════════════════╗')
    console.log('║         ARCHETYPIST ARCHETYPE SCORING AUDIT          ║')
    console.log('╚═══════════════════════════════════════════════════════╝')
    console.log(`Charts: ${person1.name} (${person1.date}) + ${person2.name} (${person2.date})`)
    console.log(`  P1: Sun ${chart1.sun.sign}, Moon ${chart1.moon.sign}, Venus ${chart1.venus.sign}, Saturn ${chart1.saturn.sign}`)
    console.log(`  P2: Sun ${chart2.sun.sign}, Moon ${chart2.moon.sign}, Venus ${chart2.venus.sign}, Saturn ${chart2.saturn.sign}`)
    console.log('\nALL ARCHETYPE SCORES:')
    Object.entries(archetypeScores)
      .sort(([, a], [, b]) => b.score - a.score)
      .forEach(([name, r], i) => console.log(`  ${i + 1}. ${name}: ${r.score}pts`))
    console.log(`\n► WINNER: "${selectedArchetype}" — ${selectionReason}`)
    console.log('\nWINNER BREAKDOWN:')
    Object.entries(archetypeScores[selectedArchetype].breakdown)
      .forEach(([k, v]) => console.log(`  ${v > 0 ? '+' : ''}${v}  ${k}`))
    console.log('═══════════════════════════════════════════════════════\n')

    const archetypeBlock = `
ARCHETYPE (pre-selected by scoring system):
"${selectedArchetype}" — score: ${archetypeRawScore}pts | ${selectionReason}

The "archetype" field in your JSON MUST be exactly: "${selectedArchetype}"
Write an archetypeDescription and insights that authentically explain why this archetype fits the confirmed aspects below.
`

    const ARCHETYPE_LIST = `(healthy → intense, for reference — archetype already selected)
- "Highest Timeline Soulmate"
- "Life Builder Soulmate"
- "Safe Love Soulmate"
- "Power Couple"
- "Healing Partner Soulmate"
- "Spiritual Catalyst Soulmate"
- "Twin Flame Soulmate"
- "Addictive Chemistry Soulmate"
- "Karmic Soulmate"
- "Intense but Temporary Soulmate"`

    if (tier === 'free') {
      const freePrompt = `You are an expert astrologer analyzing synastry. Base your entire analysis STRICTLY on the data below — no assumptions.
${archetypeBlock}
CHART POSITIONS (sign, degree in sign, ecliptic longitude):
${chartSummary1}

${chartSummary2}

CONFIRMED DEGREE-BASED ASPECTS (within standard orbs only):
${aspectsSummary}

CRITICAL RULES — MUST FOLLOW:
1. ONLY reference aspects that appear in the CONFIRMED ASPECTS list above.
2. Do NOT infer aspects from signs alone. Two planets in the same sign are NOT conjunct unless they appear in the list with a confirmed orb.
3. When citing an aspect, always include the sign, degree, and orb exactly as listed.
4. If no aspects are listed for a planet pair, do not mention an aspect between them.

Archetype reference list:
${ARCHETYPE_LIST}

Provide a JSON response with exactly this structure:
{
  "archetype": "${selectedArchetype}",
  "archetypeDescription": "One clear sentence explaining why this archetype fits (max 25 words, plain language)",
  "insights": [
    "Cite a specific confirmed aspect with exact degrees and orb",
    "Cite a second confirmed aspect with exact degrees and orb",
    "Describe a chart pattern or third confirmed aspect with exact degrees"
  ]
}`

      const message = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 600,
        messages: [{ role: 'user', content: freePrompt }]
      })

      const content   = message.content[0].type === 'text' ? message.content[0].text : ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Invalid AI response')

      const parsed = JSON.parse(jsonMatch[0])
      parsed.archetype = selectedArchetype // enforce server selection

      try {
        const supabase = getServiceClient()
        await supabase.from('analyses').upsert({
          session_id: sessionId,
          person1_name: person1.name, person2_name: person2.name,
          person1_data: { ...person1, latitude: geo1.latitude, longitude: geo1.longitude },
          person2_data: { ...person2, latitude: geo2.latitude, longitude: geo2.longitude },
          free_analysis: { ...parsed, compatibilityScore },
          payment_status: 'pending', tier: 'free',
          created_at: new Date().toISOString()
        }, { onConflict: 'session_id' })
      } catch (dbError) { console.error('DB error (non-fatal):', dbError) }

      return NextResponse.json({
        sessionId,
        archetype: parsed.archetype,
        archetypeDescription: parsed.archetypeDescription,
        insights: parsed.insights,
        compatibilityScore,
        debugInfo
      })

    } else {
      const premiumPrompt = `You are a master astrologer providing a comprehensive synastry reading. Base your entire analysis STRICTLY on the data below — no assumptions.
${archetypeBlock}
CHART POSITIONS (sign, degree in sign, ecliptic longitude):
${chartSummary1}

${chartSummary2}

CONFIRMED DEGREE-BASED ASPECTS (within standard orbs only):
${aspectsSummary}

CRITICAL RULES — MUST FOLLOW:
1. ONLY reference aspects that appear in the CONFIRMED ASPECTS list above.
2. Do NOT infer aspects from signs alone. Two planets in the same sign are NOT conjunct unless confirmed with a tight orb.
3. When citing any aspect, include sign, degree, and orb.
4. If a planetary area has no confirmed aspect, note that instead of inventing one.
5. Score fields (0–100) should reflect actual aspect quality: tight harmonious = high, no aspect = 50, challenging = lower.

Archetype reference list:
${ARCHETYPE_LIST}

Provide a detailed JSON response with this EXACT structure (all fields required):
{
  "archetype": "${selectedArchetype}",
  "archetypeDescription": "One clear sentence explaining why this archetype fits (max 25 words)",
  "insights": [
    "Cite confirmed aspect 1 with exact degrees and orb",
    "Cite confirmed aspect 2 with exact degrees and orb",
    "Cite confirmed aspect 3 or describe chart patterns"
  ],
  "overview": "3-4 sentence overview grounded in the confirmed aspects above",
  "sunCompatibility": { "aspect": "Confirmed Sun aspect or 'no major Sun aspect detected'", "description": "2-3 sentences", "score": 75 },
  "moonCompatibility": { "aspect": "Confirmed Moon aspect or 'no major Moon aspect detected'", "description": "2-3 sentences", "score": 82 },
  "venusCompatibility": { "aspect": "Confirmed Venus aspect or 'no major Venus aspect detected'", "description": "2-3 sentences", "score": 88 },
  "marsCompatibility": { "aspect": "Confirmed Mars aspect or 'no major Mars aspect detected'", "description": "2-3 sentences", "score": 71 },
  "communicationStyle": "2-3 sentences on Mercury aspects from the confirmed list",
  "emotionalDynamics": "2-3 sentences on Moon aspects from the confirmed list",
  "romanticPotential": "2-3 sentences on Venus/Mars aspects from the confirmed list",
  "growthOpportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "challenges": ["challenge 1", "challenge 2", "challenge 3"],
  "coreStrengths": ["strength 1", "strength 2", "strength 3", "strength 4"],
  "longTermPotential": "2-3 sentences grounded in chart data",
  "practicalAdvice": ["advice 1", "advice 2", "advice 3"]
}`

      const message = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: premiumPrompt }]
      })

      const content   = message.content[0].type === 'text' ? message.content[0].text : ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Invalid AI response')

      const parsed = JSON.parse(jsonMatch[0])
      parsed.archetype = selectedArchetype // enforce server selection

      try {
        const supabase = getServiceClient()
        await supabase.from('analyses').upsert({
          session_id: sessionId,
          person1_name: person1.name, person2_name: person2.name,
          person1_data: { ...person1, latitude: geo1.latitude, longitude: geo1.longitude },
          person2_data: { ...person2, latitude: geo2.latitude, longitude: geo2.longitude },
          free_analysis: { archetype: parsed.archetype, archetypeDescription: parsed.archetypeDescription,
                           insights: parsed.insights, compatibilityScore },
          full_analysis: parsed,
          payment_status: 'completed', tier: 'premium',
          updated_at: new Date().toISOString()
        }, { onConflict: 'session_id' })
      } catch (dbError) { console.error('DB error (non-fatal):', dbError) }

      return NextResponse.json({
        sessionId,
        archetype: parsed.archetype,
        archetypeDescription: parsed.archetypeDescription,
        insights: parsed.insights,
        compatibilityScore,
        debugInfo,
        fullAnalysis: {
          overview: parsed.overview,
          sunCompatibility: parsed.sunCompatibility, moonCompatibility: parsed.moonCompatibility,
          venusCompatibility: parsed.venusCompatibility, marsCompatibility: parsed.marsCompatibility,
          communicationStyle: parsed.communicationStyle, emotionalDynamics: parsed.emotionalDynamics,
          romanticPotential: parsed.romanticPotential, growthOpportunities: parsed.growthOpportunities,
          challenges: parsed.challenges, coreStrengths: parsed.coreStrengths,
          longTermPotential: parsed.longTermPotential, practicalAdvice: parsed.practicalAdvice
        }
      })
    }
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 })
  }
}
