import { create } from 'zustand'
import type { Project, ProjectStatus, SectionConfig } from '@/types'
import { generateId } from '@/lib/utils'

interface ProjectStore {
  projects: Project[]
  isLoaded: boolean
  fetchProjects: () => Promise<void>
  reloadProjects: () => Promise<void>
  refreshProject: (id: string) => Promise<Project | undefined>
  addProject: (project: Project) => Promise<Project>
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => Promise<void>
  duplicateProject: (id: string) => Promise<Project>
  setProjectStatus: (id: string, status: Exclude<ProjectStatus, 'published'>) => void
  setSubdomain: (id: string, subdomain: string | null) => Promise<Project>
  publishProject: (id: string) => Promise<Project>
  unpublishProject: (id: string) => Promise<Project>
  updateSections: (id: string, sections: SectionConfig[]) => void
  toggleSection: (projectId: string, sectionId: string) => void
  reorderSections: (projectId: string, sections: SectionConfig[]) => void
  getProject: (id: string) => Project | undefined
  addMediaToProject: (projectId: string, mediaId: string) => void
  removeMediaFromProject: (projectId: string, mediaId: string) => void
}

// Billing state (plan / hasPaid / preapprovalId / views / publishedUrl) is never
// sent from here: the server owns it and the API strips it from request bodies.
// Read it back with refreshProject() / reloadProjects() instead of computing it.
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

  refreshProject: async (id) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { cache: 'no-store' })
      if (!res.ok) return undefined
      const fresh: Project = await res.json()
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? fresh : p)),
      }))
      return fresh
    } catch (err) {
      console.error('[ProjectStore] refreshProject error:', err)
      return undefined
    }
  },

  // Optimistic insert, but never optimistic about the result: on any failure the
  // placeholder is removed again and the error is rethrown. Returning the
  // client-side `project` on a failed POST used to hand callers an id that does
  // not exist server-side — the wizard then navigated to
  // /projects/{phantomId}/editor, which 404s, and the row was never created.
  addProject: async (project) => {
    set((state) => ({ projects: [project, ...state.projects], isLoaded: true }))

    const rollback = () =>
      set((state) => ({ projects: state.projects.filter((p) => p.id !== project.id) }))

    let res: Response
    try {
      res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      })
    } catch (err) {
      rollback()
      console.error('[ProjectStore] addProject error:', err)
      throw new Error('No se pudo guardar el proyecto. Revisá tu conexión.')
    }

    const body = await res.json().catch(() => ({}))

    if (!res.ok) {
      rollback()
      const error = new Error(
        body?.error || 'No se pudo guardar el proyecto'
      ) as Error & { status?: number }
      error.status = res.status
      throw error
    }

    const saved: Project = body
    set((state) => ({
      projects: state.projects.map((p) => (p.id === project.id ? saved : p)),
    }))
    return saved
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
      // A subdomain is unique across the whole table, so carrying the original's
      // over from the spread guaranteed a 409 on POST /api/projects — duplicating
      // any project that had claimed a subdomain always failed. The copy starts
      // with no subdomain; the user claims a new one from the editor.
      subdomain: null,
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

  // Non-publish lifecycle transitions only. `published` is unreachable from
  // here by design: it is a paid state and the server refuses to grant it
  // through an ordinary field write. Use publishProject() instead.
  setProjectStatus: (id, status) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
      ),
    }))
    syncUpdate(id, { status })
  },

  // Deliberately NOT routed through updateProject(): syncUpdate() is
  // fire-and-forget and swallows the response, so a 409 (subdomain taken, or
  // frozen because the project is published) would be logged to the console and
  // the UI would keep showing a subdomain the server refused to store.
  // This awaits the write and rethrows with the HTTP status attached so callers
  // can tell "someone claimed it first" from "the request failed".
  setSubdomain: async (id, subdomain) => {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subdomain }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      const error = new Error(
        body?.error || 'No se pudo guardar el subdominio'
      ) as Error & { status?: number }
      error.status = res.status
      throw error
    }
    const saved: Project = body
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? saved : p)),
    }))
    return saved
  },

  // Publishing goes through a dedicated endpoint that verifies ownership AND
  // payment server-side. Unlike the other mutations here this is not optimistic:
  // it can legitimately fail with 402, and showing a site as live when it is not
  // would be worse than waiting for the round trip.
  publishProject: async (id) => {
    const res = await fetch(`/api/projects/${id}/publish`, { method: 'POST' })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(body?.error || 'No se pudo publicar el sitio')
    }
    const saved: Project = body
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? saved : p)),
    }))
    return saved
  },

  unpublishProject: async (id) => {
    const res = await fetch(`/api/projects/${id}/unpublish`, { method: 'POST' })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(body?.error || 'No se pudo despublicar el sitio')
    }
    const saved: Project = body
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? saved : p)),
    }))
    return saved
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
