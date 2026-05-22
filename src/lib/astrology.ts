export interface BirthData {
  date: string
  time?: string
  latitude: number
  longitude: number
  timezone?: string
}

export interface PlanetPosition {
  name: string
  sign: string
  degree: number
  retrograde?: boolean
}

export interface NatalChart {
  sun: PlanetPosition
  moon: PlanetPosition
  mercury: PlanetPosition
  venus: PlanetPosition
  mars: PlanetPosition
  jupiter: PlanetPosition
  saturn: PlanetPosition
  ascendant?: PlanetPosition
}

export interface SynastryAspect {
  planet1: string
  planet2: string
  aspect: string
  orb: number
  nature: 'harmonious' | 'challenging' | 'neutral'
}

export interface GeocodingResult {
  latitude: number
  longitude: number
  timezone: string
  displayName: string
}

export async function geocodeLocation(location: string): Promise<GeocodingResult> {
  const encoded = encodeURIComponent(location)
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
    { headers: { 'User-Agent': 'Archetypist/1.0 (healthfulbee@gmail.com)' } }
  )

  if (!response.ok) throw new Error('Geocoding failed')

  const data = await response.json()
  if (!data || data.length === 0) throw new Error(`Location not found: ${location}`)

  const result = data[0]
  return {
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
    timezone: 'UTC',
    displayName: result.display_name
  }
}

export async function getNatalChart(birthData: BirthData): Promise<NatalChart> {
  const apiKey = process.env.ASTROLOGY_API_KEY!
  const { date, time = '12:00', latitude, longitude, timezone = 'UTC' } = birthData

  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = (time || '12:00').split(':').map(Number)

  const requestBody = {
    day,
    month,
    year,
    hour: isNaN(hour) ? 12 : hour,
    min: isNaN(minute) ? 0 : minute,
    lat: latitude,
    lon: longitude,
    tzone: getTimezoneOffset(timezone),
    house_system: 'whole_sign'
  }

  console.log('[astrology] getNatalChart request:', JSON.stringify(requestBody))

  try {
    const response = await fetch('https://json.astrologyapi.com/v1/planets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`
      },
      body: JSON.stringify(requestBody)
    })

    console.log('[astrology] API status:', response.status)

    if (response.ok) {
      const data = await response.json()
      console.log('[astrology] API response:', JSON.stringify(data))
      return mapApiResponseToChart(data)
    } else {
      const errText = await response.text()
      console.warn('[astrology] API error body:', errText)
    }
  } catch (err) {
    console.warn('[astrology] API fetch failed, using fallback:', err)
  }

  // Fallback: accurate geocentric calculation via Keplerian orbital mechanics
  const chart = calculateChartAccurate(year, month, day,
    isNaN(hour) ? 12 : hour,
    isNaN(minute) ? 0 : minute
  )
  console.log('[astrology] fallback chart:', JSON.stringify(chart))
  return chart
}

function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date()
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
    return (tzDate.getTime() - utcDate.getTime()) / 3600000
  } catch {
    return 0
  }
}

function mapApiResponseToChart(
  data: Record<string, { name: string; sign: string; fullDegree: number; isRetro: string }>
): NatalChart {
  const findPlanet = (name: string): PlanetPosition => {
    const planet = Object.values(data).find(
      p => typeof p === 'object' && p.name?.toLowerCase() === name.toLowerCase()
    )
    if (!planet) return { name, sign: 'Aries', degree: 0 }
    return {
      name: planet.name,
      sign: planet.sign,
      degree: planet.fullDegree % 30,
      retrograde: planet.isRetro === 'true'
    }
  }

  return {
    sun: findPlanet('Sun'),
    moon: findPlanet('Moon'),
    mercury: findPlanet('Mercury'),
    venus: findPlanet('Venus'),
    mars: findPlanet('Mars'),
    jupiter: findPlanet('Jupiter'),
    saturn: findPlanet('Saturn'),
  }
}

