import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export const useLeadNotes = (leadId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['lead-notes', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!leadId && !!user,
  });

  useEffect(() => {
    if (!leadId || !user) return;
    const channel = supabase
      .channel(`notes-${leadId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_notes', filter: `lead_id=eq.${leadId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['lead-notes', leadId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [leadId, user, queryClient]);

  return query;
};

export const useAddNote = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, content }: { leadId: string; content: string }) => {
      const { data, error } = await supabase
        .from('lead_notes')
        .insert({ lead_id: leadId, user_id: user!.id, content })
        .select()
        .single();
      if (error) throw error;

      await supabase.from('lead_activities').insert({
        lead_id: leadId,
        user_id: user!.id,
        type: 'note',
        description: `Added a note: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
      });

      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['lead-notes', vars.leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead-activities', vars.leadId] });
    },
  });
};

export const useCallLogs = (leadId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['call-logs', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .eq('lead_id', leadId)
        .order('called_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!leadId && !!user,
  });
};

export const useAddCallLog = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: { leadId: string; direction: string; duration_minutes: number; outcome: string; notes: string }) => {
      const { data, error } = await supabase
        .from('call_logs')
        .insert({
          lead_id: log.leadId,
          user_id: user!.id,
          direction: log.direction,
          duration_minutes: log.duration_minutes,
          outcome: log.outcome,
          notes: log.notes,
        })
        .select()
        .single();
      if (error) throw error;

      await supabase.from('lead_activities').insert({
        lead_id: log.leadId,
        user_id: user!.id,
        type: 'call',
        description: `${log.direction === 'inbound' ? 'Received' : 'Made'} a call (${log.duration_minutes} min) — ${log.outcome}`,
      });

      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['call-logs', vars.leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead-activities', vars.leadId] });
    },
  });
};

export const useLeadActivities = (leadId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['lead-activities', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!leadId && !!user,
  });

  useEffect(() => {
    if (!leadId || !user) return;
    const channel = supabase
      .channel(`activities-${leadId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_activities', filter: `lead_id=eq.${leadId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [leadId, user, queryClient]);

  return query;
};

export const useLeadAttachments = (leadId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['lead-attachments', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_attachments')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!leadId && !!user,
  });
};

export const useAddAttachment = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, file }: { leadId: string; file: File }) => {
      const filePath = `${user!.id}/${leadId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(filePath);

      const { data, error } = await supabase
        .from('lead_attachments')
        .insert({
          lead_id: leadId,
          user_id: user!.id,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          file_type: file.type,
        })
        .select()
        .single();
      if (error) throw error;

      await supabase.from('lead_activities').insert({
        lead_id: leadId,
        user_id: user!.id,
        type: 'attachment',
        description: `Attached file "${file.name}"`,
      });

      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['lead-attachments', vars.leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead-activities', vars.leadId] });
    },
  });
};
