import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  hint?: string
  label?: string
  showCount?: boolean
  maxLength?: number
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, hint, label, showCount, maxLength, id, value, ...props }, ref) => {
    const textareaId = id ?? React.useId()
    const charCount = typeof value === 'string' ? value.length : 0

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-surface-700">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          maxLength={maxLength}
          value={value}
          className={cn(
            'flex min-h-[100px] w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 shadow-inner-sm',
            'placeholder:text-surface-400 resize-none',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-400',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-50',
            error && 'border-danger-400 focus:ring-danger-500/25 focus:border-danger-400',
            className
          )}
          {...props}
        />
        <div className="flex justify-between items-center">
          <div>
            {error && <p className="text-xs text-danger-600">{error}</p>}
            {hint && !error && <p className="text-xs text-surface-400">{hint}</p>}
          </div>
          {showCount && maxLength && (
            <span className={cn('text-xs', charCount >= maxLength ? 'text-danger-500' : 'text-surface-400')}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
