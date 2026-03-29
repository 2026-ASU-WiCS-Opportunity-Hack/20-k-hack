import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getUserRole(email: string): Promise<string | null> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('email', email)
    .single()
  return data?.role ?? null
}