// ---------------------------------------------------------------------------
// Accurate geocentric planetary positions using Paul Schlyter's algorithm
// (https://paulschlyter.com/planets/)
// Accuracy: ~1° for inner planets, <0.5° for outer planets
// ---------------------------------------------------------------------------

const D2R = Math.PI / 180

function rev(x: number): number {
  return ((x % 360) + 360) % 360
}

/** Iterative solution to Kepler's equation M = E - e·sin(E) */
function solveKepler(M_deg: number, e: number): number {
  let E = M_deg + e * (180 / Math.PI) * Math.sin(M_deg * D2R) * (1 + e * Math.cos(M_deg * D2R))
  for (let i = 0; i < 15; i++) {
    const dE = (M_deg - E + e * (180 / Math.PI) * Math.sin(E * D2R)) / (1 - e * Math.cos(E * D2R))
    E += dE
    if (Math.abs(dE) < 1e-6) break
  }
  return E
}

interface Helio {
  x: number  // heliocentric ecliptic X (AU)
  y: number  // heliocentric ecliptic Y (AU)
}

/** Heliocentric ecliptic XY for a planet given its orbital elements */
function helioXY(N: number, i: number, w: number, a: number, e: number, M: number): Helio {
  const E = solveKepler(M, e)
  const xv = a * (Math.cos(E * D2R) - e)
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(E * D2R)
  const v = rev(Math.atan2(yv, xv) / D2R)
  const r = Math.sqrt(xv * xv + yv * yv)
  const vw = v + w
  // Project into ecliptic plane (ignoring Z / latitude for sign accuracy)
  const x = r * (Math.cos(N * D2R) * Math.cos(vw * D2R) - Math.sin(N * D2R) * Math.sin(vw * D2R) * Math.cos(i * D2R))
  const y = r * (Math.sin(N * D2R) * Math.cos(vw * D2R) + Math.cos(N * D2R) * Math.sin(vw * D2R) * Math.cos(i * D2R))
  return { x, y }
}

/** Sun's geocentric ecliptic XY and longitude (= Earth's heliocentric, negated) */
function sunGeo(d: number): Helio & { lon: number } {
  const w = rev(282.9404 + 4.70935e-5 * d)
  const e = 0.016709 - 1.151e-9 * d
  const M = rev(356.0470 + 0.9856002585 * d)
  const E = solveKepler(M, e)
  const xv = Math.cos(E * D2R) - e
  const yv = Math.sqrt(1 - e * e) * Math.sin(E * D2R)
  const v = rev(Math.atan2(yv, xv) / D2R)
  const r = Math.sqrt(xv * xv + yv * yv)
  const lon = rev(v + w)
  return { x: r * Math.cos(lon * D2R), y: r * Math.sin(lon * D2R), lon }
}

