import { NextResponse } from "next/server";
import { getSessionUserId } from "@/mutual/auth/session";
import { updateLocation } from "@/mutual/db/users";

// Store the signed-in user's coarse location for event search. Coords are
// validated and never logged.
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { lat, lng, city } = (await request.json()) as {
    lat?: number;
    lng?: number;
    city?: string;
  };

  const hasCoords = typeof lat === "number" && typeof lng === "number";
  if (hasCoords && (lat < -90 || lat > 90 || lng < -180 || lng > 180)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }
  if (!hasCoords && !city?.trim()) {
    return NextResponse.json({ error: "Location is required" }, { status: 400 });
  }

  const user = await updateLocation(userId, {
    lat: hasCoords ? lat : undefined,
    lng: hasCoords ? lng : undefined,
    city: city?.trim() || undefined,
  });

  return NextResponse.json({ ok: true, city: user.city });
}
