import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const runtime = 'edge'

export default async function CarLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: consent } = await supabase
    .from('consentimientos')
    .select('id_consentimiento')
    .eq('id_usuario', user.id)
    .single()

  if (!consent) {
    redirect('/consentimiento')
  }

  return children
}
