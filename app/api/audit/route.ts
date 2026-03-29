import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALERT_THRESHOLD = 6
const ALERT_WINDOW_MS = 2 * 60 * 1000

export async function POST(req: NextRequest) {
  const { user_email, action, record_id, details } = await req.json()

  await supabase.from('audit_logs').insert([{ user_email, action, record_id, details }])

  const windowStart = new Date(Date.now() - ALERT_WINDOW_MS).toISOString()
  const { count } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_email', user_email)
    .gte('created_at', windowStart)

  if (count && count >= ALERT_THRESHOLD) {
    const { data: existingAlert } = await supabase
      .from('alerts')
      .select('id')
      .eq('user_email', user_email)
      .gte('created_at', windowStart)
      .single()

    if (!existingAlert) {
      await supabase.from('alerts').insert([{
        user_email,
        message: `⚠️ Unusual activity: ${user_email} accessed ${count} records in 2 minutes`
      }])
    }
  }

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const userEmail = req.headers.get('x-user-email')
  if (!userEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('email', userEmail)
    .single()

  if (!roleData || roleData.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('is_read', false)
    .order('created_at', { ascending: false })

  return NextResponse.json({ logs, alerts })
}