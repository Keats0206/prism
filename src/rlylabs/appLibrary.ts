import type { Spec } from "@json-render/core";
import { titleFromPrompt } from "./generation";

export type SavedApp = {
  id: string;
  title: string;
  prompt: string;
  spec: Spec;
  createdAt: string;
  updatedAt: string;
};

const LIBRARY_KEY = "prism:library";

function isSavedApp(value: unknown): value is SavedApp {
  if (!value || typeof value !== "object") return false;
  const app = value as Record<string, unknown>;
  return (
    typeof app.id === "string" &&
    typeof app.title === "string" &&
    typeof app.prompt === "string" &&
    app.spec != null &&
    typeof app.spec === "object"
  );
}

function readLibrary(): SavedApp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LIBRARY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedApp);
  } catch {
    return [];
  }
}

function writeLibrary(apps: SavedApp[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(apps));
  } catch {
    // Ignore quota errors — persistence is best-effort.
  }
}

export function listApps(): SavedApp[] {
  return readLibrary().sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function saveApp(input: { prompt: string; spec: Spec }): SavedApp {
  const now = new Date().toISOString();
  const app: SavedApp = {
    id: crypto.randomUUID(),
    title: titleFromPrompt(input.prompt),
    prompt: input.prompt.trim(),
    spec: input.spec,
    createdAt: now,
    updatedAt: now,
  };

  writeLibrary([app, ...readLibrary()]);
  return app;
}

export function getApp(id: string): SavedApp | null {
  return readLibrary().find((app) => app.id === id) ?? null;
}

export function deleteApp(id: string): void {
  writeLibrary(readLibrary().filter((app) => app.id !== id));

  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`prism:state:${id}`);
  } catch {
    // Ignore cleanup errors.
  }
}
