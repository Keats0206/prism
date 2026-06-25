# Prism — Friend Test Guide

Prism turns a text prompt into a small interactive app in the browser. Everything a user builds is stored locally in their browser — no account needed.

## Setup checklist

1. **Env vars**: Copy `.env.example` → `.env.local` and set `AI_GATEWAY_API_KEY`.
   - Get a key from [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) or your AI provider.
2. **Deploy**: Push to Vercel (recommended) or run locally with `yarn dev`.
3. **Share the link**: Send friends `https://your-domain.com/prism`.

## What to tell friends

> Open this link on your phone, tap **+**, describe something you need — a morning routine, workout tracker, trip planner, grocery list — and Prism builds a mini app for you. Tap **← Home** to see everything you've built.

Suggested prompts to try:
- "Morning routine checklist"
- "Track my chest workout with sets and reps"
- "Plan a date night in Brooklyn"
- "Weekly grocery list I can check off"

## Success metrics (informal)

- [ ] Friends build at least one app unprompted
- [ ] They reopen an app from the home list after refreshing
- [ ] Interactive state persists (checked items, toggles) after refresh
- [ ] Layout looks correct on mobile (edge-to-edge, no gray gutters)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Generation failed" | Verify `AI_GATEWAY_API_KEY` is set in Vercel env vars (Production + Preview) |
| Apps disappear | Data is per-browser — clearing site data wipes the library |
| Gray gutters on mobile | Hard refresh; ensure you're on `/prism` not an old cached build |
| Build works locally but not deployed | Redeploy after adding env vars; check Vercel function logs |

## Local dev

```bash
yarn dev
# Open http://localhost:3000/prism
```

Build apps are stored in `localStorage` under `prism:library`. Per-app interactive state lives under `prism:state:{appId}`.
