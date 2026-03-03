-- Fix for Team Manager: Allow administrators to update user rows (specifically team_id)
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

DROP POLICY IF EXISTS "Allow admins to update users" ON public.users;
CREATE POLICY "Allow admins to update users" ON public.users
FOR UPDATE USING (is_admin());

-- Fix for Registration: Allow authenticated users to insert their own row
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.users;
CREATE POLICY "Allow users to insert own profile" ON public.users
FOR INSERT WITH CHECK (auth.uid() = id);

-- Fix for XP/Tasks: Allow authenticated users to insert xp_logs and task_submissions
DROP POLICY IF EXISTS "Allow insert on xp_logs" ON public.xp_logs;
CREATE POLICY "Allow insert on xp_logs" ON public.xp_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert on task_submissions" ON public.task_submissions;
CREATE POLICY "Allow insert on task_submissions" ON public.task_submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert on tasks" ON public.tasks;
CREATE POLICY "Allow insert on tasks" ON public.tasks FOR INSERT WITH CHECK (true);

-- Allow admins to update task_submissions (for approving/rejecting)
DROP POLICY IF EXISTS "Allow admins to update task_submissions" ON public.task_submissions;
CREATE POLICY "Allow admins to update task_submissions" ON public.task_submissions FOR UPDATE USING (is_admin());

-- Allow admins to update teams
DROP POLICY IF EXISTS "Allow admins to update teams" ON public.teams;
CREATE POLICY "Allow admins to update teams" ON public.teams FOR UPDATE USING (is_admin());

-- Allow admins to delete teams
DROP POLICY IF EXISTS "Allow admins to delete teams" ON public.teams;
CREATE POLICY "Allow admins to delete teams" ON public.teams FOR DELETE USING (is_admin());
