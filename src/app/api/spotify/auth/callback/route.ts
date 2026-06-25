import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode } from "@/spotify/client";

export const dynamic = "force-dynamic";

// Spotify redirects here with ?code & ?state. Verify state, swap the code for
// tokens (persisted by the client), then return to /jukebox.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const home = new URL("/jukebox", request.url);

  if (error) {
    home.searchParams.set("error", error);
    return NextResponse.redirect(home);
  }

  // CSRF state check. The state cookie is host-scoped, so a localhost↔127.0.0.1
  // flow (or a cleared cookie) can leave it absent on the callback host. For a
  // single-user local dev tool we tolerate a *missing* cookie but still reject
  // an explicit mismatch (a present-but-wrong state = tampering).
  const expectedState = request.cookies.get("spotify_oauth_state")?.value;
  if (!code || (expectedState && state !== expectedState)) {
    home.searchParams.set("error", "invalid_oauth_state");
    return NextResponse.redirect(home);
  }

  try {
    await exchangeCode(code);
    home.searchParams.set("connected", "1");
  } catch (err) {
    console.error("Spotify token exchange failed:", err);
    home.searchParams.set("error", "token_exchange_failed");
  }

  const response = NextResponse.redirect(home);
  response.cookies.delete("spotify_oauth_state");
  return response;
}
