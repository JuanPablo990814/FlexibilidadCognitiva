'use server'

import { createClient } from '@/lib/supabase/server'

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

  if (!user) throw new Error('Usuario no autenticado')

  const payload = {
    id_usuario: user.id,
    total_ensayos: metricas.totalEnsayos,
    total_aciertos: metricas.totalAciertos,
    total_errores: metricas.totalErrores,
    categorias_completadas: metricas.categoriasCompletadas,
    errores_perseverativos: metricas.erroresPersonerativos,
    errores_no_perseverativos: metricas.erroresNoPersonerativos,
    fallos_al_mantener: metricas.fallosAlMantener,
    ensayos_hasta_1ra_categoria: metricas.ensayosHasta1raCategoria
  }

  const { error } = await supabase.from('resultados_wcst').insert([payload])

  if (error) {
    console.error('Error guardando resultado WCST:', error)
    return { success: false, error: 'Ocurrió un error guardando el test en la nube. Intente de nuevo.' }
  }

  return { success: true }
}
