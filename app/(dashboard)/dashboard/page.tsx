'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, LayoutGrid, LayoutList, Globe, Sparkles,
  TrendingUp, Eye, Filter, SlidersHorizontal, Command,
  FileText, ArrowUpRight, Zap
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { SkeletonCard } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useProjectStore } from '@/store/useProjectStore'
import { useUIStore } from '@/store/useUIStore'
import { formatRelativeDate, formatNumber } from '@/lib/utils'
import type { ProjectStatus } from '@/types'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Edit, Copy, Trash2, ExternalLink, Eye as EyeIcon, Settings, Rocket, MoreHorizontal } from 'lucide-react'

const STATUS_FILTERS: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'Todos' },
  { value: 'published', label: 'Publicados' },
  { value: 'ready',     label: 'Listos' },
  { value: 'draft',     label: 'Borradores' },
  { value: 'generating',label: 'Generando' },
]

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } },
}

export default function DashboardPage() {
  const router = useRouter()
  const { projects, deleteProject, duplicateProject, setProjectStatus } = useProjectStore()
  const { openCommandPalette } = useUIStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.businessData.businessType.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [projects, search, statusFilter])

  const stats = useMemo(() => ({
    total:     projects.length,
    published: projects.filter((p) => p.status === 'published').length,
    totalViews: projects.reduce((sum, p) => sum + (p.views ?? 0), 0),
    ready:     projects.filter((p) => p.status === 'ready').length,
  }), [projects])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeletingId(deleteId)
    await new Promise((r) => setTimeout(r, 600))
    deleteProject(deleteId)
    toast.success('Proyecto eliminado')
    setDeleteId(null)
    setDeletingId(null)
  }

  const handleDuplicate = (id: string, name: string) => {
    duplicateProject(id)
    toast.success(`"${name}" duplicado`)
  }

  const handlePublish = async (id: string, name: string) => {
    const project = projects.find((p) => p.id === id)
    if (!project?.hasPaid) {
      router.push(`/projects/${id}/checkout`)
      return
    }
    setProjectStatus(id, 'generating')
    toast.loading(`Publicando "${name}"...`, { id: `pub-${id}`, duration: 3000 })
    await new Promise((r) => setTimeout(r, 3000))
    setProjectStatus(id, 'published')
    toast.success(`"${name}" publicado`, { id: `pub-${id}` })
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-surface-100 px-6 lg:px-8 py-5 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-surface-900">Dashboard</h1>
            <p className="text-sm text-surface-400 mt-0.5">Tus proyectos de sitios web</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Command palette shortcut */}
            <button
              type="button"
              onClick={openCommandPalette}
              className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-xl border border-surface-200 text-sm text-surface-400 hover:border-surface-300 hover:text-surface-600 transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Buscar</span>
              <kbd className="ml-1 text-xs bg-surface-100 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
            </button>
            <Button variant="gradient" size="md" onClick={() => router.push('/wizard')} leftIcon={<Plus className="h-4 w-4" />}>
              Nuevo sitio
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 lg:px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Proyectos totales', value: stats.total,     icon: FileText,   color: 'text-brand-600', bg: 'bg-brand-50' },
            { label: 'Publicados',         value: stats.published, icon: Globe,       color: 'text-success-600', bg: 'bg-success-50' },
            { label: 'Listos para pub.',   value: stats.ready,     icon: Sparkles,   color: 'text-warning-600', bg: 'bg-warning-50' },
            { label: 'Vistas totales',     value: formatNumber(stats.totalViews), icon: Eye, color: 'text-violet-600', bg: 'bg-violet-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-surface-100 p-5 flex items-start gap-4"
            >
              <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-surface-900">{value}</p>
                <p className="text-xs text-surface-400 mt-0.5">{label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar proyectos..."
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-surface-200 bg-white text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-400 transition-all"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={`h-8 px-3 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === value
                    ? 'bg-surface-900 text-white'
                    : 'bg-white border border-surface-200 text-surface-600 hover:border-surface-300 hover:text-surface-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 ml-auto bg-surface-100 rounded-lg p-1">
            {[{ mode: 'grid' as const, icon: LayoutGrid, label: 'Vista grilla' }, { mode: 'list' as const, icon: LayoutList, label: 'Vista lista' }].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => setViewMode(mode)}
                className={`h-7 w-7 flex items-center justify-center rounded-md transition-all ${
                  viewMode === mode ? 'bg-white shadow-soft text-surface-800' : 'text-surface-400 hover:text-surface-600'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>

        {/* Grid / List */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasSearch={!!search || statusFilter !== 'all'} onClear={() => { setSearch(''); setStatusFilter('all') }} />
        ) : viewMode === 'grid' ? (
          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filtered.map((project) => (
              <motion.div key={project.id} variants={stagger.item}>
                <ProjectCard
                  project={project}
                  onEdit={() => router.push(`/projects/${project.id}/editor`)}
                  onPreview={() => router.push(`/projects/${project.id}/preview`)}
                  onDuplicate={() => handleDuplicate(project.id, project.name)}
                  onDelete={() => setDeleteId(project.id)}
                  onPublish={() => handlePublish(project.id, project.name)}
                  onSettings={() => router.push(`/projects/${project.id}/settings`)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="space-y-2">
            {filtered.map((project) => (
              <ProjectListRow
                key={project.id}
                project={project}
                onEdit={() => router.push(`/projects/${project.id}/editor`)}
                onPreview={() => router.push(`/projects/${project.id}/preview`)}
                onDuplicate={() => handleDuplicate(project.id, project.name)}
                onDelete={() => setDeleteId(project.id)}
                onPublish={() => handlePublish(project.id, project.name)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar proyecto?"
        description="Esta acción no se puede deshacer. El sitio y todos sus datos serán eliminados permanentemente."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
        loading={!!deletingId}
      />
    </div>
  )
}

// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, onEdit, onPreview, onDuplicate, onDelete, onPublish, onSettings }: {
  project: any
  onEdit: () => void
  onPreview: () => void
  onDuplicate: () => void
  onDelete: () => void
  onPublish: () => void
  onSettings: () => void
}) {
  const colorHex = project.businessData.branding.primaryColor

  return (
    <div className="group bg-white rounded-2xl border border-surface-100 overflow-hidden hover:shadow-card hover:-translate-y-0.5 transition-all duration-200">
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-100 cursor-pointer" onClick={onPreview}>
        {project.thumbnail ? (
          <Image src={project.thumbnail} alt={project.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center gradient-brand-subtle">
            <div className="h-12 w-12 gradient-brand rounded-2xl flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button type="button" onClick={(e) => { e.stopPropagation(); onPreview() }} className="h-8 px-3 rounded-lg bg-white text-xs font-semibold text-surface-800 flex items-center gap-1.5 shadow-soft hover:bg-surface-50 transition-colors">
            <EyeIcon className="h-3.5 w-3.5" /> Preview
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onEdit() }} className="h-8 px-3 rounded-lg bg-white text-xs font-semibold text-surface-800 flex items-center gap-1.5 shadow-soft hover:bg-surface-50 transition-colors">
            <Edit className="h-3.5 w-3.5" /> Editar
          </button>
        </div>
        {/* Status dot */}
        <div className="absolute top-3 left-3">
          <StatusBadge status={project.status} />
        </div>
        {/* Plan badge */}
        {project.plan !== 'free' && (
          <div className="absolute top-3 right-3">
            <Badge variant={project.plan}>{project.plan}</Badge>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-surface-900 text-sm truncate">{project.name}</h3>
            <p className="text-xs text-surface-400 mt-0.5">{project.businessData.businessType} · {project.template}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" title="Más opciones" aria-label="Más opciones" className="h-7 w-7 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem icon={<Edit className="h-3.5 w-3.5" />} onClick={onEdit}>Editar</DropdownMenuItem>
              <DropdownMenuItem icon={<EyeIcon className="h-3.5 w-3.5" />} onClick={onPreview}>Preview</DropdownMenuItem>
              <DropdownMenuItem icon={<Settings className="h-3.5 w-3.5" />} onClick={onSettings}>Configuración</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={<Copy className="h-3.5 w-3.5" />} onClick={onDuplicate}>Duplicar</DropdownMenuItem>
              {project.publishedUrl && (
                <DropdownMenuItem icon={<ExternalLink className="h-3.5 w-3.5" />} onClick={() => window.open(project.publishedUrl)}>
                  Ver sitio
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={<Trash2 className="h-3.5 w-3.5" />} onClick={onDelete} destructive>Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-surface-50">
          <span className="flex items-center gap-1 text-xs text-surface-400">
            <Eye className="h-3 w-3" />
            {formatNumber(project.views ?? 0)}
          </span>
          <span className="text-xs text-surface-300">·</span>
          <span className="text-xs text-surface-400">{formatRelativeDate(project.updatedAt)}</span>
          <div className="ml-auto">
            {project.status === 'ready' ? (
              <Button size="xs" variant="gradient" onClick={onPublish} leftIcon={<Rocket className="h-3 w-3" />}>
                Publicar
              </Button>
            ) : project.status === 'published' ? (
              <Button size="xs" variant="outline" onClick={() => window.open(project.publishedUrl)} rightIcon={<ArrowUpRight className="h-3 w-3" />}>
                Ver sitio
              </Button>
            ) : (
              <Button size="xs" variant="secondary" onClick={onEdit}>
                Editar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── List Row ──────────────────────────────────────────────────────────────────
function ProjectListRow({ project, onEdit, onPreview, onDuplicate, onDelete, onPublish }: {
  project: any
  onEdit: () => void
  onPreview: () => void
  onDuplicate: () => void
  onDelete: () => void
  onPublish: () => void
}) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-xl border border-surface-100 px-4 py-3 hover:shadow-soft transition-all">
      {/* Thumb */}
      <div className="h-12 w-20 rounded-lg overflow-hidden shrink-0 bg-surface-100 cursor-pointer" onClick={onPreview}>
        {project.thumbnail && (
          <Image src={project.thumbnail} alt={project.name} width={80} height={48} className="object-cover h-full w-full" unoptimized />
        )}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-surface-900 truncate">{project.name}</h3>
          <StatusBadge status={project.status} />
        </div>
        <p className="text-xs text-surface-400 mt-0.5">{project.businessData.businessType} · actualizado {formatRelativeDate(project.updatedAt)}</p>
      </div>
      {/* Views */}
      <div className="hidden md:flex items-center gap-1 text-xs text-surface-400 shrink-0">
        <Eye className="h-3.5 w-3.5" />
        {formatNumber(project.views ?? 0)}
      </div>
      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Button size="xs" variant="outline" onClick={onEdit}>Editar</Button>
        {project.status === 'ready' && (
          <Button size="xs" variant="gradient" onClick={onPublish}>Publicar</Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" title="Más opciones" aria-label="Más opciones" className="h-7 w-7 rounded-lg flex items-center justify-center text-surface-400 hover:bg-surface-100 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onPreview}>Preview</DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>Duplicar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} destructive>Eliminar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ hasSearch, onClear }: { hasSearch: boolean; onClear: () => void }) {
  const router = useRouter()
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="h-16 w-16 gradient-brand-subtle rounded-3xl flex items-center justify-center mb-5">
        {hasSearch ? <Search className="h-8 w-8 text-brand-400" /> : <Plus className="h-8 w-8 text-brand-400" />}
      </div>
      <h3 className="text-lg font-bold text-surface-800 mb-2">
        {hasSearch ? 'Sin resultados' : 'Todavía no tenés proyectos'}
      </h3>
      <p className="text-sm text-surface-400 max-w-xs mb-6">
        {hasSearch
          ? 'Probá con otros términos o limpiá los filtros.'
          : 'Creá tu primer sitio web en menos de 20 minutos, sin saber programar.'}
      </p>
      {hasSearch ? (
        <Button variant="outline" onClick={onClear}>Limpiar filtros</Button>
      ) : (
        <Button variant="gradient" onClick={() => router.push('/wizard')} leftIcon={<Sparkles className="h-4 w-4" />}>
          Crear primer sitio
        </Button>
      )}
    </motion.div>
  )
}
