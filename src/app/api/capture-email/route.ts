import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

/*
  Run this SQL in your Supabase dashboard (SQL Editor) to create the table:

  create table if not exists public.emails (
    id          uuid primary key default gen_random_uuid(),
    email       text unique not null,
    created_at  timestamptz not null default now()
  );

  -- Optional: enable RLS and allow server-side inserts via service role
  alter table public.emails enable row level security;
*/

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const normalized = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalized)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const supabase = getServiceClient()

    const { error } = await supabase
      .from('emails')
      .insert({ email: normalized })

    if (error) {
      // Unique violation (code 23505) means email already exists — treat as success
      if (error.code === '23505') {
        return NextResponse.json({ success: true, existing: true })
      }
      console.error('[capture-email] insert error:', error)
      return NextResponse.json({ error: 'Failed to save email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, existing: false })
  } catch (err) {
    console.error('[capture-email] unexpected error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
