import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { WizardData, SectionType, ColorTheme } from '@/types'

const initialData: WizardData = {
  // Step 1
  businessType: '',
  // Step 2
  name: '',
  tagline: '',
  description: '',
  tone: 'profesional',
  // Step 3
  services: [],
  // Step 4
  team: [],
  // Filled by "Generá mi sitio con IA" (no manual wizard step)
  testimonials: [],
  faqs: [],
  stats: [],
  // Step 5
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  city: '',
  province: '',
  socials: {},
  // Step 6
  primaryColor: '#6366f1',
  colorTheme: 'indigo',
  fontHeading: 'inter',
  fontBody: 'inter',
  // Step 7
  template: '',
  // Step 8
  enabledSections: ['hero', 'services', 'contact', 'footer'],
  // Step 9
  logoId: undefined,
  heroImageId: undefined,
  // Step 10
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
}

const TOTAL_STEPS = 10

interface WizardStore {
  step: number
  data: WizardData
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  setField: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void
  toggleSection: (sectionId: SectionType) => void
  setColorTheme: (theme: ColorTheme, color: string) => void
  reset: () => void
  isStepValid: (step: number) => boolean
}

export const useWizardStore = create<WizardStore>()(
  persist(
    (set, get) => ({
  step: 1,
  data: { ...initialData },

  setStep: (step) => set({ step }),
  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, TOTAL_STEPS) })),
  prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 1) })),

  setField: (key, value) =>
    set((s) => ({ data: { ...s.data, [key]: value } })),

  toggleSection: (sectionId) =>
    set((s) => {
      const required: SectionType[] = ['hero', 'contact', 'footer']
      if (required.includes(sectionId)) return s
      const enabled = s.data.enabledSections.includes(sectionId)
        ? s.data.enabledSections.filter((id) => id !== sectionId)
        : [...s.data.enabledSections, sectionId]
      return { data: { ...s.data, enabledSections: enabled } }
    }),

  setColorTheme: (theme, color) =>
    set((s) => ({ data: { ...s.data, colorTheme: theme, primaryColor: color } })),

  isStepValid: (step) => {
    const { data } = get()
    switch (step) {
      case 1: return !!data.businessType
      case 2: return data.name.trim().length >= 2 && data.description.trim().length >= 10
      case 3: return true
      case 4: return true
      case 5: return data.phone.trim().length >= 6 || data.email.trim().length >= 5
      case 6: return true
      case 7: return !!data.template
      case 8: return data.enabledSections.length >= 3
      case 9: return true
      case 10: return data.seoTitle.trim().length >= 5
      default: return true
    }
  },

  reset: () => set({ step: 1, data: { ...initialData } }),
    }),
    {
      // Persist to sessionStorage so a mid-wizard refresh keeps the user's work,
      // but the draft dies with the tab rather than lingering across sessions.
      name: 'wizard-draft',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? window.sessionStorage : undefined as unknown as Storage
      ),
      partialize: (s) => ({ step: s.step, data: s.data }),
      // Rehydration is triggered manually from the wizard page after mount, so
      // the server render and the first client render both start from defaults
      // (no hydration mismatch); the saved draft is restored in a mount effect.
      skipHydration: true,
    }
  )
)

export const TOTAL_WIZARD_STEPS = TOTAL_STEPS
