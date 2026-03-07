import Link from 'next/link'
import { Globe, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  hasProjects: boolean
  onClear?: () => void
}

export function EmptyState({ hasProjects, onClear }: EmptyStateProps) {
  if (hasProjects) {
    return (
      <div className="text-center py-20">
        <div className="w-14 h-14 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Search className="w-7 h-7 text-surface-400" />
        </div>
        <h3 className="text-lg font-semibold text-surface-900 mb-2">No encontramos resultados</h3>
        <p className="text-surface-500 mb-6 text-sm">Probá con otros términos o quitá los filtros.</p>
        <Button variant="outline" onClick={onClear}>Limpiar filtros</Button>
      </div>
    )
  }

  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 gradient-brand rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-brand">
        <Globe className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-xl font-bold text-surface-900 mb-2">Todavía no creaste ningún sitio</h3>
      <p className="text-surface-500 mb-8 max-w-sm mx-auto">
        Creá tu primer sitio web con IA en menos de 5 minutos. Sin código, sin diseñadores.
      </p>
      <Link href="/wizard">
        <Button variant="gradient" size="lg" className="gap-2 shadow-brand">
          <Plus className="w-5 h-5" />
          Crear mi primer sitio
        </Button>
      </Link>
    </div>
  )
}
