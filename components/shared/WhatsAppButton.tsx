'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const WHATSAPP_NUMBER = '5491171311465'
const DEFAULT_MESSAGE = 'Hola! Me interesa crear un sitio web con Automatic IA Lab. ¿Pueden darme más info?'

// Full-screen builder flows own their bottom edge (a pinned navigation footer),
// so this floating CTA both overlaps the primary action on mobile and is out of
// place there — it's a marketing contact prompt, not a builder control. Mirrors
// the dashboard layout's hideMobileBar rule.
function isHiddenRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return pathname === '/wizard' || pathname.includes('/editor') || pathname.includes('/preview')
}

export function WhatsAppButton() {
  const pathname = usePathname()
  const [showTooltip, setShowTooltip] = useState(false)

  if (isHiddenRoute(pathname)) return null

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl border border-surface-200 p-4 max-w-[280px]"
          >
            <button
              onClick={() => setShowTooltip(false)}
              className="absolute top-2 right-2 text-surface-400 hover:text-surface-600"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-sm font-semibold text-surface-900 mb-1">
              ¿Tenés dudas?
            </p>
            <p className="text-xs text-surface-500 mb-3">
              Escribinos por WhatsApp y te respondemos en minutos.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors"
            >
              Iniciar chat
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setShowTooltip(!showTooltip)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        aria-label="Contactar por WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>
    </div>
  )
}
