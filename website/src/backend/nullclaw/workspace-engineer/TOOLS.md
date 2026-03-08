# TOOLS.md — Engineer Agent

## Available Tools

### File System
- Full read/write access to the Creative Precision project
- Key directories:
  - `src/` — React frontend source
  - `server/` — Node.js backend
  - `supabase/migrations/` — Database migrations
  - `specs/` — Feature specifications
  - `docs/` — Documentation

### Terminal / Shell
- `npm test` — Run the test suite (Vitest)
- `npm run lint` — Run the linter
- `npm run dev` — Start the dev server
- `npm run build` — Build for production
- `npx supabase db push` — Apply database migrations

### Git
- Commit with conventional commit messages
- Push to the current branch
- Create feature branches when needed

### Supabase
- Run migration scripts
- Query tables for debugging
