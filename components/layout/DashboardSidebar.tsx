'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, BookTemplate, Settings, HelpCircle,
  Plus, LogOut, Search, Image, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/useUIStore'
import { useProjectStore } from '@/store/useProjectStore'
import { Avatar } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { useSession, signOut } from 'next-auth/react'

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/templates',  label: 'Templates',  icon: BookTemplate },
]

const BOTTOM_ITEMS = [
  { href: '/settings',   label: 'Configuración', icon: Settings },
  { href: '/help',       label: 'Ayuda',          icon: HelpCircle },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarCollapsed, toggleSidebar, openCommandPalette } = useUIStore()
  const { projects } = useProjectStore()
  const { data: session } = useSession()

  const publishedCount = projects.filter((p) => p.status === 'published').length
  const user = session?.user
  const planLabel = user?.plan === 'professional' ? 'Plan Professional' : user?.plan === 'essential' ? 'Plan Essential' : 'Plan Gratuito'

  const handleLogout = async () => {
    toast.success('Sesión cerrada')
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 z-30 flex h-screen flex-col bg-surface-950 border-r border-white/5 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/5 shrink-0">
        <AnimatePresence mode="wait">
          {!sidebarCollapsed ? (
            <motion.div
              key="full"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2.5 flex-1 min-w-0"
            >
              <img src="/logo.png" alt="Automatic IA Lab" className="h-8 w-8 object-contain rounded-xl shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">Automatic IA Lab</p>
                <p className="text-[10px] text-white/40 truncate">Website Builder</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center mx-auto"
            >
              <img src="/logo.png" alt="Automatic IA Lab" className="h-8 w-8 object-contain rounded-xl" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main scroll area */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto scrollbar-hide py-3 gap-1">
        {/* Search / Command */}
        {!sidebarCollapsed && (
          <div className="px-3 mb-1">
            <button
              onClick={openCommandPalette}
              className="w-full flex items-center gap-2 h-8 px-3 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 text-xs transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">Buscar...</span>
              <kbd className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
            </button>
          </div>
        )}

        {/* New site button */}
        <div className="px-3 mb-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/wizard')}
            className={cn(
              'w-full flex items-center gap-2 h-9 px-3 rounded-xl gradient-brand text-white text-sm font-semibold shadow-brand/50 shadow-md hover:opacity-90 transition-opacity',
              sidebarCollapsed && 'justify-center px-0'
            )}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && 'Nuevo sitio'}
          </motion.button>
        </div>

        {/* Nav */}
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'mx-3 flex items-center gap-3 h-9 px-3 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:bg-white/6 hover:text-white/80',
                sidebarCollapsed && 'justify-center px-0 mx-3'
              )}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
              {!sidebarCollapsed && isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400"
                />
              )}
            </Link>
          )
        })}

        {/* Projects section */}
        {!sidebarCollapsed && (
          <div className="mt-3 px-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-1.5 px-1">
              Proyectos
            </p>
            {projects.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}/editor`}
                className={cn(
                  'flex items-center gap-2.5 h-8 px-2 rounded-lg text-xs text-white/50 hover:bg-white/6 hover:text-white/80 transition-all truncate',
                  pathname.includes(project.id) && 'bg-white/8 text-white/80'
                )}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  ref={(el) => { if (el) el.style.backgroundColor = project.businessData.branding.primaryColor }}
                />
                <span className="truncate">{project.name}</span>
              </Link>
            ))}
            {projects.length > 4 && (
              <Link href="/dashboard" className="flex items-center gap-2 h-8 px-2 text-xs text-white/30 hover:text-white/50 transition-colors">
                +{projects.length - 4} más
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="border-t border-white/5 py-3 space-y-1 shrink-0">
        {!sidebarCollapsed && (
          <Link
            href="/media"
            className="mx-3 flex items-center gap-3 h-9 px-3 rounded-xl text-sm text-white/50 hover:bg-white/6 hover:text-white/80 transition-colors"
          >
            <Image className="h-4 w-4 shrink-0" />
            <span>Multimedia</span>
          </Link>
        )}

        {BOTTOM_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'mx-3 flex items-center gap-3 h-9 px-3 rounded-xl text-sm text-white/50 hover:bg-white/6 hover:text-white/80 transition-colors',
              sidebarCollapsed && 'justify-center px-0'
            )}
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>{label}</span>}
          </Link>
        ))}

        {/* Plan badge */}
        {!sidebarCollapsed && user?.plan && user.plan !== 'free' && (
          <div className="mx-3 mt-2 rounded-xl bg-gradient-to-r from-brand-600/20 to-violet-600/20 border border-brand-500/20 p-3">
            <p className="text-xs font-semibold text-brand-300 mb-0.5">{planLabel}</p>
            <p className="text-[10px] text-white/40">{publishedCount} sitios publicados</p>
          </div>
        )}

        {/* User */}
        <div className={cn(
          'mx-3 flex items-center gap-2.5 h-10 px-2 rounded-xl hover:bg-white/6 transition-colors cursor-pointer group mt-1',
          sidebarCollapsed && 'justify-center px-0'
        )}>
          <Avatar name={user?.name ?? 'Usuario'} size="sm" className="shrink-0" />
          {!sidebarCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/80 truncate">{user?.name ?? 'Usuario'}</p>
                <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white/70"
                title="Cerrar sesión"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-surface-800 border border-white/10 flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-surface-700 transition-all shadow-soft"
      >
        {sidebarCollapsed
          ? <ChevronRight className="h-3 w-3" />
          : <ChevronLeft className="h-3 w-3" />
        }
      </button>
    </motion.aside>
  )
}
