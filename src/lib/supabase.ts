import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function getServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceKey)
}

export interface Analysis {
  id?: string
  session_id: string
  person1_name: string
  person2_name: string
  person1_data: PersonData
  person2_data: PersonData
  free_analysis: FreeAnalysis
  full_analysis?: FullAnalysis
  payment_status: 'pending' | 'completed'
  tier: 'free' | 'onetime' | 'monthly'
  stripe_session_id?: string
  created_at?: string
}

export interface PersonData {
  name: string
  date: string
  time?: string
  location: string
  latitude?: number
  longitude?: number
}

export interface FreeAnalysis {
  archetype: string
  archetypeDescription: string
  insights: string[]
  compatibilityScore: number
}

export interface FullAnalysis {
  overview: string
  sunCompatibility: AspectAnalysis
  moonCompatibility: AspectAnalysis
  venusCompatibility: AspectAnalysis
  marsCompatibility: AspectAnalysis
  communicationStyle: string
  emotionalDynamics: string
  romanticPotential: string
  growthOpportunities: string[]
  challenges: string[]
  coreStrengths: string[]
  longTermPotential: string
  practicalAdvice: string[]
}

export interface AspectAnalysis {
  aspect: string
  description: string
  score: number
}
