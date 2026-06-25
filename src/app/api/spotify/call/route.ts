import { NextResponse } from "next/server";
import { getTool, WRITE_TOOL_NAMES } from "@/spotify/tools";
import { SpotifyError } from "@/spotify/client";

export const dynamic = "force-dynamic";

// Runtime action endpoint. The generated jukebox UI calls write tools
// (play/queue/createPlaylist/...) through here. Only write tools are callable,
// and params are validated against the tool's Zod schema before execution.
export async function POST(request: Request) {
  let payload: { tool?: string; params?: unknown };
  try {
    payload = (await request.json()) as { tool?: string; params?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { tool: name, params } = payload;

  if (!name || !WRITE_TOOL_NAMES.includes(name)) {
    return NextResponse.json(
      { error: `Unknown or non-callable tool: ${name ?? "(none)"}` },
      { status: 400 },
    );
  }

  const spec = getTool(name);
  if (!spec) {
    return NextResponse.json({ error: "Tool not found" }, { status: 400 });
  }

  const parsed = spec.input.safeParse(params ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid params", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await spec.handler(parsed.data);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof SpotifyError) {
      const message =
        error.status === 401
          ? "Spotify is not connected"
          : error.status === 404
            ? "No active Spotify device — open Spotify and start playing on a device first."
            : error.message;
      return NextResponse.json({ error: message }, { status: error.status });
    }
    console.error("Spotify action failed:", error);
    return NextResponse.json({ error: "Spotify action failed" }, { status: 500 });
  }
}
