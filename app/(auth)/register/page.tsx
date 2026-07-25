'use client'
import { useState, useEffect, Suspense } from 'react'
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
import { resolveNextRoute } from '@/lib/next-routes'
import { rememberWebsitePlanPreference } from '@/lib/plan-preference'
import { getWebsitePlanConfig, WEBSITE_PLANS, formatARS } from '@/lib/website-plans'

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
  const planParam = searchParams.get('plan')
  const next = searchParams.get('next')
  const redirectTo = resolveNextRoute(next, '/wizard')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordValue, setPasswordValue] = useState('')

  /**
   * The plan chosen on the pricing page used to reach this screen, get rendered
   * as a badge, and then die at submit — so a customer who picked Professional
   * had to pick it again at checkout, at the moment of highest purchase intent.
   *
   * `getWebsitePlanConfig` returns undefined for anything that is not a real
   * plan id, which is what makes `?plan=<junk>` a no-op instead of an error: no
   * badge, no preference, and the raw param never reaches the DOM — the label
   * below comes from the plan config, not from the query string.
   */
  const chosenPlan = getWebsitePlanConfig(planParam)

  /**
   * Written on mount rather than at submit so it survives BOTH ways off this
   * page: the credentials form (same document) and the Google button, which
   * navigates to Google's origin and back. sessionStorage is per-tab and per
   * origin, so the round trip preserves it; a value written only in `onSubmit`
   * would never exist for the OAuth path.
   */
  useEffect(() => {
    rememberWebsitePlanPreference(planParam)
  }, [planParam])

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

    const toastMessages: Record<string, string> = {
      monitoreo: '¡Cuenta creada! Configurá tu monitoreo.',
      linkedin: '¡Cuenta creada! Configurá tu LinkedIn Optimizer.',
      resenas: '¡Cuenta creada! Configurá tus reseñas.',
      crypto: '¡Cuenta creada! Configurá tus señales crypto.',
      leads: '¡Cuenta creada! Configurá tu captación de leads.',
    }
    toast.success(toastMessages[next ?? ''] ?? '¡Cuenta creada! Empecemos con tu sitio.')
    router.push(redirectTo)
    router.refresh()
  }

  const handleGoogleRegister = async () => {
    await signIn('google', { callbackUrl: redirectTo })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Mobile sales hero — the desktop pitch panel is hidden on phones, so the
          hook lives here too, right above the form. */}
      <div className="lg:hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-semibold tracking-wide uppercase">
          Sitios web con IA
        </span>
        <h2 className="text-2xl font-extrabold text-white leading-tight">
          Tu sitio web, publicado <span className="gradient-text">esta misma tarde.</span>
        </h2>
        <p className="text-white/55 text-sm leading-relaxed">
          Sin programar. Un asistente lo arma según tu negocio y vos lo editás desde el navegador.
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="text-emerald-400 font-medium">🆓 Armarlo es gratis, sin tarjeta</span>
          <span className="text-white/30">·</span>
          <span className="text-white/70">desde <span className="font-bold text-white">{formatARS(WEBSITE_PLANS.essential.annual)}</span>/mes al publicar</span>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {['Abogados', 'Contadores', 'Gimnasios', 'Comercios', 'Consultorios', 'y más'].map((r) => (
            <span key={r} className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-white/55 text-[11px]">{r}</span>
          ))}
        </div>
      </div>

      <div>
        {chosenPlan && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/25 text-brand-300 text-xs font-medium mb-4">
            Plan {chosenPlan.name} seleccionado
          </div>
        )}
        <h1 className="text-2xl font-extrabold text-white mb-1.5">Crear cuenta gratis</h1>
        <p className="text-sm text-white/50">
          ¿Ya tenés cuenta?{' '}
          <Link href={next ? `/login?next=${next}` : '/login'} className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
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
              {...register('password', { onChange: (e) => setPasswordValue(e.target.value) })}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
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
