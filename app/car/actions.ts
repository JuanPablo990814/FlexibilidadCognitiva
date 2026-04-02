'use server'

import { createClient } from '@/lib/supabase/server'

export async function saveCarResult(resultado: {
  total: number
  subescalas: { M: number; P: number; TD: number; AR: number }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Usuario no autenticado')

  // Calcular el estado general según el promedio (1-5) propuesto en los requerimientos
  const promedio = resultado.total / 17
  let estado = 'Medio'
  if (promedio < 2.6) estado = 'Bajo'
  else if (promedio > 3.7) estado = 'Alto'

  const payload = {
    id_usuario: user.id,
    metas: resultado.subescalas.M,
    perseverancia: resultado.subescalas.P,
    toma_decisiones: resultado.subescalas.TD,
    aprendizaje_errores: resultado.subescalas.AR,
    estado_general: estado
  }

  const { error } = await supabase.from('resultados_autorregulacion').insert([payload])

  if (error) {
    console.error('Error guardando resultado CAR:', error)
    return { success: false, error: 'Ocurrió un error guardando el test en la nube. Intente de nuevo.' }
  }

  return { success: true }
}
