import type { EventItem } from "@/mutual/types";

// Thin wrapper over Exa search for pulling live local events. Provider-agnostic
// shape (EventItem) so a future swap (Ticketmaster, etc.) only touches this file.
// Fails soft: a missing key or a network error throws, and callers degrade to a
// text reply rather than 500-ing the chat.

const EXA_ENDPOINT = "https://api.exa.ai/search";

export type LiveEventSearch = {
  query: string;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  timeframe?: string | null;
  limit?: number;
};

type ExaResult = {
  title?: string;
  url?: string;
  text?: string;
  summary?: string;
  publishedDate?: string;
  image?: string;
};

export function isExaConfigured(): boolean {
  return Boolean(process.env.EXA_API_KEY);
}

export async function searchLocalEvents(
  params: LiveEventSearch,
): Promise<EventItem[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error("EXA_API_KEY is not set");
  }

  const where = params.city
    ? ` in ${params.city}`
    : params.lat != null && params.lng != null
      ? ` near ${params.lat.toFixed(2)},${params.lng.toFixed(2)}`
      : "";
  const when = params.timeframe ? ` ${params.timeframe}` : " this week";
  const query = `${params.query} events${where}${when}`;

  const res = await fetch(EXA_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query,
      type: "auto",
      numResults: params.limit ?? 5,
      contents: { text: { maxCharacters: 400 }, summary: true },
    }),
  });

  if (!res.ok) {
    throw new Error(`Exa search failed: ${res.status}`);
  }

  const data = (await res.json()) as { results?: ExaResult[] };
  return (data.results ?? []).slice(0, params.limit ?? 5).map((r) => ({
    title: r.title?.trim() || "Untitled event",
    url: r.url,
    description: (r.summary ?? r.text)?.trim().slice(0, 200) || undefined,
    startsAt: r.publishedDate,
    imageUrl: r.image,
  }));
}
