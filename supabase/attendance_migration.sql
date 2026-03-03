-- ============================================================
-- StudyJam: Full Database Fix — Run ALL of this in Supabase SQL Editor
-- ============================================================

-- 1. Create attendance status enum (if not existing)
DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'no_class');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Create attendance table (if not existing)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL DEFAULT 'absent',
    marked_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Attendance RLS
DROP POLICY IF EXISTS "Allow select on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow insert on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow update on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow delete on attendance" ON public.attendance;
CREATE POLICY "Allow select on attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Allow insert on attendance" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on attendance" ON public.attendance FOR UPDATE USING (true);
CREATE POLICY "Allow delete on attendance" ON public.attendance FOR DELETE USING (true);

-- 3. Badges table RLS fix
DROP POLICY IF EXISTS "Allow insert on badges" ON public.badges;
DROP POLICY IF EXISTS "Allow update on badges" ON public.badges;
DROP POLICY IF EXISTS "Allow delete on badges" ON public.badges;
DROP POLICY IF EXISTS "Allow select on badges" ON public.badges;
CREATE POLICY "Allow select on badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Allow insert on badges" ON public.badges FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on badges" ON public.badges FOR UPDATE USING (true);
CREATE POLICY "Allow delete on badges" ON public.badges FOR DELETE USING (true);

-- 4. User badges table RLS fix
DROP POLICY IF EXISTS "Allow insert on user_badges" ON public.user_badges;
DROP POLICY IF EXISTS "Allow delete on user_badges" ON public.user_badges;
DROP POLICY IF EXISTS "Allow select on user_badges" ON public.user_badges;
CREATE POLICY "Allow select on user_badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Allow insert on user_badges" ON public.user_badges FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete on user_badges" ON public.user_badges FOR DELETE USING (true);

-- 5. Teams table RLS fix
DROP POLICY IF EXISTS "Allow insert on teams" ON public.teams;
DROP POLICY IF EXISTS "Allow update on teams" ON public.teams;
DROP POLICY IF EXISTS "Allow delete on teams" ON public.teams;
CREATE POLICY "Allow insert on teams" ON public.teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on teams" ON public.teams FOR UPDATE USING (true);
CREATE POLICY "Allow delete on teams" ON public.teams FOR DELETE USING (true);

-- 6. Add streak and highlight columns (safe if already exists)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS weekly_highlight TEXT;
