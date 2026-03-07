'use client'
import { useEffect } from 'react'
import { useUIStore } from '@/store/useUIStore'
import { useProjectStore } from '@/store/useProjectStore'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { cn } from '@/lib/utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore()
  const { fetchProjects } = useProjectStore()

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return (
    <div className="flex min-h-screen bg-surface-50">
      <DashboardSidebar />
      <main
        className={cn(
          'flex-1 min-w-0 transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-60'
        )}
      >
        {children}
      </main>
    </div>
  )
}
