'use client'
import Image from 'next/image'
import Link from 'next/link'
import { MoreHorizontal, Edit3, Copy, Trash2, ExternalLink, Eye, Globe, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatRelativeDate } from '@/lib/utils'
import type { Project, ProjectStatus } from '@/types'

const statusConfig: Record<ProjectStatus, { label: string; variant: 'draft' | 'generating' | 'ready' | 'published' | 'error'; dot: string }> = {
  draft: { label: 'Borrador', variant: 'draft', dot: 'bg-surface-400' },
  generating: { label: 'Generando...', variant: 'generating', dot: 'bg-blue-500 animate-pulse' },
  ready: { label: 'Listo', variant: 'ready', dot: 'bg-violet-500' },
  published: { label: 'Publicado', variant: 'published', dot: 'bg-emerald-500' },
  error: { label: 'Error', variant: 'error', dot: 'bg-red-500' },
}

interface ProjectCardProps {
  project: Project
  onDelete: () => void
  onDuplicate: () => void
}

export function ProjectCard({ project, onDelete, onDuplicate }: ProjectCardProps) {
  const status = statusConfig[project.status]

  return (
    <div className="group bg-white border border-surface-100 rounded-2xl overflow-hidden shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-200">
      {/* Thumbnail */}
      <div className="relative h-44 bg-surface-100 overflow-hidden">
        {project.thumbnail ? (
          <Image
            src={project.thumbnail}
            alt={project.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-5xl"
            style={{ background: `linear-gradient(135deg, ${project.businessData.branding.primaryColor}20, ${project.businessData.branding.primaryColor}08)` }}
          >
            <Globe className="w-12 h-12" style={{ color: project.businessData.branding.primaryColor }} />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={status.variant} className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </Badge>
        </div>

        {/* Actions overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <Link href={`/projects/${project.id}/editor`}>
            <button className="bg-white text-surface-900 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-elevated hover:bg-surface-50 transition-colors">
              <Edit3 className="w-3.5 h-3.5" /> Editar
            </button>
          </Link>
          <Link href={`/projects/${project.id}/preview`}>
            <button className="bg-white text-surface-900 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-elevated hover:bg-surface-50 transition-colors">
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          </Link>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-surface-900 text-sm leading-tight line-clamp-1">{project.name}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/projects/${project.id}/editor`}>
                <DropdownMenuItem>
                  <Edit3 className="w-4 h-4" /> Editar
                </DropdownMenuItem>
              </Link>
              <Link href={`/projects/${project.id}/preview`}>
                <DropdownMenuItem>
                  <Eye className="w-4 h-4" /> Vista previa
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="w-4 h-4" /> Duplicar
              </DropdownMenuItem>
              {project.publishedUrl && (
                <DropdownMenuItem onClick={() => window.open(project.publishedUrl, '_blank')}>
                  <ExternalLink className="w-4 h-4" /> Ver sitio
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onClick={onDelete}>
                <Trash2 className="w-4 h-4" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between text-xs text-surface-400">
          <span className="capitalize">{project.businessData.businessType}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeDate(project.updatedAt)}
          </span>
        </div>

        {/* Color dot */}
        <div className="mt-3 flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full border border-white shadow-sm"
            ref={(el) => { if (el) el.style.backgroundColor = project.businessData.branding.primaryColor }}
          />
          <span className="text-xs text-surface-400 capitalize">{project.plan}</span>
          <span className="text-surface-200">·</span>
          <span className="text-xs text-surface-400">{project.template}</span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-4 pb-4 flex gap-2">
        <Link href={`/projects/${project.id}/editor`} className="flex-1">
          <button className="w-full text-xs font-medium text-surface-600 border border-surface-200 rounded-xl py-2 hover:bg-surface-50 transition-colors flex items-center justify-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5" /> Editar
          </button>
        </Link>
        <Link href={`/projects/${project.id}/publish`} className="flex-1">
          <button
            className="w-full text-xs font-medium text-white rounded-xl py-2 transition-colors flex items-center justify-center gap-1.5 gradient-brand"
          >
            <Globe className="w-3.5 h-3.5" />
            {project.status === 'published' ? 'Ver sitio' : 'Publicar'}
          </button>
        </Link>
      </div>
    </div>
  )
}
