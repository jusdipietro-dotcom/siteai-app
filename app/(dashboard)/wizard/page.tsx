'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, X, Plus, Trash2, Check, Sparkles,
  Phone, Mail, MapPin, Instagram, Facebook, Linkedin, Twitter,
  Image as ImageIcon, Type, Globe, Search, Tag, Upload,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useWizardStore, TOTAL_WIZARD_STEPS } from '@/store/useWizardStore'
import { useProjectStore } from '@/store/useProjectStore'
import { useMediaStore } from '@/store/useMediaStore'
import { colorPresets, typographyOptions } from '@/config/themes'
import { businessTypes, toneOptions } from '@/data/mockBusinessTypes'
import { mockTemplates } from '@/data/mockTemplates'
import { generateId, slugify, cn } from '@/lib/utils'
import type { Project, SectionConfig, SectionType, ColorTheme } from '@/types'

// ─── Step metadata ────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Tipo',      title: 'Tipo de negocio',      subtitle: 'Elegí la categoría que mejor describe tu negocio' },
  { label: 'Info',      title: 'Información básica',    subtitle: 'Contanos sobre tu negocio' },
  { label: 'Servicios', title: 'Servicios',             subtitle: 'Listá lo que ofrecés (podés editar después)' },
  { label: 'Equipo',    title: 'Tu equipo',             subtitle: 'Opcional: agregá miembros del equipo' },
  { label: 'Contacto',  title: 'Datos de contacto',     subtitle: 'Cómo pueden comunicarse con vos' },
  { label: 'Estilo',    title: 'Colores y tipografía',  subtitle: 'Dale identidad visual a tu sitio' },
  { label: 'Template',  title: 'Diseño base',           subtitle: 'Elegí un template como punto de partida' },
  { label: 'Secciones', title: 'Secciones del sitio',   subtitle: 'Seleccioná qué bloques querés en tu página' },
  { label: 'Imágenes',  title: 'Imágenes',              subtitle: 'Elegí logo e imagen principal' },
  { label: 'Confirmar', title: 'SEO y revisión final',  subtitle: 'Revisá todo antes de generar tu sitio' },
]

// ─── Available sections ───────────────────────────────────────────────────────

const ALL_SECTIONS: { id: SectionType; label: string; desc: string; required?: boolean; emoji: string }[] = [
  { id: 'hero',         label: 'Inicio / Hero',     desc: 'Presentación principal con CTA',      required: true,  emoji: '🦸' },
  { id: 'about',        label: 'Sobre mí / Nosotros', desc: 'Historia y propósito del negocio', emoji: '💡' },
  { id: 'services',     label: 'Servicios',          desc: 'Lista de productos o servicios',      emoji: '📋' },
  { id: 'gallery',      label: 'Galería',            desc: 'Portfolio de fotos o trabajos',       emoji: '🖼️' },
  { id: 'team',         label: 'Equipo',             desc: 'Presentación del equipo',             emoji: '👥' },
  { id: 'testimonials', label: 'Testimonios',        desc: 'Reseñas y opiniones de clientes',     emoji: '💬' },
  { id: 'faq',          label: 'Preguntas frecuentes', desc: 'Respondé las dudas comunes',        emoji: '❓' },
  { id: 'pricing',      label: 'Precios',            desc: 'Tabla de planes o tarifas',           emoji: '💰' },
  { id: 'stats',        label: 'Estadísticas',       desc: 'Números que transmiten confianza',    emoji: '📊' },
  { id: 'cta',          label: 'Llamada a la acción', desc: 'Sección con botón de contacto',      emoji: '📣' },
  { id: 'contact',      label: 'Contacto',           desc: 'Formulario y datos de contacto',      required: true,  emoji: '📞' },
  { id: 'footer',       label: 'Footer',             desc: 'Pie de página con links y legal',     required: true,  emoji: '📌' },
]

// ─── Progress bar ─────────────────────────────────────────────────────────────

function WizardProgress({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100)
  return (
    <div className="h-1.5 w-full bg-surface-100 rounded-full overflow-hidden">
      <motion.div
        className="h-full gradient-brand rounded-full"
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  )
}

// ─── Step 1: Business Type ────────────────────────────────────────────────────

