'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const schema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirmá tu contraseña'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      })
      const d = await res.json()
      if (!res.ok) {
        setError(d.error ?? 'Error al restablecer la contraseña')
        return
      }
      setDone(true)
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    }
  }

  if (!token) {
    return (
      <div className="space-y-6 text-center py-8">
        <p className="text-white/50">Link inválido. Solicitá uno nuevo desde la página de login.</p>
        <Link href="/forgot-password" className="text-brand-400 hover:text-brand-300 text-sm font-medium">
          Solicitar nuevo link
        </Link>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-7"
    >
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Volver al login
      </Link>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white mb-1.5">Nueva contraseña</h1>
              <p className="text-sm text-white/50">Elegí una contraseña segura para tu cuenta.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/70">Nueva contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    className={cn(
                      'w-full h-11 pl-10 pr-11 rounded-xl border bg-white/5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 transition-all',
                      errors.password ? 'border-danger-500/60 focus:ring-danger-500/20' : 'border-white/10 focus:border-brand-500/60 focus:ring-brand-500/20'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-danger-400">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/70">Confirmar contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    {...register('confirmPassword')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repetí la contraseña"
                    className={cn(
                      'w-full h-11 pl-10 pr-4 rounded-xl border bg-white/5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 transition-all',
                      errors.confirmPassword ? 'border-danger-500/60 focus:ring-danger-500/20' : 'border-white/10 focus:border-brand-500/60 focus:ring-brand-500/20'
                    )}
                  />
                </div>
                {errors.confirmPassword && <p className="text-xs text-danger-400">{errors.confirmPassword.message}</p>}
              </div>

              {error && <p className="text-xs text-danger-400 text-center">{error}</p>}

              <Button type="submit" variant="gradient" size="lg" loading={isSubmitting} className="w-full shadow-brand" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Cambiar contraseña
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-20 h-20 gradient-brand rounded-3xl flex items-center justify-center mx-auto shadow-brand"
            >
              <CheckCircle className="h-10 w-10 text-white" />
            </motion.div>
            <div>
              <h2 className="text-xl font-extrabold text-white mb-2">Contraseña actualizada</h2>
              <p className="text-sm text-white/50">Tu contraseña se cambió correctamente. Ya podés iniciar sesión.</p>
            </div>
            <Link href="/login">
              <Button variant="gradient" size="lg" className="shadow-brand" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Ir al login
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
