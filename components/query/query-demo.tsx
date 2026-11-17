"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  useCreateProject,
  useProjects,
  useProjectsRealtime,
  useRemoveProject,
} from "@/lib/queries/projects";
import { useRealtimeStatus } from "@/lib/realtime/client";

/**
 * Demo of the TanStack Query layer running against the placeholder
 * /api/projects route handlers. Delete when wiring real APIs.
 */
export function QueryDemo() {
  const { data: projects, isPending, isError, error } = useProjects();
  const createProject = useCreateProject();
  const removeProject = useRemoveProject();
  useProjectsRealtime();
  const realtimeStatus = useRealtimeStatus();

  const addProject = useCallback(() => {
    createProject.mutate({
      name: `Project ${new Date().toLocaleTimeString()}`,
      description: "Created via TanStack Query mutation.",
      status: "planning",
      dueDate: null,
    });
  }, [createProject]);

  return (
    <section className="w-full max-w-md rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
        TanStack Query demo
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            realtimeStatus === "open"
              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
              : realtimeStatus === "connecting"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          {realtimeStatus === "open" ? "live" : realtimeStatus}
        </span>
      </h2>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        Server state via /api/projects — cached, realtime-synced across tabs.
      </p>

      {isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {isError && (
        <p className="text-sm text-red-500">Error: {error.message}</p>
      )}

      {projects && (
        <ul className="flex flex-col gap-2">
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2 text-sm dark:border-zinc-800"
            >
              <span className="truncate">{project.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={removeProject.isPending}
                onClick={() => removeProject.mutate(project.id)}
              >
                Remove
              </Button>
            </li>
          ))}
          {projects.length === 0 && (
            <li className="text-sm text-zinc-500">No projects yet.</li>
          )}
        </ul>
      )}

      <Button
        type="button"
        className="mt-4"
        disabled={createProject.isPending}
        onClick={addProject}
      >
        {createProject.isPending ? "Creating…" : "Add project"}
      </Button>
    </section>
  );
}
