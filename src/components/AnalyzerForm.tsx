'use client'

import { useState } from 'react'
import { User, Calendar, Clock, MapPin, Loader2, Stars } from 'lucide-react'
import type { PersonData } from '@/lib/supabase'

interface AnalyzerFormProps {
  onAnalyze: (person1: PersonData, person2: PersonData) => void
  isLoading: boolean
}

interface PersonFormProps {
  person: PersonData
  setPerson: (p: PersonData) => void
  label: string
  color: 'purple' | 'pink'
}

// Defined outside AnalyzerForm so React doesn't remount inputs on every keystroke
function PersonForm({ person, setPerson, label, color }: PersonFormProps) {
  const borderColor = color === 'purple' ? 'border-purple-600/50' : 'border-pink-600/50'
  const textColor = color === 'purple' ? 'text-purple-400' : 'text-pink-400'
  const focusColor = color === 'purple' ? 'focus:border-purple-500' : 'focus:border-pink-500'

  return (
    <div className={`glass-card rounded-2xl p-6 border ${borderColor}`}>
      <h3 className={`font-semibold text-lg mb-5 ${textColor}`}>{label}</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Name *
            </span>
          </label>
          <input
            type="text"
            value={person.name}
            onChange={e => setPerson({ ...person, name: e.target.value })}
            placeholder="Full name or nickname"
            autoComplete="off"
            className={`w-full bg-slate-800 border border-slate-700 ${focusColor} focus:outline-none rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors`}
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Birth Date *
            </span>
          </label>
          <input
            type="date"
            value={person.date}
            onChange={e => setPerson({ ...person, date: e.target.value })}
            className={`w-full bg-slate-800 border border-slate-700 ${focusColor} focus:outline-none rounded-lg px-4 py-3 text-sm text-white transition-colors [color-scheme:dark]`}
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Birth Time
              <span className="text-slate-600 text-xs ml-1">(optional)</span>
            </span>
          </label>
          <input
            type="time"
            value={person.time}
            onChange={e => setPerson({ ...person, time: e.target.value })}
            className={`w-full bg-slate-800 border border-slate-700 ${focusColor} focus:outline-none rounded-lg px-4 py-3 text-sm text-white transition-colors [color-scheme:dark]`}
          />
          <p className="text-slate-600 text-xs mt-1">Improves accuracy for Moon &amp; Ascendant</p>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Birth Location *
            </span>
          </label>
          <input
            type="text"
            value={person.location}
            onChange={e => setPerson({ ...person, location: e.target.value })}
            placeholder="City, Country (e.g. Paris, France)"
            autoComplete="off"
            className={`w-full bg-slate-800 border border-slate-700 ${focusColor} focus:outline-none rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors`}
          />
        </div>
      </div>
    </div>
  )
}

export default function AnalyzerForm({ onAnalyze, isLoading }: AnalyzerFormProps) {
  const [person1, setPerson1] = useState<PersonData>({ name: '', date: '', time: '', location: '' })
  const [person2, setPerson2] = useState<PersonData>({ name: '', date: '', time: '', location: '' })
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: string[] = []

    if (!person1.name.trim()) errs.push('Person 1 name is required')
    if (!person1.date) errs.push('Person 1 birth date is required')
    if (!person1.location.trim()) errs.push('Person 1 birth location is required')
    if (!person2.name.trim()) errs.push('Person 2 name is required')
    if (!person2.date) errs.push('Person 2 birth date is required')
    if (!person2.location.trim()) errs.push('Person 2 birth location is required')

    if (errs.length > 0) {
      setErrors(errs)
      return
    }

    console.log('[form] submitting person1:', JSON.stringify(person1))
    console.log('[form] submitting person2:', JSON.stringify(person2))
    setErrors([])
    onAnalyze(person1, person2)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <PersonForm person={person1} setPerson={setPerson1} label="You" color="purple" />
        <PersonForm person={person2} setPerson={setPerson2} label="Partner" color="pink" />
      </div>

      {errors.length > 0 && (
        <div className="mb-6 bg-red-900/20 border border-red-700/50 rounded-xl px-5 py-4">
          <ul className="space-y-1">
            {errors.map(err => (
              <li key={err} className="text-red-400 text-sm">{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-center">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-4 rounded-full text-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all glow-purple"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing the cosmos...
            </>
          ) : (
            <>
              <Stars className="w-5 h-5" />
              Reveal Your Synastry
            </>
          )}
        </button>
        <p className="text-slate-500 text-sm mt-3">Free preview &middot; Takes 10&ndash;20 seconds</p>
      </div>
    </form>
  )
}
