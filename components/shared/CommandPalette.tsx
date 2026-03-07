'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, LayoutDashboard, Plus, FileText, Image, Settings,
  Rocket, BookTemplate, ArrowRight, Keyboard
} from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { useProjectStore } from '@/store/useProjectStore'
import { cn } from '@/lib/utils'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  action: () => void
  group: string
  keywords?: string[]
}

export function CommandPalette() {
  const { commandPaletteOpen, closeCommandPalette } = useUIStore()
  const { projects } = useProjectStore()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const router = useRouter()

  const navigate = useCallback((path: string) => {
    router.push(path)
    closeCommandPalette()
    setQuery('')
  }, [router, closeCommandPalette])

  const staticCommands: CommandItem[] = [
    {
      id: 'dashboard', label: 'Ir al Dashboard', icon: <LayoutDashboard className="h-4 w-4" />,
      action: () => navigate('/dashboard'), group: 'Navegación', keywords: ['inicio', 'home'],
    },
    {
      id: 'new', label: 'Crear nuevo sitio', description: 'Iniciar el wizard de creación',
      icon: <Plus className="h-4 w-4" />, action: () => navigate('/wizard'), group: 'Acciones',
    },
    {
      id: 'templates', label: 'Ver templates', icon: <BookTemplate className="h-4 w-4" />,
      action: () => navigate('/templates'), group: 'Navegación',
    },
  ]

  const projectCommands: CommandItem[] = projects.slice(0, 5).map((p) => ({
    id: `proj-${p.id}`,
    label: p.name,
    description: `Editar · ${p.status}`,
    icon: <FileText className="h-4 w-4" />,
    action: () => navigate(`/projects/${p.id}/editor`),
    group: 'Proyectos',
    keywords: [p.name.toLowerCase(), p.slug],
  }))

  const allCommands = [...staticCommands, ...projectCommands]

  const filtered = query
    ? allCommands.filter((cmd) => {
        const q = query.toLowerCase()
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.description?.toLowerCase().includes(q) ||
          cmd.keywords?.some((k) => k.includes(q))
        )
      })
    : allCommands

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = []
    acc[cmd.group].push(cmd)
    return acc
  }, {})

  useEffect(() => { setActiveIndex(0) }, [query])

  useEffect(() => {
    if (!commandPaletteOpen) { setQuery(''); setActiveIndex(0) }
  }, [commandPaletteOpen])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!commandPaletteOpen) return
      if (e.key === 'Escape') closeCommandPalette()
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, filtered.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)) }
      if (e.key === 'Enter' && filtered[activeIndex]) { filtered[activeIndex].action() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [commandPaletteOpen, filtered, activeIndex, closeCommandPalette])

  let flatIndex = 0

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
          onClick={closeCommandPalette}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-modal border border-surface-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-surface-100">
              <Search className="h-4 w-4 text-surface-400 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar comandos, proyectos..."
                className="flex-1 text-sm text-surface-900 placeholder:text-surface-400 outline-none bg-transparent"
              />
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-surface-200 px-1.5 font-mono text-[10px] text-surface-400">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-2 scrollbar-thin">
              {Object.entries(grouped).length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <Search className="h-8 w-8 text-surface-300 mb-2" />
                  <p className="text-sm text-surface-500">Sin resultados para "{query}"</p>
                </div>
              ) : (
                Object.entries(grouped).map(([group, items]) => (
                  <div key={group}>
                    <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-surface-400">
                      {group}
                    </p>
                    {items.map((item) => {
                      const idx = flatIndex++
                      const isActive = idx === activeIndex
                      return (
                        <button
                          key={item.id}
                          onClick={item.action}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                            isActive ? 'bg-surface-100' : 'hover:bg-surface-50'
                          )}
                        >
                          <span className={cn('shrink-0', isActive ? 'text-brand-600' : 'text-surface-400')}>
                            {item.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-surface-800 truncate">{item.label}</p>
                            {item.description && (
                              <p className="text-xs text-surface-400 truncate">{item.description}</p>
                            )}
                          </div>
                          {isActive && <ArrowRight className="h-3.5 w-3.5 text-surface-400 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-t border-surface-100 bg-surface-50">
              <Keyboard className="h-3 w-3 text-surface-400" />
              <span className="text-xs text-surface-400">↑↓ navegar · Enter seleccionar · Esc cerrar</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
