'use client'

import { useState } from 'react'
import { User, Calendar, Clock, MapPin, Loader2, Stars } from 'lucide-react'
import type { PersonData } from '@/lib/supabase'

interface AnalyzerFormProps {
  onAnalyze: (person1: PersonData, person2: PersonData) => void
  isLoading: boolean
}

const initialPerson = (): PersonData => ({
  name: '',
  date: '',
  time: '',
  location: ''
})

export default function AnalyzerForm({ onAnalyze, isLoading }: AnalyzerFormProps) {
  const [person1, setPerson1] = useState<PersonData>(initialPerson())
  const [person2, setPerson2] = useState<PersonData>(initialPerson())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!person1.name || !person1.date || !person1.location) {
      alert('Please fill in all required fields for Person 1')
      return
    }
    if (!person2.name || !person2.date || !person2.location) {
      alert('Please fill in all required fields for Person 2')
      return
    }

    onAnalyze(person1, person2)
  }

  const PersonForm = ({
    person,
    setPerson,
    label,
    color
  }: {
    person: PersonData
    setPerson: (p: PersonData) => void
    label: string
    color: 'purple' | 'pink'
  }) => {
    const borderColor = color === 'purple' ? 'border-purple-600/50' : 'border-pink-600/50'
    const textColor = color === 'purple' ? 'text-purple-400' : 'text-pink-400'
    const focusColor = color === 'purple' ? 'focus:border-purple-500' : 'focus:border-pink-500'

    return (
      <div className={`glass-card rounded-2xl p-6 border ${borderColor}`}>
        <h3 className={`font-semibold text-lg mb-5 ${textColor}`}>{label}</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Name *
            </label>
            <input
              type="text"
              value={person.name}
              onChange={e => setPerson({ ...person, name: e.target.value })}
              placeholder="Full name or nickname"
              className={`w-full bg-slate-800/60 border border-slate-700 ${focusColor} focus:outline-none rounded-lg px-4 py-2.5 text-sm placeholder-slate-500 transition-colors`}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Birth Date *
            </label>
            <input
              type="date"
              value={person.date}
              onChange={e => setPerson({ ...person, date: e.target.value })}
              className={`w-full bg-slate-800/60 border border-slate-700 ${focusColor} focus:outline-none rounded-lg px-4 py-2.5 text-sm transition-colors [color-scheme:dark]`}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Birth Time
              <span className="text-slate-600 text-xs">(optional)</span>
            </label>
            <input
              type="time"
              value={person.time}
              onChange={e => setPerson({ ...person, time: e.target.value })}
              className={`w-full bg-slate-800/60 border border-slate-700 ${focusColor} focus:outline-none rounded-lg px-4 py-2.5 text-sm transition-colors [color-scheme:dark]`}
            />
            <p className="text-slate-600 text-xs mt-1">Improves accuracy for Moon &amp; Ascendant</p>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Birth Location *
            </label>
            <input
              type="text"
              value={person.location}
              onChange={e => setPerson({ ...person, location: e.target.value })}
              placeholder="City, Country (e.g. Paris, France)"
              className={`w-full bg-slate-800/60 border border-slate-700 ${focusColor} focus:outline-none rounded-lg px-4 py-2.5 text-sm placeholder-slate-500 transition-colors`}
              required
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <PersonForm
          person={person1}
          setPerson={setPerson1}
          label="Person 1"
          color="purple"
        />
        <PersonForm
          person={person2}
          setPerson={setPerson2}
          label="Person 2"
          color="pink"
        />
      </div>

      <div className="text-center">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all glow-purple"
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
        <p className="text-slate-500 text-sm mt-3">Free preview · Takes 10-20 seconds</p>
      </div>
    </form>
  )
}
