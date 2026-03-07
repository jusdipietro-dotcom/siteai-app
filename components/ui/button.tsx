import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.97] select-none',
  {
    variants: {
      variant: {
        default:     'bg-surface-900 text-white hover:bg-surface-700 shadow-soft',
        primary:     'bg-brand-600 text-white hover:bg-brand-700 shadow-soft',
        gradient:    'gradient-brand text-white hover:opacity-90 shadow-brand',
        secondary:   'bg-surface-100 text-surface-800 hover:bg-surface-200',
        outline:     'border border-surface-200 bg-white text-surface-700 hover:bg-surface-50 hover:border-surface-300',
        ghost:       'text-surface-600 hover:bg-surface-100 hover:text-surface-900',
        destructive: 'bg-danger-600 text-white hover:bg-danger-700',
        'destructive-ghost': 'text-danger-600 hover:bg-danger-50 hover:text-danger-700',
        success:     'bg-success-600 text-white hover:bg-success-700',
        link:        'text-brand-600 underline-offset-4 hover:underline p-0 h-auto font-medium',
        muted:       'bg-surface-100 text-surface-500 hover:bg-surface-200',
      },
      size: {
        xs:        'h-7 px-2.5 text-xs rounded-lg gap-1',
        sm:        'h-8 px-3 text-xs rounded-lg',
        default:   'h-9 px-4',
        md:        'h-10 px-5',
        lg:        'h-11 px-6 text-base rounded-2xl',
        xl:        'h-12 px-8 text-base rounded-2xl',
        '2xl':     'h-14 px-10 text-lg rounded-2xl',
        icon:      'h-9 w-9 p-0',
        'icon-sm': 'h-7 w-7 p-0 rounded-lg',
        'icon-lg': 'h-11 w-11 p-0 rounded-2xl',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      {children}
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
