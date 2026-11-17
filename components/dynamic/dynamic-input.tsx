"use client";

import { useCallback, useState } from "react";
import { useSelector } from "@tanstack/react-store";
import { shallow } from "@tanstack/store";
import { Input } from "@/components/ui/input";
import {
  dataStore,
  getValueAtPath,
  isPlainObject,
  setValueAtPath,
} from "@/lib/store/data-store";
import { Label } from "../ui/label";

type DynamicInputProps = Omit<React.ComponentProps<"input">, "value"> & {
  /** Dot-path into the data store, e.g. "sample.data", "tags[0]", "profile.name". */
  label: string;
  path: string;
};

/**
 * A single shadcn Input bound to a store path. The value's shape decides
 * how the text is interpreted:
 *
 * - string  → plain text
 * - array   → comma-separated items ("a, b, c")
 * - object  → comma-separated "key: value" pairs ("name: Ada, email: …")
 *
 * Typing keeps the raw text locally (so trailing commas survive) and pushes
 * the parsed value into the store; updates from elsewhere overwrite the text.
 */
export function DynamicInput({
  label,
  path,
  onChange,
  ...props
}: DynamicInputProps) {
  const value = useSelector(dataStore, (state) => getValueAtPath(state, path), {
    compare: shallow,
  });
  const [raw, setRaw] = useState(() => serializeValue(value));
  // The value we last pushed to the store, kept in state (not a ref) so the
  // render-phase comparison below is lint-safe.
  const [pushed, setPushed] = useState<unknown>(value);

  // Store changed elsewhere → replace the text with its serialization.
  if (!shallow(value, pushed)) {
    setPushed(value);
    setRaw(serializeValue(value));
  }

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      const parsed = parseValue(next, value);
      setRaw(next);
      setPushed(parsed);
      setValueAtPath(path, parsed);
      onChange?.(event);
    },
    [path, value, onChange],
  );

  return (
    <div className="space-y-2">
      {label && <Label className="capitalize">{label}</Label>}
      <Input className="h-9!" value={raw} onChange={handleChange} {...props} />
    </div>
  );
}

function stringifyLeaf(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function serializeValue(value: unknown): string {
  if (isPlainObject(value)) {
    return Object.entries(value)
      .map(([key, entry]) => `${key}: ${stringifyLeaf(entry)}`)
      .join(", ");
  }
  if (Array.isArray(value)) {
    return value.map(stringifyLeaf).join(", ");
  }
  return value == null ? "" : stringifyLeaf(value);
}

/** Target shape follows the value currently at the path. */
function parseValue(raw: string, current: unknown): unknown {
  if (isPlainObject(current)) {
    const object: Record<string, unknown> = {};
    for (const part of raw.split(",")) {
      const separator = part.indexOf(":");
      if (separator === -1) continue;
      const key = part.slice(0, separator).trim();
      if (!key) continue;
      object[key] = part.slice(separator + 1).trim();
    }
    return object;
  }
  if (Array.isArray(current)) {
    return raw.split(",").map((part) => part.trim());
  }
  return raw;
}
