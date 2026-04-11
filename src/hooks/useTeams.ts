import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useTeams = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCreateTeam = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      // Create team
      const { data: team, error } = await supabase
        .from('teams')
        .insert({ name, owner_id: user!.id })
        .select()
        .single();
      if (error) throw error;

      // Add owner as team member
      await supabase.from('team_members').insert({
        team_id: team.id,
        user_id: user!.id,
        role: 'owner',
      });

      return team;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });
};

export const useTeamMembers = (teamId: string | null) => {
  return useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      const { data: members, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId!);
      if (error) throw error;

      // Fetch profiles for each member
      const userIds = members.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      return members.map(m => ({
        ...m,
        profiles: profiles?.find(p => p.user_id === m.user_id) || null,
      }));
    },
    enabled: !!teamId,
  });
};

export const useTeamInvitations = (teamId: string | null) => {
  return useQuery({
    queryKey: ['team-invitations', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });
};

export const useInviteMember = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, email }: { teamId: string; email: string }) => {
      const { data, error } = await supabase
        .from('team_invitations')
        .insert({ team_id: teamId, email, invited_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', vars.teamId] });
    },
  });
};

export const useMyInvitations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*, teams(name)')
        .eq('status', 'pending');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useRespondToInvitation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invitationId, teamId, accept }: { invitationId: string; teamId: string; accept: boolean }) => {
      // Update invitation status
      const { error } = await supabase
        .from('team_invitations')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', invitationId);
      if (error) throw error;

      // If accepted, add as team member
      if (accept) {
        const { error: memberError } = await supabase
          .from('team_members')
          .insert({ team_id: teamId, user_id: user!.id, role: 'member' });
        if (memberError) throw memberError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, teamId }: { memberId: string; teamId: string }) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);
      if (error) throw error;
      return teamId;
    },
    onSuccess: (teamId) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
  });
};

export const useShareLeadWithTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, teamId }: { leadId: string; teamId: string | null }) => {
      const { error } = await supabase
        .from('leads')
        .update({ team_id: teamId })
        .eq('id', leadId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });
};
