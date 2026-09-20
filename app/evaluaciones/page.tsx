import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const runtime = 'edge'

export default async function EvaluacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const studentId = cookies().get('active_student_id')?.value
  if (!studentId) redirect('/')
  const { data: estudiante } = await supabase
    .from('consentimientos')
    .select('nombre_estudiante')
    .eq('id_consentimiento', studentId)
    .single()
  const [{ data: wcstResults }, { data: fivePointResults }, { data: af5Results }, { data: connersResults }] = await Promise.all([
    supabase.from('resultados_wcst').select('id_resultado, fecha_evaluacion').eq('id_consentimiento', studentId).order('fecha_evaluacion', { ascending: false }).limit(1),
    supabase.from('resultados_cinco_puntos').select('id_resultado, fecha_evaluacion').eq('id_consentimiento', studentId).order('fecha_evaluacion', { ascending: false }).limit(1),
    supabase.from('resultados_af5').select('id_resultado, fecha_evaluacion').eq('id_consentimiento', studentId).order('fecha_evaluacion', { ascending: false }).limit(1),
    supabase.from('resultados_conners_docente').select('id_resultado, fecha_evaluacion').eq('id_consentimiento', studentId).order('fecha_evaluacion', { ascending: false }).limit(1),
  ])
  const wcstDone = Boolean(wcstResults?.[0])
  const fivePointsDone = Boolean(fivePointResults?.[0])
  const af5Done = Boolean(af5Results?.[0])
  const connersDone = Boolean(connersResults?.[0])

  return (
    <main className="site-shell">
      <section className="site-hero px-6 pt-7 pb-20">
        <div className="max-w-5xl mx-auto">
          <header className="site-nav"><div className="brand-lockup"><span className="brand-dot" />Flexibilidad Cognitiva</div><Link href="/" className="nav-pill bg-white/70">Cambiar estudiante</Link></header>
          <div className="mt-20 max-w-3xl"><div className="active-student"><span className="active-student__label">Estudiante activo</span><strong className="active-student__name">{estudiante?.nombre_estudiante ?? 'Seleccionado'}</strong></div><h1 className="display-title display-title--small">Elige una<br />prueba.</h1><p className="site-copy max-w-md mt-6 text-lg">Selecciona una actividad para el niño o una valoración exclusiva para el docente. Cada resultado se guarda para revisión posterior.</p></div>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 -mt-10 relative z-10"><div className="grid md:grid-cols-2 gap-5">
        <div className="site-card min-h-64 flex flex-col"><div className="flex justify-between items-start"><span className="text-4xl">🃏</span>{wcstDone && <span className="test-complete">✓ Realizado</span>}</div><p className="site-eyebrow mt-7">Clasificación</p><h2 className="text-3xl font-medium tracking-tight mt-2">Wisconsin</h2><p className="site-copy mt-3">Clasifica cartas y descubre la regla.</p><div className="mt-auto flex flex-wrap gap-2"><Link href="/wcst" className="site-button">{wcstDone ? 'Realizar reintento' : 'Comenzar'} <span>→</span></Link>{wcstDone && <Link href="/resultados/wcst" className="site-button site-button--light">Ver resultados</Link>}</div></div>
        <div className="site-card min-h-64 flex flex-col" style={{ background: '#f0eef9' }}><div className="flex justify-between items-start"><span className="text-4xl">✏️</span>{fivePointsDone && <span className="test-complete">✓ Realizado</span>}</div><p className="site-eyebrow mt-7">Fluidez figural</p><h2 className="text-3xl font-medium tracking-tight mt-2">Los cinco puntos</h2><p className="site-copy mt-3">Crea figuras diferentes uniendo puntos.</p><div className="mt-auto flex flex-wrap gap-2"><Link href="/cinco-puntos" className="site-button">{fivePointsDone ? 'Realizar reintento' : 'Comenzar'} <span>→</span></Link>{fivePointsDone && <Link href="/resultados/cinco-puntos" className="site-button site-button--light">Ver resultados</Link>}</div></div>
        <div className="site-card min-h-64 flex flex-col" style={{ background: '#f7eee5' }}><div className="flex justify-between items-start"><span className="text-4xl">💬</span>{af5Done && <span className="test-complete">✓ Realizado</span>}</div><p className="site-eyebrow mt-7">Autoconcepto</p><h2 className="text-3xl font-medium tracking-tight mt-2">AF5</h2><p className="site-copy mt-3">Responde cómo te ves en diferentes situaciones.</p><div className="mt-auto flex flex-wrap gap-2"><Link href="/af5" className="site-button">{af5Done ? 'Realizar reintento' : 'Comenzar'} <span>→</span></Link>{af5Done && <Link href="/resultados/af5" className="site-button site-button--light">Ver resultados</Link>}</div></div>
        <div className="site-card min-h-64 flex flex-col" style={{ background: '#e8f1eb' }}><div className="flex justify-between items-start"><span className="text-4xl">🧑‍🏫</span>{connersDone && <span className="test-complete">✓ Realizado</span>}</div><p className="site-eyebrow mt-7">Valoración docente</p><h2 className="text-3xl font-medium tracking-tight mt-2">Conners abreviado</h2><p className="site-copy mt-3">El profesor registra conductas observadas en el aula.</p><div className="mt-auto flex flex-wrap gap-2"><Link href="/conners" className="site-button">{connersDone ? 'Nuevo registro' : 'Responder como docente'} <span>→</span></Link>{connersDone && <Link href="/resultados/conners" className="site-button site-button--light">Ver resultados</Link>}</div></div>
      </div></section>
    </main>
  )
}
