'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

type Service = 'diseno-web' | 'seo' | 'custom' | 'premium'

interface InquiryFormProps {
  service: Service
  packageId?: string
  source?: string
  accentClass?: string
  budgetOptions?: string[]
  title?: string
  description?: string
}

const DEFAULT_BUDGETS = [
  'Menos de $200.000',
  '$200.000 - $500.000',
  '$500.000 - $1.000.000',
  'Mas de $1.000.000',
  'Necesito asesoramiento',
]

export function InquiryForm({
  service,
  packageId,
  source,
  accentClass = 'bg-brand-600 hover:bg-brand-700',
  budgetOptions = DEFAULT_BUDGETS,
  title = 'Solicitar cotizacion',
  description = 'Contanos sobre tu proyecto y te respondemos en menos de 24 horas con una propuesta personalizada.',
}: InquiryFormProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')
    setErrorMsg('')

    const fd = new FormData(e.currentTarget)
    const payload = {
      service,
      packageId: packageId ?? null,
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      phone: String(fd.get('phone') ?? '') || null,
      company: String(fd.get('company') ?? '') || null,
      website: String(fd.get('website') ?? '') || null,
      budget: String(fd.get('budget') ?? '') || null,
      message: String(fd.get('message') ?? ''),
      source: source ?? null,
      honeypot: String(fd.get('company_website') ?? ''),
    }

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Error al enviar')
      }
      setStatus('success')
      ;(e.target as HTMLFormElement).reset()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Error al enviar')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-emerald-900 mb-2">Consulta enviada</h3>
        <p className="text-emerald-800">
          Recibimos tu mensaje y te respondemos en menos de 24 horas habiles. Tambien te mandamos un email de confirmacion.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-sm">
      <h3 className="text-2xl font-bold text-surface-900 mb-2">{title}</h3>
      <p className="text-surface-600 text-sm mb-6">{description}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="iq-name">Nombre completo *</Label>
            <Input id="iq-name" name="name" required minLength={2} maxLength={120} placeholder="Juan Perez" />
          </div>
          <div>
            <Label htmlFor="iq-email">Email *</Label>
            <Input id="iq-email" name="email" type="email" required maxLength={160} placeholder="vos@ejemplo.com" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="iq-phone">Telefono / WhatsApp</Label>
            <Input id="iq-phone" name="phone" type="tel" maxLength={40} placeholder="+54 9 11 0000 0000" />
          </div>
          <div>
            <Label htmlFor="iq-company">Empresa o marca</Label>
            <Input id="iq-company" name="company" maxLength={160} placeholder="Mi Negocio S.A." />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="iq-website">Web actual (si tenes)</Label>
            <Input id="iq-website" name="website" maxLength={240} placeholder="minegocio.com" />
          </div>
          <div>
            <Label htmlFor="iq-budget">Presupuesto orientativo</Label>
            <select
              id="iq-budget"
              name="budget"
              className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              defaultValue=""
            >
              <option value="" disabled>Elegi un rango</option>
              {budgetOptions.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="iq-message">Contanos sobre tu proyecto *</Label>
          <Textarea
            id="iq-message"
            name="message"
            required
            minLength={10}
            maxLength={4000}
            rows={5}
            placeholder="Que necesitas, plazos, referencias de webs que te gusten, etc."
          />
        </div>

        {status === 'error' && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className={`w-full h-11 text-white font-semibold ${accentClass}`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...
            </>
          ) : (
            'Enviar consulta'
          )}
        </Button>
        <p className="text-xs text-surface-500 text-center">
          No usamos tus datos para spam. Solo respondemos tu consulta.
        </p>
      </form>
    </div>
  )
}
