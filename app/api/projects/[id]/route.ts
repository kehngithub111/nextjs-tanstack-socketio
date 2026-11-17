import { NextResponse } from "next/server"
import type { UpdateProjectInput } from "@/lib/queries/projects"
import { publishRealtime } from "@/lib/realtime/server"
import { projects } from "../db"

/** PLACEHOLDER API — see app/api/projects/route.ts. */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const project = projects.find((p) => p.id === id)
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(project)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const project = projects.find((p) => p.id === id)
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const updates = (await request.json()) as UpdateProjectInput
  Object.assign(project, updates)
  publishRealtime("project.updated", project)
  return NextResponse.json(project)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const index = projects.findIndex((p) => p.id === id)
  if (index === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  projects.splice(index, 1)
  publishRealtime("project.deleted", id)
  return new NextResponse(null, { status: 204 })
}
