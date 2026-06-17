// AI Gateway models available in the recipe generator. Prices are USD per 1M
// tokens and used only for a live cost *estimate* shown in the UI.
export type ModelInfo = {
  id: string; // AI Gateway "provider/model" slug
  label: string;
  inputPerM: number;
  outputPerM: number;
};

export const MODELS: ModelInfo[] = [
  { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6", inputPerM: 3, outputPerM: 15 },
  { id: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5", inputPerM: 1, outputPerM: 5 },
  { id: "openai/gpt-5", label: "GPT-5", inputPerM: 1.25, outputPerM: 10 },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", inputPerM: 1.25, outputPerM: 10 },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", inputPerM: 0.3, outputPerM: 2.5 },
];

export const DEFAULT_MODEL = MODELS[0].id;

export function getModel(id: string | undefined): ModelInfo {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}

export function estimateCost(
  model: ModelInfo,
  inputTokens: number,
  outputTokens: number,
): number {
  return (
    (inputTokens / 1_000_000) * model.inputPerM +
    (outputTokens / 1_000_000) * model.outputPerM
  );
}
