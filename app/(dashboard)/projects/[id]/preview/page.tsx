'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Monitor, Tablet, Smartphone, ExternalLink, Edit3, Lock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/store/useProjectStore'
import { cn } from '@/lib/utils'
import type { DevicePreview } from '@/types'

const deviceConfig: { id: DevicePreview; icon: typeof Monitor; label: string; width: string; height: string }[] = [
  { id: 'desktop', icon: Monitor, label: 'Desktop', width: '100%', height: '100%' },
  { id: 'tablet', icon: Tablet, label: 'Tablet', width: '768px', height: '1024px' },
  { id: 'mobile', icon: Smartphone, label: 'Mobile', width: '375px', height: '812px' },
]

export default function PreviewPage() {
  const params = useParams()
  const id = params.id as string
  const { projects } = useProjectStore()
  const project = projects.find((p) => p.id === id)
  const [device, setDevice] = useState<DevicePreview>('desktop')

  const dConf = deviceConfig.find(d => d.id === device)!

  if (!project) {
    return <div className="flex items-center justify-center h-screen text-surface-500">Proyecto no encontrado</div>
  }


  return (
    <div className="flex flex-col h-screen bg-surface-900">
      {/* Topbar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-surface-950 border-b border-surface-800 shrink-0">
        <Link href={`/projects/${id}/editor`} className="p-2 rounded-xl text-surface-400 hover:bg-surface-800 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{project.name}</p>
          <p className="text-xs text-surface-500">Vista previa</p>
        </div>

        {/* Device switcher */}
        <div className="flex items-center bg-surface-800 rounded-xl p-1 gap-0.5">
          {deviceConfig.map((d) => {
            const Icon = d.icon
            return (
              <button
                key={d.id}
                onClick={() => setDevice(d.id)}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  device === d.id ? 'bg-white text-surface-900' : 'text-surface-400 hover:text-white'
                )}
                title={d.label}
              >
                <Icon className="w-4 h-4" />
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/projects/${id}/editor`}>
            <Button size="sm" variant="outline" className="gap-1.5 border-surface-700 text-surface-300 hover:bg-surface-800 hover:text-white">
              <Edit3 className="w-3.5 h-3.5" /> Editar
            </Button>
          </Link>
          {project.status === 'published' && (
            <Button size="sm" variant="gradient" className="gap-1.5" onClick={() => window.open(`/s/${project.slug}`, '_blank')}>
              <ExternalLink className="w-3.5 h-3.5" /> Ver sitio
            </Button>
          )}
        </div>
      </div>

      {/* Watermark banner — solo para proyectos sin plan pago */}
      {!project.hasPaid && (
        <div className="shrink-0 bg-surface-900 border-b border-surface-700 px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-surface-400">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <span className="text-white font-medium">Vista previa gratuita.</span>
              {' '}El sitio publicado no tendrá esta barra ni marca de agua.
            </span>
          </div>
          <Link href={`/projects/${id}/checkout`}>
            <button type="button" className="flex items-center gap-1.5 text-xs font-semibold text-white gradient-brand px-3 py-1.5 rounded-lg shadow-brand hover:opacity-90 transition-opacity shrink-0">
              <Sparkles className="w-3.5 h-3.5" /> Publicar sitio
            </button>
          </Link>
        </div>
      )}

      {/* Preview area */}
      <div className="flex-1 overflow-auto flex items-start justify-center py-6 px-4">
        <motion.div
          animate={{ width: device === 'desktop' ? '100%' : dConf.width }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.4)] border border-surface-700"
          style={{
            width: device === 'desktop' ? '100%' : dConf.width,
            maxWidth: '100%',
            height: device === 'desktop' ? 'calc(100vh - 8rem)' : dConf.height,
          }}
        >
          {/* The REAL published-site renderer, in an iframe. No second
              implementation to drift from what ships. key={device} reloads it so
              the site re-runs its own responsive breakpoints at the new width. */}
          <iframe
            key={device}
            src={`/preview/${id}`}
            title="Vista previa del sitio"
            className="w-full h-full border-0 block bg-white"
          />
        </motion.div>
      </div>
    </div>
  )
}
