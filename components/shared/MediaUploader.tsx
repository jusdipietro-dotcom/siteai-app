'use client'
import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, ImageIcon, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useMediaStore } from '@/store/useMediaStore'
import type { MediaCategory } from '@/types'
import { toast } from 'sonner'

interface MediaUploaderProps {
  category?: MediaCategory
  currentImageUrl?: string
  onSelect?: (url: string, id: string) => void
  onRemove?: () => void
  aspectRatio?: '16/9' | '1/1' | '4/3' | '3/2' | '3/4'
  hint?: string
  label?: string
  className?: string
}

const ASPECT_CLASSES: Record<string, string> = {
  '16/9': 'aspect-video',
  '1/1': 'aspect-square',
  '4/3': 'aspect-[4/3]',
  '3/2': 'aspect-[3/2]',
  '3/4': 'aspect-[3/4]',
}

export function MediaUploader({
  category = 'misc',
  currentImageUrl,
  onSelect,
  onRemove,
  aspectRatio = '16/9',
  hint,
  label,
  className,
}: MediaUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { addFile } = useMediaStore()

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Solo se aceptan imágenes')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no puede superar los 5MB')
        return
      }

      setIsLoading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/media', { method: 'POST', body: formData })
        if (!res.ok) throw new Error('Upload failed')
        const media = await res.json()
        addFile({ ...media, usedIn: [] })
        onSelect?.(media.url, media.id)
        toast.success('Imagen subida correctamente')
      } catch {
        toast.error('Error al subir la imagen')
      } finally {
        setIsLoading(false)
      }
    },
    [category, addFile, onSelect]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <p className="text-sm font-medium text-surface-700">{label}</p>}

      <div
        className={cn(
          'relative rounded-2xl border-2 border-dashed overflow-hidden transition-all duration-150',
          ASPECT_CLASSES[aspectRatio],
          isDragging
            ? 'border-brand-400 bg-brand-50'
            : currentImageUrl
            ? 'border-transparent'
            : 'border-surface-200 bg-surface-50 hover:border-brand-300 hover:bg-brand-50/50',
          'cursor-pointer group'
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !currentImageUrl && fileRef.current?.click()}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-white/80"
            >
              <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
              <p className="text-xs text-surface-500 mt-2">Subiendo...</p>
            </motion.div>
          ) : currentImageUrl ? (
            <motion.div key="image" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative h-full w-full">
              <Image
                src={currentImageUrl}
                alt="Preview"
                fill
                className="object-cover"
                unoptimized
              />
              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
                  className="h-9 px-3 rounded-lg bg-white text-sm font-medium text-surface-800 shadow-soft hover:bg-surface-50 transition-colors flex items-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Cambiar
                </button>
                {onRemove && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove() }}
                    className="h-9 w-9 rounded-lg bg-white text-danger-600 shadow-soft hover:bg-danger-50 transition-colors flex items-center justify-center"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4"
            >
              <div className={cn(
                'h-12 w-12 rounded-2xl flex items-center justify-center transition-colors',
                isDragging ? 'bg-brand-100' : 'bg-surface-100 group-hover:bg-brand-100'
              )}>
                {isDragging
                  ? <Upload className="h-6 w-6 text-brand-500" />
                  : <ImageIcon className="h-6 w-6 text-surface-400 group-hover:text-brand-400 transition-colors" />
                }
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-surface-600">
                  {isDragging ? 'Soltar imagen aquí' : 'Arrastrar o hacer clic'}
                </p>
                <p className="text-xs text-surface-400 mt-0.5">PNG, JPG, WebP · Máx. 10MB</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {hint && !isLoading && (
        <p className="text-xs text-surface-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {hint}
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
