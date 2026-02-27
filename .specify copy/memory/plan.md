# Project Plan: AI Assessment Build Out

## Phase 1: Foundation & Identity
- [x] Create Project Constitution
- [ ] Refine System Instruction for AI "Thought Partner"
- [ ] Update Initial Greeting to match v2 vision

## Phase 2: V0.1 Launch & The Rapid Iteration Loop
1. **"Dumb Frontend, Smart Prompt" Architecture**: Implement the `ChatInterface` as a light pass-through. The complex conversational logic (Ambition -> Reality -> Friction) MUST be handled entirely within the Gemini `systemInstruction` to allow instant iteration without code deploys.
2. **Implement V0.1 Experiment Telemetry**: Ensure the UI and backend can silently track (without farming data) the core behavioral signals defined in `experiment_framework.md` (UTM tags, drop-off points, dwell time, 'Share' clicks, 'Lifeline' pulls).
3. **Decoupled Results & The Defined Offer**: Refine the `Results` component to output "Unhinged Value" (a heavily strategic, shareable diagnosis with zero pitch). Present the V0.1 Lifeline explicitly as an optional **Diagnostic Synthesis Call** (high-touch, unscalable validation).
4. **Initiate the "Ralph Loop" Cadence**: Launch V0.1. Begin weekly sprints to gather behavioral data, analyze via the executive persona lens, and deploy prompt/UI tweaks to maximize the "Talk Trigger" effect.

## Phase 3: Results & Closure
- [ ] Enhance JSON output schema in `geminiService.ts` for more detailed findings.
- [ ] Update `Results.tsx` to clearly separate "What I'm Hearing," "Pattern," and "Question to Sit With."
- [ ] Implement "Download Results" for State 2 conversion.

## Phase 4: Polish & Performance
- [ ] Fine-tune voice output timing and organic visualizer.
- [ ] Verify accessibility and mobile responsiveness.
- [ ] Optimize Gemini prompt to stay within token limits while maintaining "Executive" tone.
