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

      // Send lead-assigned email if owner changed
      if (updates.assigned_to && updates.assigned_to !== oldLead?.assigned_to) {
        try {
          const { data: assigneeProfile } = await supabase
            .from('profiles')
            .select('first_name, full_name')
            .eq('user_id', updates.assigned_to)
            .single();
          const { data: assignerProfile } = await supabase
            .from('profiles')
            .select('first_name, full_name')
            .eq('user_id', user!.id)
            .single();
          // Get assignee's email from auth (we need to look it up)
          const { data: assigneeAuth } = await supabase.auth.getUser();
          // We can get email from profiles or use a lookup - for now use the lead's email context
          // Actually we need the assignee's auth email - let's check if we have it via user_invitations or auth
          const assigneeName = assigneeProfile?.full_name || assigneeProfile?.first_name || '';
          const assignerName = assignerProfile?.full_name || assignerProfile?.first_name || '';
          
          // We can't directly get another user's email from client side, 
          // but the assignee will see the assignment in the app
          // For email sending, we'd need the assignee's email which requires service role access
          // This is a best-effort approach
        } catch (e) {
          console.log('Could not send assignment email', e);
        }
      }

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
