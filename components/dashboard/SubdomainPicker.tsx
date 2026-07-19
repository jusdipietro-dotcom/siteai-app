'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Globe, Loader2, Lock, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { publishedSiteUrl, SITES_SUBDOMAIN_BASE } from '@/lib/site-domain'
import { normalizeSubdomain, validateSubdomain } from '@/lib/subdomain'

/**
 * Time the user must stop typing before the availability request fires.
 *
 * The check endpoint is rate limited to 30 requests/minute per IP, so one
 * request per keystroke would lock a user out of their own picker mid-word.
 */
const DEBOUNCE_MS = 400

/**
 * Availability of the value currently in the input.
 *
 * `unavailable` covers both "malformed" and "already taken" on purpose: from
 * the user's point of view they are the same outcome — this value cannot be
 * saved — and the difference is carried by `reason`, which is always the exact
 * text the authority produced (lib/subdomain.ts locally, the API remotely).
 */
type CheckState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'available' }
  | { kind: 'unavailable'; reason: string }

export interface SubdomainPickerProps {
  /** Slug of the project, used to preview the fallback path URL. */
  slug: string
  /** Subdomain currently stored on the project, or null if it has none. */
  current: string | null
  /**
   * Persists the chosen subdomain. `null` releases it.
   *
   * Must reject on failure rather than swallowing the error. When the rejection
   * carries a numeric `status` of 409 the value was claimed by someone else
   * between the availability check and the write, and the picker says so
   * explicitly instead of showing a generic failure.
   */
  onSave: (subdomain: string | null) => Promise<unknown>
  /**
   * Freezes the field. Set when the project is published on a subdomain: the
   * live URL is already in the wild and the server refuses to change it (409).
   */
  locked?: boolean
}

/**
 * Lets a user claim a subdomain for a published site.
 *
 * The availability check here is advisory and always has been — see the API
 * route. Two users can both be told "available" and both submit; the unique
 * index decides, and the loser gets a 409 which `handleSave` turns into a
 * normal, readable state rather than an unhandled rejection.
 */
