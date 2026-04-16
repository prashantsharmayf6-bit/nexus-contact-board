
-- Fix SELECT policy to include assigned_to visibility
DROP POLICY IF EXISTS "Users can view own leads or team leads" ON public.leads;
CREATE POLICY "Users can view own leads or team leads or assigned leads"
ON public.leads FOR SELECT
USING (
  (auth.uid() = user_id)
  OR (assigned_to = auth.uid())
  OR ((team_id IS NOT NULL) AND is_team_member(auth.uid(), team_id))
);

-- Fix UPDATE policy to include assigned_to
DROP POLICY IF EXISTS "Users can update own or team leads" ON public.leads;
CREATE POLICY "Users can update own or team leads or assigned leads"
ON public.leads FOR UPDATE
USING (
  (auth.uid() = user_id)
  OR (assigned_to = auth.uid())
  OR ((team_id IS NOT NULL) AND is_team_member(auth.uid(), team_id))
);

-- Allow anonymous inserts for public form submissions
CREATE POLICY "Anonymous can submit leads via public form"
ON public.leads FOR INSERT TO anon
WITH CHECK (true);
