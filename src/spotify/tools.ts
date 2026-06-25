import { tool, type Tool } from "ai";
import { z } from "zod";
import { spotifyFetch } from "./client";

/**
 * MCP-shaped Spotify capability layer.
 *
 * Each tool is a named, Zod-typed function over the Spotify Web API — the same
 * shape an MCP server exposes (name + description + input schema + handler). The
 * jukebox build agent consumes the `read` tools to fetch real data; the
 * `/api/spotify/call` route invokes `write` tools for live playback/playlist
 * actions triggered by the generated UI.
 *
 * This is deliberately MCP-shaped so the internals could later be swapped for a
 * real MCP client (e.g. the marcelmarais stdio server) without touching callers.
 */

export type ToolAccess = "read" | "write";

export type SpotifyTool<I extends z.ZodType = z.ZodType> = {
  description: string;
  access: ToolAccess;
  input: I;
  handler: (args: z.infer<I>) => Promise<unknown>;
};

/** Ties a handler's argument type to its own input schema. */
function defineTool<I extends z.ZodType>(spec: SpotifyTool<I>): SpotifyTool<I> {
  return spec;
}

// ---------------------------------------------------------------------------
// Compact mappers — keep payloads small enough to bake into a generated spec.
// ---------------------------------------------------------------------------

type SpotifyImage = { url: string };
type SpotifyArtist = { name: string };
type SpotifyTrack = {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  artists: SpotifyArtist[];
  album?: { name: string; images: SpotifyImage[] };
};
type SpotifyPlaylist = {
  id: string;
  name: string;
  uri: string;
  description?: string | null;
  images: SpotifyImage[];
  owner?: { display_name?: string };
  tracks?: { total: number };
};

function image(images: SpotifyImage[] | undefined): string | undefined {
  return images?.[0]?.url;
}

function mapTrack(track: SpotifyTrack) {
  return {
    id: track.id,
    name: track.name,
    uri: track.uri,
    artists: track.artists.map((a) => a.name).join(", "),
    album: track.album?.name,
    image: image(track.album?.images),
    durationMs: track.duration_ms,
  };
}

function mapPlaylist(playlist: SpotifyPlaylist) {
  return {
    id: playlist.id,
    name: playlist.name,
    uri: playlist.uri,
    description: playlist.description ?? undefined,
    image: image(playlist.images),
    owner: playlist.owner?.display_name,
    trackCount: playlist.tracks?.total,
  };
}

async function currentUserId(): Promise<string> {
  const me = await spotifyFetch<{ id: string }>("/me");
  if (!me?.id) throw new Error("Could not resolve current Spotify user");
  return me.id;
}

// ---------------------------------------------------------------------------
// Tool registry
// ---------------------------------------------------------------------------

