import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Papa from 'papaparse'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const text = await file.text()
  const { data: rows, errors } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_')
  })

  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0].message }, { status: 400 })
  }

  const invalid = rows.filter(r => !r.name?.trim())
  if (invalid.length > 0) {
    return NextResponse.json({ error: `${invalid.length} rows missing name` }, { status: 400 })
  }

  const mapped = rows.map(r => ({
    name: r.name.trim(),
    date_of_birth: r.date_of_birth || null,
    phone: r.phone || null,
    email: r.email || null,
    household_size: parseInt(r.household_size) || null,
    language: r.language || 'English',
    notes: r.notes || null,
  }))

  const { error } = await supabase.from('clients').insert(mapped)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ imported: mapped.length }, { status: 201 })
}