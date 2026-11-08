import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/authUtils'
import { loadAnalysis } from '@/lib/analysis-server'
import { createAnalysisReport } from '@/lib/analysis-report'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) return new Response('No autorizado', { status: 401 })
  try {
    const bytes = await createAnalysisReport(await loadAnalysis(supabase))
    return new Response(new Uint8Array(bytes), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="Informe_flexibilidad_cognitiva.pdf"', 'Cache-Control': 'no-store' } })
  } catch { return new Response('No fue posible generar el informe. Revisa la conexión y vuelve a intentarlo.', { status: 500 }) }
}
