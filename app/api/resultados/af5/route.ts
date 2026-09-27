import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const respuestas = body?.respuestas
  const dimensiones = body?.dimensiones
  if (!respuestas || typeof respuestas !== 'object' || Object.keys(respuestas).length !== 30 || !dimensiones || typeof dimensiones !== 'object') {
    return Response.json({ success: false, error: 'Completa las 30 respuestas del cuestionario AF5.' }, { status: 400 })
  }
  if (!Object.values(respuestas).every(value => typeof value === 'number' && value >= 1 && value <= 99)) {
    return Response.json({ success: false, error: 'Las respuestas AF5 deben estar entre 1 y 99.' }, { status: 400 })
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ success: false, error: 'Tu sesión terminó. Inicia sesión nuevamente.' }, { status: 401 })
  const studentId = cookies().get('active_student_id')?.value
  if (!studentId) return Response.json({ success: false, error: 'Selecciona un estudiante antes de guardar el cuestionario.' }, { status: 400 })
  const scores = dimensiones as Record<string, number>
  const { data, error } = await supabase.from('resultados_af5').insert({
    id_usuario: user.id, id_consentimiento: studentId, respuestas,
    academico_laboral: scores.academico, social: scores.social, emocional: scores.emocional,
    familiar: scores.familiar, fisico: scores.fisico,
  }).select('id_resultado').single()
  if (error) return Response.json({ success: false, error: `No se pudo guardar el cuestionario AF5: ${error.message}` }, { status: 500 })
  return Response.json({ success: true, idResultado: data.id_resultado })
}
