'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Mail, Phone, Inbox, Loader2, Check,
  Archive, RotateCcw, ChevronLeft, ChevronRight, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { formatDate, formatRelativeDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { SiteLeadStatus, SiteLeadView, SiteLeadsResponse } from '@/lib/site-leads'

const STATUS_LABEL: Record<string, string> = {
  new: 'Sin leer',
  read: 'Leido',
  archived: 'Archivado',
}

const STATUS_CLASS: Record<string, string> = {
  new: 'bg-brand-50 text-brand-700 border-brand-200',
  read: 'bg-surface-100 text-surface-600 border-surface-200',
  archived: 'bg-surface-50 text-surface-400 border-surface-200',
}

export default function LeadsInboxClient({
  projectId,
  projectName,
}: {
  projectId: string
  projectName: string
}) {
  const [data, setData] = useState<SiteLeadsResponse | null>(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(
    async (targetPage: number) => {
      setLoading(true)
      setFailed(false)
      try {
        const res = await fetch(`/api/projects/${projectId}/leads?page=${targetPage}`)
        if (!res.ok) throw new Error(String(res.status))
        const body: SiteLeadsResponse = await res.json()
        setData(body)
        // The server clamps the page to one that exists; mirror it back so the
        // pager never shows a page the list is not actually on.
        setPage(body.page)
      } catch {
        setFailed(true)
      } finally {
        setLoading(false)
      }
    },
    [projectId]
  )

  useEffect(() => {
    load(0)
  }, [load])

  /**
   * Optimistic status write. The row is patched locally first because the whole
   * point of the control is a one-click triage pass down the list; waiting a
   * round trip per click makes that feel broken. A failure restores the previous
   * value rather than leaving the UI asserting something the server rejected.
   */
  async function setStatus(lead: SiteLeadView, status: SiteLeadStatus) {
    if (lead.status === status) return
    const previous = lead.status
    setBusyId(lead.id)
    setData((d) =>
      d
        ? {
            ...d,
            leads: d.leads.map((l) => (l.id === lead.id ? { ...l, status } : l)),
            unread: d.unread + (status === 'new' ? 1 : 0) - (previous === 'new' ? 1 : 0),
          }
        : d
    )
    try {
      const res = await fetch(`/api/projects/${projectId}/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error(String(res.status))
    } catch {
      setData((d) =>
        d
          ? {
              ...d,
              leads: d.leads.map((l) => (l.id === lead.id ? { ...l, status: previous } : l)),
              unread: d.unread + (previous === 'new' ? 1 : 0) - (status === 'new' ? 1 : 0),
            }
          : d
      )
      toast.error('No se pudo actualizar el mensaje')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-surface-100 px-4 lg:px-8 py-4 sticky top-14 md:top-0 z-10">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl text-surface-400 hover:bg-surface-100 transition-colors shrink-0"
            aria-label="Volver al dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold text-surface-900 truncate">
              Mensajes recibidos
            </h1>
            <p className="text-sm text-surface-500 truncate">{projectName}</p>
          </div>
          {data && data.unread > 0 && (
            <span className="shrink-0 h-6 px-2.5 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center">
              {data.unread} sin leer
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {loading && !data ? (
            <div className="flex items-center justify-center py-20 text-surface-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Cargando mensajes...
            </div>
          ) : failed ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="w-10 h-10 text-danger-400 mb-3" />
              <p className="text-sm text-surface-600 mb-4">
                No pudimos cargar los mensajes.
              </p>
              <Button variant="outline" size="sm" onClick={() => load(page)}>
                Reintentar
              </Button>
            </div>
          ) : !data || data.total === 0 ? (
            <EmptyState />
          ) : (
            <>
              <p className="text-sm text-surface-400">
                {data.total} mensaje{data.total === 1 ? '' : 's'} · mas recientes primero
              </p>

              <div className="space-y-3">
                {data.leads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    busy={busyId === lead.id}
                    onStatus={(s) => setStatus(lead, s)}
                  />
                ))}
              </div>

              {data.pageCount > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 0 || loading}
                    onClick={() => load(page - 1)}
                    leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                  >
                    Anterior
                  </Button>
                  <span className="text-xs text-surface-400">
                    Pagina {page + 1} de {data.pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= data.pageCount - 1 || loading}
                    onClick={() => load(page + 1)}
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Lead card ─────────────────────────────────────────────────────────────────

function LeadCard({
  lead,
  busy,
  onStatus,
}: {
  lead: SiteLeadView
  busy: boolean
  onStatus: (status: SiteLeadStatus) => void
}) {
  const isNew = lead.status === 'new'
  const isArchived = lead.status === 'archived'

  // Pre-filled reply. The subject is the only generated text here — the body is
  // left empty so nothing is put in the owner's mouth.
  const mailto = `mailto:${encodeURIComponent(lead.email)}?subject=${encodeURIComponent(
    `Re: tu consulta`
  )}`
  // tel: tolerates spaces poorly; strip anything that is not a digit or a
  // leading +, but keep the ORIGINAL string on screen — that is what the visitor
  // actually typed and the owner may need to read it verbatim.
  const telHref = `tel:${lead.phone?.replace(/(?!^\+)[^\d]/g, '') ?? ''}`

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border p-5 transition-all',
        isNew ? 'border-brand-200 shadow-soft' : 'border-surface-100',
        isArchived && 'opacity-70'
      )}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-surface-900 truncate">{lead.name}</h2>
            <span
              className={cn(
                'text-[11px] font-medium px-2 py-0.5 rounded-full border',
                STATUS_CLASS[lead.status] ?? STATUS_CLASS.read
              )}
            >
              {STATUS_LABEL[lead.status] ?? lead.status}
            </span>
          </div>
          <p className="text-xs text-surface-400 mt-1" title={formatDate(lead.createdAt)}>
            {formatRelativeDate(lead.createdAt)} · {formatDate(lead.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {busy && <Loader2 className="w-3.5 h-3.5 animate-spin text-surface-400" />}
          {isNew ? (
            <Button
              variant="outline"
              size="xs"
              onClick={() => onStatus('read')}
              leftIcon={<Check className="w-3 h-3" />}
            >
              Marcar leido
            </Button>
          ) : (
            <Button
              variant="outline"
              size="xs"
              onClick={() => onStatus('new')}
              leftIcon={<RotateCcw className="w-3 h-3" />}
            >
              Sin leer
            </Button>
          )}
          {isArchived ? (
            <Button variant="outline" size="xs" onClick={() => onStatus('read')}>
              Desarchivar
            </Button>
          ) : (
            <Button
              variant="outline"
              size="xs"
              onClick={() => onStatus('archived')}
              leftIcon={<Archive className="w-3 h-3" />}
            >
              Archivar
            </Button>
          )}
        </div>
      </div>

      {/* Contact actions */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <a
          href={mailto}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-surface-200 text-xs font-medium text-surface-700 hover:bg-surface-50 hover:border-surface-300 transition-colors"
        >
          <Mail className="w-3.5 h-3.5" />
          {lead.email}
        </a>
        {lead.phone && (
          <a
            href={telHref}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-surface-200 text-xs font-medium text-surface-700 hover:bg-surface-50 hover:border-surface-300 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            {lead.phone}
          </a>
        )}
      </div>

      {/* Message — whitespace preserved: the visitor's line breaks are content. */}
      <p className="mt-3 text-sm text-surface-700 whitespace-pre-wrap break-words">
        {lead.message}
      </p>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
/**
 * Says plainly that there is nothing yet. No sample rows, no placeholder
 * "Juan Perez" lead: a fabricated lead in an inbox is indistinguishable from a
 * real one, and the owner would try to answer it.
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 gradient-brand-subtle rounded-3xl flex items-center justify-center mb-5">
        <Inbox className="h-8 w-8 text-brand-400" />
      </div>
      <h2 className="text-lg font-bold text-surface-800 mb-2">Todavia no recibiste mensajes</h2>
      <p className="text-sm text-surface-400 max-w-sm">
        Cuando alguien complete el formulario de contacto de tu sitio publicado, el mensaje va a
        aparecer aca.
      </p>
    </div>
  )
}
