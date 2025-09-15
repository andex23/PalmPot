# PalmPot — Nigerian Recipe Generator

AI-powered recipe generator for Nigerian cuisine. Enter a dish or use filters; PalmPot generates a clear description, ingredients, and step-by-step instructions. Images are generated via Gemini Imagen when available, with a smart Unsplash fallback.

## Features

- Text generation with Google Gemini (schema-guided JSON)
- Image generation with Imagen; automatic Unsplash fallback for non-billed accounts
  - Deterministic Unsplash images using a stable signature per dish
  - Blur-on-load for better perceived performance
- Saved recipes (localStorage) with delete and copy helpers
- Shareable URLs (persist `q`, `cuisine`, `meal` in query params) + Copy link button
- Filters: Cuisine (Yoruba, Igbo, Hausa, Efik/Ibibio, Edo, Delta) and Meal Type
- Keyboard shortcut: Cmd/Ctrl + K focuses search
- Tailwind via CDN; Vite + React 19 + TypeScript

## Requirements

- Node.js 18+ recommended
- A Google Gemini API key

## Quickstart

1) Install dependencies

```bash
npm install
```

2) Create `.env.local` with your key

```bash
echo "GEMINI_API_KEY=YOUR_API_KEY" > .env.local
```

3) Run the dev server

```bash
npm run dev
# then open http://localhost:5173
```

## Environment

- Set `GEMINI_API_KEY` in `.env.local`.
- Vite maps `GEMINI_API_KEY` to `process.env.API_KEY` at build time (see `vite.config.ts`).
- `.gitignore` already excludes env files.

## Usage tips

- Type a dish (e.g., "Jollof Rice") and press Enter or click Generate.
- Use Filters to refine by Cuisine/Meal Type.
- Click “Copy link” to share the exact query and filters.
- “Surprise me” generates a random Nigerian dish.

### Shareable URL format

```
/?q=Jollof%20Rice&cuisine=Yoruba&meal=Dinner
```

## Images and fallbacks

- Imagen API access requires a billed Google account. If unavailable, PalmPot automatically falls back to Unsplash using the dish name. The Unsplash URL includes a stable signature so saved recipes keep a consistent image.

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — build for production into `dist/`
- `npm run preview` — preview the production build locally

## Deployment

- Any static host (Vercel/Netlify/etc.).
- Set `GEMINI_API_KEY` in your host’s environment variables.
- Build: `npm run build`, serve the `dist/` directory.

## Troubleshooting

- Imagen billing error: you’ll see a relevant Unsplash image instead.
- Empty result or errors: verify `GEMINI_API_KEY` is set and valid.

## Notes

- This app calls Gemini from the client. For production-grade apps, consider proxying API calls through a backend to keep keys off the client.
