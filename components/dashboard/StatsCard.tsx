import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const colorMap = {
  brand: { bg: 'bg-brand-50', text: 'text-brand-600', icon: 'text-brand-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-500' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', icon: 'text-violet-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-500' },
}

interface StatsCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color: keyof typeof colorMap
  trend?: string
}

export function StatsCard({ label, value, icon: Icon, color, trend }: StatsCardProps) {
  const c = colorMap[color]
  return (
    <div className="bg-white border border-surface-100 rounded-2xl p-5 shadow-soft">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', c.bg)}>
          <Icon className={cn('w-5 h-5', c.icon)} />
        </div>
        {trend && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-extrabold text-surface-900 mb-0.5">{value}</p>
      <p className="text-sm text-surface-500">{label}</p>
    </div>
  )
}
