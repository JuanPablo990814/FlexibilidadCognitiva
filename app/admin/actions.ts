'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteTestRecord(id_resultado: string, testType: 'CAR' | 'WCST') {
  const supabase = await createClient()

  // 1. Verificación en la nube (el backend verifica el JWT/RLS)
  const tabla = testType === 'CAR' ? 'resultados_autorregulacion' : 'resultados_wcst'

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
