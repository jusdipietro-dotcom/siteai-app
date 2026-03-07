'use client'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void | Promise<void>
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  onConfirm,
  loading,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 bg-white rounded-2xl shadow-modal border border-surface-100 p-6 data-[state=open]:animate-scale-in focus:outline-none">
          <div className="flex gap-4">
            {variant === 'destructive' && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger-50">
                <AlertTriangle className="h-5 w-5 text-danger-600" />
              </div>
            )}
            <div className="flex-1">
              <AlertDialog.Title className="text-base font-semibold text-surface-900 mb-1">
                {title}
              </AlertDialog.Title>
              {description && (
                <AlertDialog.Description className="text-sm text-surface-500">
                  {description}
                </AlertDialog.Description>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <AlertDialog.Cancel asChild>
              <button className="h-9 px-4 rounded-xl text-sm font-semibold text-surface-700 border border-surface-200 bg-white hover:bg-surface-50 transition-colors">
                {cancelLabel}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={cn(
                  'h-9 px-4 rounded-xl text-sm font-semibold text-white transition-colors inline-flex items-center gap-2',
                  variant === 'destructive'
                    ? 'bg-danger-600 hover:bg-danger-700'
                    : 'bg-brand-600 hover:bg-brand-700',
                  loading && 'opacity-60 cursor-not-allowed'
                )}
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
