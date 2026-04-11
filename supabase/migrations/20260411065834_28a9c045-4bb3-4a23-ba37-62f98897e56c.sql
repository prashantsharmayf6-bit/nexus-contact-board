
-- Fix: Allow team owners to see their teams (needed for INSERT...RETURNING)
CREATE POLICY "Owner can view own team" ON public.teams
  FOR SELECT USING (auth.uid() = owner_id);

-- Fix: Drop policies that reference auth.users directly (causes permission denied)
DROP POLICY IF EXISTS "Users can view their own invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Users can update their own invitations" ON public.team_invitations;

-- Recreate using auth.email() which is accessible
CREATE POLICY "Users can view their own invitations" ON public.team_invitations
  FOR SELECT USING (lower(email) = lower(auth.email()));

CREATE POLICY "Users can update their own invitations" ON public.team_invitations
  FOR UPDATE USING (lower(email) = lower(auth.email()));
