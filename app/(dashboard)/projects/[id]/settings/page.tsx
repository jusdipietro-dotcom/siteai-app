'use client'
import { useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Save, Globe, Search, BarChart2, Share2, Upload, ExternalLink, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useProjectStore } from '@/store/useProjectStore'
import { cn } from '@/lib/utils'

// ─── Image upload helper ──────────────────────────────────────────────────────

function useImageUpload(category: string) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload(file: File): Promise<string | null> {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('category', category)
      const res = await fetch('/api/media', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      const media = await res.json()
      return media.url as string
    } catch {
      toast.error('Error al subir imagen')
      return null
    } finally {
      setUploading(false)
    }
  }

  return { uploading, inputRef, upload }
}

// ─── ImageUploadField ─────────────────────────────────────────────────────────

function ImageUploadField({
  label,
  hint,
  value,
  onChange,
  category,
  previewClass = '',
}: {
  label: string
  hint: string
  value: string
  onChange: (url: string) => void
  category: string
  previewClass?: string
}) {
  const { uploading, inputRef, upload } = useImageUpload(category)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await upload(file)
    if (url) onChange(url)
    e.target.value = ''
  }

  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} title={label} />
      {value ? (
        <div className="flex items-center gap-3">
          <div className={cn('relative rounded-xl overflow-hidden border border-surface-200 bg-surface-50 flex items-center justify-center', previewClass)}>
            <Image src={value} alt={label} fill className="object-contain p-2" />
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50"
          >
            <Pencil className="w-3.5 h-3.5" />
            {uploading ? 'Subiendo...' : 'Cambiar imagen'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-surface-200 rounded-xl p-6 text-center hover:border-brand-400 hover:bg-brand-50/30 transition-colors disabled:opacity-50"
        >
          <Upload className="w-7 h-7 text-surface-300 mx-auto mb-2" />
          <p className="text-sm text-surface-500 mb-1">
            {uploading ? 'Subiendo...' : 'Clic para subir'}
          </p>
          <p className="text-xs text-surface-400">{hint}</p>
        </button>
      )}
    </div>
  )
}

// ─── SEO Preview ──────────────────────────────────────────────────────────────

