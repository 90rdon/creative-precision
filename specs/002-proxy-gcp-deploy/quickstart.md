# Quickstart: Secure Gemini Proxy Architecture

## Local Development (New Flow)

1. **Root .env**: 
   Ensure `GEMINI_API_KEY` is set in your root `.env` file. Do NOT prefix it with `VITE_`.
   ```text
   GEMINI_API_KEY=AIzaSy...
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   *Vite is now configured to proxy all `/api/*` requests to your local Node.js proxy (during development, we use a middleware or the Vite proxy config).*

3. **Verify Security**:
   Open browser DevTools -> Network tab. Send a message. You should see a request to `http://localhost:3000/api/chat`. No Google URLs or API keys should be visible.

## Deployment to GCP Cloud Run

1. **Build the Container**:
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/reflect-assessment
   ```

2. **Deploy**:
   ```bash
   gcloud run deploy reflect-assessment \
     --image gcr.io/YOUR_PROJECT_ID/reflect-assessment \
     --set-env-vars="GEMINI_API_KEY=AIzaSy..." \
     --platform managed
   ```

## Key Files
- `server/src/index.ts`: The proxy server and static asset server.
- `src/services/geminiService.ts`: Refactored to call `/api/chat`.
- `Dockerfile`: Multi-stage build for React + Node.
