'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteTestRecord(id_resultado: string, testType: 'CAR' | 'WCST' | 'CINCO_PUNTOS' | 'AF5') {
  const supabase = await createClient()

  // 1. Verificación en la nube (el backend verifica el JWT/RLS)
  const tabla = testType === 'CAR'
    ? 'resultados_autorregulacion'
    : testType === 'WCST'
      ? 'resultados_wcst'
      : testType === 'CINCO_PUNTOS'
        ? 'resultados_cinco_puntos'
        : 'resultados_af5'

  // 2. Ejecutar la desintegración
  const { error } = await supabase
    .from(tabla)
    .delete()
    .eq('id_resultado', id_resultado)

  if (error) {
    console.error('Error al borrar test:', error)
    return { success: false, error: 'Hubo un error de servidor o no tienes permisos.' }
  }

  // 3. Forzar refresco de Next.js para purgar caché
  revalidatePath('/admin/[id_usuario]', 'page')
  return { success: true }
}

export async function updateFivePointEvaluation(id_resultado: string, evaluacion: string[]) {
  const supabase = await createClient()
  const { error } = await supabase.from('resultados_cinco_puntos').update({ evaluacion }).eq('id_resultado', id_resultado)
  if (error) return { success: false, error: 'No se pudo guardar la evaluación.' }
  revalidatePath('/admin')
  revalidatePath('/admin/[id_usuario]', 'page')
  return { success: true }
}
