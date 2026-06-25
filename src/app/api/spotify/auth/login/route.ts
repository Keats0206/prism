import { NextResponse } from "next/server";
import { authorizeUrl, SpotifyError } from "@/spotify/client";

export const dynamic = "force-dynamic";

// Kick off the one-time Spotify OAuth: redirect to the consent screen with a
// CSRF state cookie that the callback verifies.
export async function GET() {
  try {
    const state = crypto.randomUUID();
    const response = NextResponse.redirect(authorizeUrl(state));
    response.cookies.set("spotify_oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return response;
  } catch (error) {
    const message =
      error instanceof SpotifyError
        ? error.message
        : "Spotify is not configured";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
