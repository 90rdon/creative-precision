# Tech Stack & Commands

## Stack
- **Framework**: Vite + React 19 + TypeScript ~5.8
- **Styling**: Tailwind CSS v4 (config-less, CSS-first)
- **AI Backend**: Google Gemini API via `@google/genai` v1.41
  - Chat: `gemini-3-flash-preview`
  - TTS: `gemini-2.5-flash-preview-tts` (voice: 'Kore')
  - Results: `gemini-3-flash-preview` with `responseMimeType: 'application/json'`
- **Icons**: `lucide-react`
- **Deployment**: AI Studio App framework

## Key Commands
```bash
npm run dev          # Start dev server (Vite)
npm run build        # build:css (tailwindcss) + vite build
npm run build:css    # npx tailwindcss -i src/style.css -o assets/style.css
npm run preview      # Vite preview
npm run lint         # tsc --noEmit (TypeScript type check only)
```

## Environment
- `process.env.GEMINI_API_KEY` — required for Gemini client

## No testing framework configured (V0.1)
