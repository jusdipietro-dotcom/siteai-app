'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Search, Grid3X3, List, Star, Trash2, Copy,
  Download, ImageIcon, Filter, X, Check, Info,
  Heart, FolderOpen, Tag, LayoutGrid, ChevronRight,
  ZoomIn, Edit2, MoreHorizontal,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMediaStore } from '@/store/useMediaStore'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { cn, formatFileSize } from '@/lib/utils'
import type { MediaCategory, MediaFile } from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES: { id: MediaCategory | 'all'; label: string; icon: React.ReactNode }[] = [
  { id: 'all',      label: 'Todas',      icon: <LayoutGrid className="h-4 w-4" /> },
  { id: 'hero',     label: 'Hero',       icon: <ImageIcon  className="h-4 w-4" /> },
  { id: 'gallery',  label: 'Galería',    icon: <Grid3X3    className="h-4 w-4" /> },
  { id: 'team',     label: 'Equipo',     icon: <Tag        className="h-4 w-4" /> },
  { id: 'services', label: 'Servicios',  icon: <FolderOpen className="h-4 w-4" /> },
  { id: 'logo',     label: 'Logos',      icon: <Star       className="h-4 w-4" /> },
  { id: 'misc',     label: 'Varios',     icon: <Filter     className="h-4 w-4" /> },
]

// ─── Upload Drop Zone ─────────────────────────────────────────────────────────

function UploadZone({ onFiles }: { onFiles: (files: FileList) => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) onFiles(e.dataTransfer.files)
  }, [onFiles])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all',
        isDragging
          ? 'border-brand-400 bg-brand-50'
          : 'border-surface-200 bg-surface-50 hover:border-surface-300 hover:bg-surface-100'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        aria-label="Seleccionar imágenes"
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) { onFiles(e.target.files); e.target.value = '' } }}
      />
      <div className="flex flex-col items-center gap-3">
        <div className={cn(
          'h-12 w-12 rounded-2xl flex items-center justify-center transition-colors',
          isDragging ? 'bg-brand-100 text-brand-600' : 'bg-white text-surface-400 shadow-sm'
        )}>
          <Upload className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-surface-700">
            {isDragging ? 'Soltá las imágenes aquí' : 'Arrastrá imágenes o'}
          </p>
          {!isDragging && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
            >
              hacé clic para seleccionar
            </button>
          )}
        </div>
        <p className="text-xs text-surface-400">PNG, JPG, WebP — máx. 5 MB</p>
      </div>
    </div>
  )
}

// ─── Media Card (grid) ────────────────────────────────────────────────────────

