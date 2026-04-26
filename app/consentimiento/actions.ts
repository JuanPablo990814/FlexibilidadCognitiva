'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function checkConsent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  return { user }
}

export async function submitConsent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Usuario no autenticado')

  const isQuickMode = formData.get('es_rapido') === 'true'

  const payload = {
    id_usuario: user.id,
    nombre_padre: isQuickMode ? 'Registro Autorizado Físico (Admin)' : formData.get('nombre_padre'),
    cedula_padre: isQuickMode ? 'N/A' : formData.get('cedula_padre'),
    lugar_expedicion_padre: isQuickMode ? 'N/A' : formData.get('lugar_expedicion_padre'),
    nombre_estudiante: formData.get('nombre_estudiante'),
    tarjeta_identidad_estudiante: isQuickMode ? 'N/A' : formData.get('tarjeta_identidad_estudiante'),
    edad_estudiante: parseInt(formData.get('edad_estudiante') as string, 10),
    municipio_estudiante: isQuickMode ? 'N/A' : formData.get('municipio_estudiante'),
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
