import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-black text-brand-500 mb-4">404</p>
        <h1 className="text-2xl font-bold text-surface-900 mb-2">Pagina no encontrada</h1>
        <p className="text-surface-600 mb-8">
          La pagina que buscas no existe o fue movida. Verifica la URL o volve al inicio.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors"
          >
            Ir al inicio
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-surface-100 hover:bg-surface-200 text-surface-700 font-semibold rounded-xl transition-colors"
          >
            Ver el blog
          </Link>
        </div>
      </div>
    </main>
  )
}
