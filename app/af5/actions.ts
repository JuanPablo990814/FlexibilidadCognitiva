'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function saveAf5Result(respuestas: Record<number, number>, dimensiones: Record<string, number>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')
  const { error } = await supabase.from('resultados_af5').insert([{
    id_usuario: user.id,
    id_consentimiento: cookies().get('active_student_id')?.value ?? null,
    respuestas,
    academico_laboral: dimensiones.academico,
    social: dimensiones.social,
    emocional: dimensiones.emocional,
    familiar: dimensiones.familiar,
    fisico: dimensiones.fisico,
  }])
  if (error) return { success: false, error: 'No se pudo guardar el cuestionario AF5.' }
  return { success: true }
}
