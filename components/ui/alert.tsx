import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative w-full rounded-xl border p-4 flex gap-3',
  {
    variants: {
      variant: {
        default:     'bg-surface-50 border-surface-200 text-surface-700',
        info:        'bg-brand-50 border-brand-100 text-brand-800',
        success:     'bg-success-50 border-success-100 text-success-800',
        warning:     'bg-warning-50 border-warning-100 text-warning-800',
        destructive: 'bg-danger-50 border-danger-100 text-danger-800',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

const icons = {
  default:     Info,
  info:        Info,
  success:     CheckCircle2,
  warning:     AlertCircle,
  destructive: XCircle,
}

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', title, children, ...props }, ref) => {
    const Icon = icons[variant ?? 'default']
    return (
      <div ref={ref} className={cn(alertVariants({ variant }), className)} {...props}>
        <Icon className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="flex flex-col gap-0.5">
          {title && <p className="font-semibold text-sm">{title}</p>}
          {children && <div className="text-sm opacity-90">{children}</div>}
        </div>
      </div>
    )
  }
)
Alert.displayName = 'Alert'

export { Alert }
