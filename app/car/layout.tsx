import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const runtime = 'edge'

export default async function CarLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { cookies } = await import('next/headers')
  const activeStudentId = cookies().get('active_student_id')?.value

  if (!activeStudentId) {
    redirect('/')
  }

  return children
}
