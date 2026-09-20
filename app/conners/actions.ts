'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function saveConnersTeacherResult(data: { docente: string, curso: string, respuestas: Record<number, number>, observaciones: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')
  const total = Object.values(data.respuestas).reduce((sum, value) => sum + value, 0)
  const { error } = await supabase.from('resultados_conners_docente').insert([{
    id_usuario: user.id,
    id_consentimiento: cookies().get('active_student_id')?.value ?? null,
    nombre_docente: data.docente.trim(),
    curso_observado: data.curso.trim() || null,
    respuestas: data.respuestas,
    total,
    observaciones: data.observaciones.trim() || null,
  }])
  if (error) return { success: false, error: 'No se pudo guardar el registro docente.' }
  return { success: true }
}
