'use client'

import { useState, useEffect, useCallback } from 'react'
import { Gift, Plus, Trash2, Loader2, Users, Clock, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type FreeUser = {
  id: string
  email: string
  name: string | null
  isFreeAccount: boolean
  freeAccountNote: string | null
  createdAt: string
  _count: Record<string, number>
}

export default function AdminFreeAccountsClient() {
  const [users, setUsers] = useState<FreeUser[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [expiring, setExpiring] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/free-accounts')
      if (res.status === 403) {
        toast.error('No tenes permisos de administrador')
        return
      }
      const data = await res.json()
      setUsers(data.users ?? [])
    } catch {
      toast.error('Error al cargar cuentas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const addFreeAccount = async () => {
    if (!email.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/admin/free-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), note: note.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Error')
        return
      }
      toast.success(`Cuenta gratuita activada para ${email}`)
      setEmail('')
      setNote('')
      setShowForm(false)
      fetchUsers()
    } catch {
      toast.error('Error de conexion')
    } finally {
      setAdding(false)
    }
  }

  const removeFreeAccount = async (userId: string, userEmail: string) => {
    if (!confirm(`Revocar acceso gratuito de ${userEmail}?`)) return
    try {
      const res = await fetch('/api/admin/free-accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) {
        toast.error('Error al revocar')
        return
      }
      toast.success(`Acceso gratuito revocado para ${userEmail}`)
      fetchUsers()
    } catch {
      toast.error('Error de conexion')
    }
  }

  const expireTrials = async () => {
    setExpiring(true)
    try {
      const res = await fetch('/api/admin/expire-trials', { method: 'POST' })
      const data = await res.json()
      toast.success(`${data.expired} trials expirados`)
    } catch {
      toast.error('Error al expirar trials')
    } finally {
      setExpiring(false)
    }
  }

  const totalSubs = (u: FreeUser) => Object.values(u._count).reduce((a, b) => a + b, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Gift className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cuentas Gratuitas</h1>
            <p className="text-sm text-gray-500">{users.length} cuentas con acceso gratuito permanente</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expireTrials} disabled={expiring}>
            {expiring ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Clock className="w-4 h-4 mr-1" />}
            Expirar Trials
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-1" /> Agregar
          </Button>
        </div>
      </div>

      {/* Scope warning. isFreeAccount is a User-level flag with no expiry, so
          it is a much broader grant than gifting a single site — spelling that
          out here is the difference between comping one project and comping
          the customer's entire account forever. */}
      <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold mb-0.5">Esto libera TODOS los productos, para siempre</p>
          <p className="text-amber-800">
            Una cuenta gratuita da acceso sin cargo a los 12 productos de suscripción, sin fecha
            de vencimiento, hasta que la revoques a mano. Si sólo querés regalar un sitio web,
            usá <span className="font-medium">Admin → Sitios → Regalar</span>.
          </p>
        </div>
      </div>

      {showForm && (
        <div className="bg-gray-50 border rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Nueva cuenta gratuita</h3>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email del usuario *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">El usuario debe estar registrado primero</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Nota (opcional)</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Ej: CUIT 20-12345678-9, cliente piloto"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addFreeAccount} disabled={adding || !email.trim()}>
              {adding ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Activar acceso gratuito
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {users.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-1">No hay cuentas gratuitas</p>
          <p className="text-sm text-gray-400">Usa el boton "Agregar" para dar acceso gratuito a un usuario</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Usuario</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Nota</th>
                <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Suscripciones</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{u.name || 'Sin nombre'}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">{u.freeAccountNote || '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
                      {totalSubs(u)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => removeFreeAccount(u.id, u.email)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
