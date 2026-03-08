import { create } from 'zustand'
import type { MediaFile, MediaCategory } from '@/types'

interface MediaStore {
  files: MediaFile[]
  selectedIds: string[]
  filter: MediaCategory | 'all'
  search: string
  viewMode: 'grid' | 'list'
  loaded: boolean

  loadFiles: () => Promise<void>
  setFilter: (filter: MediaCategory | 'all') => void
  setSearch: (search: string) => void
  setViewMode: (mode: 'grid' | 'list') => void
  selectFile: (id: string) => void
  deselectFile: (id: string) => void
  clearSelection: () => void
  toggleFavorite: (id: string) => void
  deleteFile: (id: string) => void
  addFile: (file: MediaFile) => void
  updateAlt: (id: string, alt: string) => void
  getFiltered: () => MediaFile[]
}

export const useMediaStore = create<MediaStore>((set, get) => ({
  files: [],
  selectedIds: [],
  filter: 'all',
  search: '',
  viewMode: 'grid',
  loaded: false,

  loadFiles: async () => {
    if (get().loaded) return
    try {
      const res = await fetch('/api/media')
      if (!res.ok) return
      const data: MediaFile[] = await res.json()
      // Merge: preserve any in-memory files added via addFile while fetch was in-flight
      const existing = get().files
      const dbIds = new Set(data.map((f) => f.id))
      const inMemoryOnly = existing.filter((f) => !dbIds.has(f.id))
      set({
        files: [...inMemoryOnly, ...data.map((f) => ({ ...f, usedIn: [] }))],
        loaded: true,
      })
    } catch {
      // silent fail — user will see empty state
    }
  },

  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),
  setViewMode: (viewMode) => set({ viewMode }),

  selectFile: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id) ? s.selectedIds : [...s.selectedIds, id],
    })),

  deselectFile: (id) =>
    set((s) => ({ selectedIds: s.selectedIds.filter((sid) => sid !== id) })),

  clearSelection: () => set({ selectedIds: [] }),

  toggleFavorite: (id) => {
    const file = get().files.find((f) => f.id === id)
    if (!file) return
    const newFav = !file.favorite
    set((s) => ({
      files: s.files.map((f) => (f.id === id ? { ...f, favorite: newFav } : f)),
    }))
    fetch('/api/media', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, favorite: newFav }),
    }).catch(() => {})
  },

  deleteFile: (id) => {
    set((s) => ({
      files: s.files.filter((f) => f.id !== id),
      selectedIds: s.selectedIds.filter((sid) => sid !== id),
    }))
    fetch('/api/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {})
  },

  addFile: (file) => set((s) => ({ files: [file, ...s.files] })),

  updateAlt: (id, alt) => {
    set((s) => ({
      files: s.files.map((f) => (f.id === id ? { ...f, alt } : f)),
    }))
    fetch('/api/media', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, alt }),
    }).catch(() => {})
  },

  getFiltered: () => {
    const { files, filter, search } = get()
    return files.filter((f) => {
      const matchesFilter = filter === 'all' || f.category === filter
      const matchesSearch =
        !search ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        (f.alt ?? '').toLowerCase().includes(search.toLowerCase())
      return matchesFilter && matchesSearch
    })
  },
}))
