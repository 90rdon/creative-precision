# Codebase Structure

## Source Files (`src/`)
```
src/
├── App.tsx              # Root: view state (landing|assessment|results), UTM parsing, telemetry, exit modal
├── index.tsx            # Entry point
├── style.css            # Tailwind CSS input
├── constants.ts         # DEFAULT_CONFIG (modelName, initialGreeting, systemInstruction)
├── types.ts             # AppView, AppConfig, Message, AnalysisResult
├── services/
│   └── geminiService.ts # createChatSession(), generateResults(), generateSpeech()
└── components/
    ├── Landing.tsx       # Landing page (currently skipped — App.tsx starts at 'assessment')
    ├── ChatInterface.tsx # Main chat UI (thin pass-through; logic in prompt)
    ├── Results.tsx       # Results display (synthesis, bottleneck_diagnosis, boardroom_insight, diagnostic_call_cta)
    ├── ConfigPanel.tsx   # Dev config panel (system prompt editor, etc.)
    └── Button.tsx        # Reusable button component
```

## Key Architectural Decisions
- **"Dumb Frontend, Smart Prompt"**: ChatInterface.tsx is a thin terminal; all conversational logic is in `DEFAULT_CONFIG.systemInstruction`
- App default view is `'assessment'` (not `'landing'`) — bypasses landing page on load
- UTM params parsed from URL on mount → stored in `utmData` state for telemetry
- `sessionId` generated per session for telemetry tracking (currently console.log only)

## AnalysisResult Schema (JSON from Gemini)
```ts
{
  synthesis: string           // brutal reality synthesis
  bottleneck_diagnosis: string // named structural friction point
  boardroom_insight: string   // the "$50k insight"
  diagnostic_call_cta: string // peer-to-peer call offer (not a sales pitch)
}
```

## `.specify/` Directory (Product Brain)
Contains the product strategy, experiment framework, and Ralph Loop validation docs:
- `memory/soul.md` — philosophical/brand core
- `memory/constitution.md` — product principles, tech stack, success metrics
- `memory/plan.md` — phased build-out plan
- `memory/experiment_framework.md` — V0.1 experiment & A/B testing strategy
- `memory/strategic_review_loop.md` — Ralph Loop executive critique sessions
- `memory/elite_startup_validation_loop.md` — YC/PLG validation
- `memory/scientific_funnel_architecture.md` — E2E funnel telemetry design
- `memory/game_theory_experiment_design.md` — data architecture for native telemetry
- `memory/executive_due_diligence_review.md` — stress-test, OMTM phasing, agility fixes
- `memory/startup_best_practices_review.md` — YC/a16z framework review
