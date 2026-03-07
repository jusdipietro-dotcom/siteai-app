'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Chrome } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'El email es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  remember: z.boolean().optional(),
})

type LoginData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginData) => {
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      toast.error('Credenciales incorrectas')
      return
    }

    toast.success('¡Bienvenido de vuelta!')
    router.push('/dashboard')
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-7"
    >
      <div>
        <h1 className="text-2xl font-extrabold text-white mb-1.5">Iniciá sesión</h1>
        <p className="text-sm text-white/50">
          ¿No tenés cuenta?{' '}
          <Link href="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Registrate gratis
          </Link>
        </p>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
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
          <label className="text-sm font-medium text-white/70">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              {...register('email')}
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              className={cn(
                'w-full h-11 pl-10 pr-4 rounded-xl border bg-white/5 text-white text-sm placeholder:text-white/30',
                'focus:outline-none focus:ring-2 transition-all',
                errors.email
                  ? 'border-danger-500/60 focus:ring-danger-500/20'
                  : 'border-white/10 focus:border-brand-500/60 focus:ring-brand-500/20'
              )}
            />
          </div>
          {errors.email && <p className="text-xs text-danger-400">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white/70">Contraseña</label>
            <Link href="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className={cn(
                'w-full h-11 pl-10 pr-11 rounded-xl border bg-white/5 text-white text-sm placeholder:text-white/30',
                'focus:outline-none focus:ring-2 transition-all',
                errors.password
                  ? 'border-danger-500/60 focus:ring-danger-500/20'
                  : 'border-white/10 focus:border-brand-500/60 focus:ring-brand-500/20'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-danger-400">{errors.password.message}</p>}
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            {...register('remember')}
            type="checkbox"
            className="h-4 w-4 rounded border-white/20 bg-white/5 accent-brand-500"
          />
          <span className="text-sm text-white/50">Recordarme por 30 días</span>
        </label>

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          loading={isSubmitting}
          className="w-full shadow-brand"
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Iniciar sesión
        </Button>
      </form>

      <p className="text-xs text-center text-white/20">
        Al continuar aceptás nuestros{' '}
        <Link href="/terms" className="underline hover:text-white/40 transition-colors">Términos de uso</Link>
        {' '}y{' '}
        <Link href="/privacy" className="underline hover:text-white/40 transition-colors">Política de privacidad</Link>
      </p>
    </motion.div>
  )
}
