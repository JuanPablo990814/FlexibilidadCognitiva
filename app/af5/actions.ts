'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function saveAf5Result(respuestas: Record<number, number>, dimensiones: Record<string, number>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Tu sesión terminó. Inicia sesión nuevamente.' }
  const activeStudentId = cookies().get('active_student_id')?.value
  if (!activeStudentId) return { success: false, error: 'Selecciona un estudiante antes de guardar el cuestionario.' }
  const { data: savedResult, error } = await supabase.from('resultados_af5').insert([{
    id_usuario: user.id,
    id_consentimiento: activeStudentId,
    respuestas,
    academico_laboral: dimensiones.academico,
    social: dimensiones.social,
    emocional: dimensiones.emocional,
    familiar: dimensiones.familiar,
    fisico: dimensiones.fisico,
  }]).select('id_resultado').single()
  if (error) {
    console.error('Error guardando AF5:', error)
    return { success: false, error: `No se pudo guardar el cuestionario AF5: ${error.message}` }
  }
  return { success: true, idResultado: savedResult.id_resultado }
}
