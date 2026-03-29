import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data } = await supabase.auth.exchangeCodeForSession(code)

    if (!data.session) {
      return NextResponse.redirect(`${origin}/welcome`)  // ← 변경
    }

    const email = data.session.user.email

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: roleData } = await adminSupabase
      .from('user_roles')
      .select('role')
      .eq('email', email)
      .single()

    if (!roleData || roleData.role === 'staff') {
      return NextResponse.redirect(`${origin}/welcome`)  // ← 변경
    }

    return NextResponse.redirect(`${origin}/welcome`)    // ← 변경 (admin도 welcome으로)
  }

  return NextResponse.redirect(`${origin}/welcome`)      // ← 변경
}