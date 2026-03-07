import { create } from 'zustand'

interface UIStore {
  commandPaletteOpen: boolean
  mobileMenuOpen: boolean
  sidebarCollapsed: boolean

  openCommandPalette: () => void
  closeCommandPalette: () => void
  toggleCommandPalette: () => void
  toggleMobileMenu: () => void
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  commandPaletteOpen: false,
  mobileMenuOpen: false,
  sidebarCollapsed: false,

  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
}))
