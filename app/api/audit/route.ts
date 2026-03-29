import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 이상 감지 임계값 (데모용: 6개/2분)
const ALERT_THRESHOLD = 6
const ALERT_WINDOW_MS = 2 * 60 * 1000

export async function POST(req: NextRequest) {
  const { user_email, action, record_id, details } = await req.json()

  // 1. Audit log 기록
  await supabase.from('audit_logs').insert([{
    user_email,
    action,
    record_id,
    details
  }])

  // 2. 이상 감지 — 최근 2분 내 접근 횟수 체크
  const windowStart = new Date(Date.now() - ALERT_WINDOW_MS).toISOString()
  const { count } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_email', user_email)
    .gte('created_at', windowStart)

  if (count && count >= ALERT_THRESHOLD) {
    // 중복 알림 방지 — 최근 2분 내 같은 유저 알림이 없을 때만
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

export async function GET() {
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