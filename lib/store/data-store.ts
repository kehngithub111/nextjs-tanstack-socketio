import { createStore } from "@tanstack/store"

/**
 * Generic document store addressed by dot-paths, e.g.:
 *
 *   <DynamicInput path="sample.data" />
 *   <DynamicInput path="tags[0]" />
 *   <DynamicInput path="profile.name" />
 *
 * Leaves hold strings; branches are objects or arrays. Writing to a path
 * that doesn't exist yet auto-creates the missing structure: numeric
 * segments produce arrays, string segments produce objects.
 */
export type DataState = Record<string, unknown>

const initialState: DataState = {
  sample: {
    data: "Hello world",
  },
  profile: {
    name: "",
    email: "",
  },
  tags: ["frontend", "design"],
}

export const dataStore = createStore<DataState>(initialState)

const PATH_SEGMENT = /([^.[\]]+)|\[(\d+)\]/g

/** "items[0].title" and "items.0.title" both parse to ["items", 0, "title"]. */
export function parsePath(path: string): Array<string | number> {
  const segments: Array<string | number> = []
  for (const match of path.matchAll(PATH_SEGMENT)) {
    if (match[2] !== undefined) {
      segments.push(Number(match[2]))
    } else {
      segments.push(/^\d+$/.test(match[1]) ? Number(match[1]) : match[1])
    }
  }
  return segments
}

/** Builds a child path: joinPath("tags", 0) → "tags[0]", joinPath("", "a") → "a". */
export function joinPath(base: string, key: string | number): string {
  if (typeof key === "number") return `${base}[${key}]`
  return base ? `${base}.${key}` : key
}

export function getValueAtPath(state: DataState, path: string): unknown {
  let current: unknown = state
  for (const segment of parsePath(path)) {
    if (current === null || typeof current !== "object") return undefined
    if (Array.isArray(current)) {
      current = current[segment as number]
    } else {
      current = (current as Record<string, unknown>)[segment as string]
    }
  }
  return current
}

/** Immutable write; creates intermediate objects/arrays as needed. */
export function setValueAtPath(path: string, value: unknown) {
  const segments = parsePath(path)
  if (segments.length === 0) return
  dataStore.setState((state) => setIn(state, segments, value) as DataState)
}

/** Removes the leaf at a path (array item by index, or object key). */
export function removeValueAtPath(path: string) {
  const segments = parsePath(path)
  if (segments.length === 0) return
  dataStore.setState((state) => deleteIn(state, segments) as DataState)
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function setIn(
  obj: unknown,
  segments: Array<string | number>,
  value: unknown,
): unknown {
  if (segments.length === 0) return value
  const [key, ...rest] = segments
  if (typeof key === "number") {
    const copy = Array.isArray(obj) ? obj.slice() : []
    copy[key] = setIn(copy[key], rest, value)
    return copy
  }
  const base = isPlainObject(obj) ? obj : {}
  return { ...base, [key]: setIn(base[key], rest, value) }
}

function deleteIn(
  obj: unknown,
  segments: Array<string | number>,
): unknown {
  if (segments.length === 0 || obj === null || typeof obj !== "object") {
    return obj
  }
  const [key, ...rest] = segments
  if (rest.length === 0) {
    if (Array.isArray(obj) && typeof key === "number") {
      return obj.filter((_, index) => index !== key)
    }
    if (isPlainObject(obj) && typeof key === "string") {
      const copy = { ...obj }
      delete copy[key]
      return copy
    }
    return obj
  }
  if (Array.isArray(obj) && typeof key === "number") {
    return obj.map((item, index) =>
      index === key ? deleteIn(item, rest) : item,
    )
  }
  if (isPlainObject(obj)) {
    return { ...obj, [key]: deleteIn(obj[key], rest) }
  }
  return obj
}
