import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ExportExcelButton from '@/components/ExportExcelButton'
import { isAdmin } from '@/lib/authUtils'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const studentKey = (student: any) => [student.nombre_estudiante, student.grado_estudiante, student.grupo_estudiante]
  .map(value => String(value ?? '').trim().toLocaleLowerCase()).join('|')

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  if (!isAdmin(user.email)) redirect('/')

  const [{ data: rawStudents }, { data: wcst }, { data: fivePoints }, { data: af5 }, { data: conners }] = await Promise.all([
    supabase.from('consentimientos').select('*'),
    supabase.from('resultados_wcst').select('*').order('fecha_evaluacion', { ascending: false }),
    supabase.from('resultados_cinco_puntos').select('*').order('fecha_evaluacion', { ascending: false }),
    supabase.from('resultados_af5').select('*').order('fecha_evaluacion', { ascending: false }),
    supabase.from('resultados_conners_docente').select('*').order('fecha_evaluacion', { ascending: false }),
  ])

  const students = (rawStudents || []).filter((student, index, list) => list.findIndex(candidate => studentKey(candidate) === studentKey(student)) === index)
  const latest = (records: any[] | null, id: string) => (records || []).find(record => record.id_consentimiento === id)
  const exportRows = students.map(student => {
    const wcstResult = latest(wcst, student.id_consentimiento)
    const five = latest(fivePoints, student.id_consentimiento)
    const af5Result = latest(af5, student.id_consentimiento)
    const connersResult = latest(conners, student.id_consentimiento)
    const evaluation = Array.isArray(five?.evaluacion) ? five.evaluacion : []
    const rawAf5 = af5Result?.respuestas || {}
    const rawConners = connersResult?.respuestas || {}
    const wcstTrials = Array.isArray(wcstResult?.historial) ? wcstResult.historial : []
    const base = {
      Estudiante: student.nombre_estudiante,
      Grado: student.grado_estudiante,
      Grupo: student.grupo_estudiante,
      WCST_fecha: wcstResult?.fecha_evaluacion ?? '',
      WCST_categorias: wcstResult?.categorias_completadas ?? '',
      WCST_aciertos: wcstResult?.total_aciertos ?? '',
      WCST_errores_perseverativos: wcstResult?.errores_perseverativos ?? '',
      WCST_errores_no_perseverativos: wcstResult?.errores_no_perseverativos ?? '',
      WCST_fallos_mantenimiento: wcstResult?.fallos_al_mantener ?? '',
      Cinco_puntos_fecha: five?.fecha_evaluacion ?? '',
      Cinco_puntos_figuras: five?.figuras_completadas ?? '',
      Cinco_puntos_tiempo_segundos: five?.tiempo_segundos ?? '',
      Cinco_puntos_unicas: five ? evaluation.filter((value: string) => value === 'unico').length : '',
      Cinco_puntos_repetidas: five ? evaluation.filter((value: string) => value === 'repetido').length : '',
      Cinco_puntos_infracciones: five ? evaluation.filter((value: string) => value === 'infraccion').length : '',
      AF5_fecha: af5Result?.fecha_evaluacion ?? '',
      AF5_academico_laboral: af5Result?.academico_laboral ?? '', AF5_social: af5Result?.social ?? '', AF5_emocional: af5Result?.emocional ?? '', AF5_familiar: af5Result?.familiar ?? '', AF5_fisico: af5Result?.fisico ?? '',
      Conners_fecha: connersResult?.fecha_evaluacion ?? '', Conners_docente: connersResult?.nombre_docente ?? '', Conners_curso: connersResult?.curso_observado ?? '', Conners_total: connersResult?.total ?? '', Conners_observaciones: connersResult?.observaciones ?? '',
    }
    const trialColumns = Object.fromEntries(Array.from({ length: 64 }, (_, index) => [`WCST_ensayo_${index + 1}`, wcstTrials[index] ? (wcstTrials[index].correcto ? 'Acierto' : wcstTrials[index].esPersonerativo ? 'Error perseverativo' : 'Error') : '']))
    const fivePointColumns = Object.fromEntries(Array.from({ length: 30 }, (_, index) => [`Cinco_puntos_figura_${index + 1}`, evaluation[index] ?? '']))
    const af5Columns = Object.fromEntries(Array.from({ length: 30 }, (_, index) => [`AF5_item_${index + 1}`, rawAf5[index + 1] ?? '']))
    const connersColumns = Object.fromEntries(Array.from({ length: 10 }, (_, index) => [`Conners_item_${index + 1}`, rawConners[index + 1] ?? '']))
    return { ...base, ...trialColumns, ...fivePointColumns, ...af5Columns, ...connersColumns }
  })

  return <main className="site-shell"><section className="site-hero px-6 pt-7 pb-24"><div className="max-w-7xl mx-auto"><header className="site-nav"><div className="brand-lockup"><span className="brand-dot" />Panel investigador</div><div className="nav-pills"><Link href="/" className="nav-pill">Cerrar panel</Link></div></header><div className="mt-16"><p className="site-eyebrow">Seguimiento de evaluaciones</p><h1 className="display-title display-title--small mt-3">Resultados que<br />sí se entienden.</h1><p className="site-copy text-lg max-w-2xl mt-6">Consulta el progreso de cada estudiante y las valoraciones realizadas por niños y docentes.</p></div></div></section>
    <section className="max-w-7xl mx-auto px-6 -mt-10 relative z-10 pb-12"><div className="grid grid-cols-2 lg:grid-cols-5 gap-4"><Kpi label="Estudiantes" value={students.length} detail="disponibles" /><Kpi label="Wisconsin" value={(wcst || []).length} detail="intentos registrados" /><Kpi label="Cinco puntos" value={(fivePoints || []).length} detail="ejecuciones registradas" /><Kpi label="AF5" value={(af5 || []).length} detail="cuestionarios registrados" /><Kpi label="Conners docente" value={(conners || []).length} detail="valoraciones registradas" /></div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-10 mb-5"><div><p className="site-eyebrow">Estudiantes</p><h2 className="text-3xl font-semibold tracking-tight mt-2">Panel de seguimiento</h2></div><ExportExcelButton data={exportRows} filename="Resultados_evaluaciones.xlsx" /></div>
      <div className="site-card !p-0 overflow-x-auto"><table className="w-full min-w-[920px] text-left"><thead className="bg-[#eef3f2] text-[#50686c] text-xs uppercase tracking-[.12em]"><tr><th className="px-6 py-4">Estudiante</th><th className="px-5 py-4 text-center">Wisconsin</th><th className="px-5 py-4 text-center">Cinco puntos</th><th className="px-5 py-4 text-center">AF5</th><th className="px-5 py-4 text-center">Conners docente</th><th className="px-5 py-4 text-center">Expediente</th></tr></thead><tbody className="divide-y divide-[#e1e5e4]">{students.map(student => { const wcstResult = latest(wcst, student.id_consentimiento); const five = latest(fivePoints, student.id_consentimiento); const af5Result = latest(af5, student.id_consentimiento); const connersResult = latest(conners, student.id_consentimiento); const unique = Array.isArray(five?.evaluacion) ? five.evaluacion.filter((value: string) => value === 'unico').length : null; const af5Mean = af5Result ? Math.round((Number(af5Result.academico_laboral) + Number(af5Result.social) + Number(af5Result.emocional) + Number(af5Result.familiar) + Number(af5Result.fisico)) / 5) : null; return <tr key={student.id_consentimiento} className="hover:bg-[#fafbf9]"><td className="px-6 py-5"><strong className="block text-[#20232c]">{student.nombre_estudiante}</strong><span className="text-xs text-[#657078]">Grado {student.grado_estudiante} · Grupo {student.grupo_estudiante}</span></td><td className="px-5 py-5 text-center"><Status value={wcstResult ? `${wcstResult.categorias_completadas}/6 categorías` : null} /></td><td className="px-5 py-5 text-center"><Status value={five ? `${unique ?? 0} únicas · ${five.figuras_completadas}/30` : null} /></td><td className="px-5 py-5 text-center"><Status value={af5Result ? `${af5Mean}/99 promedio` : null} /></td><td className="px-5 py-5 text-center"><Status value={connersResult ? `${connersResult.total}/30 · ${connersResult.nombre_docente}` : null} /></td><td className="px-5 py-5 text-center"><Link href={`/admin/${student.id_consentimiento}`} className="site-button site-button--light text-xs">Ver →</Link></td></tr> })}</tbody></table></div>
    </section></main>
}

function Kpi({ label, value, detail }: { label: string, value: number, detail: string }) { return <div className="site-card"><p className="site-eyebrow">{label}</p><p className="text-4xl font-semibold tracking-tight mt-3">{value}</p><p className="text-xs text-[#657078] mt-2">{detail}</p></div> }
function Status({ value }: { value: string | null }) { return value ? <span className="inline-flex rounded-full bg-[#e8f1eb] px-3 py-1.5 text-xs font-semibold text-[#265a3b]">{value}</span> : <span className="text-sm text-[#8a9497]">Pendiente</span> }
