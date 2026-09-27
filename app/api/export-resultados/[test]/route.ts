import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const sources = {
  wcst: ['resultados_wcst', 'Wisconsin'],
  'cinco-puntos': ['resultados_cinco_puntos', 'Cinco puntos'],
  af5: ['resultados_af5', 'Autoconcepto AF5'],
  conners: ['resultados_conners_docente', 'Conners docente'],
} as const

export async function GET(_: Request, { params }: { params: { test: string } }) {
  const source = sources[params.test as keyof typeof sources]
  if (!source) return Response.json({ error: 'Prueba no válida.' }, { status: 404 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'No autorizado.' }, { status: 401 })
  const studentId = cookies().get('active_student_id')?.value
  if (!studentId) return Response.json({ error: 'Selecciona un estudiante.' }, { status: 400 })
  const [{ data: student }, { data: record, error }] = await Promise.all([
    supabase.from('consentimientos').select('nombre_estudiante, grado_estudiante, grupo_estudiante').eq('id_consentimiento', studentId).single(),
    supabase.from(source[0]).select('*').eq('id_consentimiento', studentId).order('fecha_evaluacion', { ascending: false }).limit(1).maybeSingle(),
  ])
  if (error || !record) return Response.json({ error: 'No hay resultados disponibles para descargar.' }, { status: 404 })
  const row = { Estudiante: student?.nombre_estudiante ?? '', Grado: student?.grado_estudiante ?? '', Grupo: student?.grupo_estudiante ?? '', Fecha: record.fecha_evaluacion, ...record }
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([row]), source[1].slice(0, 31))
  const bytes = new Uint8Array(XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }))
  return new Response(bytes, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${source[1].replaceAll(' ', '_')}.xlsx"`, 'Cache-Control': 'no-store' } })
}
