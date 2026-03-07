'use client'
import { useEffect } from 'react'
import { useUIStore } from '@/store/useUIStore'

export function GlobalKeyboardShortcuts() {
  const { toggleCommandPalette } = useUIStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K → command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggleCommandPalette()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleCommandPalette])

  return null
}
