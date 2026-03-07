'use client'
import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { colorPresets } from '@/config/themes'
import type { ColorTheme } from '@/types'

interface ColorPresetSelectorProps {
  value: ColorTheme
  onChange: (theme: ColorTheme, primaryColor: string) => void
  size?: 'sm' | 'md'
  showLabel?: boolean
}

export function ColorPresetSelector({
  value,
  onChange,
  size = 'md',
  showLabel = true,
}: ColorPresetSelectorProps) {
  return (
    <div className="space-y-3">
      {showLabel && (
        <p className="text-sm font-medium text-surface-700">Paleta de color</p>
      )}
      <div className="grid grid-cols-4 gap-2">
        {colorPresets.map((preset) => {
          const isSelected = value === preset.id
          return (
            <motion.button
              key={preset.id}
              onClick={() => onChange(preset.id, preset.primary)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={cn(
                'group relative flex flex-col items-center gap-1.5 rounded-xl p-2.5 border-2 transition-all duration-150',
                isSelected
                  ? 'border-surface-900 bg-surface-50 shadow-soft'
                  : 'border-transparent hover:border-surface-200 hover:bg-surface-50'
              )}
              title={preset.name}
            >
              {/* Swatches */}
              <div className="flex gap-1">
                {preset.swatches.slice(0, 3).map((color, i) => (
                  <div
                    key={i}
                    className={cn(
                      'rounded-full',
                      size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Name */}
              {size !== 'sm' && (
                <span className="text-[10px] font-medium text-surface-600 text-center leading-tight">
                  {preset.name.split(' ')[0]}
                </span>
              )}

              {/* Check */}
              {isSelected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-surface-900 shadow-sm"
                >
                  <Check className="h-2.5 w-2.5 text-white" />
                </motion.span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Preview */}
      {(() => {
        const preset = colorPresets.find((p) => p.id === value)
        if (!preset) return null
        return (
          <div className="flex items-center gap-3 rounded-xl bg-surface-50 border border-surface-100 p-3">
            <div className="h-8 w-8 rounded-lg shadow-soft" style={{ backgroundColor: preset.primary }} />
            <div>
              <p className="text-sm font-semibold text-surface-800">{preset.name}</p>
              <p className="text-xs text-surface-500">{preset.description}</p>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
