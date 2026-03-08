'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  ArrowLeft, Monitor, Tablet, Smartphone, Eye, Save, Undo2,
  Plus, GripVertical, ToggleLeft, ToggleRight, ChevronRight,
  Layers, Palette, Settings, Image as ImageIcon, Type, AlignLeft,
  Phone, Mail, MapPin, Star, HelpCircle, Share2, CheckSquare,
  Loader2, Sparkles, ExternalLink, Code, Grid3x3
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProjectStore } from '@/store/useProjectStore'
import { useEditorStore } from '@/store/useEditorStore'
import { useMediaStore } from '@/store/useMediaStore'
import { ColorPresetSelector } from '@/components/shared/ColorPresetSelector'
import { cn } from '@/lib/utils'
import type { SectionConfig, SectionType, DevicePreview, ColorTheme } from '@/types'

// Section icons map
const SECTION_ICONS: Record<SectionType, React.ReactNode> = {
  hero:         <Star className="h-3.5 w-3.5" />,
  about:        <AlignLeft className="h-3.5 w-3.5" />,
  services:     <CheckSquare className="h-3.5 w-3.5" />,
  gallery:      <ImageIcon className="h-3.5 w-3.5" />,
  testimonials: <Star className="h-3.5 w-3.5" />,
  faq:          <HelpCircle className="h-3.5 w-3.5" />,
  contact:      <Phone className="h-3.5 w-3.5" />,
  cta:          <Share2 className="h-3.5 w-3.5" />,
  stats:        <Grid3x3 className="h-3.5 w-3.5" />,
  features:     <CheckSquare className="h-3.5 w-3.5" />,
  team:         <Star className="h-3.5 w-3.5" />,
  pricing:      <Star className="h-3.5 w-3.5" />,
  footer:       <AlignLeft className="h-3.5 w-3.5" />,
}

const DEVICE_CONFIG: Record<DevicePreview, { width: string; label: string; icon: React.ReactNode }> = {
  desktop: { width: '100%',   label: 'Desktop',  icon: <Monitor className="h-4 w-4" /> },
  tablet:  { width: '768px',  label: 'Tablet',   icon: <Tablet className="h-4 w-4" /> },
  mobile:  { width: '375px',  label: 'Mobile',   icon: <Smartphone className="h-4 w-4" /> },
}

