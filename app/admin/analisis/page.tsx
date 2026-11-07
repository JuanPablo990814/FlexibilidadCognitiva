import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/authUtils'
import { loadAnalysis } from '@/lib/analysis-server'
import AnalysisDashboard from '@/components/AnalysisDashboard'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export default async function AnalysisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  if (!isAdmin(user.email)) redirect('/')
  let data
  try { data = await loadAnalysis(supabase) } catch {
    return <main className="site-shell px-6 py-16"><div className="site-card max-w-xl mx-auto"><h1 className="text-2xl font-semibold">No se pudo cargar el análisis</h1><p className="site-copy my-4">Comprueba la conexión y los permisos de lectura de las seis tablas. No se muestran resúmenes parciales.</p><Link href="/admin" className="site-button">Volver al panel</Link></div></main>
  }
  return <main className="site-shell"><section className="site-hero px-6 py-8"><div className="max-w-7xl mx-auto"><header className="site-nav"><div className="brand-lockup"><span className="brand-dot" />Panel investigador</div><Link href="/admin" className="nav-pill bg-white/70">Volver al seguimiento</Link></header><div className="my-12"><p className="site-eyebrow">Resultados de la investigación</p><h1 className="display-title display-title--small mt-4">Análisis de evaluaciones</h1><p className="site-copy text-lg mt-5 max-w-3xl">Resultados individuales, comparación entre grupos y revisión de la calidad de los registros.</p></div></div></section><AnalysisDashboard data={data} /></main>
}
