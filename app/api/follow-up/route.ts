import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function POST(req: NextRequest) {
  const { notes, client_id } = await req.json()

  if (!notes || !client_id) {
    return NextResponse.json({ error: 'Missing notes or client_id' }, { status: 400 })
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `You are a case management assistant. Analyze this case note and extract any follow-up actions needed.

Case note: "${notes}"

Return ONLY a JSON array like this (no other text):
[
  {
    "note": "brief description of follow-up needed",
    "category": "Food Security | Mental Health | Housing | Medical | Other",
    "due_days": 7
  }
]

If no follow-ups needed, return empty array: []`
    }]
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]'
  
  let followUps = []
  try {
    followUps = JSON.parse(text)
  } catch {
    followUps = []
  }

  // save on Supabase
  if (followUps.length > 0) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const rows = followUps.map((f: { note: string; category: string; due_days: number }) => ({
      client_id,
      note: f.note,
      category: f.category,
      due_date: new Date(Date.now() + f.due_days * 86400000).toISOString(),
      is_done: false
    }))

    await supabase.from('follow_ups').insert(rows)
  }

  return NextResponse.json({ followUps })
}