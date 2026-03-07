'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Email inválido'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    await new Promise((r) => setTimeout(r, 1200))
    setSentEmail(data.email)
    setSent(true)
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
        {!sent ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white mb-1.5">Recuperar acceso</h1>
              <p className="text-sm text-white/50">
                Ingresá tu email y te enviaremos un link para restablecer tu contraseña.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/70">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    className={cn(
                      'w-full h-11 pl-10 pr-4 rounded-xl border bg-white/5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 transition-all',
                      errors.email ? 'border-danger-500/60 focus:ring-danger-500/20' : 'border-white/10 focus:border-brand-500/60 focus:ring-brand-500/20'
                    )}
                  />
                </div>
                {errors.email && <p className="text-xs text-danger-400">{errors.email.message}</p>}
              </div>

              <Button type="submit" variant="gradient" size="lg" loading={isSubmitting} className="w-full shadow-brand" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Enviar link de recuperación
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
              <h2 className="text-xl font-extrabold text-white mb-2">Email enviado</h2>
              <p className="text-sm text-white/50 leading-relaxed">
                Revisá tu casilla <span className="text-white/80 font-medium">{sentEmail}</span> y hacé click en el link para restablecer tu contraseña.
              </p>
            </div>

            <div className="glass-dark rounded-xl p-4 text-sm text-white/40 text-left space-y-1">
              <p>• Revisá también la carpeta de spam</p>
              <p>• El link expira en 24 horas</p>
              <p>• Si no lo recibís, podés reenviar el email</p>
            </div>

            <div className="flex flex-col gap-3">
              <button type="button" onClick={() => setSent(false)} className="text-sm text-brand-400 hover:text-brand-300 transition-colors font-medium">
                Reenviar email
              </button>
              <Link href="/login" className="text-sm text-white/40 hover:text-white/60 transition-colors">
                Volver al login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
