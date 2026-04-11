import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export interface Lead {
  id: string;
  user_id: string;
  team_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  status: string;
  source: string | null;
  value: number | null;
  notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export const useLeads = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!user,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('leads-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return query;
};

export const useCreateLead = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: Omit<Lead, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('leads')
        .insert({ ...lead, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;

      // Create activity
      await supabase.from('lead_activities').insert({
        lead_id: data.id,
        user_id: user!.id,
        type: 'created',
        description: `Lead "${data.name}" was created`,
      });

      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });
};

export const useUpdateLead = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      // Get old lead for status change tracking
      const { data: oldLead } = await supabase.from('leads').select('status, name, assigned_to').eq('id', id).single();

      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // Track status change
      if (oldLead && updates.status && oldLead.status !== updates.status) {
        await supabase.from('lead_activities').insert({
          lead_id: id,
          user_id: user!.id,
          type: 'status_change',
          description: `Status changed from "${oldLead.status}" to "${updates.status}"`,
          metadata: { from: oldLead.status, to: updates.status },
        });
      }

      // Note: Lead assignment/sharing emails require looking up other users' emails,
      // which needs service role access. These notifications will be sent
      // via the send-transactional-email edge function when the backend
      // has access to recipient email addresses.

      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });
};
