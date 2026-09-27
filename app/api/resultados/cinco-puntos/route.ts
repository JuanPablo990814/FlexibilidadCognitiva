import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body || !Array.isArray(body.designs) || typeof body.elapsedSeconds !== 'number') {
    return Response.json({ success: false, error: 'Los datos del test de cinco puntos no son válidos.' }, { status: 400 })
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ success: false, error: 'Tu sesión terminó. Inicia sesión nuevamente.' }, { status: 401 })
  const studentId = cookies().get('active_student_id')?.value
  if (!studentId) return Response.json({ success: false, error: 'Selecciona un estudiante antes de guardar el resultado.' }, { status: 400 })
  const { data, error } = await supabase.from('resultados_cinco_puntos').insert({
    id_usuario: user.id, id_consentimiento: studentId, total_casillas: 30,
    figuras_completadas: body.designs.length, tiempo_segundos: Math.max(0, Math.round(body.elapsedSeconds)),
    comprendio_instruccion: typeof body.comprendioInstruccion === 'boolean' ? body.comprendioInstruccion : null,
    repitio_instruccion: typeof body.repitioInstruccion === 'boolean' ? body.repitioInstruccion : null,
    disenos: body.designs, evaluacion: body.designs.map(() => 'pendiente'),
  }).select('id_resultado').single()
  if (error) return Response.json({ success: false, error: `No fue posible guardar el resultado: ${error.message}` }, { status: 500 })
  return Response.json({ success: true, idResultado: data.id_resultado })
}
