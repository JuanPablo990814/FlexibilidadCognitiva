'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export type FivePointDesign = { lines: [number, number][] }

export async function saveFivePointResult(designs: FivePointDesign[], elapsedSeconds: number, comprendioInstruccion: boolean | null, repitioInstruccion: boolean | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { error } = await supabase.from('resultados_cinco_puntos').insert([{
    id_usuario: user.id,
    id_consentimiento: cookies().get('active_student_id')?.value ?? null,
    total_casillas: 30,
    figuras_completadas: designs.length,
    tiempo_segundos: elapsedSeconds,
    comprendio_instruccion: comprendioInstruccion,
    repitio_instruccion: repitioInstruccion,
    disenos: designs,
    evaluacion: designs.map(() => 'pendiente'),
  }])

  if (error) {
    console.error('Error guardando Cinco Puntos:', error)
    return { success: false, error: 'No fue posible guardar el resultado.' }
  }
  return { success: true }
}
