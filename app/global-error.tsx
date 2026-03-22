'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif', background: '#f8fafc' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
            <p style={{ fontSize: '4rem', fontWeight: 900, color: '#ef4444', margin: '0 0 1rem' }}>
              Error
            </p>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111', margin: '0 0 0.5rem' }}>
              Algo salio mal
            </h1>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              Ocurrio un error critico. Podes intentar recargar la pagina o volver mas tarde.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#0099ff',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '1rem',
                marginRight: '0.75rem',
              }}
            >
              Recargar pagina
            </button>
            <a
              href="/"
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f1f5f9',
                color: '#475569',
                textDecoration: 'none',
                borderRadius: '0.75rem',
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              Ir al inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
