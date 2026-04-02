'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function checkConsent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { hasConsented: false, user: null }

  const { data } = await supabase
    .from('consentimientos')
    .select('id_consentimiento')
    .eq('id_usuario', user.id)
    .single()

  return { hasConsented: !!data, user }
}

export async function submitConsent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Usuario no autenticado')

  const payload = {
    id_usuario: user.id,
    nombre_padre: formData.get('nombre_padre'),
    cedula_padre: formData.get('cedula_padre'),
    lugar_expedicion_padre: formData.get('lugar_expedicion_padre'),
    nombre_estudiante: formData.get('nombre_estudiante'),
    tarjeta_identidad_estudiante: formData.get('tarjeta_identidad_estudiante'),
    municipio_estudiante: formData.get('municipio_estudiante'),
    grado_estudiante: formData.get('grado_estudiante'),
    grupo_estudiante: formData.get('grupo_estudiante'),
    autorizacion_dada: true
  }

  const { error } = await supabase.from('consentimientos').insert([payload])

  if (error) {
    console.error('Error guardando consentimiento:', error)
    throw new Error('Hubo un error al guardar el consentimiento. Inténtalo de nuevo.')
  }

  redirect('/')
}
