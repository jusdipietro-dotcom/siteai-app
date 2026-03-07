import { create } from 'zustand'
import type { MediaFile, MediaCategory } from '@/types'
import { mockMedia } from '@/data/mockMedia'
import { generateId } from '@/lib/utils'

interface MediaStore {
  files: MediaFile[]
  selectedIds: string[]
  filter: MediaCategory | 'all'
  search: string
  viewMode: 'grid' | 'list'

  setFilter: (filter: MediaCategory | 'all') => void
  setSearch: (search: string) => void
  setViewMode: (mode: 'grid' | 'list') => void
  selectFile: (id: string) => void
  deselectFile: (id: string) => void
  clearSelection: () => void
  toggleFavorite: (id: string) => void
  deleteFile: (id: string) => void
  addMockFile: (category: MediaCategory, name: string, url: string) => MediaFile
  updateAlt: (id: string, alt: string) => void
  getFiltered: () => MediaFile[]
}

export const useMediaStore = create<MediaStore>((set, get) => ({
  files: mockMedia,
  selectedIds: [],
  filter: 'all',
  search: '',
  viewMode: 'grid',

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

  toggleFavorite: (id) =>
    set((s) => ({
      files: s.files.map((f) => (f.id === id ? { ...f, favorite: !f.favorite } : f)),
    })),

  deleteFile: (id) =>
    set((s) => ({
      files: s.files.filter((f) => f.id !== id),
      selectedIds: s.selectedIds.filter((sid) => sid !== id),
    })),

  addMockFile: (category, name, url) => {
    const newFile: MediaFile = {
      id: `media-${generateId()}`,
      name,
      url,
      thumbnailUrl: url,
      type: 'image',
      category,
      size: Math.floor(Math.random() * 500000) + 50000,
      width: 1200,
      height: 800,
      alt: name.replace(/\.[^.]+$/, '').replace(/-/g, ' '),
      favorite: false,
      usedIn: [],
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ files: [newFile, ...s.files] }))
    return newFile
  },

  updateAlt: (id, alt) =>
    set((s) => ({
      files: s.files.map((f) => (f.id === id ? { ...f, alt } : f)),
    })),

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