export function SubdomainPicker({ slug, current, onSave, locked = false }: SubdomainPickerProps) {
  const [value, setValue] = useState(current ?? '')
  const [check, setCheck] = useState<CheckState>({ kind: 'idle' })
  const [saving, setSaving] = useState(false)

  // Discards responses from checks the user has already typed past. Without it
  // a slow request for "ju" can land after a fast one for "juanperez" and
  // report on a value that is no longer in the box.
  const requestSeq = useRef(0)

  const normalized = normalizeSubdomain(value)
  const isUnchanged = normalized === (current ?? '')
  const previewUrl = publishedSiteUrl({ slug, subdomain: normalized || null })

  useEffect(() => {
    if (locked) return

    // Empty means "release the subdomain" — nothing to look up.
    if (normalized === '') {
      setCheck({ kind: 'idle' })
      return
    }

    // Already ours. Asking the server would answer "taken" — by us.
    if (normalized === current) {
      setCheck({ kind: 'available' })
      return
    }

    // Instant local feedback. The server re-validates anyway; this only saves
    // a round trip on values that cannot possibly be accepted.
    const local = validateSubdomain(normalized)
    if (!local.valid) {
      setCheck({ kind: 'unavailable', reason: local.reason ?? 'Subdominio inválido' })
      return
    }

    setCheck({ kind: 'checking' })
    const seq = ++requestSeq.current
    const controller = new AbortController()

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/subdomains/check?value=${encodeURIComponent(normalized)}`, {
          signal: controller.signal,
        })
        const body = await res.json().catch(() => ({}))
        if (seq !== requestSeq.current) return

        if (!res.ok) {
          setCheck({
            kind: 'unavailable',
            reason: body?.error ?? 'No se pudo verificar la disponibilidad',
          })
          return
        }

        setCheck(
          body?.available
            ? { kind: 'available' }
            : { kind: 'unavailable', reason: body?.reason ?? 'Ese subdominio no está disponible' }
        )
      } catch {
        if (controller.signal.aborted || seq !== requestSeq.current) return
        setCheck({
          kind: 'unavailable',
          reason: 'No se pudo verificar la disponibilidad. Probá de nuevo.',
        })
      }
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [normalized, current, locked])

  async function handleSave() {
    const payload = normalized === '' ? null : normalized

    if (payload !== null) {
      const local = validateSubdomain(payload)
      if (!local.valid) {
        setCheck({ kind: 'unavailable', reason: local.reason ?? 'Subdominio inválido' })
        return
      }
    }

    setSaving(true)
    try {
      await onSave(payload)
      setValue(payload ?? '')
      setCheck(payload ? { kind: 'available' } : { kind: 'idle' })
      toast.success(payload ? 'Subdominio guardado' : 'Subdominio liberado')
    } catch (err) {
      // A 409 means the value was claimed between the check and the write — the
      // check is advisory, the unique index is the arbiter. The server's message
      // ("Ese subdominio ya está en uso") is the accurate one, so it is shown
      // verbatim rather than paraphrased. Parking the field in `unavailable`
      // also disables the save button until the user types something else,
      // which is what makes a lost race a dead end instead of a retry loop.
      const message =
        err instanceof Error && err.message ? err.message : 'No se pudo guardar el subdominio'
      setCheck({ kind: 'unavailable', reason: message })
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  // ── Frozen: published on a subdomain ───────────────────────────────────────
  if (locked) {
    return (
      <div className="space-y-2">
        <Label>Subdominio</Label>
        <div className="flex items-center">
          <Input
            value={current ?? ''}
            readOnly
            disabled
            className="rounded-r-none"
            wrapperClassName="flex-1"
            aria-label="Subdominio"
          />
          <span className="px-3 h-10 flex items-center bg-surface-50 border border-l-0 border-surface-200 rounded-r-xl text-sm text-surface-500 whitespace-nowrap">
            .{SITES_SUBDOMAIN_BASE}
          </span>
        </div>
        <div className="flex items-start gap-2 bg-surface-50 border border-surface-200 rounded-xl p-3 text-xs text-surface-600">
          <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-surface-400" />
          <span>
            El subdominio queda fijo mientras el sitio está publicado: la dirección ya circula en
            links, códigos QR y buscadores. Para cambiarlo, despublicá el sitio primero.
          </span>
        </div>
      </div>
    )
  }

  const canSave =
    !saving &&
    !isUnchanged &&
    (normalized === '' || check.kind === 'available')

  return (
    <div className="space-y-2">
      <Label htmlFor="subdomain-input">Subdominio</Label>

      <div className="flex items-center">
        <Input
          id="subdomain-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="mi-negocio"
          autoComplete="off"
          spellCheck={false}
          className="rounded-r-none"
          wrapperClassName="flex-1"
        />
        <span className="px-3 h-10 flex items-center bg-surface-50 border border-l-0 border-surface-200 rounded-r-xl text-sm text-surface-500 whitespace-nowrap">
          .{SITES_SUBDOMAIN_BASE}
        </span>
      </div>

      {/* Availability */}
      <div className="min-h-[1.25rem] text-xs" aria-live="polite">
        {check.kind === 'checking' && (
          <span className="flex items-center gap-1.5 text-surface-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            Verificando disponibilidad...
          </span>
        )}
        {check.kind === 'available' && (
          <span className="flex items-center gap-1.5 text-emerald-600">
            <Check className="w-3.5 h-3.5 shrink-0" />
            {isUnchanged && normalized !== '' ? 'Este es tu subdominio actual' : 'Disponible'}
          </span>
        )}
        {check.kind === 'unavailable' && (
          <span className="flex items-center gap-1.5 text-danger-600">
            <X className="w-3.5 h-3.5 shrink-0" />
            {check.reason}
          </span>
        )}
        {check.kind === 'idle' && (
          <span className="text-surface-400">
            {current
              ? 'Vacío libera el subdominio y el sitio vuelve a la URL por ruta.'
              : 'Letras minúsculas, números y guiones. Entre 3 y 63 caracteres.'}
          </span>
        )}
      </div>

      {/* Live preview of the resulting public URL */}
      <div className="flex items-center gap-2 bg-surface-50 rounded-xl p-3 text-sm text-surface-600 min-w-0">
        <Globe className="w-4 h-4 text-brand-500 shrink-0" />
        <span className="text-xs shrink-0">Tu sitio quedará en</span>
        <span className="font-mono text-brand-600 truncate">{previewUrl}</span>
      </div>

      <div className="flex justify-end">
        <Button size="sm" variant="outline" loading={saving} disabled={!canSave} onClick={handleSave}>
          {normalized === '' && current ? 'Liberar subdominio' : 'Guardar subdominio'}
        </Button>
      </div>
    </div>
  )
}
