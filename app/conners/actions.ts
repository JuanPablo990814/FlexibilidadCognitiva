'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function saveConnersTeacherResult(data: { docente: string, curso: string, respuestas: Record<number, number>, observaciones: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Tu sesión terminó. Inicia sesión nuevamente.' }
  const activeStudentId = cookies().get('active_student_id')?.value
  if (!activeStudentId) return { success: false, error: 'Selecciona un estudiante antes de guardar la valoración.' }
  const total = Object.values(data.respuestas).reduce((sum, value) => sum + value, 0)
  const { data: savedResult, error } = await supabase.from('resultados_conners_docente').insert([{
    id_usuario: user.id,
    id_consentimiento: activeStudentId,
    nombre_docente: data.docente.trim(),
    curso_observado: data.curso.trim() || null,
    respuestas: data.respuestas,
    total,
    observaciones: data.observaciones.trim() || null,
  }]).select('id_resultado').single()
  if (error) {
    console.error('Error guardando Conners:', error)
    return { success: false, error: `No se pudo guardar el registro docente: ${error.message}` }
  }
  return { success: true, idResultado: savedResult.id_resultado }
}
