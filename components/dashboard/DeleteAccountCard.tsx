'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

/**
 * Account deletion, with a confirmation the user cannot stumble into.
 *
 * TWO STEPS, and they are two steps on purpose:
 *   1. a button that only OPENS a dialog — it deletes nothing, so no misclick
 *      on the settings page can start anything;
 *   2. inside the dialog, the user must type their own account email. The
 *      confirm button stays disabled until it matches, and the server checks
 *      the same thing again (lib/account-deletion.ts, confirmationMatches), so
 *      a replayed or hand-crafted request without the phrase is refused too.
 *
 * The dialog states plainly what is lost, that billing stops, and that there is
 * no self-service undo. Burying any of that would make the confirmation
 * theatre rather than consent.
 */
export function DeleteAccountCard({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)

  const matches = typed.trim().toLowerCase() === email.trim().toLowerCase() && email.length > 0

  const handleDelete = async () => {
    if (!matches || busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail: typed }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        // The 502 path is the important one: billing could NOT be fully stopped,
        // so nothing was deleted and the account still works. Say exactly that
        // instead of a generic error — a user who thinks they are deleted but is
        // still being charged is the outcome this whole flow exists to prevent.
        toast.error(data?.error ?? 'No pudimos procesar la baja. Intentá de nuevo.')
        setBusy(false)
        return
      }

      toast.success('Tu cuenta fue dada de baja. Cerrando sesión…')
      // Sign out rather than merely redirect: the account is already blocked
      // server-side, so leaving a stale token in the browser would only produce
      // confusing 401s on every page.
      await signOut({ callbackUrl: '/' })
    } catch {
      toast.error('Error de red. Tu cuenta NO fue eliminada.')
      setBusy(false)
    }
  }

  const close = (next: boolean) => {
    if (busy) return
    setOpen(next)
    if (!next) setTyped('')
  }

  return (
    <div className="rounded-xl border border-danger-200 bg-danger-50/40 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-danger-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-danger-800">Eliminar cuenta</h3>
          <p className="text-xs text-danger-700/80 mt-1 leading-relaxed">
            Se cancelan todas tus suscripciones, tus sitios publicados dejan de estar online de
            inmediato y tus datos personales se eliminan en un plazo de 30 días. No se puede
            deshacer.
          </p>
          <div className="mt-4">
            <Button
              variant="destructive"
              size="sm"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => setOpen(true)}
            >
              Eliminar mi cuenta
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={close}>
        <DialogContent size="default">
          <DialogHeader>
            <DialogTitle>¿Eliminar tu cuenta definitivamente?</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer por vos mismo.</DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="rounded-xl bg-surface-50 border border-surface-200 p-4">
              <p className="text-xs font-semibold text-surface-700 mb-2">Ahora mismo:</p>
              <ul className="text-xs text-surface-600 space-y-1.5 list-disc pl-4">
                <li>
                  Se <strong>cancelan todas tus suscripciones</strong> en MercadoPago. No se te
                  vuelve a cobrar.
                </li>
                <li>
                  Tus sitios publicados <strong>dejan de estar online</strong> y sus direcciones
                  quedan libres.
                </li>
                <li>Perdés el acceso a tu cuenta inmediatamente.</li>
              </ul>
              <p className="text-xs font-semibold text-surface-700 mt-3 mb-2">En 30 días:</p>
              <ul className="text-xs text-surface-600 space-y-1.5 list-disc pl-4">
                <li>
                  Se eliminan tus datos personales, el contenido de tus sitios, tus imágenes,
                  tus credenciales guardadas y{' '}
                  <strong>los contactos recibidos en tus sitios</strong>. Descargalos antes si los
                  necesitás.
                </li>
                <li>
                  Se conserva un registro de facturación anonimizado (montos, fechas, plan e ids de
                  pago, sin tus datos) porque la ley nos obliga a guardarlo.
                </li>
              </ul>
            </div>

            <div>
              <label
                htmlFor="confirm-email"
                className="block text-sm font-medium text-surface-700 mb-1.5"
              >
                Escribí <span className="font-mono text-danger-700">{email}</span> para confirmar
              </label>
              <input
                id="confirm-email"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                disabled={busy}
                placeholder={email}
                className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-white text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-danger-500/20 focus:border-danger-400 transition-all disabled:opacity-60"
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => close(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              loading={busy}
              disabled={!matches || busy}
              leftIcon={busy ? undefined : <Trash2 className="h-4 w-4" />}
            >
              Eliminar definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
