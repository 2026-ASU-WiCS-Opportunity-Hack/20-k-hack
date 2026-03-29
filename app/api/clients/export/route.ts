import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Papa from 'papaparse'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('clients')
    .select('name, date_of_birth, phone, email, household_size, language, notes')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const csv = Papa.unparse(data || [], {
    header: true,
    columns: ['name', 'date_of_birth', 'phone', 'email', 'household_size', 'language', 'notes']
  })

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="safecase_clients_${new Date().toISOString().slice(0, 10)}.csv"`
    }
  })
}