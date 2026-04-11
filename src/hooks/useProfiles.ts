import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useAllProfilesMap = () => {
  const { user } = useAuth();

  const query = useQuery({
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

  // Build a map of user_id -> profile for quick lookup
  const profilesMap = new Map<string, any>();
  if (query.data) {
    for (const p of query.data) {
      profilesMap.set(p.user_id, p);
    }
  }

  return { ...query, profilesMap };
};
