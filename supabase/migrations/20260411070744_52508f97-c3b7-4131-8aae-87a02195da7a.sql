
DROP POLICY "Authenticated users can update invitations" ON public.user_invitations;
CREATE POLICY "Inviters can update invitations" ON public.user_invitations
  FOR UPDATE TO authenticated USING (auth.uid() = invited_by);
