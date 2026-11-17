import { NextResponse } from "next/server"
import type { CreateProjectInput } from "@/lib/queries/projects"
import { publishRealtime } from "@/lib/realtime/server"
import { projects } from "./db"

/**
 * PLACEHOLDER API — in-memory, per-server-process. Delete this folder when
 * your real API is live; lib/queries/projects.ts is the only consumer.
 */

export async function GET() {
  return NextResponse.json(projects)
}

export async function POST(request: Request) {
  const input = (await request.json()) as CreateProjectInput
  const project = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  projects.push(project)
  publishRealtime("project.created", project)
  return NextResponse.json(project, { status: 201 })
}
