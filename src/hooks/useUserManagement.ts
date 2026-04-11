import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserInvitations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useInviteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitation: { first_name: string; last_name: string; email: string; phone?: string }) => {
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: invitation,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-invitations'] }),
  });
};

export const useDeleteInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-invitations'] }),
  });
};

export const useAllProfiles = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useIsAdmin = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .eq('role', 'admin');
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user,
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['user-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
    },
  });
};

export const useAllUserRoles = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useManageRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user_id, role, action }: { user_id: string; role: string; action: 'set' | 'remove' }) => {
      const { data, error } = await supabase.functions.invoke('manage-role', {
        body: { user_id, role, action },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['is-admin'] });
    },
  });
};
