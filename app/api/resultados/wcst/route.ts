import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const metricas = await request.json().catch(() => null)
  if (!metricas || !Number.isInteger(metricas.totalEnsayos) || !Array.isArray(metricas.historial)) {
    return Response.json({ success: false, error: 'Las métricas de Wisconsin no son válidas.' }, { status: 400 })
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ success: false, error: 'Tu sesión terminó. Inicia sesión nuevamente.' }, { status: 401 })
  const studentId = cookies().get('active_student_id')?.value
  if (!studentId) return Response.json({ success: false, error: 'Selecciona un estudiante antes de guardar el resultado.' }, { status: 400 })
  const { data, error } = await supabase.from('resultados_wcst').insert({
    id_usuario: user.id, id_consentimiento: studentId, total_ensayos: metricas.totalEnsayos,
    total_aciertos: metricas.totalAciertos, total_errores: metricas.totalErrores,
    categorias_completadas: metricas.categoriasCompletadas, errores_perseverativos: metricas.erroresPersonerativos,
    errores_no_perseverativos: metricas.erroresNoPersonerativos, fallos_al_mantener: metricas.fallosAlMantener,
    ensayos_hasta_1ra_categoria: metricas.ensayosHasta1raCategoria, historial: metricas.historial,
  }).select('id_resultado').single()
  if (error) return Response.json({ success: false, error: `Ocurrió un error guardando el test en la nube: ${error.message}` }, { status: 500 })
  return Response.json({ success: true, idResultado: data.id_resultado })
}
