'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Globe, CheckCircle2, Circle, Rocket, ExternalLink,
  Copy, Twitter, Facebook, Link2, Sparkles, AlertCircle, Lock, Zap, PowerOff, Ban, CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubdomainPicker } from '@/components/dashboard/SubdomainPicker'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { WEBSITE_PLANS, formatARS } from '@/lib/website-plans'
import { publishedSiteUrl } from '@/lib/site-domain'
import { useProjectStore } from '@/store/useProjectStore'

const CHECKLIST = [
  { id: 'name', label: 'Nombre del negocio configurado', check: (p: any) => !!p.name },
  { id: 'seo', label: 'Título SEO y descripción definidos', check: (p: any) => !!p.businessData?.seo?.title },
  { id: 'sections', label: 'Al menos 3 secciones habilitadas', check: (p: any) => (p.sections?.filter((s: any) => s.enabled)?.length ?? 0) >= 3 },
  { id: 'contact', label: 'Datos de contacto completos', check: (p: any) => !!(p.businessData?.contact?.phone || p.businessData?.contact?.email) },
  { id: 'template', label: 'Template seleccionado', check: (p: any) => !!p.template },
]

export default function PublishPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { projects, publishProject, unpublishProject, cancelSubscription, setSubdomain } = useProjectStore()
  const project = projects.find((p) => p.id === id)

  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(project?.status === 'published')
  const [showSuccess, setShowSuccess] = useState(false)
  const [customDomain, setCustomDomain] = useState('')
  const [confirmUnpublish, setConfirmUnpublish] = useState(false)
  const [unpublishing, setUnpublishing] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  if (!project) return <div className="flex items-center justify-center h-screen text-surface-500">Proyecto no encontrado</div>

  // ── Paywall gate: si no tiene plan pago, mostrar pantalla de upgrade ──────
  if (!project.hasPaid) {
    return (
      <div className="min-h-screen">
        {/* Topbar */}
        <div className="bg-white border-b border-surface-100 px-6 lg:px-10 py-6">
          <div className="flex items-center gap-3">
            <Link href={`/projects/${id}/editor`} title="Volver al editor" className="p-2 rounded-xl text-surface-400 hover:bg-surface-100 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-surface-900">Publicar sitio</h1>
              <p className="text-sm text-surface-500">{project.name}</p>
            </div>
          </div>
        </div>

        {/* Paywall */}
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="w-20 h-20 rounded-3xl bg-surface-100 flex items-center justify-center mx-auto">
              <Lock className="w-9 h-9 text-surface-400" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-surface-900 mb-2">
                Necesitás un plan para publicar
              </h2>
              <p className="text-surface-500 text-sm max-w-md mx-auto">
                La vista previa es gratuita. Para publicar tu sitio online y que el mundo lo vea, elegí un plan pago.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {[
                { icon: '🌐', title: 'Online 24/7', desc: 'Tu sitio disponible en internet desde el primer día' },
                { icon: '🔒', title: 'SSL gratis', desc: 'Certificado de seguridad incluido sin costo adicional' },
                { icon: '⚡', title: 'Actualizaciones', desc: 'Modificá el contenido cuando quieras, sin costo extra' },
              ].map((f) => (
                <div key={f.title} className="bg-white border border-surface-100 rounded-2xl p-4">
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <p className="font-semibold text-surface-900 text-sm mb-1">{f.title}</p>
                  <p className="text-xs text-surface-500">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Pricing preview */}
            <div className="bg-white border border-surface-200 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-bold text-surface-900">Essential</p>
                  <p className="text-xs text-surface-500">Publicación + SSL + soporte</p>
                </div>
                <span className="text-2xl font-extrabold text-surface-900">{formatARS(WEBSITE_PLANS.essential.monthly)}<span className="text-sm font-normal text-surface-400">/mes</span></span>
              </div>
              <div className="h-px bg-surface-100" />
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-bold text-surface-900 flex items-center gap-1.5">
                    Professional <span className="text-[10px] gradient-brand text-white px-2 py-0.5 rounded-full font-bold">POPULAR</span>
                  </p>
                  <p className="text-xs text-surface-500">Hasta 3 proyectos + SEO avanzado + Google Analytics</p>
                </div>
                <span className="text-2xl font-extrabold text-surface-900">{formatARS(WEBSITE_PLANS.professional.monthly)}<span className="text-sm font-normal text-surface-400">/mes</span></span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={`/projects/${id}/checkout`} className="flex-1">
                <Button variant="gradient" size="lg" className="w-full gap-2 shadow-brand">
                  <Zap className="w-4 h-4" /> Elegir plan y publicar
                </Button>
              </Link>
              <Link href={`/projects/${id}/preview`} className="flex-1">
                <Button variant="outline" size="lg" className="w-full gap-2">
                  Ver vista previa
                </Button>
              </Link>
            </div>

            <p className="text-xs text-surface-400">
              Sin permanencia mínima · Cancelá cuando quieras · Garantía de devolución 30 días
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  // Single source of truth for the public URL. It flips between the path host
  // and the subdomain host on its own, so nothing here hardcodes a domain.
  const siteUrl = publishedSiteUrl({ slug: project.slug, subdomain: project.subdomain ?? null })
  const checks = CHECKLIST.map((item) => ({ ...item, passed: item.check(project) }))
  const allPassed = checks.every((c) => c.passed)
  // The server freezes the subdomain of a published project (409 on change).
  // Reflect that in the UI so nobody discovers the rule by hitting the error.
  const subdomainLocked = published && !!project.subdomain

  // Billing lifecycle state. A suspended project's public URL 404s (the gate
  // excludes it), so the "published" banner must not claim the site is online.
  const isSuspended = project.billingStatus === 'suspended'
  const isCancelled = isSuspended && project.suspendedReason === 'cancelled'

  async function handleCancel() {
    setCancelling(true)
    try {
      const result = await cancelSubscription(id)
      setConfirmCancel(false)
      if (result.alreadyCancelled) {
        toast.success('Tu suscripción ya estaba cancelada.')
      } else {
        toast.success('Suscripción cancelada. Tu sitio ya no está online.')
      }
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo cancelar la suscripción. Intentá de nuevo.'
      )
    } finally {
      setCancelling(false)
    }
  }

  async function handlePublish() {
    setPublishing(true)
    try {
      // The server re-checks ownership and payment and owns publishedUrl.
      // The paywall screen above is UX; this call is what actually enforces it.
      await publishProject(id)
      setPublished(true)
      setShowSuccess(true)
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo publicar el sitio. Intentá de nuevo.'
      )
    } finally {
      setPublishing(false)
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(siteUrl)
    toast.success('URL copiada al portapapeles')
  }

  async function handleUnpublish() {
    setUnpublishing(true)
    try {
      await unpublishProject(id)
      setPublished(false)
      setShowSuccess(false)
      setConfirmUnpublish(false)
      toast.success('Tu sitio ya no está online. Podés volver a publicarlo cuando quieras.')
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo despublicar el sitio. Intentá de nuevo.'
      )
    } finally {
      setUnpublishing(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Topbar */}
      <div className="bg-white border-b border-surface-100 px-6 lg:px-10 py-6">
        <div className="flex items-center gap-3">
          <Link href={`/projects/${id}/editor`} className="p-2 rounded-xl text-surface-400 hover:bg-surface-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-surface-900">Publicar sitio</h1>
            <p className="text-sm text-surface-500">{project.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">

        {/* Already published banner */}
        {published && !showSuccess && !isSuspended && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-emerald-900">Tu sitio está publicado</p>
                <a href={siteUrl} target="_blank" rel="noreferrer" className="text-sm text-emerald-700 hover:underline flex items-center gap-1 mt-1 truncate">
                  {siteUrl} <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
              <Button variant="outline" size="sm" className="shrink-0" onClick={copyUrl}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-emerald-200/70 pt-3">
              <p className="text-xs text-emerald-700/90">
                ¿Necesitás cambiar el subdominio o darlo de baja? Despublicá el sitio primero.
              </p>
              <Button
                variant="destructive-ghost"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => setConfirmUnpublish(true)}
              >
                <PowerOff className="w-3.5 h-3.5" /> Despublicar
              </Button>
            </div>
          </div>
        )}

        {/* Checklist */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6 space-y-4">
          <h2 className="font-semibold text-surface-900">Revisión previa a la publicación</h2>
          <ul className="space-y-3">
            {checks.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                {item.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-surface-300 shrink-0" />
                )}
                <span className={`text-sm ${item.passed ? 'text-surface-800' : 'text-surface-400'}`}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>

          {!allPassed && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              Completá los items pendientes para publicar.
            </div>
          )}
        </div>

        {/* Dirección del sitio */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-surface-900">Dirección del sitio</h2>
            <p className="text-xs text-surface-400 mt-0.5">
              Con tu plan podés elegir un subdominio propio. Si no elegís ninguno, el sitio queda
              en la dirección por ruta.
            </p>
          </div>
          <SubdomainPicker
            slug={project.slug}
            current={project.subdomain ?? null}
            locked={subdomainLocked}
            onSave={(subdomain) => setSubdomain(id, subdomain)}
          />
          {!subdomainLocked && (
            <p className="text-xs text-surface-400">
              Elegilo antes de publicar: una vez publicado el sitio, el subdominio queda fijo hasta
              que lo despubliques.
            </p>
          )}
        </div>

        {/* Custom domain — not implemented yet, deliberately disabled */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-surface-900">Dominio personalizado</h2>
            <p className="text-xs text-surface-400 mt-0.5">Todavía no está disponible. Por ahora tu sitio usa la dirección de arriba.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Tu dominio</Label>
            <div className="flex gap-2">
              <Input
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="tunegocio.com"
                className="flex-1"
                disabled
              />
              <Button variant="outline" disabled>Conectar</Button>
            </div>
          </div>
        </div>

        {/* Publish button */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6 space-y-4">
          <h2 className="font-semibold text-surface-900">Listo para publicar</h2>
          <p className="text-sm text-surface-500">
            Al publicar, tu sitio queda online en{' '}
            <span className="font-mono text-brand-600 break-all">{siteUrl}</span>. Después podés
            seguir editándolo: los cambios se reflejan en el sitio publicado.
          </p>

          {publishing && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-sm text-surface-600"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full shrink-0"
              />
              Publicando tu sitio...
            </motion.div>
          )}

          <Button
            variant="gradient"
            size="lg"
            className="w-full gap-2 shadow-brand"
            onClick={handlePublish}
            loading={publishing}
            disabled={!allPassed || published}
          >
            <Rocket className="w-5 h-5" />
            {published ? 'Sitio publicado' : 'Publicar ahora'}
          </Button>
        </div>

        {/* Subscription — cancel. Shown for paid projects (this whole return is
            gated on hasPaid above). Billing continues even while unpublished, so
            this is where the owner stops it. */}
        <div className="bg-white rounded-2xl border border-surface-100 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-surface-400" />
            <h2 className="font-semibold text-surface-900">Suscripción</h2>
          </div>

          {isCancelled ? (
            <div className="flex items-start gap-2 bg-surface-50 border border-surface-200 rounded-xl p-4 text-sm text-surface-600">
              <Ban className="w-4 h-4 mt-0.5 shrink-0 text-surface-400" />
              <div>
                <p className="font-medium text-surface-800">Suscripción cancelada</p>
                <p className="text-xs text-surface-500 mt-0.5">
                  Tu sitio está offline y ya no se te cobra. Tu contenido se conserva: para volver a
                  publicarlo, contratá un plan nuevamente desde el checkout.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-surface-500">
                Al cancelar, tu sitio queda <strong>offline de inmediato</strong> (la dirección
                pública devuelve 404) y <strong>dejamos de cobrarte</strong>. Tu contenido se
                conserva por si querés reactivarlo más adelante.
              </p>
              <Button
                variant="destructive-ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => setConfirmCancel(true)}
              >
                <Ban className="w-3.5 h-3.5" /> Cancelar suscripción
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Unpublish confirmation */}
      <ConfirmDialog
        open={confirmUnpublish}
        onOpenChange={setConfirmUnpublish}
        variant="destructive"
        title="¿Despublicar el sitio?"
        description="El sitio dejará de estar online de inmediato: la dirección pública devolverá 404 para cualquier visitante. Tu contenido se conserva y podés volver a publicarlo cuando quieras. Al despublicar también se libera el subdominio para poder cambiarlo."
        confirmLabel="Despublicar sitio"
        cancelLabel="Cancelar"
        onConfirm={handleUnpublish}
        loading={unpublishing}
      />

      {/* Cancel subscription confirmation */}
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        variant="destructive"
        title="¿Cancelar la suscripción?"
        description="Tu sitio quedará offline de inmediato: la dirección pública devolverá 404. Dejamos de cobrarte y cancelamos el pago recurrente en MercadoPago. Tu contenido se conserva, pero para volver a publicarlo tendrás que contratar un plan nuevamente."
        confirmLabel="Cancelar suscripción"
        cancelLabel="Volver"
        onConfirm={handleCancel}
        loading={cancelling}
      />

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-elevated text-center"
            >
              {/* Icon */}
              <div className="w-20 h-20 gradient-brand rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-brand">
                <Sparkles className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-2xl font-extrabold text-surface-900 mb-2">¡Tu sitio está live!</h2>
              <p className="text-surface-500 mb-6 text-sm">
                {project.name} ya está publicado y disponible en internet.
              </p>

              {/* URL box */}
              <div className="bg-surface-50 border border-surface-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
                <Globe className="w-5 h-5 text-brand-500 shrink-0" />
                <span className="text-sm font-mono text-surface-700 flex-1 truncate text-left">{siteUrl}</span>
                <button type="button" onClick={copyUrl} title="Copiar URL" className="p-1.5 hover:bg-surface-200 rounded-lg transition-colors">
                  <Copy className="w-4 h-4 text-surface-500" />
                </button>
              </div>

              {/* Share */}
              <div className="mb-6">
                <p className="text-xs text-surface-400 mb-3">Compartir</p>
                <div className="flex justify-center gap-3">
                  {[
                    { icon: Twitter, label: 'Twitter', color: 'hover:bg-sky-50 hover:text-sky-600' },
                    { icon: Facebook, label: 'Facebook', color: 'hover:bg-blue-50 hover:text-blue-700' },
                    { icon: Link2, label: 'Copiar link', color: 'hover:bg-surface-100 hover:text-surface-700', action: copyUrl },
                  ].map(({ icon: Icon, label, color, action }) => (
                    <button
                      key={label}
                      type="button"
                      title={label}
                      onClick={action}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border border-surface-200 text-surface-500 transition-colors ${color}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px] font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={siteUrl} target="_blank" rel="noreferrer" className="flex-1">
                  <Button variant="gradient" className="w-full gap-2">
                    <ExternalLink className="w-4 h-4" /> Ver sitio
                  </Button>
                </a>
                <Button variant="outline" className="flex-1" onClick={() => { setShowSuccess(false); router.push('/dashboard') }}>
                  Ir al dashboard
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
