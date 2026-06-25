import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Single-user Spotify token store + Web API helper.
 *
 * Mirrors how the real marcelmarais/spotify-mcp-server keeps one
 * `spotify-config.json` for a dev account: we persist the OAuth tokens to
 * `.spotify-tokens.json` at the repo root (gitignored) and refresh the access
 * token on demand. This is a local-dev convenience — a deployed version would
 * move the store to a database or encrypted env.
 */

const TOKEN_FILE = path.join(process.cwd(), ".spotify-tokens.json");

const ACCOUNTS_BASE = "https://accounts.spotify.com";
const API_BASE = "https://api.spotify.com/v1";

/** Scopes needed for reads (library/playback state) and writes (playback + playlists). */
export const SPOTIFY_SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "playlist-read-private",
  "playlist-modify-private",
  "playlist-modify-public",
  "user-library-read",
  "user-read-recently-played",
].join(" ");

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  /** Epoch milliseconds at which the access token expires. */
  expiresAt: number;
};

export class SpotifyError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "SpotifyError";
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new SpotifyError(`${name} is not configured`, 500);
  }
  return value;
}

export function clientId(): string {
  return requireEnv("SPOTIFY_CLIENT_ID");
}

export function redirectUri(): string {
  return (
    process.env.SPOTIFY_REDIRECT_URI ??
    "http://127.0.0.1:3000/api/spotify/auth/callback"
  );
}

function basicAuthHeader(): string {
  const creds = `${clientId()}:${requireEnv("SPOTIFY_CLIENT_SECRET")}`;
  return `Basic ${Buffer.from(creds).toString("base64")}`;
}

async function readTokens(): Promise<StoredTokens | null> {
  try {
    const raw = await fs.readFile(TOKEN_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoredTokens>;
    if (!parsed.accessToken || !parsed.refreshToken) return null;
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      expiresAt: parsed.expiresAt ?? 0,
    };
  } catch {
    return null;
  }
}

async function writeTokens(tokens: StoredTokens): Promise<void> {
  await fs.writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2), "utf8");
}

/** Whether a refresh token exists — drives the page's "Connect Spotify" gate. */
export async function isConnected(): Promise<boolean> {
  return (await readTokens()) !== null;
}

/** Build the authorize URL the user is redirected to for the one-time OAuth. */
export function authorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId(),
    scope: SPOTIFY_SCOPES,
    redirect_uri: redirectUri(),
    state,
  });
  return `${ACCOUNTS_BASE}/authorize?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

async function requestToken(body: URLSearchParams): Promise<TokenResponse> {
  const res = await fetch(`${ACCOUNTS_BASE}/api/token`, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new SpotifyError(`Token request failed: ${detail}`, res.status);
  }
  return (await res.json()) as TokenResponse;
}

/** Exchange an authorization code for tokens and persist them. */
export async function exchangeCode(code: string): Promise<void> {
  const token = await requestToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
    }),
  );
  if (!token.refresh_token) {
    throw new SpotifyError("Spotify did not return a refresh token", 500);
  }
  await writeTokens({
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: Date.now() + token.expires_in * 1000,
  });
}

async function refresh(tokens: StoredTokens): Promise<StoredTokens> {
  const token = await requestToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken,
    }),
  );
  const next: StoredTokens = {
    accessToken: token.access_token,
    // Spotify may or may not rotate the refresh token.
    refreshToken: token.refresh_token ?? tokens.refreshToken,
    expiresAt: Date.now() + token.expires_in * 1000,
  };
  await writeTokens(next);
  return next;
}

/** Return a valid access token, refreshing if it expires within 60s. */
async function getAccessToken(): Promise<string> {
  const tokens = await readTokens();
  if (!tokens) {
    throw new SpotifyError("Spotify is not connected", 401);
  }
  if (tokens.expiresAt - 60_000 <= Date.now()) {
    const refreshed = await refresh(tokens);
    return refreshed.accessToken;
  }
  return tokens.accessToken;
}

type FetchOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
};

/**
 * Call the Spotify Web API with the stored bearer token. Returns parsed JSON,
 * or `null` for empty (204) responses (common for playback control endpoints).
 */
export async function spotifyFetch<T = unknown>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T | null> {
  const token = await getAccessToken();

  const url = new URL(`${API_BASE}${endpoint}`);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new SpotifyError(
      `Spotify API ${res.status}: ${detail || res.statusText}`,
      res.status,
    );
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return null;
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : null;
}