/** Moon's geocentric ecliptic longitude (simplified, accurate ~1°) */
function moonGeoLon(d: number, sunLon: number): number {
  const N = rev(125.1228 - 0.0529538083 * d)
  const i = 5.1454
  const w = rev(318.0634 + 0.1643573223 * d)
  const a = 60.2666  // Earth radii
  const e = 0.054900
  const M = rev(115.3654 + 13.0649929509 * d)

  const E = solveKepler(M, e)
  const xv = a * (Math.cos(E * D2R) - e)
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(E * D2R)
  const v = rev(Math.atan2(yv, xv) / D2R)
  const r = Math.sqrt(xv * xv + yv * yv)
  const vw = v + w
  const xg = r * (Math.cos(N * D2R) * Math.cos(vw * D2R) - Math.sin(N * D2R) * Math.sin(vw * D2R) * Math.cos(i * D2R))
  const yg = r * (Math.sin(N * D2R) * Math.cos(vw * D2R) + Math.cos(N * D2R) * Math.sin(vw * D2R) * Math.cos(i * D2R))
  let lon = rev(Math.atan2(yg, xg) / D2R)

  // Main perturbation corrections
  const Ls = rev(356.0470 + 0.9856002585 * d + (282.9404 + 4.70935e-5 * d))  // Sun mean longitude
  const Ms = rev(356.0470 + 0.9856002585 * d)  // Sun mean anomaly
  const Mm = M                                   // Moon mean anomaly
  const D_  = rev(lon - sunLon)                  // Moon's mean elongation
  const F  = rev(lon - N)                        // Moon's argument of latitude

  lon += -1.274 * Math.sin((Mm - 2 * D_) * D2R)
       + 0.658 * Math.sin(2 * D_ * D2R)
       - 0.186 * Math.sin(Ms * D2R)
       - 0.059 * Math.sin((2 * Mm - 2 * D_) * D2R)
       - 0.057 * Math.sin((Mm - 2 * D_ + Ms) * D2R)
       + 0.053 * Math.sin((Mm + 2 * D_) * D2R)
       + 0.046 * Math.sin((2 * D_ - Ms) * D2R)
       + 0.041 * Math.sin((Mm - Ms) * D2R)
       - 0.035 * Math.sin(D_ * D2R)
       - 0.031 * Math.sin((Mm + Ms) * D2R)
       - 0.015 * Math.sin((2 * F - 2 * D_) * D2R)
       + 0.011 * Math.sin((Mm - 4 * D_) * D2R)

  return rev(lon)
}

/** Geocentric ecliptic longitude of a planet given its heliocentric XY and the Sun's geocentric XY */
function toGeocentric(helio: Helio, sun: Helio): number {
  // geocentric = heliocentric_planet - heliocentric_earth
  // heliocentric_earth = -geocentric_sun = -(sun.x, sun.y)
  // so: geocentric_planet = heliocentric_planet + geocentric_sun
  return rev(Math.atan2(helio.y + sun.y, helio.x + sun.x) / D2R)
}

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
]

function lonToPosition(lon: number, name: string): PlanetPosition {
  const normalized = ((lon % 360) + 360) % 360
  const signIndex = Math.floor(normalized / 30)
  return {
    name,
    sign: ZODIAC_SIGNS[Math.min(signIndex, 11)],
    degree: normalized % 30,
    retrograde: false
  }
}

function julianDay(year: number, month: number, day: number, hour: number): number {
  let y = year, m = month
  if (m <= 2) { y -= 1; m += 12 }
  const A = Math.floor(y / 100)
  const B = 2 - A + Math.floor(A / 4)
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + hour / 24 + B - 1524.5
}

function calculateChartAccurate(
  year: number, month: number, day: number, hour: number, minute: number
): NatalChart {
  const jd = julianDay(year, month, day, hour + minute / 60)
  const d = jd - 2451543.5  // Days since 1999 Dec 31.0 UT (Paul Schlyter's epoch)

  const sun = sunGeo(d)
  const moonLon = moonGeoLon(d, sun.lon)

  // Planetary orbital elements (N, i, w, a, e, M) at day d
  const mercuryLon = toGeocentric(helioXY(
    rev(48.3313 + 3.24587e-5 * d),
    7.0047 + 5.0e-8 * d,
    rev(29.1241 + 1.01444e-5 * d),
    0.387098,
    0.205635 + 5.59e-10 * d,
    rev(168.6562 + 4.0923344368 * d)
  ), sun)

  const venusLon = toGeocentric(helioXY(
    rev(76.6799 + 2.46590e-5 * d),
    3.3946 + 2.75e-8 * d,
    rev(54.8910 + 1.38374e-5 * d),
    0.723330,
    0.006773 - 1.302e-9 * d,
    rev(48.0052 + 1.6021302244 * d)
  ), sun)

  const marsLon = toGeocentric(helioXY(
    rev(49.5574 + 2.11081e-5 * d),
    1.8497 - 1.78e-8 * d,
    rev(286.5016 + 2.92961e-5 * d),
    1.523688,
    0.093405 + 2.516e-9 * d,
    rev(18.6021 + 0.5240207766 * d)
  ), sun)

  const jupiterLon = toGeocentric(helioXY(
    rev(100.4542 + 2.76854e-5 * d),
    1.3030 - 1.557e-7 * d,
    rev(273.8777 + 1.64505e-5 * d),
    5.20256,
    0.048498 + 4.469e-9 * d,
    rev(19.8950 + 0.0830853001 * d)
  ), sun)

  const saturnLon = toGeocentric(helioXY(
    rev(113.6634 + 2.38980e-5 * d),
    2.4886 - 1.081e-7 * d,
    rev(339.3939 + 2.97661e-5 * d),
    9.55475,
    0.055546 - 9.499e-9 * d,
    rev(316.9670 + 0.0334442282 * d)
  ), sun)

  return {
    sun: lonToPosition(sun.lon, 'Sun'),
    moon: lonToPosition(moonLon, 'Moon'),
    mercury: lonToPosition(mercuryLon, 'Mercury'),
    venus: lonToPosition(venusLon, 'Venus'),
    mars: lonToPosition(marsLon, 'Mars'),
    jupiter: lonToPosition(jupiterLon, 'Jupiter'),
    saturn: lonToPosition(saturnLon, 'Saturn'),
  }
}

