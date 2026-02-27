# Reflect Assessment - Developer & Operations Guide

Welcome! This guide outlines how to run, monitor, and iteratively improve the Reflect AI Assessment built with React, Vite, and Google Cloud Gemini API. 

## 1. Running the System Locally

To test new prompts, interface tweaks, or run debugging sessions:

1. **Install Dependencies**:
```bash
npm install
```

2. **Environment Configuration**:
   Ensure you have a `.env` file at the root. You will need:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

3. **Start the Development Server**:
```bash
npm run dev
```
   The local server will typically spin up at `http://localhost:5173`. 
   
4. **Running Tests**:
   The application holds 100% test passing accuracy with extensive coverage. To ensure your changes do not regress logic:
```bash
npm run test
npm run test:coverage  # Generates detailed coverage output
```

---

## 2. Configuring the AI (Dumb Frontend, Smart Prompt Architecture)

We utilize the "Dumb Frontend, Smart Prompt" architecture. All deep decision-logic remains within the LLM prompt instructions rather than hard-coded JavaScript.

To tune the conversational flow or the output format of the assessment based on user feedback:
1. Open `src/constants.ts` and modify `DEFAULT_CONFIG`.
2. **System Setup (`systemSetup`)**: This dictates how the Gemini model routes the conversation. Adjust the personality, the specific questions asked, and the cadence by editing this block.
3. **Assessment Prompt (`assessmentPrompt`)**: Adjust this to dictate how the final JSON schema is outputted. *Always ensure this returns structured JSON* so that `Results.tsx` can correctly parse `synthesis`, `bottleneck_diagnosis`, `boardroom_insight`, and `diagnostic_call_cta`.

*Why do we do this?* If users report that the conversation feels "too generic," simply refine the `systemSetup` prompt directly without needing a massive codebase refactor.

---

## 3. Monitoring Events & Telemetry (Supabase)

To understand user drop-offs, engagement depth, and which outputs lead to booked calls, the system automatically logs events to Supabase. This logic exists in `src/services/telemetryService.ts`.

### Traced Events
- **Session Started**: Automatically tracked (`utm_*` parameters are captured for attribution).
- **`message_sent`**: Fired every time the user sends a message. Tracks `message_count`.
- **`assessment_complete`**: Fired when the AI detects a close signal phrase. Captures `duration_seconds`.
- **`lifeline_clicked`**: Captures converting clicks on the Results screen (e.g., booking a diagnostic call via Cal.com or opening a generic email).
- **`share_clicked`**: When the user copies the results to share internally.
- **`pdf_downloaded`**: When the user requests the conversation transcript.

### Analyzing the Data to Improve the System
- **High Drop-off Mid-Conversation?** If `completion_status` frequently shows as `abandoned` around message 2 or 3, the AI might be asking overly-complex questions. Tweak the `systemSetup` prompt to be more conversational.
- **Low Calendar Bookings?** If `assessment_complete` happens often but `lifeline_clicked` is low, investigate `Results.tsx` logic or tweak `diagnostic_call_cta` in the assessment prompt to make the call-to-action more compelling based on their specific friction points.

---

## 4. Architecture: Voice & Speech Components

The web audio interface (`ChatInterface.tsx`) manages complex interactions by offloading heavy logic to custom React hooks located in `src/hooks/`:
- **`useSpeechRecognition.ts`**: Safely wraps the native `window.SpeechRecognition` and `webkitSpeechRecognition` APIs to handle silence detection intervals.
- **`useTextToSpeech.ts`**: Manages converting model outputs via `generateSpeech` into `AudioBuffer` queues mapped onto custom `AudioContext` contexts. Handles streaming text cleanly.
- **`useAudioVisualizer.ts`**: Tracks the user mic input through `AnalyserNode` frequency bin counts and generates organic canvas blobs via `requestAnimationFrame`.

If iterating on voice visualization or Speech-To-Text speed, isolate development to these custom hooks for safer testing iteration.