const SIDEBAR_TABS = [
  { id: 'sections', label: 'Secciones', icon: <Layers className="h-4 w-4" /> },
  { id: 'styles',   label: 'Estilos',   icon: <Palette className="h-4 w-4" /> },
  { id: 'seo',      label: 'SEO',       icon: <Settings className="h-4 w-4" /> },
  { id: 'media',    label: 'Media',     icon: <ImageIcon className="h-4 w-4" /> },
] as const

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { projects, updateProject, toggleSection, reorderSections } = useProjectStore()
  const { device, setDevice, selectedSection, selectSection, sidebarTab, setSidebarTab, isDirty, isSaving, setIsSaving, markSaved } = useEditorStore()
  const { files: mediaFiles, loadFiles, addFile } = useMediaStore()
  const galleryImages = mediaFiles.filter((f) => f.category === 'gallery').slice(0, 6)

  const project = projects.find((p) => p.id === id)
  const [sections, setSections] = useState<SectionConfig[]>(project?.sections ?? [])
  const [localName, setLocalName] = useState(project?.businessData.name ?? '')
  const [localColor, setLocalColor] = useState(project?.businessData.branding.primaryColor ?? '#6366f1')
  const [localTheme, setLocalTheme] = useState<ColorTheme>(project?.businessData.branding.colorTheme ?? 'indigo')
  const [previewKey, setPreviewKey] = useState(0)

  useEffect(() => {
    if (project) {
      setSections(project.sections)
      setLocalName(project.businessData.name)
      setLocalColor(project.businessData.branding.primaryColor)
      setLocalTheme(project.businessData.branding.colorTheme)
    }
  }, [project?.id])

  useEffect(() => { loadFiles() }, [])

  const handleSave = useCallback(async () => {
    if (!project) return
    setIsSaving(true)
    await new Promise((r) => setTimeout(r, 900))
    updateProject(id, {
      sections,
      businessData: {
        ...project.businessData,
        name: localName,
        branding: { ...project.businessData.branding, primaryColor: localColor, colorTheme: localTheme },
      },
    })
    markSaved()
    toast.success('Cambios guardados')
  }, [id, sections, localName, localColor, localTheme, project, updateProject, setIsSaving, markSaved])

  const handleColorChange = (theme: ColorTheme, color: string) => {
    setLocalColor(color)
    setLocalTheme(theme)
    setPreviewKey((k) => k + 1)
  }

  if (!project) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-surface-400">Proyecto no encontrado</p>
    </div>
  )

  const enabledSections = sections.filter((s) => s.enabled)

  return (
    <div className="flex flex-col h-screen bg-surface-100 overflow-hidden">
      {/* ── Top bar ── */}
      <header className="flex items-center gap-3 h-14 px-4 bg-white border-b border-surface-100 shrink-0 z-20">
        <Link href="/dashboard" className="p-2 rounded-xl text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors" title="Volver">
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <input
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            title="Nombre del proyecto"
            aria-label="Nombre del proyecto"
            placeholder="Nombre del proyecto"
            className="text-sm font-semibold text-surface-900 bg-transparent border-none outline-none focus:bg-surface-50 focus:px-2 rounded-lg transition-all truncate max-w-[200px]"
          />
          {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-warning-500 shrink-0" title="Cambios sin guardar" />}
        </div>

        {/* Device switcher */}
        <div className="flex items-center gap-0.5 bg-surface-100 rounded-xl p-1">
          {(Object.keys(DEVICE_CONFIG) as DevicePreview[]).map((d) => (
            <button
              key={d}
              type="button"
              title={DEVICE_CONFIG[d].label}
              aria-label={DEVICE_CONFIG[d].label}
              onClick={() => setDevice(d)}
              className={cn(
                'h-8 w-8 flex items-center justify-center rounded-lg transition-all',
                device === d ? 'bg-white shadow-soft text-surface-800' : 'text-surface-400 hover:text-surface-600'
              )}
            >
              {DEVICE_CONFIG[d].icon}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Eye className="h-3.5 w-3.5" />}
            onClick={() => router.push(`/projects/${id}/preview`)}
          >
            Preview
          </Button>
          <Button
            variant="gradient"
            size="sm"
            loading={isSaving}
            leftIcon={isSaving ? undefined : <Save className="h-3.5 w-3.5" />}
            onClick={handleSave}
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
          <Button
            variant="default"
            size="sm"
            leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
            onClick={() => router.push(`/projects/${id}/publish`)}
          >
            Publicar
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* ── Left sidebar ── */}
        <aside className="w-64 bg-white border-r border-surface-100 flex flex-col shrink-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-surface-100 shrink-0">
            {SIDEBAR_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                title={tab.label}
                aria-label={tab.label}
                onClick={() => setSidebarTab(tab.id as typeof sidebarTab)}
                className={cn(
                  'flex-1 flex items-center justify-center h-10 transition-colors',
                  sidebarTab === tab.id
                    ? 'text-brand-600 border-b-2 border-brand-500'
                    : 'text-surface-400 hover:text-surface-600'
                )}
              >
                {tab.icon}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {sidebarTab === 'sections' && (
              <SectionManager
                sections={sections}
                selectedSection={selectedSection}
                onSelect={selectSection}
                onChange={setSections}
                onToggle={(sectionId) => {
                  setSections((prev) =>
                    prev.map((s) => s.id === sectionId && !s.required ? { ...s, enabled: !s.enabled } : s)
                  )
                }}
              />
            )}

            {sidebarTab === 'styles' && (
              <div className="p-4 space-y-5">
                <div>
                  <p className="section-label mb-3">Paleta de color</p>
                  <ColorPresetSelector value={localTheme} onChange={handleColorChange} showLabel={false} />
                </div>
                <div>
                  <p className="section-label mb-2">Color personalizado</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={localColor}
                      onChange={(e) => { setLocalColor(e.target.value); setPreviewKey((k) => k + 1) }}
                      className="h-9 w-14 rounded-lg border border-surface-200 cursor-pointer p-0.5 bg-white"
                    />
                    <code className="text-xs text-surface-500 font-mono">{localColor}</code>
                  </div>
                </div>
                <div>
                  <p className="section-label mb-2">Tipografía</p>
                  {['inter', 'playfair', 'dm-sans', 'manrope', 'space-grotesk'].map((font) => (
                    <button
                      key={font}
                      type="button"
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-1',
                        project.businessData.branding.fontHeading === font
                          ? 'bg-brand-50 text-brand-700 font-medium'
                          : 'text-surface-600 hover:bg-surface-50'
                      )}
                      onClick={() => {
                        updateProject(id, {
                          businessData: {
                            ...project.businessData,
                            branding: { ...project.businessData.branding, fontHeading: font },
                          },
                        })
                        toast.success(`Tipografía cambiada a ${font}`)
                      }}
                    >
                      {font.charAt(0).toUpperCase() + font.slice(1).replace(/-/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sidebarTab === 'seo' && (
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="section-label">Título SEO</label>
                  <input
                    defaultValue={project.businessData.seo.title}
                    onBlur={(e) => updateProject(id, { businessData: { ...project.businessData, seo: { ...project.businessData.seo, title: e.target.value } } })}
                    className="w-full h-9 px-3 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                    placeholder="Título para Google"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="section-label">Meta descripción</label>
                  <textarea
                    defaultValue={project.businessData.seo.description}
                    onBlur={(e) => updateProject(id, { businessData: { ...project.businessData, seo: { ...project.businessData.seo, description: e.target.value } } })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-surface-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                    placeholder="Descripción breve para buscadores"
                  />
                  <p className="text-xs text-surface-400">Recomendado: 120–160 caracteres</p>
                </div>
                <div className="space-y-1.5">
                  <label className="section-label">Keywords</label>
                  <input
                    defaultValue={project.businessData.seo.keywords}
                    onBlur={(e) => updateProject(id, { businessData: { ...project.businessData, seo: { ...project.businessData.seo, keywords: e.target.value } } })}
                    className="w-full h-9 px-3 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                    placeholder="palabra1, palabra2, ..."
                  />
                </div>
              </div>
            )}

            {sidebarTab === 'media' && (
              <div className="p-4 space-y-3">
                <p className="section-label mb-2">Archivos del proyecto</p>
                {project.mediaIds.length === 0 ? (
                  <p className="text-xs text-surface-400">No hay archivos cargados.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {project.mediaIds.slice(0, 8).map((mediaId) => (
                      <div key={mediaId} className="aspect-square rounded-lg bg-surface-100 overflow-hidden relative group">
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-surface-400 font-mono">{mediaId.slice(0, 6)}</div>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push(`/media`)}
                  leftIcon={<ImageIcon className="h-3.5 w-3.5" />}
                >
                  Gestionar media
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Canvas ── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-auto p-6 flex justify-center">
            <motion.div
              key={previewKey}
              animate={{ width: DEVICE_CONFIG[device].width }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-full"
            >
              <div className="bg-white rounded-2xl canvas-shadow overflow-hidden">
                <SitePreview
                  project={project}
                  sections={sections}
                  primaryColor={localColor}
                  name={localName}
                  selectedSection={selectedSection}
                  onSelectSection={selectSection}
                  galleryImages={galleryImages}
                />
              </div>
            </motion.div>
          </div>
        </main>

        {/* ── Right panel ── */}
        <AnimatePresence>
          {selectedSection && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white border-l border-surface-100 overflow-hidden shrink-0"
            >
              <RightPanel
                section={sections.find((s) => s.id === selectedSection)}
                project={project}
                onClose={() => selectSection(null)}
                mediaFiles={mediaFiles}
                addFile={addFile}
                onUpdate={(updates) => {
                  updateProject(id, { businessData: { ...project.businessData, ...updates } })
                  toast.success('Cambio aplicado')
                }}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Section Manager ────────────────────────────────────────────────────────────
function SectionManager({ sections, selectedSection, onSelect, onChange, onToggle }: {
  sections: SectionConfig[]
  selectedSection: SectionType | null
  onSelect: (id: SectionType | null) => void
  onChange: (sections: SectionConfig[]) => void
  onToggle: (id: string) => void
}) {
  return (
    <div className="p-3 space-y-1">
      <p className="section-label px-2 py-2">Secciones del sitio</p>
      <Reorder.Group axis="y" values={sections} onReorder={onChange} className="space-y-1">
        {sections.map((section) => (
          <Reorder.Item
            key={section.id}
            value={section}
            className={cn(
              'flex items-center gap-2 px-2.5 py-2.5 rounded-xl cursor-pointer group transition-all',
              selectedSection === section.id
                ? 'bg-brand-50 ring-1 ring-brand-200'
                : section.enabled
                ? 'hover:bg-surface-50'
                : 'opacity-40 hover:opacity-60 hover:bg-surface-50'
            )}
            onClick={() => onSelect(selectedSection === section.id ? null : section.id as SectionType)}
          >
            {/* Drag handle */}
            <span className="text-surface-300 cursor-grab hover:text-surface-500 shrink-0">
              <GripVertical className="h-3.5 w-3.5" />
            </span>

            {/* Icon */}
            <span className={cn('shrink-0', selectedSection === section.id ? 'text-brand-500' : 'text-surface-400')}>
              {SECTION_ICONS[section.id as SectionType] ?? <AlignLeft className="h-3.5 w-3.5" />}
            </span>

            {/* Label */}
            <span className="flex-1 text-sm font-medium text-surface-700 truncate">{section.label}</span>

            {/* Required badge */}
            {section.required ? (
              <span className="text-[9px] font-bold uppercase tracking-wider text-surface-400">FIJO</span>
            ) : (
              <button
                type="button"
                title={section.enabled ? 'Ocultar sección' : 'Mostrar sección'}
                onClick={(e) => { e.stopPropagation(); onToggle(section.id) }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-surface-400 hover:text-surface-700"
              >
                {section.enabled
                  ? <ToggleRight className="h-4 w-4 text-brand-500" />
                  : <ToggleLeft className="h-4 w-4" />
                }
              </button>
            )}
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  )
}

// ── Image Picker ───────────────────────────────────────────────────────────────
function ImagePicker({ value, onChange, mediaFiles, addFile, label = 'Imagen' }: {
  value?: string
  onChange: (url: string) => void
  mediaFiles: any[]
  addFile: (file: any) => void
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', 'misc')
      const res = await fetch('/api/media', { method: 'POST', body: formData })
      if (!res.ok) throw new Error()
      const media = await res.json()
      addFile({ ...media, usedIn: [] })
      onChange(media.url)
      setOpen(false)
    } catch {
      toast.error('Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="section-label">{label}</label>
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-surface-200 group">
          <img src={value} alt="" className="w-full h-28 object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button type="button" onClick={() => setOpen(true)} className="text-xs bg-white text-surface-800 px-2 py-1 rounded-lg font-medium">Cambiar</button>
            <button type="button" onClick={() => onChange('')} className="text-xs bg-danger-500 text-white px-2 py-1 rounded-lg font-medium">Quitar</button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full h-20 rounded-xl border-2 border-dashed border-surface-200 flex flex-col items-center justify-center gap-1 hover:border-brand-400 hover:bg-brand-50 transition-all text-surface-400 hover:text-brand-500"
        >
          <ImageIcon className="h-5 w-5" />
          <span className="text-xs">Seleccionar imagen</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl p-5 w-[480px] max-h-[70vh] flex flex-col gap-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-surface-900">Seleccionar imagen</p>
              <button type="button" onClick={() => setOpen(false)} className="h-7 w-7 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-500 text-xs">✕</button>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              aria-label="Subir imagen"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); e.target.value = '' }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center justify-center gap-2 h-9 rounded-xl border-2 border-dashed border-surface-200 text-sm text-surface-500 hover:border-brand-400 hover:text-brand-500 transition-all disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {uploading ? 'Subiendo...' : 'Subir nueva imagen'}
            </button>

            {mediaFiles.length === 0 ? (
              <p className="text-sm text-surface-400 text-center py-4">No hay imágenes en tu biblioteca. Subí una arriba.</p>
            ) : (
              <div className="overflow-y-auto grid grid-cols-4 gap-2">
                {mediaFiles.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => { onChange(f.url); setOpen(false) }}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all hover:border-brand-500 ${value === f.url ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-surface-200'}`}
                  >
                    <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Right Panel ────────────────────────────────────────────────────────────────
function RightPanel({ section, project, onClose, onUpdate, mediaFiles, addFile }: {
  section?: SectionConfig
  project: any
  onClose: () => void
  onUpdate: (updates: any) => void
  mediaFiles: any[]
  addFile: (file: any) => void
}) {
  if (!section) return null
  const bd = project.businessData

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-surface-100 shrink-0">
        <p className="text-sm font-semibold text-surface-800">{section.label}</p>
        <button type="button" title="Cerrar panel" aria-label="Cerrar panel" onClick={onClose} className="h-6 w-6 rounded-md text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors flex items-center justify-center text-xs">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {section.id === 'hero' && (
          <>
            <FieldGroup label="Título principal">
              <input defaultValue={bd.name} onBlur={(e) => onUpdate({ name: e.target.value })} title="Título principal" placeholder="Nombre del negocio" className="field-input" />
            </FieldGroup>
            <FieldGroup label="Slogan">
              <input defaultValue={bd.tagline} onBlur={(e) => onUpdate({ tagline: e.target.value })} title="Slogan" placeholder="Tu slogan aquí" className="field-input" />
            </FieldGroup>
            <FieldGroup label="Descripción">
              <textarea defaultValue={bd.description} onBlur={(e) => onUpdate({ description: e.target.value })} rows={3} title="Descripción" placeholder="Descripción del negocio" className="field-textarea" />
            </FieldGroup>
            <ImagePicker
              label="Imagen de fondo"
              value={bd.heroImage}
              onChange={(url) => onUpdate({ heroImage: url })}
              mediaFiles={mediaFiles}
              addFile={addFile}
            />
          </>
        )}

        {section.id === 'contact' && (
          <>
            <FieldGroup label="Teléfono">
              <input defaultValue={bd.contact.phone} onBlur={(e) => onUpdate({ contact: { ...bd.contact, phone: e.target.value } })} title="Teléfono" placeholder="+54 11 1234-5678" className="field-input" />
            </FieldGroup>
            <FieldGroup label="Email">
              <input defaultValue={bd.contact.email} onBlur={(e) => onUpdate({ contact: { ...bd.contact, email: e.target.value } })} title="Email" placeholder="contacto@empresa.com" className="field-input" />
            </FieldGroup>
            <FieldGroup label="Dirección">
              <input defaultValue={bd.contact.address} onBlur={(e) => onUpdate({ contact: { ...bd.contact, address: e.target.value } })} title="Dirección" placeholder="Av. Corrientes 1234" className="field-input" />
            </FieldGroup>
            <FieldGroup label="Horario">
              <input defaultValue={bd.contact.schedule} onBlur={(e) => onUpdate({ contact: { ...bd.contact, schedule: e.target.value } })} title="Horario de atención" placeholder="Lun–Vie: 9:00–18:00" className="field-input" />
            </FieldGroup>
          </>
        )}

        {section.id === 'about' && (
          <>
            <FieldGroup label="Descripción">
              <textarea defaultValue={bd.description} onBlur={(e) => onUpdate({ description: e.target.value })} rows={4} title="Descripción" placeholder="Contá tu historia..." className="field-textarea" />
            </FieldGroup>
          </>
        )}

        {(section.id === 'services' || section.id === 'features') && (
          <div className="space-y-3">
            <p className="text-xs text-surface-500">Servicios ({bd.services.length})</p>
            {bd.services.map((svc: any, i: number) => (
              <div key={svc.id} className="bg-surface-50 rounded-xl p-3 space-y-2">
                <input
                  defaultValue={svc.name}
                  onBlur={(e) => {
                    const updated = [...bd.services]
                    updated[i] = { ...svc, name: e.target.value }
                    onUpdate({ services: updated })
                  }}
                  className="field-input text-xs"
                  placeholder="Nombre del servicio"
                />
                <textarea
                  defaultValue={svc.description}
                  onBlur={(e) => {
                    const updated = [...bd.services]
                    updated[i] = { ...svc, description: e.target.value }
                    onUpdate({ services: updated })
                  }}
                  rows={2}
                  className="field-textarea text-xs"
                  placeholder="Descripción"
                />
              </div>
            ))}
          </div>
        )}

        {section.id === 'testimonials' && (
          <div className="space-y-3">
            <p className="text-xs text-surface-500">Testimonios ({bd.testimonials.length})</p>
            {bd.testimonials.map((t: any, i: number) => (
              <div key={t.id} className="bg-surface-50 rounded-xl p-3 space-y-2">
                <input
                  defaultValue={t.author}
                  onBlur={(e) => { const u = [...bd.testimonials]; u[i] = { ...t, author: e.target.value }; onUpdate({ testimonials: u }) }}
                  className="field-input text-xs" placeholder="Nombre del cliente"
                />
                <input
                  defaultValue={t.role}
                  onBlur={(e) => { const u = [...bd.testimonials]; u[i] = { ...t, role: e.target.value }; onUpdate({ testimonials: u }) }}
                  className="field-input text-xs" placeholder="Cargo / empresa"
                />
                <textarea
                  defaultValue={t.content}
                  onBlur={(e) => { const u = [...bd.testimonials]; u[i] = { ...t, content: e.target.value }; onUpdate({ testimonials: u }) }}
                  rows={2} className="field-textarea text-xs" placeholder="Testimonio"
                />
              </div>
            ))}
          </div>
        )}

        {section.id === 'team' && (
          <div className="space-y-3">
            <p className="text-xs text-surface-500">Equipo ({bd.team.length})</p>
            {bd.team.map((m: any, i: number) => (
              <div key={m.id} className="bg-surface-50 rounded-xl p-3 space-y-2">
                <ImagePicker
                  value={m.image}
                  onChange={(url) => { const u = [...bd.team]; u[i] = { ...m, image: url }; onUpdate({ team: u }) }}
                  mediaFiles={mediaFiles}
                  addFile={addFile}
                  label="Foto"
                />
                <input
                  defaultValue={m.name}
                  onBlur={(e) => { const u = [...bd.team]; u[i] = { ...m, name: e.target.value }; onUpdate({ team: u }) }}
                  className="field-input text-xs" placeholder="Nombre"
                />
                <input
                  defaultValue={m.role}
                  onBlur={(e) => { const u = [...bd.team]; u[i] = { ...m, role: e.target.value }; onUpdate({ team: u }) }}
                  className="field-input text-xs" placeholder="Cargo"
                />
                <textarea
                  defaultValue={m.bio}
                  onBlur={(e) => { const u = [...bd.team]; u[i] = { ...m, bio: e.target.value }; onUpdate({ team: u }) }}
                  rows={2} className="field-textarea text-xs" placeholder="Biografía breve"
                />
              </div>
            ))}
          </div>
        )}

        {section.id === 'faq' && (
          <div className="space-y-3">
            <p className="text-xs text-surface-500">Preguntas ({bd.faqs.length})</p>
            {bd.faqs.map((faq: any, i: number) => (
              <div key={faq.id} className="bg-surface-50 rounded-xl p-3 space-y-2">
                <input
                  defaultValue={faq.question}
                  onBlur={(e) => { const u = [...bd.faqs]; u[i] = { ...faq, question: e.target.value }; onUpdate({ faqs: u }) }}
                  className="field-input text-xs" placeholder="Pregunta"
                />
                <textarea
                  defaultValue={faq.answer}
                  onBlur={(e) => { const u = [...bd.faqs]; u[i] = { ...faq, answer: e.target.value }; onUpdate({ faqs: u }) }}
                  rows={2} className="field-textarea text-xs" placeholder="Respuesta"
                />
              </div>
            ))}
          </div>
        )}

        {section.id === 'gallery' && (
          <div className="space-y-3">
            <p className="text-xs text-surface-500">Imágenes de la galería ({(bd.galleryImages ?? []).length}/6)</p>
            <div className="grid grid-cols-3 gap-2">
              {(bd.galleryImages ?? []).map((url: string, i: number) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-surface-200 group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    title="Quitar imagen"
                    onClick={() => {
                      const imgs = [...(bd.galleryImages ?? [])]
                      imgs.splice(i, 1)
                      onUpdate({ galleryImages: imgs })
                    }}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-danger-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >✕</button>
                </div>
              ))}
              {(bd.galleryImages ?? []).length < 6 && (
                <ImagePicker
                  value={undefined}
                  onChange={(url) => {
                    if (!url) return
                    onUpdate({ galleryImages: [...(bd.galleryImages ?? []), url] })
                  }}
                  mediaFiles={mediaFiles}
                  addFile={addFile}
                  label=""
                />
              )}
            </div>
          </div>
        )}

        {section.id === 'stats' && (
          <div className="space-y-2">
            <p className="text-xs text-surface-500">Estadísticas visibles en la sección. Editá los valores directamente en el preview del sitio generado.</p>
          </div>
        )}

        {section.id === 'cta' && (
          <>
            <FieldGroup label="Título del CTA">
              <input defaultValue={bd.tagline} onBlur={(e) => onUpdate({ tagline: e.target.value })} title="Título CTA" placeholder="Tu llamado a la acción" className="field-input" />
            </FieldGroup>
            <FieldGroup label="Descripción">
              <textarea defaultValue={bd.description} onBlur={(e) => onUpdate({ description: e.target.value })} rows={3} title="Descripción CTA" placeholder="Descripción del CTA" className="field-textarea" />
            </FieldGroup>
          </>
        )}

        {section.id === 'footer' && (
          <>
            <FieldGroup label="Email de contacto">
              <input defaultValue={bd.contact.email} onBlur={(e) => onUpdate({ contact: { ...bd.contact, email: e.target.value } })} title="Email footer" placeholder="contacto@empresa.com" className="field-input" />
            </FieldGroup>
            <FieldGroup label="Teléfono">
              <input defaultValue={bd.contact.phone} onBlur={(e) => onUpdate({ contact: { ...bd.contact, phone: e.target.value } })} title="Teléfono footer" placeholder="+54 11 1234-5678" className="field-input" />
            </FieldGroup>
            <FieldGroup label="Instagram">
              <input defaultValue={bd.socials.instagram} onBlur={(e) => onUpdate({ socials: { ...bd.socials, instagram: e.target.value } })} title="Instagram" placeholder="@usuario" className="field-input" />
            </FieldGroup>
            <FieldGroup label="Facebook">
              <input defaultValue={bd.socials.facebook} onBlur={(e) => onUpdate({ socials: { ...bd.socials, facebook: e.target.value } })} title="Facebook" placeholder="facebook.com/pagina" className="field-input" />
            </FieldGroup>
          </>
        )}
      </div>
    </div>
  )
}

// ── Field helpers ──────────────────────────────────────────────────────────────
function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="section-label">{label}</label>
      {children}
    </div>
  )
}

// ── Site Preview ───────────────────────────────────────────────────────────────
function SitePreview({ project, sections, primaryColor, name, selectedSection, onSelectSection, galleryImages }: {
  project: any
  sections: SectionConfig[]
  primaryColor: string
  name: string
  selectedSection: SectionType | null
  onSelectSection: (id: SectionType | null) => void
  galleryImages: any[]
}) {
  const bd = project.businessData
  const enabled = sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order)

  return (
    <div className="font-sans text-surface-900 min-h-[600px]">
      {/* Nav mock */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-surface-100">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: primaryColor }}>
            {name.charAt(0)}
          </div>
          <span className="font-bold text-sm">{name}</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          {enabled.slice(0, 4).map((s) => (
            <button key={s.id} type="button" className="text-xs text-surface-500 hover:text-surface-800 transition-colors">{s.label}</button>
          ))}
        </div>
        <div className="h-8 px-4 rounded-lg text-xs font-semibold text-white flex items-center" style={{ backgroundColor: primaryColor }}>
          Contactar
        </div>
      </nav>

      {/* Sections */}
      {enabled.map((section) => (
        <div
          key={section.id}
          onClick={() => onSelectSection(selectedSection === section.id ? null : section.id as SectionType)}
          className={cn(
            'relative cursor-pointer group transition-all',
            selectedSection === section.id && 'ring-2 ring-inset ring-brand-500'
          )}
        >
          {/* Section label on hover */}
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="px-2 py-1 rounded-lg bg-brand-500 text-white text-[10px] font-medium shadow-sm">
              {section.label}
            </span>
          </div>

          <PreviewSection section={section} bd={bd} name={name} color={primaryColor} galleryImages={galleryImages} />
        </div>
      ))}
    </div>
  )
}

function PreviewSection({ section, bd, name, color, galleryImages }: { section: SectionConfig; bd: any; name: string; color: string; galleryImages: any[] }) {
  switch (section.id) {
    case 'hero':
      return (
        <div
          className="px-8 py-16 text-center relative overflow-hidden"
          style={bd.heroImage ? undefined : { background: `linear-gradient(135deg, ${color}12, ${color}06)` }}
        >
          {bd.heroImage && (
            <img src={bd.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          )}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4 border" style={{ color, borderColor: `${color}40`, backgroundColor: `${color}10` }}>
              <Sparkles className="h-3 w-3" /> Bienvenido
            </div>
            <h1 className="text-3xl font-extrabold text-surface-900 mb-3">{name}</h1>
            <p className="text-surface-500 text-sm mb-6 max-w-md mx-auto">{bd.tagline}</p>
            <div className="flex items-center justify-center gap-3">
              <div className="h-9 px-5 rounded-xl text-sm font-semibold text-white flex items-center" style={{ backgroundColor: color }}>Contactar</div>
              <div className="h-9 px-5 rounded-xl text-sm font-semibold text-surface-700 flex items-center border border-surface-200">Ver servicios</div>
            </div>
          </div>
        </div>
      )
    case 'services':
      return (
        <div className="px-8 py-12">
          <h2 className="text-xl font-bold text-center mb-8">Nuestros Servicios</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {bd.services.slice(0, 6).map((svc: any) => (
              <div key={svc.id} className="p-4 rounded-xl border border-surface-100 hover:shadow-soft transition-shadow">
                <div className="text-2xl mb-2">{svc.emoji ?? '✦'}</div>
                <h3 className="font-semibold text-sm mb-1">{svc.name}</h3>
                <p className="text-xs text-surface-500 line-clamp-2">{svc.description}</p>
              </div>
            ))}
          </div>
        </div>
      )
    case 'about':
      return (
        <div className="px-8 py-12 bg-surface-50">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl font-bold mb-4">Sobre Nosotros</h2>
            <p className="text-sm text-surface-500 leading-relaxed">{bd.description}</p>
          </div>
        </div>
      )
    case 'testimonials':
      return (
        <div className="px-8 py-12">
          <h2 className="text-xl font-bold text-center mb-8">Lo que dicen nuestros clientes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bd.testimonials.slice(0, 3).map((t: any) => (
              <div key={t.id} className="p-4 rounded-xl border border-surface-100">
                <div className="flex mb-2">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} className="h-3 w-3 fill-warning-400 text-warning-400" />)}
                </div>
                <p className="text-xs text-surface-600 italic mb-3">"{t.content}"</p>
                <p className="text-xs font-semibold">{t.author}</p>
                <p className="text-xs text-surface-400">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      )
    case 'contact':
      return (
        <div className="px-8 py-12" style={{ backgroundColor: `${color}08` }}>
          <h2 className="text-xl font-bold text-center mb-8">Contacto</h2>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4" style={{ color }} />{bd.contact.phone}</div>
            <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4" style={{ color }} />{bd.contact.email}</div>
            <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4" style={{ color }} />{bd.contact.address}</div>
          </div>
        </div>
      )
    case 'team':
      return (
        <div className="px-8 py-12 bg-surface-50">
          <h2 className="text-xl font-bold text-center mb-8">Nuestro Equipo</h2>
          <div className="flex flex-wrap justify-center gap-6">
            {bd.team.slice(0, 4).map((m: any) => (
              <div key={m.id} className="text-center">
                {m.image
                  ? <img src={m.image} alt={m.name} className="h-16 w-16 rounded-2xl object-cover mx-auto mb-2" />
                  : <div className="h-16 w-16 rounded-2xl gradient-brand mx-auto mb-2 flex items-center justify-center text-white font-bold">{m.name.charAt(0)}</div>
                }
                <p className="text-sm font-semibold">{m.name}</p>
                <p className="text-xs text-surface-400">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      )
    case 'faq':
      return (
        <div className="px-8 py-12">
          <h2 className="text-xl font-bold text-center mb-8">Preguntas Frecuentes</h2>
          <div className="max-w-2xl mx-auto space-y-3">
            {bd.faqs.slice(0, 4).map((faq: any) => (
              <div key={faq.id} className="border border-surface-100 rounded-xl p-4">
                <p className="text-sm font-semibold mb-1.5">{faq.question}</p>
                <p className="text-xs text-surface-500">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )
    case 'gallery': {
      const imgs: string[] = bd.galleryImages ?? []
      return (
        <div className="px-8 py-12 bg-surface-50">
          <h2 className="text-xl font-bold text-center mb-8">Galería</h2>
          <div className="grid grid-cols-3 gap-3">
            {imgs.length > 0
              ? imgs.map((url, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))
              : [...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-surface-200 flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-surface-300" />
                  </div>
                ))
            }
          </div>
        </div>
      )
    }
    case 'stats':
      return (
        <div className="px-8 py-12" style={{ backgroundColor: color }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            {[['500+','Clientes'],['10+','Años'],['98%','Satisfacción'],['24/7','Soporte']].map(([v, l]) => (
              <div key={l}><p className="text-3xl font-extrabold">{v}</p><p className="text-sm opacity-75 mt-1">{l}</p></div>
            ))}
          </div>
        </div>
      )
    case 'footer':
      return (
        <div className="px-8 py-8 bg-surface-900 text-center">
          <p className="text-sm font-bold text-white mb-1">{name}</p>
          <p className="text-xs text-white/40">© 2025 · Todos los derechos reservados</p>
        </div>
      )
    default:
      return (
        <div className="px-8 py-12 text-center bg-surface-50">
          <p className="text-sm text-surface-400">{section.label}</p>
        </div>
      )
  }
}
