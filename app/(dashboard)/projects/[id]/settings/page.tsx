'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Globe, Search, BarChart2, Share2, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useProjectStore } from '@/store/useProjectStore'

export default function SettingsPage() {
  const params = useParams()
  const id = params.id as string
  const { projects, updateProject } = useProjectStore()
  const project = projects.find((p) => p.id === id)
  const [saving, setSaving] = useState(false)
  const [gaEnabled, setGaEnabled] = useState(false)

  if (!project) return <div className="flex items-center justify-center h-screen text-surface-500">Proyecto no encontrado</div>

  async function handleSave() {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSaving(false)
    toast.success('Configuración guardada')
  }

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-surface-100 px-6 lg:px-10 py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href={`/projects/${id}/editor`} className="p-2 rounded-xl text-surface-400 hover:bg-surface-100 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-surface-900">Configuración</h1>
              <p className="text-sm text-surface-500">{project.name}</p>
            </div>
          </div>
          <Button variant="gradient" className="gap-2" loading={saving} onClick={handleSave}>
            <Save className="w-4 h-4" /> Guardar cambios
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <Tabs defaultValue="general">
          <TabsList className="mb-8">
            <TabsTrigger value="general" className="gap-1.5"><Globe className="w-3.5 h-3.5" /> General</TabsTrigger>
            <TabsTrigger value="seo" className="gap-1.5"><Search className="w-3.5 h-3.5" /> SEO</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5"><BarChart2 className="w-3.5 h-3.5" /> Analytics</TabsTrigger>
            <TabsTrigger value="socials" className="gap-1.5"><Share2 className="w-3.5 h-3.5" /> Redes</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="bg-white rounded-2xl border border-surface-100 p-6 space-y-5">
              <h2 className="font-semibold text-surface-900">Información del proyecto</h2>
              <div className="space-y-1.5">
                <Label>Nombre del proyecto</Label>
                <Input defaultValue={project.name} />
              </div>
              <div className="space-y-1.5">
                <Label>Subdominio (mock)</Label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-surface-50 border border-r-0 border-surface-200 rounded-l-xl text-sm text-surface-500">
                    siteai.app/
                  </span>
                  <Input
                    defaultValue={project.slug}
                    className="rounded-l-none border-l-0"
                  />
                </div>
                <p className="text-xs text-surface-400">Solo letras, números y guiones.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Idioma</Label>
                <select className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30">
                  <option>Español (Argentina)</option>
                  <option>Español (España)</option>
                  <option>English</option>
                  <option>Português</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-surface-100 p-6 space-y-4">
              <h2 className="font-semibold text-surface-900">Logo y favicon</h2>
              {[
                { label: 'Logo del negocio', desc: 'PNG, JPG o SVG · Recomendado: 200x80px' },
                { label: 'Favicon', desc: 'PNG o ICO · 32x32px' },
              ].map((item) => (
                <div key={item.label}>
                  <Label className="mb-2">{item.label}</Label>
                  <div className="border-2 border-dashed border-surface-200 rounded-xl p-6 text-center hover:border-brand-400 cursor-pointer transition-colors">
                    <ImageIcon className="w-8 h-8 text-surface-300 mx-auto mb-2" />
                    <p className="text-sm text-surface-500 mb-1">Arrastrá o hacé clic para subir</p>
                    <p className="text-xs text-surface-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-5">
            <div className="bg-white rounded-2xl border border-surface-100 p-6 space-y-5">
              <h2 className="font-semibold text-surface-900">SEO básico</h2>
              <div className="space-y-1.5">
                <Label>Título del sitio</Label>
                <Input defaultValue={project.businessData.seo.title} />
                <p className="text-xs text-surface-400">Máx. 60 caracteres · {project.businessData.seo.title.length}/60</p>
              </div>
              <div className="space-y-1.5">
                <Label>Descripción meta</Label>
                <Textarea defaultValue={project.businessData.seo.description} rows={3} />
                <p className="text-xs text-surface-400">Máx. 155 caracteres</p>
              </div>
              <div className="space-y-1.5">
                <Label>Keywords (separadas por coma)</Label>
                <Input defaultValue={project.businessData.seo.keywords} />
              </div>
              <div className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-surface-900">Sitemap XML</p>
                  <p className="text-xs text-surface-400">Genera un sitemap.xml para Google</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-5">
            <div className="bg-white rounded-2xl border border-surface-100 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-surface-900">Google Analytics 4</h2>
                  <p className="text-xs text-surface-400 mt-0.5">Requiere plan Professional</p>
                </div>
                <Switch checked={gaEnabled} onCheckedChange={setGaEnabled} />
              </div>
              {gaEnabled && (
                <div className="space-y-1.5">
                  <Label>ID de medición (G-XXXXXXXX)</Label>
                  <Input placeholder="G-XXXXXXXXXX" />
                  <p className="text-xs text-surface-400">
                    Encontralo en{' '}
                    <a href="https://analytics.google.com" target="_blank" className="text-brand-600 hover:underline">
                      Google Analytics → Admin → Flujos de datos
                    </a>
                  </p>
                </div>
              )}
              {!gaEnabled && (
                <div className="bg-surface-50 rounded-xl p-4 text-sm text-surface-500">
                  Activá Google Analytics para ver las visitas y métricas de tu sitio.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="socials" className="space-y-5">
            <div className="bg-white rounded-2xl border border-surface-100 p-6 space-y-5">
              <h2 className="font-semibold text-surface-900">Redes sociales</h2>
              {[
                { label: 'Instagram', placeholder: '@tunegocio', value: project.businessData.socials.instagram },
                { label: 'Facebook', placeholder: 'facebook.com/tunegocio', value: project.businessData.socials.facebook },
                { label: 'LinkedIn', placeholder: 'linkedin.com/company/tunegocio', value: project.businessData.socials.linkedin },
                { label: 'Twitter / X', placeholder: '@tunegocio', value: '' },
              ].map((social) => (
                <div key={social.label} className="space-y-1.5">
                  <Label>{social.label}</Label>
                  <Input defaultValue={social.value} placeholder={social.placeholder} />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
