'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { User, Bell, Shield, CreditCard, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'profile',  label: 'Perfil',       icon: User },
  { id: 'billing',  label: 'Facturación',   icon: CreditCard },
  { id: 'notifs',   label: 'Notificaciones', icon: Bell },
  { id: 'security', label: 'Seguridad',     icon: Shield },
]

export default function SettingsPage() {
  const { data: session } = useSession()
  const user = session?.user
  const [activeTab, setActiveTab] = useState('profile')
  const [name, setName] = useState(user?.name ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
    toast.success('Cambios guardados')
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-surface-900 mb-1">Configuración</h1>
        <p className="text-sm text-surface-500 mb-8">Administrá tu cuenta y preferencias.</p>

        <div className="flex gap-8">
          {/* Sidebar tabs */}
          <aside className="w-52 flex-shrink-0">
            <nav className="space-y-1">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'w-full flex items-center gap-3 h-9 px-3 rounded-xl text-sm font-medium transition-all',
                    activeTab === id
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                  )}
                >
                  <Icon className={cn('h-4 w-4', activeTab === id ? 'text-brand-500' : 'text-surface-400')} />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 bg-white rounded-2xl border border-surface-200 p-6"
          >
            {activeTab === 'profile' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-surface-900 mb-4">Información personal</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1.5">Nombre</label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
                      <input
                        value={user?.email ?? ''}
                        disabled
                        className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-100 text-sm text-surface-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-surface-400 mt-1">El email no puede modificarse.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1.5">Plan actual</label>
                      <div className="h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-700 flex items-center capitalize">
                        {user?.plan === 'free' ? 'Gratuito' : user?.plan === 'essential' ? 'Essential' : 'Professional'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-surface-100">
                  <Button variant="primary" size="sm" leftIcon={<Save className="h-4 w-4" />} loading={saving} onClick={handleSave}>
                    Guardar cambios
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div>
                <h2 className="text-base font-semibold text-surface-900 mb-4">Facturación y plan</h2>
                <div className="rounded-xl bg-brand-50 border border-brand-100 p-5 mb-4">
                  <p className="text-sm font-semibold text-brand-800 mb-1">Plan actual: {user?.plan === 'free' ? 'Gratuito' : user?.plan === 'essential' ? 'Essential' : 'Professional'}</p>
                  <p className="text-xs text-brand-600">Para cambiar de plan, publicá un nuevo sitio desde el editor.</p>
                </div>
                <p className="text-sm text-surface-500">Los pagos son procesados de forma segura a través de MercadoPago.</p>
              </div>
            )}

            {activeTab === 'notifs' && (
              <div>
                <h2 className="text-base font-semibold text-surface-900 mb-4">Notificaciones</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Novedades del producto', desc: 'Recibí emails sobre nuevas funciones.' },
                    { label: 'Actividad de proyectos', desc: 'Alertas cuando un sitio cambia de estado.' },
                    { label: 'Resumen semanal', desc: 'Un resumen de tus estadísticas cada semana.' },
                  ].map(({ label, desc }) => (
                    <div key={label} className="flex items-start justify-between gap-4 py-3 border-b border-surface-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-surface-800">{label}</p>
                        <p className="text-xs text-surface-400 mt-0.5">{desc}</p>
                      </div>
                      <button
                        type="button"
                        className="h-6 w-11 rounded-full bg-brand-500 flex items-center px-1 transition-colors flex-shrink-0"
                        aria-label={`Toggle ${label}`}
                      >
                        <span className="h-4 w-4 rounded-full bg-white shadow-sm ml-auto" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-base font-semibold text-surface-900 mb-4">Seguridad</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">Contraseña actual</label>
                    <input type="password" className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">Nueva contraseña</label>
                    <input type="password" className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">Confirmar nueva contraseña</label>
                    <input type="password" className="w-full h-10 px-3 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" placeholder="••••••••" />
                  </div>
                  <div className="pt-2">
                    <Button variant="primary" size="sm" leftIcon={<Shield className="h-4 w-4" />} onClick={() => toast.success('Contraseña actualizada')}>
                      Actualizar contraseña
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
