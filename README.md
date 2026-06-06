# LAMP

LAMP is a React-based reading app for Buddhist study text. It brings together the reading view, chapter navigation, verse selection, and commentary study panel in one interface.

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
- Cloudflare Pages build output dir: `dist`
- GitHub Actions deploy script: `npm run deploy:pages`

## Cloudflare Pages

This repo is set up for Cloudflare Pages deployments from GitHub Actions.

Workflow:

- push to `main` or run the workflow manually
- build the app with `npm run build`
- deploy the `dist` directory with `wrangler pages deploy`

Required GitHub secrets:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Before deployment, make sure:

- confirm `public/reading-data.json` is current
- run `npm run typecheck`
- run `npm run test -- --run`
- run `npm run build`

If you want to deploy locally, set the same Cloudflare environment variables and run:

```bash
npm run deploy:pages
```

## Notes

- `npm run dev` starts the app locally.
- `npm run preview` serves a production build locally.
- Valid scripts are `dev`, `build`, `preview`, `test`, and `typecheck`.
