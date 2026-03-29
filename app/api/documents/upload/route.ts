import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const clientId = formData.get('client_id') as string

  if (!file || !clientId) return NextResponse.json({ error: 'Missing file or client_id' }, { status: 400 })

  const fileName = `${Date.now()}_${file.name}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error } = await supabase.storage
    .from('client-documents')
    .upload(`${clientId}/${fileName}`, buffer, { contentType: file.type })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, fileName }, { status: 201 })
}