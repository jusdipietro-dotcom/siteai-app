'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Chrome, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Al menos 8 caracteres')
    .regex(/[A-Z]/, 'Al menos una mayúscula')
    .regex(/[0-9]/, 'Al menos un número'),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Debés aceptar los términos' }) }),
})

type RegisterData = z.infer<typeof registerSchema>

const passwordChecks = [
  { label: 'Al menos 8 caracteres', test: (v: string) => v.length >= 8 },
  { label: 'Al menos una mayúscula', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Al menos un número', test: (v: string) => /[0-9]/.test(v) },
]

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') ?? 'free'
  const [showPassword, setShowPassword] = useState(false)
  const [passwordValue, setPasswordValue] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
    })

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error ?? 'Error al crear la cuenta')
      return
    }

    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      toast.error('Cuenta creada. Iniciá sesión para continuar.')
      router.push('/login')
      return
    }

    toast.success('¡Cuenta creada! Empecemos con tu sitio.')
    router.push('/wizard')
    router.refresh()
  }

  const handleGoogleRegister = async () => {
    await signIn('google', { callbackUrl: '/wizard' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div>
        {plan !== 'free' && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/25 text-brand-300 text-xs font-medium mb-4">
            Plan {plan} seleccionado
          </div>
        )}
        <h1 className="text-2xl font-extrabold text-white mb-1.5">Crear cuenta gratis</h1>
        <p className="text-sm text-white/50">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Iniciá sesión
          </Link>
        </p>
      </div>

      <button
        type="button"
        onClick={handleGoogleRegister}
        className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all"
      >
        <Chrome className="h-4 w-4" />
        Continuar con Google
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-white/30">o con email</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/70">Nombre completo</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              {...register('name')}
              type="text"
              placeholder="Tu nombre"
              autoComplete="name"
              className={cn(
                'w-full h-11 pl-10 pr-4 rounded-xl border bg-white/5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 transition-all',
                errors.name ? 'border-danger-500/60 focus:ring-danger-500/20' : 'border-white/10 focus:border-brand-500/60 focus:ring-brand-500/20'
              )}
            />
          </div>
          {errors.name && <p className="text-xs text-danger-400">{errors.name.message}</p>}
        </div>

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

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/70">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              onChange={(e) => setPasswordValue(e.target.value)}
              className={cn(
                'w-full h-11 pl-10 pr-11 rounded-xl border bg-white/5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 transition-all',
                errors.password ? 'border-danger-500/60 focus:ring-danger-500/20' : 'border-white/10 focus:border-brand-500/60 focus:ring-brand-500/20'
              )}
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {passwordValue && (
            <div className="space-y-1 pt-0.5">
              {passwordChecks.map(({ label, test }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <CheckCircle2 className={cn('h-3.5 w-3.5', test(passwordValue) ? 'text-success-400' : 'text-white/20')} />
                  <span className={cn('text-xs', test(passwordValue) ? 'text-white/60' : 'text-white/25')}>{label}</span>
                </div>
              ))}
            </div>
          )}
          {errors.password && <p className="text-xs text-danger-400">{errors.password.message}</p>}
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input {...register('acceptTerms')} type="checkbox" className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 accent-brand-500 shrink-0" />
          <span className="text-sm text-white/50 leading-relaxed">
            Acepto los{' '}
            <Link href="/terms" className="text-brand-400 hover:text-brand-300 underline transition-colors">Términos de uso</Link>
            {' '}y la{' '}
            <Link href="/privacy" className="text-brand-400 hover:text-brand-300 underline transition-colors">Política de privacidad</Link>
          </span>
        </label>
        {errors.acceptTerms && <p className="text-xs text-danger-400">{errors.acceptTerms.message}</p>}

        <Button type="submit" variant="gradient" size="lg" loading={isSubmitting} className="w-full shadow-brand" rightIcon={<ArrowRight className="h-4 w-4" />}>
          Crear cuenta gratis
        </Button>
      </form>
    </motion.div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
