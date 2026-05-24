'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { WA_GENERIC } from '@/lib/whatsapp'

const navLinks = [
  { label: 'Servicios', href: '#servicios' },
  { label: 'Soluciones', href: '#soluciones' },
  { label: 'Rubros', href: '#rubros' },
  { label: 'Proceso', href: '#proceso' },
  { label: 'FAQ', href: '#faq' },
]

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-surface-100 shadow-soft'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="#top" className="flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt="Automatic IA Lab"
              width={48}
              height={48}
              priority
              className="w-12 h-12 object-contain rounded-xl group-hover:scale-105 transition-transform"
            />
            <span
              className={cn(
                'text-lg font-bold tracking-tight transition-colors',
                scrolled ? 'text-surface-900' : 'text-white'
              )}
            >
              Automatic IA Lab
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3.5 py-2 text-sm font-medium rounded-lg transition-colors',
                  scrolled
                    ? 'text-surface-600 hover:text-surface-900 hover:bg-surface-50'
                    : 'text-surface-300 hover:text-white hover:bg-white/10'
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a href={WA_GENERIC} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="gradient" className="gap-1.5">
                <MessageCircle className="w-4 h-4" />
                Consultanos por WhatsApp
              </Button>
            </a>
          </div>

          <button
            type="button"
            aria-label={mobileOpen ? 'Cerrar menu' : 'Abrir menu'}
            className={cn(
              'md:hidden p-2 rounded-lg',
              scrolled ? 'text-surface-600 hover:bg-surface-100' : 'text-white hover:bg-white/10'
            )}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-surface-100 px-4 pb-4"
          >
            <nav className="flex flex-col gap-1 pt-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 rounded-lg"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-surface-100">
                <a href={WA_GENERIC} target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)}>
                  <Button variant="gradient" className="w-full gap-1.5">
                    <MessageCircle className="w-4 h-4" />
                    Consultanos por WhatsApp
                  </Button>
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
