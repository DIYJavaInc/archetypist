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
    {
      headers: {
        'User-Agent': 'Archetypist/1.0 (healthfulbee@gmail.com)'
      }
    }
  )

  if (!response.ok) {
    throw new Error('Geocoding failed')
  }

  const data = await response.json()
  if (!data || data.length === 0) {
    throw new Error(`Location not found: ${location}`)
  }

  const result = data[0]
  const lat = parseFloat(result.lat)
  const lon = parseFloat(result.lon)

  // Get timezone from coordinates
  const tzResponse = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
    {
      headers: {
        'User-Agent': 'Archetypist/1.0 (healthfulbee@gmail.com)'
      }
    }
  )

  return {
    latitude: lat,
    longitude: lon,
    timezone: 'UTC', // Default; real implementation would use timezone API
    displayName: result.display_name
  }
}

export async function getNatalChart(birthData: BirthData): Promise<NatalChart> {
  const apiKey = process.env.ASTROLOGY_API_KEY!
  const { date, time = '12:00', latitude, longitude, timezone = 'UTC' } = birthData

  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)

  try {
    // Try the AstroAPI endpoint
    const response = await fetch('https://json.astrologyapi.com/v1/planets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`
      },
      body: JSON.stringify({
        day,
        month,
        year,
        hour,
        min: minute,
        lat: latitude,
        lon: longitude,
        tzone: getTimezoneOffset(timezone),
        house_system: 'whole_sign'
      })
    })

    if (response.ok) {
      const data = await response.json()
      return mapApiResponseToChart(data)
    }
  } catch {
    // Fall through to calculation
  }

  // Fallback: astronomical calculation
  return calculateChartFallback(year, month, day, hour, minute, latitude, longitude)
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

function mapApiResponseToChart(data: Record<string, { name: string; sign: string; fullDegree: number; isRetro: string }>): NatalChart {
  const findPlanet = (name: string): PlanetPosition => {
    const planet = Object.values(data).find((p) => p.name?.toLowerCase() === name.toLowerCase())
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

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
]

function calculateChartFallback(
  year: number, month: number, day: number,
  hour: number, minute: number,
  latitude: number, longitude: number
): NatalChart {
  // Simplified astronomical calculations using mean orbital elements
  const jd = julianDay(year, month, day, hour + minute / 60)
  const T = (jd - 2451545.0) / 36525 // Julian centuries from J2000.0

  const sunLon = (280.46646 + 36000.76983 * T) % 360
  const moonLon = (218.3165 + 481267.8813 * T) % 360
  const mercuryLon = (252.2509 + 149472.6746 * T) % 360
  const venusLon = (181.9798 + 58517.8157 * T) % 360
  const marsLon = (355.4330 + 19140.2993 * T) % 360
  const jupiterLon = (34.3515 + 3034.9057 * T) % 360
  const saturnLon = (50.0774 + 1222.1138 * T) % 360

  const toLonPosition = (lon: number, name: string): PlanetPosition => {
    const normalizedLon = ((lon % 360) + 360) % 360
    const signIndex = Math.floor(normalizedLon / 30)
    return {
      name,
      sign: ZODIAC_SIGNS[signIndex],
      degree: normalizedLon % 30,
      retrograde: false
    }
  }

  return {
    sun: toLonPosition(sunLon, 'Sun'),
    moon: toLonPosition(moonLon, 'Moon'),
    mercury: toLonPosition(mercuryLon, 'Mercury'),
    venus: toLonPosition(venusLon, 'Venus'),
    mars: toLonPosition(marsLon, 'Mars'),
    jupiter: toLonPosition(jupiterLon, 'Jupiter'),
    saturn: toLonPosition(saturnLon, 'Saturn'),
  }
}

function julianDay(year: number, month: number, day: number, hour: number): number {
  if (month <= 2) {
    year -= 1
    month += 12
  }
  const A = Math.floor(year / 100)
  const B = 2 - A + Math.floor(A / 4)
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + hour / 24 + B - 1524.5
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
          aspects.push({
            planet1: name1,
            planet2: name2,
            aspect: aspectType.name,
            orb,
            nature: aspectType.nature
          })
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
