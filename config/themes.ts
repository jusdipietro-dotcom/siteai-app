import type { ColorPreset, TypographyOption, ColorTheme } from '@/types'

export const colorPresets: ColorPreset[] = [
  {
    id: 'indigo',
    name: 'Corporate Indigo',
    description: 'Moderno, tecnológico y confiable',
    primary: '#6366f1',
    swatches: ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'],
    industries: ['agencia', 'tecnología', 'consultoría', 'startup'],
  },
  {
    id: 'legal',
    name: 'Legal Navy',
    description: 'Serio, profesional y de autoridad',
    primary: '#1d4ed8',
    swatches: ['#1d4ed8', '#3b82f6', '#93c5fd', '#dbeafe', '#eff6ff'],
    industries: ['estudio jurídico', 'estudio contable', 'notaría', 'consultoría legal'],
  },
  {
    id: 'medical',
    name: 'Medical Clean',
    description: 'Limpio, claro y de confianza',
    primary: '#0891b2',
    swatches: ['#0891b2', '#06b6d4', '#67e8f9', '#cffafe', '#ecfeff'],
    industries: ['consultorio médico', 'clínica', 'odontología', 'psicología'],
  },
  {
    id: 'restaurant',
    name: 'Warm Restaurant',
    description: 'Cálido, apetitoso y acogedor',
    primary: '#ea580c',
    swatches: ['#ea580c', '#f97316', '#fdba74', '#fed7aa', '#fff7ed'],
    industries: ['restaurante', 'bar', 'cafetería', 'catering', 'panadería'],
  },
  {
    id: 'boutique',
    name: 'Modern Boutique',
    description: 'Elegante, femenino y sofisticado',
    primary: '#db2777',
    swatches: ['#db2777', '#ec4899', '#f9a8d4', '#fce7f3', '#fdf2f8'],
    industries: ['boutique', 'moda', 'belleza', 'peluquería', 'estética'],
  },
  {
    id: 'fitness',
    name: 'Energetic Fitness',
    description: 'Dinámico, fuerte y motivador',
    primary: '#16a34a',
    swatches: ['#16a34a', '#22c55e', '#86efac', '#bbf7d0', '#f0fdf4'],
    industries: ['gimnasio', 'personal trainer', 'nutrición', 'deportes'],
  },
  {
    id: 'gold',
    name: 'Elegant Black & Gold',
    description: 'Lujoso, premium y exclusivo',
    primary: '#d97706',
    swatches: ['#d97706', '#f59e0b', '#fcd34d', '#fef3c7', '#fffbeb'],
    industries: ['inmobiliaria', 'arquitectura', 'lujo', 'alta cocina'],
  },
  {
    id: 'mono',
    name: 'Minimalist Mono',
    description: 'Austero, editorial y atemporal',
    primary: '#171717',
    swatches: ['#171717', '#404040', '#737373', '#d4d4d4', '#f5f5f5'],
    industries: ['fotografía', 'diseño', 'arquitectura', 'arte', 'editorial'],
  },
]

export const typographyOptions: TypographyOption[] = [
  { id: 'inter',         name: 'Inter',           category: 'sans',    previewClass: 'font-sans',  cssFamily: 'Inter',          googleUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap' },
  { id: 'playfair',      name: 'Playfair Display', category: 'serif',  previewClass: 'font-serif', cssFamily: 'Playfair Display', googleUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap' },
  { id: 'geist',         name: 'Geist',           category: 'sans',    previewClass: 'font-sans',  cssFamily: 'Geist',           googleUrl: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;600;700&display=swap' },
  { id: 'dm-sans',       name: 'DM Sans',         category: 'sans',    previewClass: 'font-sans',  cssFamily: 'DM Sans',         googleUrl: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap' },
  { id: 'lora',          name: 'Lora',            category: 'serif',   previewClass: 'font-serif', cssFamily: 'Lora',            googleUrl: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap' },
  { id: 'manrope',       name: 'Manrope',         category: 'sans',    previewClass: 'font-sans',  cssFamily: 'Manrope',         googleUrl: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap' },
  { id: 'fraunces',      name: 'Fraunces',        category: 'display', previewClass: 'font-serif', cssFamily: 'Fraunces',        googleUrl: 'https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&display=swap' },
  { id: 'space-grotesk', name: 'Space Grotesk',   category: 'sans',    previewClass: 'font-sans',  cssFamily: 'Space Grotesk',   googleUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap' },
]

export function getPresetById(id: ColorTheme): ColorPreset {
  return colorPresets.find((p) => p.id === id) ?? colorPresets[0]
}

export const DEFAULT_COLOR_THEME: ColorTheme = 'indigo'
