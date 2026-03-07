import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:     'bg-surface-100 text-surface-700',
        secondary:   'bg-surface-100 text-surface-600',
        outline:     'border border-surface-200 text-surface-600',
        primary:     'bg-brand-50 text-brand-700 border border-brand-100',
        success:     'bg-success-50 text-success-700 border border-success-100',
        warning:     'bg-warning-50 text-warning-700 border border-warning-100',
        danger:      'bg-danger-50 text-danger-700 border border-danger-100',
        // Project statuses
        draft:       'bg-surface-100 text-surface-600 border border-surface-200',
        generating:  'bg-brand-50 text-brand-700 border border-brand-100 animate-pulse',
        ready:       'bg-warning-50 text-warning-700 border border-warning-100',
        published:   'bg-success-50 text-success-700 border border-success-100',
        error:       'bg-danger-50 text-danger-700 border border-danger-100',
        // Plan
        free:        'bg-surface-100 text-surface-600',
        essential:   'bg-brand-50 text-brand-700',
        professional:'bg-gradient-to-r from-brand-500 to-violet-600 text-white shadow-sm',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'inline-block h-1.5 w-1.5 rounded-full',
            variant === 'published'   && 'bg-success-500',
            variant === 'generating'  && 'bg-brand-500',
            variant === 'ready'       && 'bg-warning-500',
            variant === 'draft'       && 'bg-surface-400',
            variant === 'error'       && 'bg-danger-500',
          )}
        />
      )}
      {children}
    </div>
  )
}

const statusLabel: Record<string, string> = {
  draft: 'Borrador',
  generating: 'Generando...',
  ready: 'Listo para publicar',
  published: 'Publicado',
  error: 'Error',
}

export function StatusBadge({ status }: { status: string }) {
  const variant = status as 'draft' | 'generating' | 'ready' | 'published' | 'error'
  return (
    <Badge variant={variant} dot>
      {statusLabel[status] ?? status}
    </Badge>
  )
}

export { Badge, badgeVariants }
