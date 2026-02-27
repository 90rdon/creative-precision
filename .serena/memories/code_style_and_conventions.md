# Code Style & Conventions

## TypeScript
- Strict TypeScript with `~5.8`, linted via `tsc --noEmit`
- Explicit types for all props and state; interfaces defined in `types.ts`
- No test framework yet (V0.1)

## React
- Functional components with `React.FC` typing
- Hooks: useState, useEffect, useRef
- Named exports for components; default export for App

## Tailwind
- Tailwind v4 (CSS-first config, no tailwind.config.js)
- Custom color tokens: `sand-*` (sand-50, sand-100, sand-200, sand-900), `stone-*`
- Font: `font-serif` for headings, `font-sans` for body
- Utility-first inline classes

## File Naming
- Components: PascalCase (`ChatInterface.tsx`)
- Services: camelCase (`geminiService.ts`)
- Constants: camelCase (`constants.ts`)

## Key Constraints (from Product Docs)
- **Never hard-code AI logic in React components** — keep conversation flow in system prompt
- **Configuration-driven prompts**: `systemInstruction` in `constants.ts` (eventually config DB)
- **One question at a time**: AI guidelines enforce single questions per turn
- **No sales pressure in UI**: Lifeline offer is always soft, opt-in framing
