'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tag, Plus, Trash2, Loader2, Copy, Check, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type Coupon = {
  id: string
  code: string
  discount: number
  maxUses: number
  usedCount: number
  validFrom: string
  validUntil: string
  active: boolean
  createdAt: string
  _count: { subscriptions: number }
}

export default function AdminCouponsClient() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState('')

  // Form state
  const [code, setCode] = useState('')
  const [discount, setDiscount] = useState(10)
  const [maxUses, setMaxUses] = useState(1)
  const [validUntil, setValidUntil] = useState('')
  const [showForm, setShowForm] = useState(false)

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/coupons')
      if (res.status === 403) {
        toast.error('No tenés permisos de administrador')
        return
      }
      const data = await res.json()
      setCoupons(data.coupons ?? [])
    } catch {
      toast.error('Error al cargar cupones')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCoupons() }, [fetchCoupons])

  const handleCreate = async () => {
    if (!code || !discount || !validUntil) {
      toast.error('Completá todos los campos')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, discount, maxUses, validUntil }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error)
        return
      }
      toast.success(`Cupón ${data.coupon.code} creado`)
      setShowForm(false)
      setCode('')
      setDiscount(10)
      setMaxUses(1)
      setValidUntil('')
      fetchCoupons()
    } catch {
      toast.error('Error al crear cupón')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' })
      toast.success('Cupón desactivado')
      fetchCoupons()
    } catch {
      toast.error('Error')
    }
  }

  const copyCode = (c: string) => {
    navigator.clipboard.writeText(c)
    setCopied(c)
    setTimeout(() => setCopied(''), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-surface-400" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Cupones de descuento</h1>
          <p className="text-surface-500 text-sm mt-1">Creá y administrá cupones para promotores.</p>
        </div>
        <Button variant="gradient" onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo cupón
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-surface-100 p-6 mb-6">
          <h3 className="font-semibold text-surface-900 mb-4">Crear cupón</h3>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Código</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="PROMO2026"
                className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm font-mono uppercase focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Descuento (%)</label>
              <input
                type="number"
                value={discount}
                onChange={e => setDiscount(Number(e.target.value))}
                min={1}
                max={100}
                className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Usos máximos</label>
              <input
                type="number"
                value={maxUses}
                onChange={e => setMaxUses(Number(e.target.value))}
                min={1}
                className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Válido hasta</label>
              <input
                type="date"
                value={validUntil}
                onChange={e => setValidUntil(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-surface-200 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button variant="gradient" onClick={handleCreate} disabled={creating} className="gap-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
              Crear cupón
            </Button>
          </div>
        </div>
      )}

      {/* Coupons list */}
      <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-100 bg-surface-50">
              <th className="text-left py-3 px-4 font-medium text-surface-500">Código</th>
              <th className="text-center py-3 px-4 font-medium text-surface-500">Descuento</th>
              <th className="text-center py-3 px-4 font-medium text-surface-500">Usos</th>
              <th className="text-center py-3 px-4 font-medium text-surface-500">Válido hasta</th>
              <th className="text-center py-3 px-4 font-medium text-surface-500">Estado</th>
              <th className="text-right py-3 px-4 font-medium text-surface-500">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-surface-400">No hay cupones creados</td></tr>
            )}
            {coupons.map(c => (
              <tr key={c.id} className="border-b border-surface-50 hover:bg-surface-25">
                <td className="py-3 px-4">
                  <button onClick={() => copyCode(c.code)} className="flex items-center gap-1.5 font-mono font-bold text-brand-600 hover:text-brand-700">
                    {c.code}
                    {copied === c.code ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-surface-300" />}
                  </button>
                </td>
                <td className="py-3 px-4 text-center font-medium">{c.discount}%</td>
                <td className="py-3 px-4 text-center">{c.usedCount}/{c.maxUses}</td>
                <td className="py-3 px-4 text-center text-surface-500">{new Date(c.validUntil).toLocaleDateString('es-AR')}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.active ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-100 text-surface-500'}`}>
                    {c.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  {c.active && (
                    <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
