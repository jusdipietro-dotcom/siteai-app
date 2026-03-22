'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[App Error]', error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-black text-danger-500 mb-4">500</p>
        <h1 className="text-2xl font-bold text-surface-900 mb-2">Algo salio mal</h1>
        <p className="text-surface-600 mb-8">
          Ocurrio un error inesperado. Nuestro equipo fue notificado. Podes intentar de nuevo o
          volver al inicio.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors"
          >
            Intentar de nuevo
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-surface-100 hover:bg-surface-200 text-surface-700 font-semibold rounded-xl transition-colors"
          >
            Ir al inicio
          </a>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-surface-400">
            Codigo de error: {error.digest}
          </p>
        )}
      </div>
    </main>
  )
}
