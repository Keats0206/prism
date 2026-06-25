import { simulateReadableStream } from "ai";

type StreamTextOptions = {
  /** Delay before the first character appears. */
  initialDelayMs?: number;
  /** Delay between each character chunk. */
  chunkDelayMs?: number;
  /** Called with the accumulated text after each chunk. */
  onChunk: (text: string) => void;
  signal?: AbortSignal;
};

/** Stream fixed copy through the Vercel AI SDK's simulated readable stream. */
export async function streamText(
  text: string,
  { initialDelayMs = 0, chunkDelayMs = 14, onChunk, signal }: StreamTextOptions,
): Promise<void> {
  const stream = simulateReadableStream({
    chunks: [...text],
    initialDelayInMs: initialDelayMs,
    chunkDelayInMs: chunkDelayMs,
  });

  const reader = stream.getReader();
  let accumulated = "";

  try {
    while (true) {
      if (signal?.aborted) return;
      const { done, value } = await reader.read();
      if (done) break;
      accumulated += value;
      onChunk(accumulated);
    }
  } finally {
    reader.releaseLock();
  }
}
