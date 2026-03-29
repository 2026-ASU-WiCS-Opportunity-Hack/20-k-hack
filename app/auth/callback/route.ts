import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

    if (!session) {
      return NextResponse.redirect(`${origin}/login?error=no_session`)
    }

    const email = session.user.email

    // Rolec checking in user_roles table
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('email', email)
      .single()

    if (!roleData) {
      // unauthorized users → no longer access
      return NextResponse.redirect(`${origin}/unauthorized`)
    }

    // Redicrect by roles(staff/admin)
    if (roleData.role === 'admin') {
      return NextResponse.redirect(`${origin}/dashboard`)
    } else {
      return NextResponse.redirect(`${origin}/clients`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}