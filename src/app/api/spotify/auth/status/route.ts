import { NextResponse } from "next/server";
import { isConnected } from "@/spotify/client";

export const dynamic = "force-dynamic";

// Lightweight check the /jukebox page uses to decide between the "Connect
// Spotify" gate and the prompt composer.
export async function GET() {
  return NextResponse.json({ connected: await isConnected() });
}
