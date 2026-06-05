# Yoga

Yoga is a React-based reading app for the Yoga Sutras. It brings together Sanskrit text, pronunciation, multiple translations, word meanings, audio, and a commentary study panel in one interface.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Framer Motion
- Vitest
- Playwright

## Project layout

- `src/`: active application code
- `src/assets/learning-comic/`: chapter-based comic panels used by the commentary view
- `public/`: runtime assets such as `reading-data.json`, `lexicon.json`, `favicon.png`, and `gita_header_icon.png`
- `dist/`: production build output

## Runtime data flow

The app reads from `public/reading-data.json`.

- Loader: `src/utils/dataFetcher.ts`
- Shared provider: `src/context/YogaDataContext.tsx`
- Lexicon fetch: `src/components/LexiconModal.tsx`
- Commentary comics: `src/pages/VerseView.tsx`

## Local development

```bash
npm install
npm run dev
```

Core checks:

```bash
npm run typecheck
npm run test -- --run
npm run build
```

## Deployment

This is a static build.

- Build command: `npm run build`
- Output directory: `dist`

Before deployment:

- confirm `public/reading-data.json` is current
- run `npm run typecheck`
- run `npm run test -- --run`
- run `npm run build`

## Notes

- `npm run dev` starts the app locally.
- `npm run preview` serves a production build locally.
- Valid scripts are `dev`, `build`, `preview`, `test`, and `typecheck`.
