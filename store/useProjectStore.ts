import { create } from 'zustand'
import type { Project, ProjectStatus, SectionConfig, Plan } from '@/types'
import { generateId } from '@/lib/utils'

interface ProjectStore {
  projects: Project[]
  isLoaded: boolean
  fetchProjects: () => Promise<void>
  reloadProjects: () => Promise<void>
  addProject: (project: Project) => Promise<Project>
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => Promise<void>
  duplicateProject: (id: string) => Promise<Project>
  setProjectStatus: (id: string, status: ProjectStatus) => void
  setProjectPlan: (id: string, plan: Plan) => void
  updateSections: (id: string, sections: SectionConfig[]) => void
  toggleSection: (projectId: string, sectionId: string) => void
  reorderSections: (projectId: string, sections: SectionConfig[]) => void
  getProject: (id: string) => Project | undefined
  addMediaToProject: (projectId: string, mediaId: string) => void
  removeMediaFromProject: (projectId: string, mediaId: string) => void
}

function syncUpdate(id: string, updates: Record<string, unknown>) {
  fetch(`/api/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  }).catch((err) => console.error('[ProjectStore] sync error:', err))
}

export const useProjectStore = create<ProjectStore>()((set, get) => ({
  projects: [],
  isLoaded: false,

  fetchProjects: async () => {
    if (get().isLoaded) return
    try {
      const res = await fetch('/api/projects')
      if (!res.ok) return
      const projects: Project[] = await res.json()
      set({ projects, isLoaded: true })
    } catch (err) {
      console.error('[ProjectStore] fetchProjects error:', err)
    }
  },

  reloadProjects: async () => {
    try {
      const res = await fetch('/api/projects')
      if (!res.ok) return
      const projects: Project[] = await res.json()
      set({ projects, isLoaded: true })
    } catch (err) {
      console.error('[ProjectStore] reloadProjects error:', err)
    }
  },

  addProject: async (project) => {
    set((state) => ({ projects: [project, ...state.projects], isLoaded: true }))
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      })
      if (res.ok) {
        const saved: Project = await res.json()
        set((state) => ({
          projects: state.projects.map((p) => (p.id === project.id ? saved : p)),
        }))
        return saved
      }
    } catch (err) {
      console.error('[ProjectStore] addProject error:', err)
    }
    return project
  },

  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    }))
    syncUpdate(id, { ...updates, updatedAt: new Date().toISOString() })
  },

  deleteProject: async (id) => {
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }))
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
  },

  duplicateProject: async (id) => {
    const original = get().projects.find((p) => p.id === id)
    if (!original) throw new Error('Proyecto no encontrado')
    const copy: Project = {
      ...original,
      id: generateId(),
      name: `${original.name} (copia)`,
      slug: `${original.slug}-copia-${generateId(4)}`,
      status: 'draft',
      hasPaid: false,
      plan: 'free',
      publishedUrl: undefined,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return get().addProject(copy)
  },

  setProjectStatus: (id, status) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
      ),
    }))
    syncUpdate(id, { status })
  },

  setProjectPlan: (id, plan) => {
    const hasPaid = plan !== 'free'
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, plan, hasPaid, updatedAt: new Date().toISOString() } : p
      ),
    }))
    syncUpdate(id, { plan, hasPaid })
  },

  updateSections: (id, sections) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, sections, updatedAt: new Date().toISOString() } : p
      ),
    }))
    syncUpdate(id, { sections })
  },

  toggleSection: (projectId, sectionId) => {
    const project = get().projects.find((p) => p.id === projectId)
    if (!project) return
    const sections = project.sections.map((s) =>
      s.id === sectionId && !s.required ? { ...s, enabled: !s.enabled } : s
    )
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, sections, updatedAt: new Date().toISOString() } : p
      ),
    }))
    syncUpdate(projectId, { sections })
  },

  reorderSections: (projectId, sections) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, sections, updatedAt: new Date().toISOString() } : p
      ),
    }))
    syncUpdate(projectId, { sections })
  },

  getProject: (id) => get().projects.find((p) => p.id === id),

  addMediaToProject: (projectId, mediaId) => {
    const project = get().projects.find((p) => p.id === projectId)
    if (!project || project.mediaIds.includes(mediaId)) return
    const mediaIds = [...project.mediaIds, mediaId]
    set((state) => ({
      projects: state.projects.map((p) => (p.id === projectId ? { ...p, mediaIds } : p)),
    }))
    syncUpdate(projectId, { mediaIds })
  },

  removeMediaFromProject: (projectId, mediaId) => {
    const project = get().projects.find((p) => p.id === projectId)
    if (!project) return
    const mediaIds = project.mediaIds.filter((id) => id !== mediaId)
    set((state) => ({
      projects: state.projects.map((p) => (p.id === projectId ? { ...p, mediaIds } : p)),
    }))
    syncUpdate(projectId, { mediaIds })
  },
}))
