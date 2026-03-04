-- ─── Games Migration ────────────────────────────────────────────────────────
-- Run this in the Supabase SQL Editor

-- 1. Add 'game' to xp_category enum
ALTER TYPE xp_category ADD VALUE IF NOT EXISTS 'game';

-- 2. games table
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  game_type TEXT NOT NULL DEFAULT 'wordle',
  target_word TEXT NOT NULL,          -- stored UPPERCASE
  word_list TEXT[] NOT NULL DEFAULT '{}',  -- allowed guesses, UPPERCASE
  deadline TIMESTAMPTZ,
  result_released BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. game_submissions table
CREATE TABLE IF NOT EXISTS public.game_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  solved BOOLEAN NOT NULL DEFAULT FALSE,
  guesses TEXT[] NOT NULL DEFAULT '{}',
  num_guesses INT NOT NULL,
  time_taken_seconds INT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- 4. RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read games"
  ON public.games FOR SELECT USING (true);
CREATE POLICY "Admins can insert games"
  ON public.games FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update games"
  ON public.games FOR UPDATE USING (true);
CREATE POLICY "Admins can delete games"
  ON public.games FOR DELETE USING (true);

CREATE POLICY "Anyone can read game submissions"
  ON public.game_submissions FOR SELECT USING (true);
CREATE POLICY "Students can insert own submission"
  ON public.game_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Scheduled cleanup via pg_cron (runs every hour)
--    Deletes games whose deadline passed more than 24 hours ago.
--    XP logs are unaffected (no FK to games table).
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-expired-games',
  '0 * * * *',
  $$DELETE FROM public.games WHERE deadline IS NOT NULL AND deadline < NOW() - INTERVAL '24 hours'$$
);