function SeoPreview({ title, description, slug }: { title: string; description: string; slug: string }) {
  return (
    <div className="bg-white border border-surface-200 rounded-xl p-4 space-y-1">
      <p className="text-xs text-surface-400 mb-2 font-medium">Vista previa en Google</p>
      <p className="text-[#1a0dab] text-base font-medium leading-tight truncate">
        {title || 'Título del sitio'}
      </p>
      <p className="text-[#006621] text-xs truncate">
        https://siteai.app/{slug || 'mi-negocio'} ›
      </p>
      <p className="text-[#545454] text-sm line-clamp-2">
        {description || 'Descripción de tu negocio que aparecerá en los resultados de búsqueda.'}
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const params = useParams()
  const id = params.id as string
  const { projects, updateProject } = useProjectStore()
  const project = projects.find((p) => p.id === id)
  const [saving, setSaving] = useState(false)

  // General
  const [name, setName] = useState(project?.name ?? '')
  const [slug, setSlug] = useState(project?.slug ?? '')
  const [logoUrl, setLogoUrl] = useState(project?.businessData.branding.logoId ?? '')
  const [faviconUrl, setFaviconUrl] = useState(project?.businessData.branding.faviconId ?? '')

  // SEO
  const [seoTitle, setSeoTitle] = useState(project?.businessData.seo.title ?? '')
  const [seoDesc, setSeoDesc] = useState(project?.businessData.seo.description ?? '')
  const [seoKeywords, setSeoKeywords] = useState(project?.businessData.seo.keywords ?? '')
  const [sitemapEnabled, setSitemapEnabled] = useState(project?.businessData.seo.sitemapEnabled ?? true)

  // Analytics
  const [gaEnabled, setGaEnabled] = useState(!!project?.gaId)
  const [gaId, setGaId] = useState(project?.gaId ?? '')

  // Socials
  const [instagram, setInstagram] = useState(project?.businessData.socials.instagram ?? '')
  const [facebook, setFacebook] = useState(project?.businessData.socials.facebook ?? '')
  const [linkedin, setLinkedin] = useState(project?.businessData.socials.linkedin ?? '')
  const [twitter, setTwitter] = useState(project?.businessData.socials.twitter ?? '')
  const [tiktok, setTiktok] = useState(project?.businessData.socials.tiktok ?? '')

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen text-surface-500">
        Proyecto no encontrado
      </div>
    )
  }

  function handleSlugChange(value: string) {
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error('El nombre del proyecto es obligatorio')
      return
    }
    if (!slug.trim()) {
      toast.error('El slug es obligatorio')
      return
    }
    setSaving(true)
    try {
      updateProject(id, {
        name: name.trim(),
        slug: slug.trim(),
        gaId: gaEnabled ? gaId.trim() : undefined,
        businessData: {
          ...project.businessData,
          branding: {
            ...project.businessData.branding,
            ...(logoUrl ? { logoId: logoUrl } : {}),
            ...(faviconUrl ? { faviconId: faviconUrl } : {}),
          },
          seo: {
            title: seoTitle.trim(),
            description: seoDesc.trim(),
            keywords: seoKeywords.trim(),
            sitemapEnabled,
          },
          socials: {
            ...project.businessData.socials,
            instagram: instagram.trim(),
            facebook: facebook.trim(),
            linkedin: linkedin.trim(),
            twitter: twitter.trim(),
            tiktok: tiktok.trim(),
          },
        },
      })
      toast.success('Configuración guardada')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50/50">
      {/* Header */}
      <div className="bg-white border-b border-surface-100 px-6 lg:px-10 py-5 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl text-surface-400 hover:bg-surface-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-surface-900">Configuración</h1>
              <p className="text-sm text-surface-500">{project.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/projects/${id}/editor`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Abrir editor
              </Button>
            </Link>
            <Button variant="gradient" className="gap-2" loading={saving} onClick={handleSave}>
              <Save className="w-4 h-4" /> Guardar cambios
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <Tabs defaultValue="general">
          <TabsList className="mb-8">
            <TabsTrigger value="general" className="gap-1.5">
              <Globe className="w-3.5 h-3.5" /> General
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-1.5">
              <Search className="w-3.5 h-3.5" /> SEO
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5">
              <BarChart2 className="w-3.5 h-3.5" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="socials" className="gap-1.5">
              <Share2 className="w-3.5 h-3.5" /> Redes
            </TabsTrigger>
          </TabsList>

          {/* ── General ── */}
          <TabsContent value="general" className="space-y-6">
            <div className="bg-white rounded-2xl border border-surface-100 p-6 space-y-5">
              <h2 className="font-semibold text-surface-900">Información del proyecto</h2>
              <div className="space-y-1.5">
                <Label>Nombre del proyecto</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mi Negocio"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Subdominio</Label>
                <div className="flex items-center">
                  <span className="px-3 h-10 flex items-center bg-surface-50 border border-r-0 border-surface-200 rounded-l-xl text-sm text-surface-500">
                    siteai.app/
                  </span>
                  <Input
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="rounded-l-none border-l-0"
                    placeholder="mi-negocio"
                  />
                </div>
                <p className="text-xs text-surface-400">Solo letras minúsculas, números y guiones.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-surface-100 p-6 space-y-5">
              <h2 className="font-semibold text-surface-900">Logo y favicon</h2>
              <ImageUploadField
                label="Logo del negocio"
                hint="PNG, JPG o SVG · Recomendado: 200×80 px"
                value={logoUrl}
                onChange={setLogoUrl}
                category="logo"
                previewClass="w-40 h-16"
              />
              <ImageUploadField
                label="Favicon"
                hint="PNG o ICO · 32×32 px"
                value={faviconUrl}
                onChange={setFaviconUrl}
                category="favicon"
                previewClass="w-12 h-12"
              />
            </div>
          </TabsContent>

          {/* ── SEO ── */}
          <TabsContent value="seo" className="space-y-5">
            <div className="bg-white rounded-2xl border border-surface-100 p-6 space-y-5">
              <h2 className="font-semibold text-surface-900">SEO básico</h2>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Título del sitio</Label>
                  <span className={cn('text-xs', seoTitle.length > 60 ? 'text-red-500 font-medium' : 'text-surface-400')}>
                    {seoTitle.length}/60
                  </span>
                </div>
                <Input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Mi Negocio · Servicios Profesionales"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Descripción meta</Label>
                  <span className={cn('text-xs', seoDesc.length > 155 ? 'text-red-500 font-medium' : 'text-surface-400')}>
                    {seoDesc.length}/155
                  </span>
                </div>
                <Textarea
                  value={seoDesc}
                  onChange={(e) => setSeoDesc(e.target.value)}
                  rows={3}
                  placeholder="Descripción clara de tu negocio para Google."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Keywords (separadas por coma)</Label>
                <Input
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  placeholder="abogado, derecho laboral, Buenos Aires"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-surface-900">Sitemap XML</p>
                  <p className="text-xs text-surface-400">Genera un sitemap.xml para Google</p>
                </div>
                <Switch checked={sitemapEnabled} onCheckedChange={setSitemapEnabled} />
              </div>

              <SeoPreview title={seoTitle} description={seoDesc} slug={slug} />
            </div>
          </TabsContent>

          {/* ── Analytics ── */}
          <TabsContent value="analytics" className="space-y-5">
            <div className="bg-white rounded-2xl border border-surface-100 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-surface-900">Google Analytics 4</h2>
                  <p className="text-xs text-surface-400 mt-0.5">Requiere plan Professional</p>
                </div>
                <Switch checked={gaEnabled} onCheckedChange={setGaEnabled} />
              </div>

              {gaEnabled ? (
                <div className="space-y-1.5">
                  <Label>ID de medición</Label>
                  <Input
                    value={gaId}
                    onChange={(e) => setGaId(e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                  />
                  <p className="text-xs text-surface-400">
                    Encontralo en Google Analytics → Admin → Flujos de datos
                  </p>
                </div>
              ) : (
                <div className="bg-surface-50 rounded-xl p-4 text-sm text-surface-500">
                  Activá Google Analytics para registrar visitas y métricas de tu sitio.
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Socials ── */}
          <TabsContent value="socials" className="space-y-5">
            <div className="bg-white rounded-2xl border border-surface-100 p-6 space-y-5">
              <h2 className="font-semibold text-surface-900">Redes sociales</h2>
              {[
                { label: 'Instagram', placeholder: '@tunegocio', value: instagram, onChange: setInstagram },
                { label: 'Facebook', placeholder: 'facebook.com/tunegocio', value: facebook, onChange: setFacebook },
                { label: 'LinkedIn', placeholder: 'linkedin.com/company/tunegocio', value: linkedin, onChange: setLinkedin },
                { label: 'Twitter / X', placeholder: '@tunegocio', value: twitter, onChange: setTwitter },
                { label: 'TikTok', placeholder: '@tunegocio', value: tiktok, onChange: setTiktok },
              ].map((s) => (
                <div key={s.label} className="space-y-1.5">
                  <Label>{s.label}</Label>
                  <Input value={s.value} onChange={(e) => s.onChange(e.target.value)} placeholder={s.placeholder} />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
