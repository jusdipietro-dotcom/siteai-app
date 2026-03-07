import { create } from 'zustand'
import type { DevicePreview, EditorSidebarTab, EditorRightTab, SectionType } from '@/types'

interface EditorStore {
  device: DevicePreview
  selectedSection: SectionType | null
  sidebarTab: EditorSidebarTab
  rightTab: EditorRightTab
  isDirty: boolean
  isSaving: boolean
  isPreviewMode: boolean
  showGrid: boolean
  zoom: number
  history: string[]
  historyIndex: number

  setDevice: (device: DevicePreview) => void
  selectSection: (id: SectionType | null) => void
  setSidebarTab: (tab: EditorSidebarTab) => void
  setRightTab: (tab: EditorRightTab) => void
  setDirty: (dirty: boolean) => void
  setIsSaving: (saving: boolean) => void
  togglePreviewMode: () => void
  toggleGrid: () => void
  setZoom: (zoom: number) => void
  markSaved: () => void
  pushHistory: (snapshot: string) => void
  undo: () => string | null
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  device: 'desktop',
  selectedSection: null,
  sidebarTab: 'sections',
  rightTab: 'content',
  isDirty: false,
  isSaving: false,
  isPreviewMode: false,
  showGrid: false,
  zoom: 100,
  history: [],
  historyIndex: -1,

  setDevice: (device) => set({ device }),
  selectSection: (id) => set({ selectedSection: id, rightTab: id ? 'content' : 'content' }),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setRightTab: (tab) => set({ rightTab: tab }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  setIsSaving: (saving) => set({ isSaving: saving }),
  togglePreviewMode: () => set((s) => ({ isPreviewMode: !s.isPreviewMode })),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  setZoom: (zoom) => set({ zoom }),

  markSaved: () => set({ isDirty: false, isSaving: false }),

  pushHistory: (snapshot) =>
    set((s) => {
      const newHistory = s.history.slice(0, s.historyIndex + 1)
      newHistory.push(snapshot)
      return {
        history: newHistory.slice(-50),
        historyIndex: newHistory.length - 1,
        isDirty: true,
      }
    }),

  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex <= 0) return null
    const newIndex = historyIndex - 1
    set({ historyIndex: newIndex })
    return history[newIndex] ?? null
  },
}))
