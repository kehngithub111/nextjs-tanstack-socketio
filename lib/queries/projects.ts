import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useCallback } from "react"
import { api } from "@/lib/api/client"
import { useRealtimeEvent, type RealtimeMessage } from "@/lib/realtime/client"

/**
 * Server-state layer for projects.
 *
 * WHEN YOUR REAL APIs ARRIVE:
 *   1. Update ENDPOINTS below (paths only — the fetch wrapper handles the base URL).
 *   2. Adjust the types if your API payloads differ.
 *   3. Delete the placeholder route handlers in app/api/projects/ if unused.
 * Everything else (components, cache keys, invalidation) stays as-is.
 */

export type ProjectStatus =
  | "planning"
  | "active"
  | "on-hold"
  | "completed"
  | "archived"

export type Project = {
  id: string
  name: string
  description: string
  status: ProjectStatus
  dueDate: string | null
  createdAt: string
}

export type CreateProjectInput = Omit<Project, "id" | "createdAt">
export type UpdateProjectInput = Partial<Omit<Project, "id">>

/** The single edit point for endpoint paths. */
const ENDPOINTS = {
  list: "/projects",
  detail: (id: string) => `/projects/${id}`,
}

/** Query-key factory — keeps cache keys consistent for reads and invalidation. */
export const projectKeys = {
  all: ["projects"] as const,
  list: () => [...projectKeys.all, "list"] as const,
  detail: (id: string) => [...projectKeys.all, "detail", id] as const,
}

export const projectQueries = {
  list: () =>
    queryOptions({
      queryKey: projectKeys.list(),
      queryFn: () => api.get<Project[]>(ENDPOINTS.list),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: projectKeys.detail(id),
      queryFn: () => api.get<Project>(ENDPOINTS.detail(id)),
    }),
}

export const projectMutations = {
  create: () => ({
    mutationFn: (input: CreateProjectInput) =>
      api.post<Project>(ENDPOINTS.list, input),
  }),
  update: () => ({
    mutationFn: ({ id, ...updates }: UpdateProjectInput & { id: string }) =>
      api.patch<Project>(ENDPOINTS.detail(id), updates),
  }),
  remove: () => ({
    mutationFn: (id: string) => api.delete<void>(ENDPOINTS.detail(id)),
  }),
}

/** Ready-made hooks for client components. */

export function useProjects() {
  return useQuery(projectQueries.list())
}

export function useProject(id: string) {
  return useQuery(projectQueries.detail(id))
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    ...projectMutations.create(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    ...projectMutations.update(),
    onSuccess: (updated) => {
      queryClient.setQueryData(projectKeys.detail(updated.id), updated)
      queryClient.invalidateQueries({ queryKey: projectKeys.list() })
    },
  })
}

export function useRemoveProject() {
  const queryClient = useQueryClient()
  return useMutation({
    ...projectMutations.remove(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  })
}

/**
 * Live-sync the query cache from realtime events. Mount ONCE (e.g. in the
 * app shell or a top-level client component) and every projects view stays
 * current without refetching — updates pushed by any client arrive here.
 */
export function useProjectsRealtime() {
  const queryClient = useQueryClient()

  useRealtimeEvent(
    useCallback(
      (message: RealtimeMessage) => {
        switch (message.type) {
          case "project.created": {
            const project = message.payload as Project
            queryClient.setQueryData<Project[]>(projectKeys.list(), (old) =>
              old && !old.some((p) => p.id === project.id)
                ? [...old, project]
                : old,
            )
            break
          }
          case "project.updated": {
            const project = message.payload as Project
            queryClient.setQueryData(projectKeys.detail(project.id), project)
            queryClient.setQueryData<Project[]>(projectKeys.list(), (old) =>
              old?.map((p) => (p.id === project.id ? project : p)),
            )
            break
          }
          case "project.deleted": {
            const id = message.payload as string
            queryClient.removeQueries({ queryKey: projectKeys.detail(id) })
            queryClient.setQueryData<Project[]>(projectKeys.list(), (old) =>
              old?.filter((p) => p.id !== id),
            )
            break
          }
        }
      },
      [queryClient],
    ),
  )
}
