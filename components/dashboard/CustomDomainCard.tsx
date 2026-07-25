'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Loader2, Copy, Clock, Trash2 } from 'lucide-react'

type DomainStatus = 'none' | 'pending' | 'verified' | 'active'

/**
 * Custom-domain card for the publish screen.
 *
 * Drives the assisted-activation flow (enfoque B): the owner enters a domain,
 * gets the exact A-record to create, and verifies it here. Verification only
 * checks DNS points at us; the final Traefik activation (→ 'active') is done by
 * an operator, which is why 'verified' shows "activating shortly" rather than a
 * live link. The card reads its target IP from GET /api/domains so the DNS
 * instructions never hardcode an address.
 */
export function CustomDomainCard({
  projectId,
  initialDomain,
  initialStatus,
}: {
  projectId: string
  initialDomain?: string | null
  initialStatus?: DomainStatus
}) {
  const [input, setInput] = useState(initialDomain ?? '')
  const [domain, setDomain] = useState(initialDomain ?? '')
  const [status, setStatus] = useState<DomainStatus>(initialStatus ?? 'none')
  const [targetIp, setTargetIp] = useState<string | null>(null)
  const [busy, setBusy] = useState<'' | 'set' | 'verify' | 'remove'>('')
  const [checkMsg, setCheckMsg] = useState('')

  // On mount, fetch the target IP (and reconcile status) so the DNS instructions
  // can be shown immediately for an already-configured domain.
  useEffect(() => {
    let alive = true
    fetch(`/api/domains?projectId=${encodeURIComponent(projectId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return
        setTargetIp(d.targetIp ?? null)
        if (d.status) setStatus(d.status)
        if (d.domain) {
          setDomain(d.domain)
          setInput(d.domain)
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [projectId])

  const call = async (action: 'set' | 'verify' | 'remove', extra?: Record<string, unknown>) => {
    setBusy(action)
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, projectId, ...extra }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No se pudo completar la acción')
      return data
    } finally {
      setBusy('')
    }
  }

  const connect = async () => {
    try {
      const d = await call('set', { domain: input })
      setDomain(d.domain)
      setStatus(d.status)
      setTargetIp(d.targetIp ?? targetIp)
      setCheckMsg('')
      toast.success('Dominio guardado. Configurá el DNS y verificá.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error')
    }
  }

  const verify = async () => {
    try {
      const d = await call('verify')
      setStatus(d.status)
      setTargetIp(d.targetIp ?? targetIp)
      setCheckMsg(d.message || '')
      if (d.verified) toast.success('DNS verificado')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error')
    }
  }

  const remove = async () => {
    try {
      await call('remove')
      setDomain('')
      setInput('')
      setStatus('none')
      setCheckMsg('')
      toast.success('Dominio quitado')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error')
    }
  }

  const copyIp = () => {
    if (targetIp) {
      navigator.clipboard.writeText(targetIp)
      toast.success('IP copiada')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-surface-100 p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-surface-900">Dominio propio</h2>
        <p className="text-xs text-surface-400 mt-0.5">
          Conectá tu propio dominio (ej: tunegocio.com.ar) en lugar de la dirección de arriba. Incluido en el plan Professional.
        </p>
      </div>

      {status === 'none' ? (
        <div className="space-y-1.5">
          <Label>Tu dominio</Label>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="tunegocio.com.ar"
              className="flex-1"
            />
            <Button variant="outline" onClick={connect} disabled={busy === 'set' || !input.trim()}>
              {busy === 'set' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Conectar'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-sm text-surface-800 truncate">{domain}</span>
            <Button variant="destructive-ghost" size="sm" className="gap-1.5 shrink-0" onClick={remove} disabled={!!busy}>
              <Trash2 className="w-3.5 h-3.5" /> Quitar
            </Button>
          </div>

          {status === 'active' && (
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              Tu dominio está activo. Tu sitio se sirve en <span className="font-mono">https://{domain}</span>.
            </div>
          )}

          {status === 'verified' && (
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
              <Clock className="w-4 h-4 mt-0.5 shrink-0" />
              DNS verificado. Estamos activando tu dominio con certificado SSL — suele estar listo en pocas horas.
            </div>
          )}

          {status === 'pending' && (
            <>
              <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 space-y-3">
                <p className="text-sm font-medium text-surface-800">1. Creá este registro en tu proveedor de dominio:</p>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm font-mono">
                  <span className="text-surface-400">Tipo</span><span className="text-surface-800">A</span>
                  <span className="text-surface-400">Nombre</span><span className="text-surface-800">@</span>
                  <span className="text-surface-400">Valor</span>
                  <span className="text-surface-800 flex items-center gap-2">
                    {targetIp ?? 'cargando…'}
                    {targetIp && (
                      <button type="button" onClick={copyIp} title="Copiar IP" className="text-surface-400 hover:text-surface-700">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </span>
                </div>
                <p className="text-xs text-surface-400">
                  2. Esperá a que propague (puede tardar hasta 48 hs) y verificá acá abajo.
                </p>
              </div>

              {checkMsg && <p className="text-sm text-amber-700">{checkMsg}</p>}

              <Button variant="outline" onClick={verify} disabled={busy === 'verify'} className="gap-2">
                {busy === 'verify' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Verificar DNS
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
