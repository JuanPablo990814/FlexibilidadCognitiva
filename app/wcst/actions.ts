'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

interface MetricasWCST {
  totalEnsayos: number
  totalAciertos: number
  totalErrores: number
  categoriasCompletadas: number
  erroresPersonerativos: number
  erroresNoPersonerativos: number
  fallosAlMantener: number
  ensayosHasta1raCategoria: number | null
}

export async function saveWcstResult(metricas: MetricasWCST) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Tu sesión terminó. Inicia sesión nuevamente.' }

  const activeStudentId = cookies().get('active_student_id')?.value
  if (!activeStudentId) return { success: false, error: 'Selecciona un estudiante antes de guardar el resultado.' }

  const payload = {
    id_usuario: user.id, // ID del profesor
    id_consentimiento: activeStudentId, // ID del alumno
    total_ensayos: metricas.totalEnsayos,
    total_aciertos: metricas.totalAciertos,
    total_errores: metricas.totalErrores,
    categorias_completadas: metricas.categoriasCompletadas,
    errores_perseverativos: metricas.erroresPersonerativos,
    errores_no_perseverativos: metricas.erroresNoPersonerativos,
    fallos_al_mantener: metricas.fallosAlMantener,
    ensayos_hasta_1ra_categoria: metricas.ensayosHasta1raCategoria,
    historial: (metricas as any).historial
  }

  const { data: savedResult, error } = await supabase.from('resultados_wcst').insert([payload]).select('id_resultado').single()

  if (error) {
    console.error('Error guardando resultado WCST:', error)
    return { success: false, error: `Ocurrió un error guardando el test en la nube: ${error.message}` }
  }

  return { success: true, idResultado: savedResult.id_resultado }
}
