
-- Add columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- Create user_invitations table
CREATE TABLE public.user_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all invitations
CREATE POLICY "Authenticated users can view invitations" ON public.user_invitations
  FOR SELECT TO authenticated USING (true);

-- Authenticated users can create invitations
CREATE POLICY "Authenticated users can create invitations" ON public.user_invitations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = invited_by);

-- Authenticated users can update invitations
CREATE POLICY "Authenticated users can update invitations" ON public.user_invitations
  FOR UPDATE TO authenticated USING (true);

-- Authenticated users can delete invitations
CREATE POLICY "Authenticated users can delete invitations" ON public.user_invitations
  FOR DELETE TO authenticated USING (auth.uid() = invited_by);

-- Update handle_new_user to populate first_name/last_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 2)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  -- Auto-accept any pending invitations for this user
  UPDATE public.user_invitations
  SET status = 'accepted'
  WHERE lower(email) = lower(NEW.email) AND status = 'pending';
  RETURN NEW;
END;
$function$;
