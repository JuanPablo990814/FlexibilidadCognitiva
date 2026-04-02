'use client'

import { useTransition } from 'react'
import { deleteTestRecord } from '@/app/admin/actions'
import { useRouter } from 'next/navigation'

export default function DeleteTestButton({ idResultado, testType }: { idResultado: string, testType: 'CAR' | 'WCST' }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    if (!confirm('🚨 ¿Estás segura de eliminar este intento por completo? Esta acción no se puede deshacer.')) return

    startTransition(async () => {
      const response = await deleteTestRecord(idResultado, testType)
      if (response.error) {
        alert(response.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className={`absolute top-2 right-2 p-2 rounded-lg bg-black/20 hover:bg-red-500/20 text-[#64748b] hover:text-red-400 transition-colors z-10 
        ${isPending ? 'opacity-50 cursor-not-allowed animate-pulse' : ''}`}
      title="Eliminar este test de la base de datos"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  )
}
