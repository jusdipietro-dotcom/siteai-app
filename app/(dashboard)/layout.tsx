'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { useProjectStore } from '@/store/useProjectStore'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { cn } from '@/lib/utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore()
  const { fetchProjects } = useProjectStore()
  const router = useRouter()
  const pathname = usePathname()

  // Pages that have their own full-screen header — don't show mobile top bar
  const hideMobileBar = pathname === '/wizard' || pathname.includes('/editor') || pathname.includes('/preview')

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return (
    <div className="flex min-h-screen bg-surface-50">
      <DashboardSidebar />

      {/* Mobile top bar — hidden on pages with their own header */}
      {!hideMobileBar && (
        <div className="md:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between h-14 px-4 bg-surface-950 border-b border-white/10">
          <Link href="/dashboard">
            <Image src="/logo.png" alt="Automatic IA Lab" width={28} height={28} className="h-7 w-7 object-contain rounded-lg" />
          </Link>
          <button
            type="button"
            onClick={() => router.push('/wizard')}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl gradient-brand text-white text-xs font-semibold shadow-brand/50 shadow-md"
          >
            <Plus className="h-3.5 w-3.5" /> Nuevo sitio
          </button>
        </div>
      )}

      <main
        className={cn(
          'flex-1 min-w-0 transition-all duration-300',
          !hideMobileBar && 'pt-14 md:pt-0',
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'
        )}
      >
        {children}
      </main>
    </div>
  )
}
