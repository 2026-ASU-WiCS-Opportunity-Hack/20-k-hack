import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('client_id')
  if (!clientId) return NextResponse.json({ error: 'No client_id' }, { status: 400 })

  const { data, error } = await supabase.storage
    .from('client-documents')
    .list(clientId, { sortBy: { column: 'created_at', order: 'desc' } })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function DELETE(req: Request) {
  const { clientId, fileName } = await req.json()
  const { error } = await supabase.storage
    .from('client-documents')
    .remove([`${clientId}/${fileName}`])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}