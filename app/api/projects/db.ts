import type { Project } from "@/lib/queries/projects"

/**
 * PLACEHOLDER shared in-memory DB (per server process). Not a route —
 * imported by app/api/projects/route.ts and app/api/projects/[id]/route.ts.
 * Delete alongside those when the real API is live.
 */

export const projects: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    description: "Marketing site refresh",
    status: "active",
    dueDate: null,
    createdAt: "2026-11-17T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Mobile App MVP",
    description: "First release to app stores",
    status: "planning",
    dueDate: null,
    createdAt: "2026-11-17T00:00:00.000Z",
  },
]
