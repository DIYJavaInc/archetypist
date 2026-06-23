import type { SynastryAspect, NatalChart } from '@/lib/astrology'

export type ArchetypeName =
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

export interface ScoringCtx {
  aspects: SynastryAspect[]
  chart1: NatalChart
  chart2: NatalChart
}

export interface ScoreResult {
  score: number
  breakdown: Record<string, number>
}

// Healthy → intense — used ONLY to break score ties
export const ARCHETYPE_HIERARCHY: ArchetypeName[] = [
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

export const SCORE_CAPS: Record<ArchetypeName, number> = {
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

export function has(aspects: SynastryAspect[], k1: string, k2: string, asp: string, maxOrb: number): boolean {
  return aspects.some(a =>
    ((a.planet1Key === k1 && a.planet2Key === k2) || (a.planet1Key === k2 && a.planet2Key === k1)) &&
    a.aspect === asp && a.orb <= maxOrb
  )
}

export function hasAny(aspects: SynastryAspect[], k1: string, k2: string, asps: string[], maxOrb: number): boolean {
  return asps.some(asp => has(aspects, k1, k2, asp, maxOrb))
}

export const HARMONY     = ['Conjunction', 'Trine', 'Sextile']
export const CHALLENGING = ['Square', 'Opposition']
export const SOFT        = ['Trine', 'Sextile']

// ── Sign / element helpers ────────────────────────────────────────────────────

export const EARTH_SIGNS = new Set(['Capricorn', 'Taurus', 'Virgo'])
export const WATER_SIGNS = new Set(['Cancer', 'Scorpio', 'Pisces'])
export const FIRE_SIGNS  = new Set(['Aries', 'Leo', 'Sagittarius'])
export const AIR_SIGNS   = new Set(['Gemini', 'Libra', 'Aquarius'])

export function element(sign: string): string {
  if (EARTH_SIGNS.has(sign)) return 'earth'
  if (WATER_SIGNS.has(sign)) return 'water'
  if (FIRE_SIGNS.has(sign))  return 'fire'
  return 'air'
}

// Earth↔Water and Fire↔Air are complementary (sextile-based resonance)
export function signCompat(s1: string, s2: string): 'same-sign' | 'same-element' | 'compatible' | 'neutral' {
  if (s1 === s2) return 'same-sign'
  const e1 = element(s1), e2 = element(s2)
  if (e1 === e2) return 'same-element'
  if ((e1 === 'earth' && e2 === 'water') || (e1 === 'water' && e2 === 'earth')) return 'compatible'
  if ((e1 === 'fire'  && e2 === 'air')   || (e1 === 'air'   && e2 === 'fire'))  return 'compatible'
  return 'neutral'
}

// Prevents outer-planet (Neptune, Pluto, North Node) stacking across personal planets.
export function bestAspect(
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

export function scoreHighestTimeline({ aspects: a, chart1, chart2 }: ScoringCtx): ScoreResult {
  let s = 0; const bd: Record<string, number> = {}
  const add = (lbl: string, pts: number) => { s += pts; bd[lbl] = pts }

  for (const p of ['sun', 'moon', 'venus'] as const) {
    if (has(a, 'northNode', p, 'Conjunction', 3))     add(`North Node-${p} conjunction`, 30)
    else if (hasAny(a, 'northNode', p, SOFT, 6))      add(`North Node-${p} trine/sextile`, 20)
  }
  const jup = bestAspect(a, 'jupiter', ['sun', 'moon', 'venus'], 3, 6, 25, 18)
  if (jup.pts) add(jup.label, jup.pts)
  if (has(a, 'moon', 'moon', 'Conjunction', 6))       add('Moon-Moon conjunction', 22)
  else if (has(a, 'moon', 'moon', 'Trine', 6))        add('Moon-Moon trine', 22)
  else if (has(a, 'moon', 'moon', 'Sextile', 6))      add('Moon-Moon sextile', 16)
  if (hasAny(a, 'venus', 'sun', HARMONY, 3))          add('Venus-Sun harmony (tight)', 20)
  else if (hasAny(a, 'venus', 'sun', HARMONY, 6))     add('Venus-Sun harmony', 12)
  if (has(a, 'mercury', 'mercury', 'Conjunction', 3)) add('Mercury-Mercury conjunction', 15)
  else if (hasAny(a, 'mercury', 'mercury', SOFT, 6))  add('Mercury-Mercury soft', 10)
  const sc = signCompat(chart1.sun.sign, chart2.sun.sign)
  if (sc === 'same-sign')         add(`Both Sun in ${chart1.sun.sign}`, 18)
  else if (sc === 'same-element') add('Sun signs same element', 10)
  else if (sc === 'compatible')   add('Sun signs compatible elements', 6)
  if (hasAny(a, 'pluto', 'mars', CHALLENGING, 3)) add('Pluto-Mars challenge (danger)', -25)
  if (hasAny(a, 'mars', 'mars', CHALLENGING, 3))  add('Mars-Mars challenge', -15)

  return { score: Math.max(0, s), breakdown: bd }
}

export function scoreLifeBuilder({ aspects: a, chart1, chart2 }: ScoringCtx): ScoreResult {
  let s = 0; const bd: Record<string, number> = {}
  const add = (lbl: string, pts: number) => { s += pts; bd[lbl] = pts }

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

  const capPlanets = [chart1.sun.sign, chart2.sun.sign, chart1.venus.sign, chart2.venus.sign,
                      chart1.moon.sign, chart2.moon.sign].filter(s => s === 'Capricorn').length
  if (capPlanets >= 4) add('Very heavy Capricorn emphasis (4+ placements)', 25)
  else if (capPlanets === 3) add('Heavy Capricorn emphasis (3 placements)', 18)
  else if (capPlanets === 2) add('Capricorn emphasis (2 placements)', 10)

  if (has(a, 'saturn', 'saturn', 'Conjunction', 6)) add('Saturn-Saturn conjunction', 30)

  for (const p of ['venus', 'moon', 'sun'] as const) {
    if (has(a, 'saturn', p, 'Conjunction', 3))       add(`Saturn-${p} conjunction (tight ≤3°)`, 22)
    else if (has(a, 'saturn', p, 'Conjunction', 6))  add(`Saturn-${p} conjunction (≤6°)`, 15)
    else if (hasAny(a, 'saturn', p, SOFT, 6))        add(`Saturn-${p} trine/sextile`, 12)
  }
  if (has(a, 'venus', 'venus', 'Conjunction', 3))      add('Venus-Venus conjunction (tight)', 28)
  else if (has(a, 'venus', 'venus', 'Conjunction', 6)) add('Venus-Venus conjunction', 20)
  else if (hasAny(a, 'venus', 'venus', SOFT, 6))       add('Venus-Venus trine/sextile', 14)
  if (has(a, 'moon', 'moon', 'Conjunction', 6))        add('Moon-Moon conjunction', 18)
  else if (hasAny(a, 'moon', 'moon', SOFT, 6))         add('Moon-Moon trine/sextile', 15)
  if (has(a, 'mercury', 'mercury', 'Conjunction', 3))  add('Mercury-Mercury conjunction', 15)
  else if (hasAny(a, 'mercury', 'mercury', SOFT, 6))   add('Mercury-Mercury soft', 10)
  if (hasAny(a, 'jupiter', 'saturn', HARMONY, 6))      add('Jupiter-Saturn harmony', 10)

  return { score: Math.max(0, s), breakdown: bd }
}

export function scoreSafeLove({ aspects: a, chart1, chart2 }: ScoringCtx): ScoreResult {
  let s = 0; const bd: Record<string, number> = {}
  const add = (lbl: string, pts: number) => { s += pts; bd[lbl] = pts }

  if (has(a, 'venus', 'venus', 'Conjunction', 3))      add('Venus-Venus conjunction (tight)', 28)
  else if (has(a, 'venus', 'venus', 'Conjunction', 6)) add('Venus-Venus conjunction', 20)
  else if (hasAny(a, 'venus', 'venus', SOFT, 6))       add('Venus-Venus soft', 16)
  for (const p of ['sun', 'moon'] as const) {
    if (hasAny(a, 'venus', p, HARMONY, 3))  add(`Venus-${p} harmony (tight)`, 22)
    else if (hasAny(a, 'venus', p, SOFT, 6)) add(`Venus-${p} trine/sextile`, 15)
  }
  if (hasAny(a, 'saturn', 'venus', SOFT, 6))              add('Saturn-Venus trine/sextile', 20)
  else if (has(a, 'saturn', 'venus', 'Conjunction', 6))   add('Saturn-Venus conjunction', 16)
  if (has(a, 'mercury', 'mercury', 'Conjunction', 3))     add('Mercury-Mercury conjunction', 15)
  else if (hasAny(a, 'mercury', 'mercury', SOFT, 6))      add('Mercury-Mercury soft', 10)
  if (hasAny(a, 'moon', 'moon', HARMONY, 6))              add('Moon-Moon harmony', 15)
  const vc = signCompat(chart1.venus.sign, chart2.venus.sign)
  if (vc === 'same-sign')         add(`Both Venus in ${chart1.venus.sign}`, 18)
  else if (vc === 'same-element') add('Venus signs same element', 10)
  if (hasAny(a, 'pluto', 'mars', CHALLENGING, 3))   add('Pluto-Mars challenge', -20)
  if (hasAny(a, 'pluto', 'moon', CHALLENGING, 3))   add('Pluto-Moon challenge', -15)
  if (hasAny(a, 'saturn', 'moon', CHALLENGING, 3))  add('Saturn-Moon challenge', -10)

  return { score: Math.max(0, s), breakdown: bd }
}

export function scorePowerCouple({ aspects: a }: ScoringCtx): ScoreResult {
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

export function scoreHealingPartner({ aspects: a }: ScoringCtx): ScoreResult {
  let s = 0; const bd: Record<string, number> = {}
  const add = (lbl: string, pts: number) => { s += pts; bd[lbl] = pts }

  const nep = bestAspect(a, 'neptune', ['moon', 'venus', 'sun'], 3, 5, 25, 16)
  if (nep.pts) add(nep.label, nep.pts)
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

export function scoreSpiritualCatalyst({ aspects: a }: ScoringCtx): ScoreResult {
  let s = 0; const bd: Record<string, number> = {}
  const add = (lbl: string, pts: number) => { s += pts; bd[lbl] = pts }

  const nep = bestAspect(a, 'neptune', ['sun', 'moon', 'venus', 'mercury'], 3, 4, 25, 15)
  if (nep.pts) add(nep.label, nep.pts)
  const node = bestAspect(a, 'northNode', ['sun', 'moon', 'mercury'], 3, 4, 20, 12)
  if (node.pts) add(node.label, node.pts)
  if (has(a, 'jupiter', 'neptune', 'Conjunction', 6))  add('Jupiter-Neptune conjunction', 25)
  else if (hasAny(a, 'jupiter', 'neptune', SOFT, 6))   add('Jupiter-Neptune trine/sextile', 18)
  const pluto = bestAspect(a, 'pluto', ['sun', 'moon'], 3, 5, 0, 15)
  if (pluto.pts) add(pluto.label.replace('conjunction', 'trine/sextile'), pluto.pts)
  if (hasAny(a, 'mercury', 'mercury', HARMONY, 6)) add('Mercury-Mercury harmony', 10)
  if (hasAny(a, 'neptune', 'mercury', CHALLENGING, 3)) add('Neptune-Mercury challenge (confusion)', -15)
  if (hasAny(a, 'pluto', 'mercury', CHALLENGING, 3))   add('Pluto-Mercury challenge', -10)

  return { score: Math.max(0, s), breakdown: bd }
}

export function countTwinFlameIndicators(a: SynastryAspect[]): number {
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

export function scoreTwinFlame({ aspects: a }: ScoringCtx): ScoreResult {
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

export function scoreAddictiveChemistry({ aspects: a }: ScoringCtx): ScoreResult {
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

export function scoreKarmic({ aspects: a }: ScoringCtx): ScoreResult {
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

export function scoreIntenseTemporary({ aspects: a }: ScoringCtx): ScoreResult {
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

export function scoreAllArchetypes(ctx: ScoringCtx): Record<ArchetypeName, ScoreResult> {
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

export function selectArchetype(scores: Record<ArchetypeName, ScoreResult>): {
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
