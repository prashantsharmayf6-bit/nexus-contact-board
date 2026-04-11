
-- Replace the restrictive profile view policies with one that allows all authenticated users to view
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Team members can view teammate profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
