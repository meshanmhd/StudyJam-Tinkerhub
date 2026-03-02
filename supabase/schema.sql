-- Create Enum for xp_logs category
CREATE TYPE xp_category AS ENUM ('task', 'attendance', 'presentation', 'help', 'other');

-- Create teams table first (needed for foreign keys)
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  team_xp INT NOT NULL DEFAULT 0,
  weekly_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create users table (extends auth.users implicitly, but we store our custom data here)
CREATE TABLE public.users (
  id UUID PRIMARY KEY, -- Will references auth.users(id) once auth is used
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  individual_xp INT NOT NULL DEFAULT 0,
  streak_days INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  xp_reward INT NOT NULL,
  deadline TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create task_submissions table
CREATE TABLE public.task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  xp_given INT
);

-- Create badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  type TEXT NOT NULL DEFAULT 'permanent' CHECK (type IN ('weekly', 'permanent'))
);

-- Create user_badges table
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create xp_logs table
CREATE TABLE public.xp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  category xp_category NOT NULL,
  xp_value INT NOT NULL,
  reason TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure either user_id or team_id exists
ALTER TABLE public.xp_logs ADD CONSTRAINT chk_xp_log_target CHECK (user_id IS NOT NULL OR team_id IS NOT NULL);

-- View for final scores
CREATE OR REPLACE VIEW public.user_scores AS
SELECT 
  u.id as user_id,
  u.name,
  u.role,
  u.team_id,
  t.team_name,
  u.individual_xp,
  COALESCE(t.team_xp, 0) as team_xp,
  (0.6 * COALESCE(t.team_xp, 0)) + (0.4 * u.individual_xp) as final_score
FROM public.users u
LEFT JOIN public.teams t ON u.team_id = t.id;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;

-- Creating a trigger to update individual_xp when xp_log is inserted for a user
CREATE OR REPLACE FUNCTION update_user_individual_xp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    UPDATE public.users SET individual_xp = individual_xp + NEW.xp_value WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_xp
AFTER INSERT ON public.xp_logs
FOR EACH ROW
EXECUTE FUNCTION update_user_individual_xp();

-- Creating a trigger to update team_xp when xp_log is inserted for a team
CREATE OR REPLACE FUNCTION update_team_xp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.team_id IS NOT NULL THEN
    UPDATE public.teams SET team_xp = team_xp + NEW.xp_value WHERE id = NEW.team_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_team_xp
AFTER INSERT ON public.xp_logs
FOR EACH ROW
EXECUTE FUNCTION update_team_xp();

-- Basic RLS Policies (For now, just allowing read access to authenticated users)
-- In production, these should be more granular
CREATE POLICY "Enable read access for all users" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.xp_logs FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.tasks FOR SELECT USING (true);

