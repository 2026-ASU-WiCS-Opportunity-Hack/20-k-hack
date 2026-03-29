import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: Request) {
  const { question } = await req.json()
  if (!question) return NextResponse.json({ error: 'No question' }, { status: 400 })

  // Supabase 데이터 가져오기
  const [{ data: clients }, { data: services }, { data: followUps }] = await Promise.all([
    supabase.from('clients').select('id, name, phone, email, language, household_size, is_active, notes'),
    supabase.from('service_entries').select('client_id, service_type, service_date, notes, clients(name)'),
    supabase.from('follow_ups').select('client_id, note, category, due_date, is_done, clients(name)'),
  ])

  const context = `
You are a helpful assistant for a nonprofit case management platform called SafeCase.
You have access to the following data:

CLIENTS (${clients?.length ?? 0} total):
${JSON.stringify(clients, null, 2)}

SERVICE ENTRIES (${services?.length ?? 0} total):
${JSON.stringify(services, null, 2)}

FOLLOW-UPS (${followUps?.length ?? 0} total):
${JSON.stringify(followUps, null, 2)}

Answer the staff member's question based on this data. Be concise and helpful.
Never make up data that isn't in the database. If you can't find the answer, say so.
`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `${context}\n\nQuestion: ${question}`
      }
    ]
  })

  const text = message.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')

  return NextResponse.json({ answer: text })
}