export function calculateSynastryAspects(chart1: NatalChart, chart2: NatalChart): SynastryAspect[] {
  const aspects: SynastryAspect[] = []
  const planets1 = Object.entries(chart1) as [string, PlanetPosition][]
  const planets2 = Object.entries(chart2) as [string, PlanetPosition][]

  const ASPECT_TYPES = [
    { name: 'Conjunction', angle: 0, orb: 8, nature: 'neutral' as const },
    { name: 'Sextile', angle: 60, orb: 6, nature: 'harmonious' as const },
    { name: 'Square', angle: 90, orb: 8, nature: 'challenging' as const },
    { name: 'Trine', angle: 120, orb: 8, nature: 'harmonious' as const },
    { name: 'Opposition', angle: 180, orb: 8, nature: 'challenging' as const },
  ]

  for (const [name1, planet1] of planets1) {
    for (const [name2, planet2] of planets2) {
      const lon1 = ZODIAC_SIGNS.indexOf(planet1.sign) * 30 + planet1.degree
      const lon2 = ZODIAC_SIGNS.indexOf(planet2.sign) * 30 + planet2.degree
      let diff = Math.abs(lon1 - lon2)
      if (diff > 180) diff = 360 - diff

      for (const aspectType of ASPECT_TYPES) {
        const orb = Math.abs(diff - aspectType.angle)
        if (orb <= aspectType.orb) {
          aspects.push({ planet1: name1, planet2: name2, aspect: aspectType.name, orb, nature: aspectType.nature })
        }
      }
    }
  }

  return aspects
}

export function formatChartForPrompt(name: string, chart: NatalChart): string {
  const planets = [
    `Sun in ${chart.sun.sign} (${chart.sun.degree.toFixed(1)}°)`,
    `Moon in ${chart.moon.sign} (${chart.moon.degree.toFixed(1)}°)`,
    `Mercury in ${chart.mercury.sign} (${chart.mercury.degree.toFixed(1)}°)`,
    `Venus in ${chart.venus.sign} (${chart.venus.degree.toFixed(1)}°)`,
    `Mars in ${chart.mars.sign} (${chart.mars.degree.toFixed(1)}°)`,
    `Jupiter in ${chart.jupiter.sign} (${chart.jupiter.degree.toFixed(1)}°)`,
    `Saturn in ${chart.saturn.sign} (${chart.saturn.degree.toFixed(1)}°)`,
  ]
  return `${name}:\n${planets.join('\n')}`
}

export function formatAspectsForPrompt(aspects: SynastryAspect[], name1: string, name2: string): string {
  return aspects
    .slice(0, 15)
    .map(a => `${name1}'s ${a.planet1} ${a.aspect} ${name2}'s ${a.planet2} (orb: ${a.orb.toFixed(1)}°) - ${a.nature}`)
    .join('\n')
}
