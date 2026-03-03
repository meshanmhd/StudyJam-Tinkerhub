-- Run this in the Supabase SQL Editor
-- Adds last_activity_date and streak_state to the users table

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_activity_date DATE,
  ADD COLUMN IF NOT EXISTS streak_state TEXT NOT NULL DEFAULT 'active'
    CHECK (streak_state IN ('active', 'frozen', 'reset'));
