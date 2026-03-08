# Supabase Quick Start Guide

1. Create Supabase Project
   - Go to https://supabase.com
   - Click "New Project"
   - Name: nullclaw-memory
   - Wait for it to initialize (~2 min)

2. Run Schema
   - Copy contents of: `schema/supabase-migrations.sql`
   - Paste in Supabase SQL Editor
   - Click "Run" (or Ctrl+Enter)

3. Get Connection String
   - Dashboard → Settings → Database
   - Copy: `postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres`

4. Configure Atlas
   - Copy: `config/atlas-supabase.example.json`
   - Replace `YOUR-PROJECT-REF` and `YOUR-DB-PASSWORD`
   - Add to: `nullclaw_data/config.json`

5. Configure Vigil
   - On 19.0.0.134: edit `/data/pi/.nullclaw/config.json`
   - Add same database config from step 4

6. Test
   ```bash
   psql "postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres?sslmode=require"
   SELECT name FROM instances;
   ```

Done! Both Atlas & Vigil now share memory via Supabase.

---

## Full Documentation: SUPABASE_SETUP.md
