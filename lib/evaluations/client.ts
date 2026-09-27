export type PersistResult = { success: boolean; error?: string; idResultado?: string }

/**
 * Server Actions are not supported by the Cloudflare Pages deployment used by
 * this project. Persist results through Route Handlers instead, preserving the
 * authenticated session cookies in the same-origin request.
 */
export async function persistEvaluation(path: string, payload: unknown): Promise<PersistResult> {
  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    })
    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.success) {
      return { success: false, error: result?.error ?? `No se pudo guardar el resultado (${response.status}).` }
    }
    return result
  } catch {
    return { success: false, error: 'No se pudo contactar el servidor. Inténtalo de nuevo.' }
  }
}
