import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('No autorizado', { status: 401 })

  const [studentsResult, wcstResult, fivePointsResult, af5Result, connersResult] = await Promise.all([
    supabase.from('consentimientos').select('id_consentimiento, nombre_estudiante, grado_estudiante, grupo_estudiante'),
    supabase.from('resultados_wcst').select('*').order('fecha_evaluacion', { ascending: false }),
    supabase.from('resultados_cinco_puntos').select('*').order('fecha_evaluacion', { ascending: false }),
    supabase.from('resultados_af5').select('*').order('fecha_evaluacion', { ascending: false }),
    supabase.from('resultados_conners_docente').select('*').order('fecha_evaluacion', { ascending: false }),
  ])

  const results = [studentsResult, wcstResult, fivePointsResult, af5Result, connersResult]
  const failedResult = results.find(result => result.error)
  if (failedResult?.error) {
    return Response.json(
      { error: `No fue posible generar el Excel: ${failedResult.error.message}` },
      { status: 500 },
    )
  }

  const students = studentsResult.data
  const wcst = wcstResult.data
  const fivePoints = fivePointsResult.data
  const af5 = af5Result.data
  const conners = connersResult.data

  const studentsById = new Map((students || []).map(student => [student.id_consentimiento, student]))
  const studentFields = (id: string) => {
    const student = studentsById.get(id)
    return { Estudiante: student?.nombre_estudiante ?? 'Sin estudiante', Grado: student?.grado_estudiante ?? '', Grupo: student?.grupo_estudiante ?? '' }
  }
  const records = (values: any[] | null) => values || []
  const workbook = XLSX.utils.book_new()
  const addSheet = (name: string, rows: any[]) => XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), name)

  const wcstRows = records(wcst).map(record => {
    const trials = Array.isArray(record.historial) ? record.historial : []
    return { ...studentFields(record.id_consentimiento), Fecha: record.fecha_evaluacion, Categorias: record.categorias_completadas, Aciertos: record.total_aciertos, Errores_perseverativos: record.errores_perseverativos, Errores_no_perseverativos: record.errores_no_perseverativos, Fallos_mantenimiento: record.fallos_al_mantener, ...Object.fromEntries(Array.from({ length: 64 }, (_, index) => [`Ensayo_${index + 1}`, trials[index] ? (trials[index].correcto ? 'Acierto' : trials[index].esPersonerativo ? 'Error perseverativo' : 'Error') : ''])) }
  })
  const fivePointRows = records(fivePoints).map(record => {
    const evaluation = Array.isArray(record.evaluacion) ? record.evaluacion : []
    return { ...studentFields(record.id_consentimiento), Fecha: record.fecha_evaluacion, Figuras_completadas: record.figuras_completadas, Tiempo_segundos: record.tiempo_segundos, Comprendio_instruccion: record.comprendio_instruccion, Repitio_instruccion: record.repitio_instruccion, Dibujos_unicos: evaluation.filter((value: string) => value === 'unico').length, Dibujos_repetidos: evaluation.filter((value: string) => value === 'repetido').length, Violaciones_regla: evaluation.filter((value: string) => value === 'infraccion').length, ...Object.fromEntries(Array.from({ length: 30 }, (_, index) => [`Figura_${index + 1}_clasificacion`, evaluation[index] ?? ''])) }
  })
  const af5Rows = records(af5).map(record => {
    const answers = record.respuestas || {}
    return { ...studentFields(record.id_consentimiento), Fecha: record.fecha_evaluacion, Academico_laboral: record.academico_laboral, Social: record.social, Emocional: record.emocional, Familiar: record.familiar, Fisico: record.fisico, ...Object.fromEntries(Array.from({ length: 30 }, (_, index) => [`Item_${index + 1}`, answers[index + 1] ?? ''])) }
  })
  const connersRows = records(conners).map(record => {
    const answers = record.respuestas || {}
    return { ...studentFields(record.id_consentimiento), Fecha: record.fecha_evaluacion, Docente: record.nombre_docente, Curso: record.curso_observado, Total: record.total, Observaciones: record.observaciones, ...Object.fromEntries(Array.from({ length: 10 }, (_, index) => [`Item_${index + 1}`, answers[index + 1] ?? ''])) }
  })
  const summaryRows = [...wcstRows.map(row => ({ ...row, Prueba: 'Wisconsin' })), ...fivePointRows.map(row => ({ ...row, Prueba: 'Cinco puntos' })), ...af5Rows.map(row => ({ ...row, Prueba: 'AF5' })), ...connersRows.map(row => ({ ...row, Prueba: 'Conners docente' }))]

  addSheet('Resumen', summaryRows)
  addSheet('Wisconsin', wcstRows)
  addSheet('Cinco puntos', fivePointRows)
  addSheet('AF5', af5Rows)
  addSheet('Conners docente', connersRows)

  const bytes = new Uint8Array(XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }))
  return new Response(bytes, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="Resultados_evaluaciones.xlsx"', 'Cache-Control': 'no-store' } })
}
