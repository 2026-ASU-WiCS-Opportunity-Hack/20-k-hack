import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  const { quarter, year } = await req.json()

  // 분기 날짜 범위 계산
  const quarterMap: Record<string, { start: string; end: string }> = {
    Q1: { start: `${year}-01-01`, end: `${year}-03-31` },
    Q2: { start: `${year}-04-01`, end: `${year}-06-30` },
    Q3: { start: `${year}-07-01`, end: `${year}-09-30` },
    Q4: { start: `${year}-10-01`, end: `${year}-12-31` },
  }
  const { start, end } = quarterMap[quarter]

  // 데이터 가져오기
  const [{ data: clients }, { data: services }] = await Promise.all([
    supabase.from('clients').select('name, language, household_size, is_active, notes'),
    supabase.from('service_entries')
      .select('service_type, service_date, notes, clients(name)')
      .gte('service_date', start)
      .lte('service_date', end)
  ])

  const totalClients = clients?.length ?? 0
  const activeClients = clients?.filter(c => c.is_active).length ?? 0
  const totalServices = services?.length ?? 0

  const languageBreakdown = (clients || []).reduce((acc: Record<string, number>, c) => {
    if (c.language) acc[c.language] = (acc[c.language] || 0) + 1
    return acc
  }, {})

  const serviceTypeBreakdown = (services || []).reduce((acc: Record<string, number>, s) => {
    acc[s.service_type] = (acc[s.service_type] || 0) + 1
    return acc
  }, {})

  const totalHousehold = (clients || []).reduce((sum, c) => sum + (c.household_size || 0), 0)

  const prompt = `You are writing a professional funder report for a nonprofit case management organization called SafeCase.

Here is the data for ${quarter} ${year}:

CLIENTS:
- Total clients in system: ${totalClients}
- Active clients: ${activeClients}
- Total people served (household members): ${totalHousehold}
- Language breakdown: ${JSON.stringify(languageBreakdown)}

SERVICES (${quarter} ${year}):
- Total services delivered: ${totalServices}
- Service type breakdown: ${JSON.stringify(serviceTypeBreakdown)}

Write a professional 2-page funder report with the following sections:
1. Executive Summary (2-3 sentences)
2. Population Served (demographics, languages, household sizes)
3. Services Delivered This Quarter (types, numbers, impact)
4. Outcomes & Impact (what changed for clients)
5. Challenges & Next Steps

Use a warm, professional tone appropriate for grant reports. Be specific with numbers. Format with clear section headers using markdown.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }]
  })

  const report = message.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')

  return NextResponse.json({ report, quarter, year, totalClients, totalServices })
}