function Step1({ data, setField }: { data: any; setField: any }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {businessTypes.map((bt) => (
        <button
          key={bt.id}
          type="button"
          onClick={() => setField('businessType', bt.id)}
          className={cn(
            'flex flex-col items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all',
            data.businessType === bt.id
              ? 'border-brand-500 bg-brand-50 shadow-md'
              : 'border-surface-200 bg-white hover:border-surface-300 hover:bg-surface-50'
          )}
        >
          <div className="flex items-center gap-2 w-full">
            <span className="text-2xl">{bt.icon}</span>
            {data.businessType === bt.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto h-5 w-5 rounded-full bg-brand-500 flex items-center justify-center"
              >
                <Check className="h-3 w-3 text-white" />
              </motion.div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-800">{bt.name}</p>
            <p className="text-xs text-surface-500 mt-0.5">{bt.description}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── Step 2: Basic Info ───────────────────────────────────────────────────────

function Step2({ data, setField }: { data: any; setField: any }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-5">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-700">Nombre del negocio *</label>
          <input
            value={data.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Ej: Estudio Di Pietro, La Romana, FitLife Gym..."
            title="Nombre del negocio"
            className="field-input h-10 text-base"
          />
        </div>

        {/* Tagline */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-700">Slogan o tagline</label>
          <input
            value={data.tagline}
            onChange={(e) => setField('tagline', e.target.value)}
            placeholder="Ej: Tu abogado de confianza, Cocina de autor, Entrená diferente..."
            title="Slogan del negocio"
            className="field-input h-10"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-surface-700">Descripción del negocio *</label>
          <textarea
            value={data.description}
            onChange={(e) => setField('description', e.target.value)}
            rows={4}
            placeholder="Contá quiénes son, qué hacen, cuál es su propuesta de valor..."
            title="Descripción del negocio"
            className="field-textarea"
          />
          <p className="text-xs text-surface-400">{data.description.length} / 500 caracteres recomendados</p>
        </div>

        {/* Tone */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-surface-700">Tono de comunicación</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {toneOptions.map((tone) => (
              <button
                key={tone.id}
                type="button"
                onClick={() => setField('tone', tone.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all text-left',
                  data.tone === tone.id
                    ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                    : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
                )}
              >
                <span>{tone.emoji}</span>
                <div>
                  <p className="font-medium text-xs">{tone.label}</p>
                  <p className="text-[10px] text-surface-400">{tone.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Services ─────────────────────────────────────────────────────────

function Step3({ data, setField }: { data: any; setField: any }) {
  const addService = () => {
    setField('services', [...data.services, { id: generateId(), name: '', description: '', price: '' }])
  }

  const updateService = (id: string, field: string, value: string) => {
    setField('services', data.services.map((s: any) => s.id === id ? { ...s, [field]: value } : s))
  }

  const removeService = (id: string) => {
    setField('services', data.services.filter((s: any) => s.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {data.services.map((service: any, idx: number) => (
            <motion.div
              key={service.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border border-surface-200 rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Servicio {idx + 1}</p>
                <button
                  type="button"
                  onClick={() => removeService(service.id)}
                  className="h-6 w-6 rounded-lg hover:bg-danger-50 flex items-center justify-center text-surface-400 hover:text-danger-600 transition-colors"
                  title="Eliminar servicio"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <input
                  value={service.name}
                  onChange={(e) => updateService(service.id, 'name', e.target.value)}
                  placeholder="Nombre del servicio"
                  title="Nombre del servicio"
                  className="field-input sm:col-span-2"
                />
                <input
                  value={service.price}
                  onChange={(e) => updateService(service.id, 'price', e.target.value)}
                  placeholder="Precio (ej: $5.000)"
                  title="Precio"
                  className="field-input"
                />
              </div>
              <textarea
                value={service.description}
                onChange={(e) => updateService(service.id, 'description', e.target.value)}
                rows={2}
                placeholder="Breve descripción de este servicio..."
                title="Descripción del servicio"
                className="field-textarea"
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {data.services.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-surface-200 rounded-2xl bg-surface-50">
            <p className="text-sm text-surface-500">Aún no agregaste servicios</p>
            <p className="text-xs text-surface-400 mt-1">Podés agregar hasta 6 servicios o saltearte este paso</p>
          </div>
        )}
      </div>

      {data.services.length < 6 && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={addService}
        >
          Agregar servicio
        </Button>
      )}
    </div>
  )
}

// ─── Step 4: Team ─────────────────────────────────────────────────────────────

function Step4({ data, setField }: { data: any; setField: any }) {
  const addMember = () => {
    setField('team', [...data.team, { id: generateId(), name: '', role: '', bio: '' }])
  }

  const updateMember = (id: string, field: string, value: string) => {
    setField('team', data.team.map((m: any) => m.id === id ? { ...m, [field]: value } : m))
  }

  const removeMember = (id: string) => {
    setField('team', data.team.filter((m: any) => m.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 text-sm text-brand-700">
        <p className="font-medium">Paso opcional</p>
        <p className="text-brand-600 text-xs mt-0.5">Podés saltear este paso y agregar el equipo desde el editor.</p>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {data.team.map((member: any, idx: number) => (
            <motion.div
              key={member.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border border-surface-200 rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Miembro {idx + 1}</p>
                <button
                  type="button"
                  onClick={() => removeMember(member.id)}
                  className="h-6 w-6 rounded-lg hover:bg-danger-50 flex items-center justify-center text-surface-400 hover:text-danger-600 transition-colors"
                  title="Eliminar miembro"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  value={member.name}
                  onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                  placeholder="Nombre completo"
                  title="Nombre del miembro"
                  className="field-input"
                />
                <input
                  value={member.role}
                  onChange={(e) => updateMember(member.id, 'role', e.target.value)}
                  placeholder="Cargo o rol (ej: Director, Médica)"
                  title="Cargo del miembro"
                  className="field-input"
                />
              </div>
              <textarea
                value={member.bio}
                onChange={(e) => updateMember(member.id, 'bio', e.target.value)}
                rows={2}
                placeholder="Bio breve..."
                title="Biografía"
                className="field-textarea"
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {data.team.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-surface-200 rounded-2xl bg-surface-50">
            <p className="text-sm text-surface-500">Sin miembros del equipo</p>
          </div>
        )}
      </div>

      {data.team.length < 8 && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={addMember}
        >
          Agregar miembro
        </Button>
      )}
    </div>
  )
}

// ─── Step 5: Contact ──────────────────────────────────────────────────────────

function Step5({ data, setField }: { data: any; setField: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-surface-200 rounded-2xl p-5 space-y-4">
        <p className="text-sm font-semibold text-surface-700 flex items-center gap-2">
          <Phone className="h-4 w-4 text-brand-500" /> Teléfono y WhatsApp
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-500">Teléfono</label>
            <input
              value={data.phone}
              onChange={(e) => setField('phone', e.target.value)}
              placeholder="+54 9 11 1234-5678"
              title="Teléfono"
              className="field-input"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-500">WhatsApp</label>
            <input
              value={data.whatsapp}
              onChange={(e) => setField('whatsapp', e.target.value)}
              placeholder="+54 9 11 1234-5678"
              title="WhatsApp"
              className="field-input"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-surface-200 rounded-2xl p-5 space-y-4">
        <p className="text-sm font-semibold text-surface-700 flex items-center gap-2">
          <Mail className="h-4 w-4 text-brand-500" /> Email y dirección
        </p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-500">Email de contacto *</label>
            <input
              value={data.email}
              onChange={(e) => setField('email', e.target.value)}
              type="email"
              placeholder="contacto@tunegocio.com"
              title="Email de contacto"
              className="field-input"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-500">Dirección</label>
            <input
              value={data.address}
              onChange={(e) => setField('address', e.target.value)}
              placeholder="Av. Corrientes 1234, CABA"
              title="Dirección"
              className="field-input"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-surface-500">Ciudad</label>
              <input
                value={data.city}
                onChange={(e) => setField('city', e.target.value)}
                placeholder="Buenos Aires"
                title="Ciudad"
                className="field-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-surface-500">Provincia</label>
              <input
                value={data.province}
                onChange={(e) => setField('province', e.target.value)}
                placeholder="Buenos Aires"
                title="Provincia"
                className="field-input"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-surface-200 rounded-2xl p-5 space-y-4">
        <p className="text-sm font-semibold text-surface-700">Redes sociales <span className="text-surface-400 font-normal">(opcionales)</span></p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { key: 'instagram', icon: <Instagram className="h-3.5 w-3.5" />, placeholder: '@tunegocio' },
            { key: 'facebook',  icon: <Facebook  className="h-3.5 w-3.5" />, placeholder: 'facebook.com/tunegocio' },
            { key: 'linkedin',  icon: <Linkedin  className="h-3.5 w-3.5" />, placeholder: 'linkedin.com/company/...' },
            { key: 'twitter',   icon: <Twitter   className="h-3.5 w-3.5" />, placeholder: '@tunegocio' },
          ].map(({ key, icon, placeholder }) => (
            <div key={key} className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">{icon}</div>
              <input
                value={(data.socials as any)[key] ?? ''}
                onChange={(e) => setField('socials', { ...data.socials, [key]: e.target.value })}
                placeholder={placeholder}
                title={key}
                className="field-input pl-8"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 6: Style ────────────────────────────────────────────────────────────

function Step6({ data, setField, setColorTheme }: { data: any; setField: any; setColorTheme: any }) {
  useEffect(() => {
    typographyOptions.forEach((font) => {
      const id = `gfont-${font.id}`
      if (!document.getElementById(id)) {
        const link = document.createElement('link')
        link.id = id
        link.rel = 'stylesheet'
        link.href = font.googleUrl
        document.head.appendChild(link)
      }
    })
  }, [])

  return (
    <div className="space-y-6">
      {/* Color presets */}
      <div className="bg-white border border-surface-200 rounded-2xl p-5 space-y-4">
        <p className="text-sm font-semibold text-surface-700">Paleta de colores</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {colorPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setColorTheme(preset.id as ColorTheme, preset.primary)}
              className={cn(
                'rounded-xl p-3 border-2 text-left transition-all',
                data.colorTheme === preset.id
                  ? 'border-brand-500 bg-brand-50 shadow-md'
                  : 'border-surface-200 bg-white hover:border-surface-300'
              )}
            >
              <div className="flex gap-1 mb-2">
                {preset.swatches.slice(0, 4).map((s) => (
                  <div
                    key={s}
                    className="h-4 w-4 rounded-full flex-shrink-0"
                    ref={(el) => { if (el) el.style.backgroundColor = s }}
                  />
                ))}
              </div>
              <p className="text-xs font-semibold text-surface-800">{preset.name}</p>
              <p className="text-[10px] text-surface-500 mt-0.5 leading-tight">{preset.description}</p>
              {data.colorTheme === preset.id && (
                <div className="mt-2">
                  <span className="text-[10px] font-medium text-brand-600 bg-brand-100 px-2 py-0.5 rounded-full">
                    Seleccionado
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div className="bg-white border border-surface-200 rounded-2xl p-5 space-y-4">
        <p className="text-sm font-semibold text-surface-700 flex items-center gap-2">
          <Type className="h-4 w-4 text-brand-500" /> Tipografía
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-surface-500">Titulares</label>
            <div className="space-y-1.5">
              {typographyOptions.slice(0, 5).map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => setField('fontHeading', font.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition-all',
                    data.fontHeading === font.id
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-surface-200 bg-white text-surface-700 hover:border-surface-300'
                  )}
                >
                  <span style={{ fontFamily: font.cssFamily }}>{font.name}</span>
                  <span className="text-xs text-surface-400 capitalize">{font.category}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-surface-500">Cuerpo de texto</label>
            <div className="space-y-1.5">
              {typographyOptions.slice(0, 5).map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => setField('fontBody', font.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition-all',
                    data.fontBody === font.id
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-surface-200 bg-white text-surface-700 hover:border-surface-300'
                  )}
                >
                  <span style={{ fontFamily: font.cssFamily }}>{font.name}</span>
                  <span className="text-xs text-surface-400 capitalize">{font.category}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 7: Template ─────────────────────────────────────────────────────────

function Step7({ data, setField }: { data: any; setField: any }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {mockTemplates.map((tpl) => (
        <button
          key={tpl.id}
          type="button"
          onClick={() => setField('template', tpl.id)}
          className={cn(
            'relative rounded-2xl border-2 text-left overflow-hidden transition-all',
            data.template === tpl.id
              ? 'border-brand-500 shadow-lg ring-2 ring-brand-500/20'
              : 'border-surface-200 hover:border-surface-300'
          )}
        >
          {/* Thumbnail */}
          <div className="aspect-[4/3] bg-surface-100 relative">
            <img
              src={tpl.thumbnail}
              alt={tpl.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Badges */}
            <div className="absolute top-2 left-2 flex gap-1">
              {tpl.popular && (
                <span className="text-[10px] font-bold bg-warning-400 text-white px-2 py-0.5 rounded-full">Popular</span>
              )}
              {tpl.isNew && (
                <span className="text-[10px] font-bold bg-success-500 text-white px-2 py-0.5 rounded-full">Nuevo</span>
              )}
              {tpl.premium && (
                <span className="text-[10px] font-bold bg-violet-600 text-white px-2 py-0.5 rounded-full">Pro</span>
              )}
            </div>
            {/* Selected overlay */}
            {data.template === tpl.id && (
              <div className="absolute inset-0 bg-brand-600/20 flex items-center justify-center">
                <div className="h-10 w-10 rounded-full bg-brand-500 flex items-center justify-center">
                  <Check className="h-5 w-5 text-white" />
                </div>
              </div>
            )}
          </div>
          {/* Info */}
          <div className="p-3 bg-white">
            <p className="text-sm font-bold text-surface-900">{tpl.name}</p>
            <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{tpl.description}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── Step 8: Sections ─────────────────────────────────────────────────────────

function Step8({ data, toggleSection }: { data: any; toggleSection: any }) {
  return (
    <div className="space-y-4">
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 text-sm text-brand-700">
        <p className="font-medium">Hero, Contacto y Footer son obligatorios</p>
        <p className="text-brand-600 text-xs mt-0.5">Podés agregar o quitar secciones desde el editor en cualquier momento.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {ALL_SECTIONS.map((section) => {
          const enabled = data.enabledSections.includes(section.id)
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => !section.required && toggleSection(section.id)}
              disabled={section.required}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all',
                enabled
                  ? section.required
                    ? 'border-surface-300 bg-surface-100 cursor-not-allowed'
                    : 'border-brand-500 bg-brand-50'
                  : 'border-surface-200 bg-white hover:border-surface-300',
              )}
            >
              <span className="text-xl shrink-0">{section.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn('text-sm font-medium', enabled ? 'text-surface-800' : 'text-surface-600')}>
                    {section.label}
                  </p>
                  {section.required && (
                    <span className="text-[10px] font-medium text-surface-500 bg-surface-200 px-1.5 py-0.5 rounded-full">
                      Fijo
                    </span>
                  )}
                </div>
                <p className="text-xs text-surface-400">{section.desc}</p>
              </div>
              <div className={cn(
                'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                enabled ? 'bg-brand-500 border-brand-500' : 'border-surface-300'
              )}>
                {enabled && <Check className="h-3 w-3 text-white" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 9: Images ───────────────────────────────────────────────────────────

// URLs de Unsplash usadas para simular uploads reales
const UPLOAD_POOL = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
  'https://images.unsplash.com/photo-1556742031-c6961e8560b0?w=1200&q=80',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&q=80',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=80',
  'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&q=80',
]
let uploadPoolIdx = 0

// ─── AI image generation via Pollinations.ai (free, no API key) ───────────────

const AI_HERO_PROMPTS: Record<string, string[]> = {
  restaurante: [
    'elegant restaurant dining room, warm candlelight, wooden tables, cozy interior, cinematic photography',
    'delicious gourmet food presentation on rustic table, natural window light, bokeh background',
    'professional chef cooking in modern kitchen, culinary art, vibrant colors, action shot',
    'beautiful restaurant exterior at golden hour, inviting facade, warm neon lighting, night photography',
  ],
  abogado: [
    'modern law firm office interior, polished desk, law books, soft professional lighting, premium',
    'scales of justice on wooden desk, elegant law office, blurred bookshelf background',
    'confident lawyer in suit at modern office, natural window light, professional portrait',
    'contemporary corporate office building facade, glass and steel exterior, blue sky',
  ],
  consultorio: [
    'modern medical clinic reception, clean white interior, professional healthcare, calming atmosphere',
    'friendly doctor in white coat smiling at desk, warm natural light, professional healthcare',
    'calm therapy office, comfortable chairs, indoor plants, warm natural lighting, welcoming',
    'bright modern clinic corridor, clean minimalist design, healthcare professional setting',
  ],
  contable: [
    'modern accounting office interior, financial charts on screen, professional corporate setting',
    'business graphs on laptop, financial planning documents, professional desk, clean workspace',
    'confident accountant reviewing documents at modern office, natural light, professional',
    'clean corporate office interior, financial district view, glass walls, professional',
  ],
  inmobiliaria: [
    'luxury modern house exterior, manicured garden, golden hour light, real estate photography',
    'bright spacious living room, large windows city view, modern furniture, lifestyle photography',
    'aerial view modern residential neighborhood, architecture photography, professional shot',
    'real estate agent showing bright modern apartment, natural light, friendly professional',
  ],
  gimnasio: [
    'modern gym interior, rows of equipment, dramatic motivational lighting, fitness center',
    'athlete lifting weights in professional gym, intense focus, cinematic lighting, fitness',
    'bright yoga studio, group training class, healthy lifestyle, natural light',
    'fit person running on treadmill, modern fitness center, dynamic action, energy',
  ],
  peluqueria: [
    'modern hair salon interior, illuminated mirrors, professional styling chairs, clean elegant',
    'hairstylist working on client, professional beauty salon, warm lighting, beauty care',
    'beautiful woman with perfect styled hair, salon photography, soft lighting, glamour',
    'beauty products arranged elegantly on shelf, minimalist modern hair salon style',
  ],
  boutique: [
    'modern fashion boutique interior, clothing racks, stylish window display, warm elegant lighting',
    'curated clothing store interior, fashion photography, neutral palette, lifestyle',
    'stylish woman shopping in boutique, natural light, fashion photography, elegant retail',
    'minimalist clothing store, white walls, wood fixtures, professional retail photography',
  ],
  agencia: [
    'modern creative agency office, open plan, colorful collaborative workspace, startup energy',
    'diverse design team working on computers, modern workspace, natural light, collaboration',
    'sleek tech startup office, whiteboard brainstorming session, energetic professional atmosphere',
    'modern coworking space, ergonomic desks, large panoramic windows, professional',
  ],
  arquitectura: [
    'stunning modern building exterior, bold geometric architecture, blue sky, professional photo',
    'beautiful minimalist interior design, open plan living room, natural materials, design',
    'architect reviewing blueprints at studio, design process, professional creative space',
    'modern architectural project under construction, dramatic sky, professional photography',
  ],
  fotografo: [
    'photographer with professional camera, dramatic studio lighting, creative portrait session',
    'modern photography studio, professional lighting equipment, artistic creative setup',
    'beautiful landscape photography at golden hour, dramatic light, professional composition',
    'photo gallery exhibition, framed fine art prints on white walls, contemporary art space',
  ],
  profesional: [
    'confident professional at modern bright office, laptop open, productive workspace, natural light',
    'business consultant presenting to clients, modern meeting room, professional corporate',
    'life coach in bright minimalist office, whiteboard, motivational professional setting',
    'freelancer at clean desk home office, plants, natural light, productive calm atmosphere',
  ],
}

const DEFAULT_AI_PROMPTS = [
  'modern professional business office interior, bright natural light, clean minimal design',
  'successful business team in meeting room, professional corporate setting, natural light',
  'modern business building exterior, professional signage, welcoming entrance, sunny day',
  'professional business workspace, laptop and coffee, productive atmosphere, clean desk',
]

function getAIPrompts(businessType?: string): string[] {
  const base = (businessType && AI_HERO_PROMPTS[businessType]) || DEFAULT_AI_PROMPTS
  return base.map((p: string) => p + ', professional website hero image, high quality, 4k, photorealistic')
}

function pollinationsUrl(prompt: string, seed: number): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true&model=flux&seed=${seed}`
}

// ─────────────────────────────────────────────────────────────────────────────

interface UploadSlotProps {
  label: string
  hint: string
  aspect: 'square' | 'video'
  selectedId: string | undefined
  onSelect: (id: string | undefined) => void
  gallery: import('@/types').MediaFile[]
  category: import('@/types').MediaCategory
  businessType?: string
  businessName?: string
}

function UploadSlot({ label, hint, aspect, selectedId, onSelect, gallery, category, businessType, businessName }: UploadSlotProps) {
  const { addMockFile } = useMediaStore()
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [aiSeeds, setAISeeds] = useState<number[]>([])
  const [aiLoaded, setAILoaded] = useState<Record<number, boolean>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedFile = gallery.find((f) => f.id === selectedId)
  const canUseAI = aspect === 'video' && !!businessType

  const handleGenerate = () => {
    const seeds = Array.from({ length: 4 }, () => Math.floor(Math.random() * 99999))
    setAISeeds(seeds)
    setAILoaded({})
    setShowAIPanel(true)
    setShowGallery(false)
  }

  const handleSelectAI = (url: string, seed: number) => {
    const file = addMockFile(category, `ia-generada-${seed}.jpg`, url)
    onSelect(file.id)
    setShowAIPanel(false)
    toast.success('Imagen de IA seleccionada')
  }

  const doUpload = async (fileName: string) => {
    setUploading(true)
    await new Promise((r) => setTimeout(r, 1200))
    const url = UPLOAD_POOL[uploadPoolIdx % UPLOAD_POOL.length]
    uploadPoolIdx++
    const file = addMockFile(category, fileName, url)
    onSelect(file.id)
    setUploading(false)
    toast.success('Imagen subida correctamente')
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const maxMb = 5
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`El archivo supera los ${maxMb} MB`)
      return
    }
    doUpload(file.name)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) doUpload(file.name)
  }

  return (
    <div className="bg-white border border-surface-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-surface-700 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-brand-500" />
          {label}
          <span className="text-surface-400 font-normal text-xs">(opcional)</span>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {canUseAI && !selectedFile && (
            <button
              type="button"
              onClick={handleGenerate}
              className={cn(
                'text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-lg border transition-all',
                showAIPanel
                  ? 'bg-brand-50 border-brand-300 text-brand-700'
                  : 'border-surface-200 text-surface-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/50'
              )}
            >
              <Sparkles className="h-3 w-3" />
              Generar con IA
            </button>
          )}
          {gallery.length > 0 && (
            <button
              type="button"
              onClick={() => { setShowGallery((v) => !v); setShowAIPanel(false) }}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
            >
              {showGallery ? 'Ocultar galería' : `Galería (${gallery.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Vista previa de imagen seleccionada */}
      <AnimatePresence mode="wait">
        {selectedFile ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className={cn(
              'relative rounded-2xl overflow-hidden border-2 border-brand-500 ring-2 ring-brand-500/20 group',
              aspect === 'square' ? 'aspect-square max-w-[200px]' : 'aspect-video'
            )}
          >
            <img
              src={selectedFile.thumbnailUrl ?? selectedFile.url}
              alt={selectedFile.alt ?? selectedFile.name}
              className="w-full h-full object-cover"
            />
            {/* Overlay con acciones */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                title="Cambiar imagen"
                className="h-9 px-3 rounded-xl bg-white text-surface-800 text-xs font-semibold hover:bg-surface-50 transition-colors flex items-center gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" /> Cambiar
              </button>
              <button
                type="button"
                onClick={() => onSelect(undefined)}
                title="Quitar imagen"
                className="h-9 w-9 rounded-xl bg-danger-500 text-white flex items-center justify-center hover:bg-danger-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Badge seleccionado */}
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-brand-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
              <Check className="h-3 w-3" /> Seleccionada
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-2xl transition-all cursor-pointer',
              aspect === 'square' ? 'aspect-square max-w-[200px]' : 'aspect-video',
              dragging
                ? 'border-brand-400 bg-brand-50'
                : 'border-surface-200 bg-surface-50 hover:border-brand-300 hover:bg-brand-50/40'
            )}
          >
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4 text-center">
              {uploading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                    className="h-10 w-10 rounded-full border-3 border-brand-500 border-t-transparent"
                    style={{ borderWidth: 3 }}
                  />
                  <p className="text-sm text-brand-600 font-medium">Subiendo...</p>
                </>
              ) : (
                <>
                  <div className={cn(
                    'h-12 w-12 rounded-2xl flex items-center justify-center transition-colors',
                    dragging ? 'bg-brand-100 text-brand-600' : 'bg-white text-surface-400 shadow-sm'
                  )}>
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-700">
                      {dragging ? 'Soltá la imagen aquí' : hint}
                    </p>
                    {!dragging && (
                      <p className="text-xs text-surface-400 mt-0.5">PNG, JPG, WebP — máx. 5 MB</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input file oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFileInput}
        title="Subir imagen"
      />

      {/* Panel de generación con IA */}
      <AnimatePresence>
        {showAIPanel && aiSeeds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-surface-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-surface-600 flex items-center gap-1.5 font-medium">
                  <Sparkles className="h-3 w-3 text-brand-500" />
                  Imágenes generadas por IA — hacé clic para usar
                </p>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
                >
                  Regenerar
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {aiSeeds.map((seed, i) => {
                  const prompts = getAIPrompts(businessType)
                  const url = pollinationsUrl(prompts[i % prompts.length], seed)
                  const loaded = !!aiLoaded[seed]
                  return (
                    <button
                      key={seed}
                      type="button"
                      onClick={() => handleSelectAI(url, seed)}
                      disabled={!loaded}
                      className="relative aspect-video rounded-xl overflow-hidden border-2 border-surface-200 hover:border-brand-400 transition-all group disabled:cursor-wait"
                    >
                      {!loaded && (
                        <div className="absolute inset-0 bg-surface-100 flex flex-col items-center justify-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            className="h-6 w-6 rounded-full border-2 border-brand-400 border-t-transparent"
                          />
                          <span className="text-[10px] text-surface-400">Generando...</span>
                        </div>
                      )}
                      <img
                        src={url}
                        alt={`Imagen IA ${i + 1}`}
                        className={cn(
                          'w-full h-full object-cover transition-opacity duration-500',
                          loaded ? 'opacity-100' : 'opacity-0'
                        )}
                        onLoad={() => setAILoaded((prev) => ({ ...prev, [seed]: true }))}
                        onError={() => setAILoaded((prev) => ({ ...prev, [seed]: true }))}
                      />
                      {loaded && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="bg-white text-surface-800 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 text-brand-500" /> Usar esta
                          </span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              <p className="text-[10px] text-surface-400 text-center">
                Powered by <span className="font-medium">Pollinations.ai</span> · Modelo Flux · Gratuito
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Galería expandible */}
      <AnimatePresence>
        {showGallery && gallery.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-2 border-t border-surface-100">
              <p className="text-xs text-surface-500 mb-2">O elegí una imagen existente:</p>
              <div className={cn(
                'grid gap-2',
                aspect === 'square' ? 'grid-cols-4 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3'
              )}>
                {gallery.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => { onSelect(file.id); setShowGallery(false) }}
                    className={cn(
                      'relative overflow-hidden rounded-xl border-2 transition-all',
                      aspect === 'square' ? 'aspect-square' : 'aspect-video',
                      selectedId === file.id
                        ? 'border-brand-500 ring-1 ring-brand-500/20'
                        : 'border-surface-200 hover:border-brand-300'
                    )}
                  >
                    <img
                      src={file.thumbnailUrl ?? file.url}
                      alt={file.alt ?? file.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {selectedId === file.id && (
                      <div className="absolute inset-0 bg-brand-500/25 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Step9({ data, setField }: { data: any; setField: any }) {
  const { files } = useMediaStore()
  const logos  = files.filter((f) => f.category === 'logo')
  const heroes = files.filter((f) => f.category === 'hero')

  return (
    <div className="space-y-5">
      <UploadSlot
        label="Logo de tu negocio"
        hint="Arrastrá tu logo o hacé clic para subir"
        aspect="square"
        selectedId={data.logoId}
        onSelect={(id) => setField('logoId', id)}
        gallery={logos}
        category="logo"
      />
      <UploadSlot
        label="Imagen principal (Hero)"
        hint="Arrastrá una foto o hacé clic para subir"
        aspect="video"
        selectedId={data.heroImageId}
        onSelect={(id) => setField('heroImageId', id)}
        gallery={heroes}
        category="hero"
        businessType={data.businessType}
        businessName={data.businessName}
      />
      <p className="text-xs text-center text-surface-400">
        Podés cambiar las imágenes en cualquier momento desde el editor.
      </p>
    </div>
  )
}

// ─── Step 10: SEO + Confirm ───────────────────────────────────────────────────

function Step10({ data, setField }: { data: any; setField: any }) {
  const selectedType = businessTypes.find((bt) => bt.id === data.businessType)
  const selectedTemplate = mockTemplates.find((t) => t.id === data.template)
  const selectedTheme = colorPresets.find((p) => p.id === data.colorTheme)

  return (
    <div className="space-y-6">
      {/* SEO */}
      <div className="bg-white border border-surface-200 rounded-2xl p-5 space-y-4">
        <p className="text-sm font-semibold text-surface-700 flex items-center gap-2">
          <Search className="h-4 w-4 text-brand-500" /> SEO — Posicionamiento en Google
        </p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-500">Título en Google *</label>
            <input
              value={data.seoTitle}
              onChange={(e) => setField('seoTitle', e.target.value)}
              placeholder={`${data.name || 'Tu negocio'} — ${data.city || 'Buenos Aires'}`}
              title="Título SEO"
              className="field-input h-10"
            />
            <p className="text-xs text-surface-400">{data.seoTitle.length}/60 caracteres (ideal &lt;60)</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-500">Descripción en Google</label>
            <textarea
              value={data.seoDescription}
              onChange={(e) => setField('seoDescription', e.target.value)}
              rows={3}
              placeholder={`${data.description?.slice(0, 120) || 'Descripción de tu negocio para Google...'}`}
              title="Descripción SEO"
              className="field-textarea"
            />
            <p className="text-xs text-surface-400">{data.seoDescription.length}/160 caracteres (ideal &lt;160)</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-500 flex items-center gap-1">
              <Tag className="h-3 w-3" /> Palabras clave
            </label>
            <input
              value={data.seoKeywords}
              onChange={(e) => setField('seoKeywords', e.target.value)}
              placeholder="abogado, estudio jurídico, derecho civil, Buenos Aires..."
              title="Palabras clave SEO"
              className="field-input h-10"
            />
          </div>
        </div>

        {/* Google preview */}
        {(data.seoTitle || data.name) && (
          <div className="mt-2 bg-white border border-surface-200 rounded-xl p-4">
            <p className="text-xs text-surface-400 mb-2 font-medium">Vista previa en Google</p>
            <p className="text-base font-medium text-blue-700 hover:underline cursor-pointer leading-tight">
              {data.seoTitle || `${data.name} — ${data.city || 'Buenos Aires'}`}
            </p>
            <p className="text-xs text-green-700 mt-0.5">
              {slugify(data.name || 'mi-negocio')}.siteai.app
            </p>
            <p className="text-xs text-surface-600 mt-1 line-clamp-2">
              {data.seoDescription || data.description || 'Sin descripción configurada.'}
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white border border-surface-200 rounded-2xl p-5 space-y-4">
        <p className="text-sm font-semibold text-surface-700 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-500" /> Resumen de tu sitio
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { label: 'Negocio',    value: data.name || '—' },
            { label: 'Tipo',       value: selectedType?.name || '—' },
            { label: 'Template',   value: selectedTemplate?.name || '—' },
            { label: 'Paleta',     value: selectedTheme?.name || '—' },
            { label: 'Servicios',  value: `${data.services.length} cargado${data.services.length !== 1 ? 's' : ''}` },
            { label: 'Secciones',  value: `${data.enabledSections.length} seleccionadas` },
            { label: 'Equipo',     value: data.team.length > 0 ? `${data.team.length} persona${data.team.length !== 1 ? 's' : ''}` : 'Sin equipo' },
            { label: 'Contacto',   value: data.email || data.phone || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-surface-100 last:border-0">
              <span className="text-xs text-surface-500">{label}</span>
              <span className="text-xs font-medium text-surface-800 text-right max-w-[55%] truncate">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-brand-50 to-violet-50 border border-brand-100 rounded-2xl p-5 text-center">
        <Sparkles className="h-8 w-8 text-brand-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-surface-800">¡Listo para generar!</p>
        <p className="text-xs text-surface-500 mt-1">La IA creará tu sitio profesional en segundos.</p>
      </div>
    </div>
  )
}

// ─── Main Wizard Page ─────────────────────────────────────────────────────────

export default function WizardPage() {
  const router = useRouter()
  const { step, data, nextStep, prevStep, setField, toggleSection, setColorTheme, isStepValid, reset } = useWizardStore()
  const { addProject } = useProjectStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const progress = (step / TOTAL_WIZARD_STEPS) * 100
  const valid = isStepValid(step)

  const handleNext = () => {
    if (!valid) {
      toast.error('Completá los campos requeridos antes de continuar')
      return
    }
    nextStep()
  }

  const handleSubmit = async () => {
    if (!valid) {
      toast.error('Completá el título SEO antes de generar')
      return
    }

    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 2200))

    const selectedType = businessTypes.find((bt) => bt.id === data.businessType)

    const newProject: Project = {
      id: generateId(),
      name: data.name || 'Mi negocio',
      slug: `${slugify(data.name || 'mi-negocio')}-${Date.now()}`,
      status: 'generating',
      plan: 'free',
      template: data.template || 'corporate',
      mediaIds: [...(data.logoId ? [data.logoId] : []), ...(data.heroImageId ? [data.heroImageId] : [])],
      coverImageId: data.heroImageId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: data.enabledSections.map((type, i) => {
        const secMeta = ALL_SECTIONS.find((s) => s.id === type)
        return {
          id: type,
          label: secMeta?.label ?? type,
          description: secMeta?.desc ?? '',
          enabled: true,
          required: !!secMeta?.required,
          order: i,
        } as SectionConfig
      }),
      businessData: {
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        businessType: data.businessType,
        services: data.services,
        team: data.team,
        testimonials: [],
        faqs: [],
        contact: {
          phone: data.phone,
          whatsapp: data.whatsapp,
          email: data.email,
          address: data.address,
          city: data.city,
          province: data.province,
          country: 'Argentina',
        },
        socials: {
          instagram: data.socials.instagram ?? '',
          facebook: data.socials.facebook ?? '',
          linkedin: data.socials.linkedin ?? '',
          twitter: data.socials.twitter ?? '',
          tiktok: data.socials.tiktok ?? '',
          youtube: data.socials.youtube ?? '',
        },
        seo: {
          title: data.seoTitle || `${data.name} — ${data.city}`,
          description: data.seoDescription || data.description,
          keywords: data.seoKeywords,
          sitemapEnabled: true,
        },
        branding: {
          primaryColor: data.primaryColor,
          fontHeading: data.fontHeading,
          fontBody: data.fontBody,
          tone: data.tone as any,
          colorTheme: data.colorTheme,
          logoId: data.logoId,
        },
      },
    }

    const saved = await addProject(newProject)
    reset()
    setIsSubmitting(false)
    toast.success('¡Sitio generado con éxito! Revisalo en el editor.')
    router.push(`/projects/${saved.id}/editor`)
  }

  const stepProps = { data, setField, toggleSection, setColorTheme }

  const stepContent = [
    <Step1  key={1}  {...stepProps} />,
    <Step2  key={2}  {...stepProps} />,
    <Step3  key={3}  {...stepProps} />,
    <Step4  key={4}  {...stepProps} />,
    <Step5  key={5}  {...stepProps} />,
    <Step6  key={6}  {...stepProps} />,
    <Step7  key={7}  {...stepProps} />,
    <Step8  key={8}  {...stepProps} />,
    <Step9  key={9}  {...stepProps} />,
    <Step10 key={10} {...stepProps} />,
  ]

  return (
    <div className="min-h-screen flex flex-col bg-surface-50">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 px-6 py-4 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/dashboard">
            <button
              type="button"
              title="Salir del wizard"
              onClick={reset}
              className="h-8 w-8 rounded-xl text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors flex items-center justify-center flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-surface-700">
                Paso {step} de {TOTAL_WIZARD_STEPS} —{' '}
                <span className="text-brand-600">{STEPS[step - 1]?.title}</span>
              </span>
              <span className="text-xs text-surface-400 tabular-nums">{Math.round(progress)}%</span>
            </div>
            <WizardProgress step={step} total={TOTAL_WIZARD_STEPS} />
          </div>
        </div>
      </div>

      {/* Step indicators */}
      <div className="bg-white border-b border-surface-100 px-6 py-3 overflow-x-auto scrollbar-hide flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-1 min-w-max">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-1 shrink-0">
              <div className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                i + 1 === step
                  ? 'bg-brand-600 text-white'
                  : i + 1 < step
                  ? 'bg-brand-50 text-brand-600 cursor-pointer hover:bg-brand-100'
                  : 'text-surface-400'
              )}
              onClick={() => i + 1 < step && useWizardStore.getState().setStep(i + 1)}
              >
                <span className="h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">
                  {i + 1 < step ? '✓' : i + 1}
                </span>
                {s.label}
              </div>
              {i < STEPS.length - 1 && <div className="w-3 h-px bg-surface-200 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 py-8 px-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* Step header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-surface-900">{STEPS[step - 1]?.title}</h2>
            <p className="text-sm text-surface-500 mt-1">{STEPS[step - 1]?.subtitle}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {stepContent[step - 1]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation footer */}
      <div className="bg-white border-t border-surface-200 px-6 py-4 flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={prevStep}
            disabled={step === 1}
          >
            Anterior
          </Button>

          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i + 1 === step ? 'w-5 bg-brand-500' : i + 1 < step ? 'w-1.5 bg-brand-300' : 'w-1.5 bg-surface-200'
                )}
              />
            ))}
          </div>

          {step < TOTAL_WIZARD_STEPS ? (
            <Button
              type="button"
              variant={valid ? 'gradient' : 'secondary'}
              rightIcon={<ArrowRight className="h-4 w-4" />}
              onClick={handleNext}
              className={valid ? 'shadow-brand' : ''}
            >
              Siguiente
            </Button>
          ) : (
            <Button
              type="button"
              variant="gradient"
              rightIcon={<Sparkles className="h-4 w-4" />}
              onClick={handleSubmit}
              loading={isSubmitting}
              className="shadow-brand"
            >
              {isSubmitting ? 'Generando...' : 'Generar mi sitio'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