export const spotifyTools = {
  searchSpotify: defineTool({
    access: "read",
    description:
      "Search Spotify for tracks, albums, artists, or playlists by free-text query.",
    input: z.object({
      query: z.string().describe("Search terms, e.g. 'lo-fi study beats'"),
      type: z
        .enum(["track", "album", "artist", "playlist"])
        .default("track")
        .describe("What kind of item to search for"),
      limit: z.number().int().min(1).max(50).default(12),
    }),
    handler: async ({ query, type, limit }) => {
      const data = await spotifyFetch<{
        tracks?: { items: SpotifyTrack[] };
        playlists?: { items: SpotifyPlaylist[] };
      }>("/search", { query: { q: query, type, limit } });
      if (type === "playlist") {
        return (data?.playlists?.items ?? []).map(mapPlaylist);
      }
      return (data?.tracks?.items ?? []).map(mapTrack);
    },
  }),

  getMyPlaylists: defineTool({
    access: "read",
    description: "List the current user's playlists.",
    input: z.object({ limit: z.number().int().min(1).max(50).default(20) }),
    handler: async ({ limit }) => {
      const data = await spotifyFetch<{ items: SpotifyPlaylist[] }>(
        "/me/playlists",
        { query: { limit } },
      );
      return (data?.items ?? []).map(mapPlaylist);
    },
  }),

  getPlaylistTracks: defineTool({
    access: "read",
    description: "Get the tracks inside a specific playlist.",
    input: z.object({
      playlistId: z.string(),
      limit: z.number().int().min(1).max(100).default(50),
    }),
    handler: async ({ playlistId, limit }) => {
      const data = await spotifyFetch<{ items: { track: SpotifyTrack }[] }>(
        `/playlists/${playlistId}/tracks`,
        { query: { limit } },
      );
      return (data?.items ?? [])
        .map((entry) => entry.track)
        .filter(Boolean)
        .map(mapTrack);
    },
  }),

  getLikedSongs: defineTool({
    access: "read",
    description: "Get the current user's saved/liked songs.",
    input: z.object({ limit: z.number().int().min(1).max(50).default(30) }),
    handler: async ({ limit }) => {
      const data = await spotifyFetch<{ items: { track: SpotifyTrack }[] }>(
        "/me/tracks",
        { query: { limit } },
      );
      return (data?.items ?? []).map((entry) => mapTrack(entry.track));
    },
  }),

  getNowPlaying: defineTool({
    access: "read",
    description: "Get the track currently playing on the user's Spotify.",
    input: z.object({}),
    handler: async () => {
      const data = await spotifyFetch<{
        is_playing: boolean;
        item: SpotifyTrack | null;
      }>("/me/player/currently-playing");
      if (!data?.item) return { isPlaying: false, track: null };
      return { isPlaying: data.is_playing, track: mapTrack(data.item) };
    },
  }),

  getRecentlyPlayed: defineTool({
    access: "read",
    description: "Get the user's recently played tracks.",
    input: z.object({ limit: z.number().int().min(1).max(50).default(20) }),
    handler: async ({ limit }) => {
      const data = await spotifyFetch<{ items: { track: SpotifyTrack }[] }>(
        "/me/player/recently-played",
        { query: { limit } },
      );
      return (data?.items ?? []).map((entry) => mapTrack(entry.track));
    },
  }),

  // --- write tools (invoked live from the generated UI) -------------------

  playMusic: defineTool({
    access: "write",
    description:
      "Start playback. Provide a single track `uri`, multiple track `uris`, or a `contextUri` (playlist/album).",
    input: z.object({
      uri: z.string().optional(),
      uris: z.array(z.string()).optional(),
      contextUri: z.string().optional(),
      deviceId: z.string().optional(),
    }),
    handler: async ({ uri, uris, contextUri, deviceId }) => {
      const body: Record<string, unknown> = {};
      if (contextUri) body.context_uri = contextUri;
      else if (uris?.length) body.uris = uris;
      else if (uri) body.uris = [uri];
      await spotifyFetch("/me/player/play", {
        method: "PUT",
        body,
        query: { device_id: deviceId },
      });
      return { ok: true };
    },
  }),

  pausePlayback: defineTool({
    access: "write",
    description: "Pause playback.",
    input: z.object({ deviceId: z.string().optional() }),
    handler: async ({ deviceId }) => {
      await spotifyFetch("/me/player/pause", {
        method: "PUT",
        query: { device_id: deviceId },
      });
      return { ok: true };
    },
  }),

  resumePlayback: defineTool({
    access: "write",
    description: "Resume playback.",
    input: z.object({ deviceId: z.string().optional() }),
    handler: async ({ deviceId }) => {
      await spotifyFetch("/me/player/play", {
        method: "PUT",
        query: { device_id: deviceId },
      });
      return { ok: true };
    },
  }),

  skipToNext: defineTool({
    access: "write",
    description: "Skip to the next track.",
    input: z.object({ deviceId: z.string().optional() }),
    handler: async ({ deviceId }) => {
      await spotifyFetch("/me/player/next", {
        method: "POST",
        query: { device_id: deviceId },
      });
      return { ok: true };
    },
  }),

  addToQueue: defineTool({
    access: "write",
    description: "Add a track to the playback queue.",
    input: z.object({ uri: z.string(), deviceId: z.string().optional() }),
    handler: async ({ uri, deviceId }) => {
      await spotifyFetch("/me/player/queue", {
        method: "POST",
        query: { uri, device_id: deviceId },
      });
      return { ok: true };
    },
  }),

  createPlaylist: defineTool({
    access: "write",
    description:
      "Create a new playlist for the user, optionally seeding it with track URIs.",
    input: z.object({
      name: z.string(),
      description: z.string().optional(),
      uris: z.array(z.string()).optional(),
      public: z.boolean().default(false),
    }),
    handler: async ({ name, description, uris, public: isPublic }) => {
      const userId = await currentUserId();
      const playlist = await spotifyFetch<SpotifyPlaylist>(
        `/users/${userId}/playlists`,
        { method: "POST", body: { name, description, public: isPublic } },
      );
      if (!playlist?.id) throw new Error("Failed to create playlist");
      if (uris?.length) {
        await spotifyFetch(`/playlists/${playlist.id}/tracks`, {
          method: "POST",
          body: { uris },
        });
      }
      return mapPlaylist(playlist);
    },
  }),

  addTracksToPlaylist: defineTool({
    access: "write",
    description: "Add tracks to an existing playlist.",
    input: z.object({
      playlistId: z.string(),
      uris: z.array(z.string()).min(1),
    }),
    handler: async ({ playlistId, uris }) => {
      await spotifyFetch(`/playlists/${playlistId}/tracks`, {
        method: "POST",
        body: { uris },
      });
      return { ok: true, added: uris.length };
    },
  }),
};

export type SpotifyToolName = keyof typeof spotifyTools;

const toolMap = spotifyTools as Record<string, SpotifyTool>;

export function getTool(name: string): SpotifyTool | undefined {
  return toolMap[name];
}

/** Names of write tools — the allowlist for the runtime `/api/spotify/call` route. */
export const WRITE_TOOL_NAMES = Object.entries(toolMap)
  .filter(([, t]) => t.access === "write")
  .map(([name]) => name);

/** Adapt tools of a given access level into AI SDK `tool()` definitions. */
export function toAISdkTools(access: ToolAccess): Record<string, Tool> {
  const entries = Object.entries(toolMap)
    .filter(([, t]) => t.access === access)
    .map(([name, t]) => [
      name,
      tool({
        description: t.description,
        inputSchema: t.input,
        execute: (args) => t.handler(args) as Promise<unknown>,
      }),
    ]);
  return Object.fromEntries(entries);
}
