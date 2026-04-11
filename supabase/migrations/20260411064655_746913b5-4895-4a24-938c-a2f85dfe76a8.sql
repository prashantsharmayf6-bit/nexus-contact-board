
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Teams for collaboration
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is team member
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members WHERE user_id = _user_id AND team_id = _team_id
  );
$$;

CREATE POLICY "Team members can view team" ON public.teams
  FOR SELECT USING (public.is_team_member(auth.uid(), id));
CREATE POLICY "Anyone can create team" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update team" ON public.teams
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete team" ON public.teams
  FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Members can view team members" ON public.team_members
  FOR SELECT USING (public.is_team_member(auth.uid(), team_id));
CREATE POLICY "Team owner can manage members" ON public.team_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid())
    OR user_id = auth.uid()
  );
CREATE POLICY "Team owner can remove members" ON public.team_members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid())
    OR user_id = auth.uid()
  );

-- Leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','proposal','negotiation','won','lost')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual','website','referral','social','email','phone','other')),
  value NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leads or team leads" ON public.leads
  FOR SELECT USING (
    auth.uid() = user_id
    OR (team_id IS NOT NULL AND public.is_team_member(auth.uid(), team_id))
  );
CREATE POLICY "Users can create leads" ON public.leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own or team leads" ON public.leads
  FOR UPDATE USING (
    auth.uid() = user_id
    OR (team_id IS NOT NULL AND public.is_team_member(auth.uid(), team_id))
  );
CREATE POLICY "Users can delete own leads" ON public.leads
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lead notes
CREATE TABLE public.lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes for accessible leads" ON public.lead_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id
      AND (l.user_id = auth.uid() OR (l.team_id IS NOT NULL AND public.is_team_member(auth.uid(), l.team_id)))
    )
  );
CREATE POLICY "Users can add notes" ON public.lead_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.lead_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Call logs
CREATE TABLE public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound','outbound')),
  duration_minutes INTEGER DEFAULT 0,
  outcome TEXT,
  notes TEXT,
  called_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view call logs for accessible leads" ON public.call_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id
      AND (l.user_id = auth.uid() OR (l.team_id IS NOT NULL AND public.is_team_member(auth.uid(), l.team_id)))
    )
  );
CREATE POLICY "Users can add call logs" ON public.call_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activity timeline
CREATE TABLE public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('note','call','status_change','email','attachment','created')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities for accessible leads" ON public.lead_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id
      AND (l.user_id = auth.uid() OR (l.team_id IS NOT NULL AND public.is_team_member(auth.uid(), l.team_id)))
    )
  );
CREATE POLICY "Users can add activities" ON public.lead_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Attachments
CREATE TABLE public.lead_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments for accessible leads" ON public.lead_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id
      AND (l.user_id = auth.uid() OR (l.team_id IS NOT NULL AND public.is_team_member(auth.uid(), l.team_id)))
    )
  );
CREATE POLICY "Users can add attachments" ON public.lead_attachments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own attachments" ON public.lead_attachments
  FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false);

CREATE POLICY "Users can upload attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can view attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own attachments" ON storage.objects
  FOR DELETE USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_activities;