function MediaCard({
  file,
  selected,
  onSelect,
  onToggleFavorite,
  onDelete,
  onView,
}: {
  file: MediaFile
  selected: boolean
  onSelect: () => void
  onToggleFavorite: () => void
  onDelete: () => void
  onView: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative group rounded-xl overflow-hidden border-2 cursor-pointer transition-all',
        selected
          ? 'border-brand-500 ring-2 ring-brand-500/20'
          : 'border-surface-200 hover:border-surface-300'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
    >
      {/* Image */}
      <div className="aspect-square bg-surface-100 relative">
        <img
          src={file.thumbnailUrl ?? file.url}
          alt={file.alt ?? file.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Hover overlay */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                title="Ver imagen"
                onClick={onView}
                className="h-8 w-8 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center text-surface-700 hover:text-surface-900 transition-colors"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                title={file.favorite ? 'Quitar favorita' : 'Marcar favorita'}
                onClick={onToggleFavorite}
                className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
                  file.favorite
                    ? 'bg-warning-100 text-warning-600 hover:bg-warning-200'
                    : 'bg-white/90 hover:bg-white text-surface-600 hover:text-warning-600'
                )}
              >
                <Heart className={cn('h-4 w-4', file.favorite && 'fill-current')} />
              </button>
              <button
                type="button"
                title="Eliminar"
                onClick={onDelete}
                className="h-8 w-8 rounded-lg bg-white/90 hover:bg-danger-50 flex items-center justify-center text-surface-600 hover:text-danger-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selection check */}
        <div
          className={cn(
            'absolute top-2 left-2 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all',
            selected
              ? 'bg-brand-500 border-brand-500'
              : 'bg-white/80 border-white/60 opacity-0 group-hover:opacity-100'
          )}
        >
          {selected && <Check className="h-3 w-3 text-white" />}
        </div>

        {/* Favorite star */}
        {file.favorite && (
          <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-warning-400 flex items-center justify-center">
            <Heart className="h-3 w-3 text-white fill-current" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 bg-white">
        <p className="text-xs font-medium text-surface-800 truncate">{file.name}</p>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs text-surface-400">{formatFileSize(file.size)}</span>
          {file.usedIn.length > 0 && (
            <span className="text-xs text-brand-600">{file.usedIn.length} proyecto{file.usedIn.length > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Media Row (list) ─────────────────────────────────────────────────────────

function MediaRow({
  file,
  selected,
  onSelect,
  onToggleFavorite,
  onDelete,
  onView,
}: {
  file: MediaFile
  selected: boolean
  onSelect: () => void
  onToggleFavorite: () => void
  onDelete: () => void
  onView: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer group',
        selected
          ? 'border-brand-500 bg-brand-50/50'
          : 'border-surface-200 bg-white hover:border-surface-300 hover:bg-surface-50'
      )}
      onClick={onSelect}
    >
      {/* Checkbox */}
      <div
        className={cn(
          'h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
          selected ? 'bg-brand-500 border-brand-500' : 'border-surface-300 group-hover:border-brand-300'
        )}
      >
        {selected && <Check className="h-3 w-3 text-white" />}
      </div>

      {/* Thumbnail */}
      <div className="h-10 w-14 rounded-lg overflow-hidden bg-surface-100 flex-shrink-0">
        <img
          src={file.thumbnailUrl ?? file.url}
          alt={file.alt ?? file.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Name & alt */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-surface-800 truncate">{file.name}</p>
        <p className="text-xs text-surface-400 truncate">{file.alt || '—'}</p>
      </div>

      {/* Category */}
      <Badge variant="default" className="hidden md:flex flex-shrink-0 capitalize">
        {file.category}
      </Badge>

      {/* Size */}
      <span className="text-xs text-surface-400 w-20 text-right hidden sm:block flex-shrink-0">
        {formatFileSize(file.size)}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          title="Ver"
          onClick={onView}
          className="h-7 w-7 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-500 hover:text-surface-700 transition-colors"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title={file.favorite ? 'Quitar favorita' : 'Favorita'}
          onClick={onToggleFavorite}
          className={cn(
            'h-7 w-7 rounded-lg flex items-center justify-center transition-colors',
            file.favorite
              ? 'text-warning-500 hover:bg-warning-50'
              : 'text-surface-400 hover:text-warning-500 hover:bg-surface-100'
          )}
        >
          <Heart className={cn('h-3.5 w-3.5', file.favorite && 'fill-current')} />
        </button>
        <button
          type="button"
          title="Eliminar"
          onClick={onDelete}
          className="h-7 w-7 rounded-lg hover:bg-danger-50 flex items-center justify-center text-surface-400 hover:text-danger-600 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({ file, onClose, onToggleFavorite, onUpdateAlt }: {
  file: MediaFile
  onClose: () => void
  onToggleFavorite: () => void
  onUpdateAlt: (alt: string) => void
}) {
  const [alt, setAlt] = useState(file.alt ?? '')
  const [editing, setEditing] = useState(false)

  const handleSaveAlt = () => {
    onUpdateAlt(alt)
    setEditing(false)
    toast.success('Texto alternativo actualizado')
  }

  return (
    <motion.aside
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="w-80 flex-shrink-0 bg-white border-l border-surface-200 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
        <p className="text-sm font-semibold text-surface-900">Detalles</p>
        <button
          type="button"
          title="Cerrar panel"
          onClick={onClose}
          className="h-7 w-7 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-500 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Preview */}
      <div className="p-4 border-b border-surface-100">
        <div className="aspect-video rounded-xl overflow-hidden bg-surface-100">
          <img
            src={file.url}
            alt={file.alt ?? file.name}
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Metadata */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Name */}
        <div>
          <p className="text-xs font-medium text-surface-500 mb-1">Nombre del archivo</p>
          <p className="text-sm text-surface-800 break-all">{file.name}</p>
        </div>

        {/* Alt text */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-medium text-surface-500">Texto alternativo</p>
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <Edit2 className="h-3 w-3" /> Editar
              </button>
            )}
          </div>
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                rows={3}
                placeholder="Descripción de la imagen para accesibilidad..."
                className="field-textarea"
                title="Texto alternativo"
              />
              <div className="flex gap-2">
                <Button size="xs" variant="primary" onClick={handleSaveAlt}>Guardar</Button>
                <Button size="xs" variant="ghost" onClick={() => { setEditing(false); setAlt(file.alt ?? '') }}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-surface-700">{file.alt || <span className="text-surface-400 italic">Sin texto alternativo</span>}</p>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Tamaño', value: formatFileSize(file.size) },
            { label: 'Categoría', value: <span className="capitalize">{file.category}</span> },
            { label: 'Dimensiones', value: `${file.width} × ${file.height}` },
            { label: 'Proyectos', value: file.usedIn.length > 0 ? `${file.usedIn.length} sitio${file.usedIn.length > 1 ? 's' : ''}` : 'Sin usar' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-50 rounded-xl p-3">
              <p className="text-xs text-surface-500 mb-0.5">{label}</p>
              <p className="text-sm font-medium text-surface-800">{value}</p>
            </div>
          ))}
        </div>

        {/* Favorite */}
        <button
          type="button"
          onClick={onToggleFavorite}
          className={cn(
            'w-full flex items-center justify-center gap-2 h-9 rounded-xl border text-sm font-medium transition-all',
            file.favorite
              ? 'border-warning-200 bg-warning-50 text-warning-700 hover:bg-warning-100'
              : 'border-surface-200 bg-white text-surface-600 hover:border-warning-200 hover:bg-warning-50 hover:text-warning-600'
          )}
        >
          <Heart className={cn('h-4 w-4', file.favorite && 'fill-current')} />
          {file.favorite ? 'Quitar de favoritas' : 'Marcar como favorita'}
        </button>

        {/* Copy URL */}
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(file.url)
            toast.success('URL copiada al portapapeles')
          }}
          className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-surface-200 bg-white text-sm text-surface-600 hover:bg-surface-50 transition-all"
        >
          <Copy className="h-4 w-4" /> Copiar URL
        </button>
      </div>
    </motion.aside>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MediaPage() {
  const {
    files, selectedIds, filter, search, viewMode,
    setFilter, setSearch, setViewMode,
    selectFile, deselectFile, clearSelection,
    toggleFavorite, deleteFile, addFile, updateAlt,
    getFiltered, loadFiles,
  } = useMediaStore()

  useEffect(() => { loadFiles() }, [])

  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [viewFile, setViewFile] = useState<MediaFile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null)
  const [deletingMultiple, setDeletingMultiple] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = getFiltered().filter((f) => !showFavoritesOnly || f.favorite)

  const handleFileClick = (file: MediaFile) => {
    if (selectedIds.includes(file.id)) {
      deselectFile(file.id)
    } else {
      selectFile(file.id)
    }
  }

  const handleView = (file: MediaFile) => {
    setViewFile(file)
  }

  const handleFiles = async (files: FileList) => {
    setIsUploading(true)
    let uploaded = 0
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) { toast.error(`${file.name}: solo se aceptan imágenes`); continue }
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name}: supera los 5 MB`); continue }
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/media', { method: 'POST', body: formData })
        if (!res.ok) throw new Error()
        const media = await res.json()
        addFile({ ...media, usedIn: [] })
        uploaded++
      } catch {
        toast.error(`Error al subir ${file.name}`)
      }
    }
    setIsUploading(false)
    if (uploaded > 0) toast.success(`${uploaded} imagen${uploaded > 1 ? 'es' : ''} subida${uploaded > 1 ? 's' : ''} correctamente`)
  }

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteFile(deleteTarget.id)
      if (viewFile?.id === deleteTarget.id) setViewFile(null)
      toast.success('Imagen eliminada')
      setDeleteTarget(null)
    }
  }

  const handleBulkDelete = () => {
    setDeletingMultiple(true)
  }

  const handleBulkDeleteConfirm = () => {
    selectedIds.forEach((id) => deleteFile(id))
    if (viewFile && selectedIds.includes(viewFile.id)) setViewFile(null)
    toast.success(`${selectedIds.length} imagen${selectedIds.length > 1 ? 'es' : ''} eliminada${selectedIds.length > 1 ? 's' : ''}`)
    clearSelection()
    setDeletingMultiple(false)
  }

  const stats = {
    total: files.length,
    favorites: files.filter((f) => f.favorite).length,
    used: files.filter((f) => f.usedIn.length > 0).length,
    size: files.reduce((acc, f) => acc + f.size, 0),
  }

  return (
    <div className="flex h-screen flex-col bg-surface-50">
      {/* Top bar */}
      <header className="bg-white border-b border-surface-200 px-6 py-4 flex items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-surface-900">Media Library</h1>
          <p className="text-xs text-surface-500 mt-0.5">
            {stats.total} archivos · {stats.favorites} favoritas · {formatFileSize(stats.size)} en total
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <span className="text-sm text-surface-600 font-medium">
                {selectedIds.length} seleccionada{selectedIds.length > 1 ? 's' : ''}
              </span>
              <Button
                variant="destructive-ghost"
                size="sm"
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={handleBulkDelete}
              >
                Eliminar
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Deseleccionar
              </Button>
            </motion.div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            aria-label="Subir imágenes"
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) { handleFiles(e.target.files); e.target.value = '' } }}
          />
          <Button
            variant="gradient"
            size="sm"
            leftIcon={isUploading ? undefined : <Upload className="h-4 w-4" />}
            loading={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="shadow-brand"
          >
            {isUploading ? 'Subiendo...' : 'Subir imagen'}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-52 flex-shrink-0 bg-white border-r border-surface-200 p-4 overflow-y-auto">
          {/* Categories */}
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">Categorías</p>
          <nav className="space-y-0.5">
            {CATEGORIES.map(({ id, label, icon }) => {
              const count = id === 'all' ? files.length : files.filter((f) => f.category === id).length
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
                    filter === id
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                  )}
                >
                  <span className={filter === id ? 'text-brand-500' : 'text-surface-400'}>{icon}</span>
                  <span className="flex-1 text-left">{label}</span>
                  <span className={cn(
                    'text-xs tabular-nums',
                    filter === id ? 'text-brand-500' : 'text-surface-400'
                  )}>{count}</span>
                </button>
              )
            })}
          </nav>

          <div className="mt-6 pt-4 border-t border-surface-100">
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">Filtros</p>
            <button
              type="button"
              onClick={() => setShowFavoritesOnly((v) => !v)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
                showFavoritesOnly
                  ? 'bg-warning-50 text-warning-700 font-medium'
                  : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
              )}
            >
              <Heart className={cn('h-4 w-4', showFavoritesOnly ? 'text-warning-500 fill-current' : 'text-surface-400')} />
              <span className="flex-1 text-left">Favoritas</span>
              <span className={cn('text-xs', showFavoritesOnly ? 'text-warning-500' : 'text-surface-400')}>
                {stats.favorites}
              </span>
            </button>
          </div>

          {/* Stats summary */}
          <div className="mt-6 pt-4 border-t border-surface-100 space-y-3">
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Resumen</p>
            <div className="bg-surface-50 rounded-xl p-3 space-y-2">
              {[
                { label: 'En uso', value: stats.used },
                { label: 'Sin usar', value: stats.total - stats.used },
                { label: 'Favoritas', value: stats.favorites },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-surface-500">{label}</span>
                  <span className="font-medium text-surface-700">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Toolbar */}
          <div className="bg-white border-b border-surface-200 px-6 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o descripción..."
                title="Buscar imágenes"
                className="w-full h-9 pl-9 pr-4 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
              />
              {search && (
                <button
                  type="button"
                  title="Limpiar búsqueda"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                title="Vista en grilla"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
                  viewMode === 'grid' ? 'bg-brand-50 text-brand-600' : 'text-surface-500 hover:bg-surface-100'
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Vista en lista"
                onClick={() => setViewMode('list')}
                className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
                  viewMode === 'list' ? 'bg-brand-50 text-brand-600' : 'text-surface-500 hover:bg-surface-100'
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <span className="text-xs text-surface-400 hidden sm:block pl-2 border-l border-surface-200">
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-6">
            {filtered.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-surface-100 flex items-center justify-center text-surface-400">
                  <ImageIcon className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-base font-semibold text-surface-700">
                    {search ? 'Sin resultados' : showFavoritesOnly ? 'Sin favoritas' : 'Sin imágenes'}
                  </p>
                  <p className="text-sm text-surface-400 mt-1">
                    {search
                      ? `No encontramos imágenes para "${search}"`
                      : showFavoritesOnly
                      ? 'Marcá imágenes como favoritas para verlas aquí'
                      : 'Subí tu primera imagen para empezar'}
                  </p>
                </div>
                {!search && !showFavoritesOnly && (
                  <Button variant="primary" leftIcon={<Upload className="h-4 w-4" />} onClick={() => fileInputRef.current?.click()} loading={isUploading}>
                    Subir imagen
                  </Button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="space-y-6">
                {/* Upload drop zone */}
                <UploadZone onFiles={handleFiles} />

                {/* Grid */}
                <motion.div
                  layout
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
                >
                  <AnimatePresence mode="popLayout">
                    {filtered.map((file) => (
                      <MediaCard
                        key={file.id}
                        file={file}
                        selected={selectedIds.includes(file.id)}
                        onSelect={() => handleFileClick(file)}
                        onToggleFavorite={() => toggleFavorite(file.id)}
                        onDelete={() => setDeleteTarget(file)}
                        onView={() => handleView(file)}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Upload drop zone */}
                <UploadZone onFiles={handleFiles} />

                {/* List */}
                <div className="space-y-1.5">
                  {/* Header */}
                  <div className="flex items-center gap-4 px-3 pb-1 border-b border-surface-200">
                    <div className="w-5" />
                    <div className="w-14 flex-shrink-0" />
                    <p className="flex-1 text-xs font-medium text-surface-500">Nombre</p>
                    <p className="text-xs font-medium text-surface-500 hidden md:block w-24">Categoría</p>
                    <p className="text-xs font-medium text-surface-500 w-20 text-right hidden sm:block">Tamaño</p>
                    <div className="w-20" />
                  </div>
                  <AnimatePresence mode="popLayout">
                    {filtered.map((file) => (
                      <MediaRow
                        key={file.id}
                        file={file}
                        selected={selectedIds.includes(file.id)}
                        onSelect={() => handleFileClick(file)}
                        onToggleFavorite={() => toggleFavorite(file.id)}
                        onDelete={() => setDeleteTarget(file)}
                        onView={() => handleView(file)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Detail panel */}
        <AnimatePresence>
          {viewFile && (
            <DetailPanel
              key={viewFile.id}
              file={viewFile}
              onClose={() => setViewFile(null)}
              onToggleFavorite={() => toggleFavorite(viewFile.id)}
              onUpdateAlt={(alt) => updateAlt(viewFile.id, alt)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Delete single confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar imagen"
        description={`¿Estás seguro de eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      {/* Bulk delete confirm */}
      <ConfirmDialog
        open={deletingMultiple}
        onOpenChange={(open) => !open && setDeletingMultiple(false)}
        title={`Eliminar ${selectedIds.length} imagen${selectedIds.length > 1 ? 'es' : ''}`}
        description="Esta acción eliminará todas las imágenes seleccionadas y no se puede deshacer."
        confirmLabel="Eliminar todo"
        variant="destructive"
        onConfirm={handleBulkDeleteConfirm}
      />
    </div>
  )
}
