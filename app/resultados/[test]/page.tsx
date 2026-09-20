import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'

export const runtime = 'edge'

export default async function ResultadosPage({ params }: { params: { test: string } }) {
  if (!['wcst', 'cinco-puntos', 'af5', 'conners'].includes(params.test)) notFound()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const studentId = cookies().get('active_student_id')?.value
  if (!studentId) redirect('/')
  const [{ data: student }, { data: result }] = await Promise.all([
    supabase.from('consentimientos').select('nombre_estudiante').eq('id_consentimiento', studentId).single(),
    (params.test === 'wcst' ? supabase.from('resultados_wcst').select('*') : params.test === 'af5' ? supabase.from('resultados_af5').select('*') : params.test === 'conners' ? supabase.from('resultados_conners_docente').select('*') : supabase.from('resultados_cinco_puntos').select('*'))
      .eq('id_consentimiento', studentId).order('fecha_evaluacion', { ascending: false }).limit(1).maybeSingle(),
  ])
  if (!result) redirect('/evaluaciones')
  const fivePoints = params.test === 'cinco-puntos'
  const af5 = params.test === 'af5'
  const conners = params.test === 'conners'
  const evaluation = fivePoints && Array.isArray(result.evaluacion) ? result.evaluacion : []
  const unique = evaluation.filter((value: string) => value === 'unico').length
  const repeated = evaluation.filter((value: string) => value === 'repetido').length
  const infractions = evaluation.filter((value: string) => value === 'infraccion').length

  return <main className="site-shell"><section className="site-hero px-6 py-7"><div className="max-w-4xl mx-auto"><header className="site-nav"><div className="brand-lockup"><span className="brand-dot" />Flexibilidad Cognitiva</div><Link href="/evaluaciones" className="nav-pill bg-white/70">Volver a pruebas</Link></header><div className="mt-16"><div className="active-student"><span className="active-student__label">Resultados de</span><strong className="active-student__name">{student?.nombre_estudiante ?? 'Estudiante'}</strong></div><h1 className="display-title display-title--small">{fivePoints ? 'Los cinco puntos.' : af5 ? 'Autoconcepto AF5.' : conners ? 'Conners docente.' : 'Wisconsin.'}</h1></div></div></section><section className="max-w-4xl mx-auto px-6 -mt-8 relative z-10"><div className="site-card grid grid-cols-1 sm:grid-cols-3 gap-4">
    {af5 ? <><Metric label="Académico/laboral" value={String(result.academico_laboral)} /><Metric label="Social" value={String(result.social)} /><Metric label="Emocional" value={String(result.emocional)} /><Metric label="Familiar" value={String(result.familiar)} /><Metric label="Físico" value={String(result.fisico)} /></> : conners ? <><Metric label="Índice total" value={`${result.total}/30`} /><Metric label="Docente" value={result.nombre_docente} /><Metric label="Curso" value={result.curso_observado || 'Sin registrar'} /></> : fivePoints ? <><Metric label="Dibujos totales" value={`${result.figuras_completadas}/30`} /><Metric label="Dibujos únicos" value={String(unique)} /><Metric label="Dibujos repetidos" value={String(repeated)} /><Metric label="Violaciones de la regla" value={String(infractions)} /><Metric label="Tiempo utilizado" value={`${Math.floor(result.tiempo_segundos / 60)}:${String(result.tiempo_segundos % 60).padStart(2, '0')} min`} /><Metric label="Comprendió la instrucción" value={result.comprendio_instruccion == null ? 'Sin dato' : result.comprendio_instruccion ? 'Sí' : 'No'} /><Metric label="Repitió instrucciones" value={result.repitio_instruccion == null ? 'Sin dato' : result.repitio_instruccion ? 'Sí' : 'No'} /></> : <><Metric label="Categorías completadas" value={`${result.categorias_completadas}/6`} /><Metric label="Aciertos" value={`${result.total_aciertos}/${result.total_ensayos}`} /><Metric label="Errores perseverativos" value={String(result.errores_perseverativos)} /></>}
  </div>{conners && <p className="site-card mt-5 text-sm text-[#657078]">Este índice registra observaciones docentes y debe interpretarse junto con el contexto escolar y una valoración profesional; no constituye un diagnóstico.</p>}{af5 && <Af5DimensionGuide />}{fivePoints && evaluation.some((value: string) => value === 'pendiente') && <p className="site-card mt-5 text-sm text-[#657078]">El docente aún tiene figuras pendientes por clasificar. Los conteos se actualizarán cuando termine su revisión.</p>}</section></main>
}

function Metric({ label, value }: { label: string, value: string }) { return <div className="rounded-xl bg-[#f8f7f3] p-5"><p className="site-eyebrow">{label}</p><p className="text-4xl font-semibold tracking-tight mt-3">{value}</p></div> }

const AF5_DIMENSIONS = [
  ['Académico/laboral', 'Cómo se percibe como estudiante: capacidad, esfuerzo, inteligencia y desempeño escolar.'],
  ['Social', 'Cómo percibe sus relaciones con otras personas: amistad, comunicación y facilidad para hacer amigos.'],
  ['Emocional', 'Cómo percibe su estado y sus respuestas emocionales, como nerviosismo, miedo o sentirse alterado.'],
  ['Familiar', 'Cómo se percibe dentro de su familia: aceptación, confianza, apoyo e integración.'],
  ['Físico', 'Cómo percibe su cuerpo, apariencia y capacidades físicas, incluido el desempeño deportivo.'],
] as const

function Af5DimensionGuide() {
  return <section className="site-card mt-5">
    <p className="site-eyebrow">Guía de lectura</p>
    <h2 className="text-2xl font-semibold text-[#20232c] mt-2">¿Qué mide cada dimensión?</h2>
    <div className="grid sm:grid-cols-2 gap-4 mt-6">
      {AF5_DIMENSIONS.map(([name, description]) => <div key={name} className="rounded-xl bg-[#f8f7f3] p-4"><h3 className="font-semibold text-[#20232c]">{name}</h3><p className="text-sm leading-relaxed text-[#657078] mt-2">{description}</p></div>)}
    </div>
    <p className="text-xs leading-relaxed text-[#657078] mt-5">Los puntajes describen un perfil de autopercepción; su interpretación debe realizarla un profesional en el contexto de la evaluación.</p>
  </section>
}
