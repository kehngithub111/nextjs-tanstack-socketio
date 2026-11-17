# Client Foundation Boilerplate

A Next.js 16 client-side foundation: **TanStack Store** (client state), **TanStack Query** (server state), and **Socket.io** (realtime) — each in one swappable file, with placeholder APIs so the whole stack runs before any real backend exists.

## Stack

| Layer | Tech | Entry point |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) + React 19 | `app/` |
| UI | Tailwind CSS 4 + shadcn/ui | `components/ui/` |
| Client state | TanStack Store | `lib/store/data-store.ts` |
| Server state | TanStack Query v5 | `lib/queries/projects.ts` |
| Realtime | Socket.io (custom server) | `lib/realtime/client.ts` |
| Placeholder API | Next route handlers (in-memory) | `app/api/` |

## Getting started

```bash
npm install
npm run dev   # runs server.mjs — required for Socket.io (next dev alone can't serve WebSockets)
```

## Structure

```
app/
  providers.tsx            # QueryClientProvider (client state of TanStack Query)
  layout.tsx               # Providers wired here
  page.tsx                 # demo page — replace with your app
  api/                     # PLACEHOLDER API (delete when real backend exists)
    projects/              # REST + shared in-memory db.ts
lib/
  api/client.ts            # typed fetch wrapper (api.get/post/patch/put/delete)
  queries/                 # one file per domain (projects.ts is the template)
  store/data-store.ts      # path-addressed client store
  realtime/
    client.ts              # SWAP FILE for the realtime transport
    server.ts              # route-handler → Socket.io bridge
components/
  dynamic/dynamic-input.tsx  # <DynamicInput path="a.b.c" /> — store-bound input
  query/query-demo.tsx       # example: queries + mutations + realtime sync
server.mjs                 # custom server: Next.js + Socket.io, same origin
```

## The three layers

### 1. Client state — TanStack Store

`lib/store/data-store.ts` holds a document addressed by dot-paths; writes auto-create structure (string segments → objects, numeric → arrays).

```tsx
<DynamicInput path="sample.data" label="Sample" />        // string
<DynamicInput path="tags" label="Tags" />                 // "a, b, c"
<DynamicInput path="profile" label="Profile" />           // "key: value, …"
<DynamicInput path="profile.name" label="Name" />         // any leaf
```

Two inputs on the same path auto-sync — state lives in the store, not the component. For non-path client state, create another store in `lib/store/` following the same actions-factory pattern.

### 2. Server state — TanStack Query

Every domain gets one file in `lib/queries/` (copy `projects.ts`):

1. **Types** — API payloads
2. **`ENDPOINTS`** — the single edit point for paths
3. **`<domain>Keys`** — query-key factory
4. **`<domain>Queries` / `<domain>Mutations`** — `queryOptions` + mutation factories
5. **Hooks** — `useProjects`, `useCreateProject`, … with cache invalidation

```tsx
const { data, isPending, isError, error } = useProjects();
createProject.mutate({ name: "New", status: "planning" });
```

### 3. Realtime — Socket.io

One message contract everywhere: `{ type, payload, at }`.

- **Emit** (server side): `publishRealtime("project.created", project)` from route handlers / your backend
- **Consume** (client): `useRealtimeEvent(handler)` + `useRealtimeStatus()`
- **Cache sync**: `useProjectsRealtime()` maps domain events straight into the query cache — mount once, and mutations from any client appear live in every tab

## Swapping in a real backend

Designed as a one-go swap:

1. Delete `app/api/` (placeholders) and `server.mjs`; revert scripts to `next dev` / `next start`
2. Set env vars (see `.env.example`):
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://api.myapp.com
   NEXT_PUBLIC_REALTIME_URL=https://realtime.myapp.com
   ```
3. Update `ENDPOINTS` + types in `lib/queries/*.ts`

Nothing in `components/` or `app/` changes — that's the point of the abstraction.

## Scaling notes

- **Multiple API/realtime instances:** add `@socket.io/redis-adapter` on whichever server owns Socket.io
- **Per-user data:** swap the global placeholder db for real auth + storage on the backend; the query layer already keys by domain, add user context via query keys when needed
