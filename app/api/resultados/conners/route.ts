import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body.docente !== 'string' || !body.docente.trim() || !body.respuestas || typeof body.respuestas !== 'object') {
    return Response.json({ success: false, error: 'Los datos de la valoración docente no son válidos.' }, { status: 400 })
  }
  const respuestas = body.respuestas as Record<string, unknown>
  if (Object.keys(respuestas).length !== 10 || !Object.values(respuestas).every(value => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 3)) {
    return Response.json({ success: false, error: 'Valora las 10 conductas con un valor entre 0 y 3.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ success: false, error: 'Tu sesión terminó. Inicia sesión nuevamente.' }, { status: 401 })
  const studentId = cookies().get('active_student_id')?.value
  if (!studentId) return Response.json({ success: false, error: 'Selecciona un estudiante antes de guardar la valoración.' }, { status: 400 })

  const respuestasNumericas = respuestas as Record<string, number>
  const total = Object.values(respuestasNumericas).reduce((sum, value) => sum + value, 0)
  const { data, error } = await supabase.from('resultados_conners_docente').insert({
    id_usuario: user.id, id_consentimiento: studentId, nombre_docente: body.docente.trim(),
    curso_observado: typeof body.curso === 'string' && body.curso.trim() ? body.curso.trim() : null,
    respuestas: respuestasNumericas, total, observaciones: typeof body.observaciones === 'string' && body.observaciones.trim() ? body.observaciones.trim() : null,
  }).select('id_resultado').single()
  if (error) return Response.json({ success: false, error: `No se pudo guardar el registro docente: ${error.message}` }, { status: 500 })
  return Response.json({ success: true, idResultado: data.id_resultado })
}
