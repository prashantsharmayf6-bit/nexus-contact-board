import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useMyInvitations, useRespondToInvitation } from '@/hooks/useTeams';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ActivityNotification {
  id: string;
  type: string;
  description: string;
  created_at: string;
  lead_id: string;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const { data: invitations = [] } = useMyInvitations();
  const respondToInvitation = useRespondToInvitation();
  const queryClient = useQueryClient();
  const [activities, setActivities] = useState<ActivityNotification[]>([]);
  const [open, setOpen] = useState(false);

  // Fetch recent activities
  useEffect(() => {
    if (!user) return;

    const fetchActivities = async () => {
      const { data } = await supabase
        .from('lead_activities')
        .select('id, type, description, created_at, lead_id')
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setActivities(data);
    };

    fetchActivities();

    // Real-time subscription for new activities
    const channel = supabase
      .channel('notifications-activities')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lead_activities' },
        (payload) => {
          setActivities(prev => [payload.new as ActivityNotification, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    // Real-time subscription for new invitations
    const invChannel = supabase
      .channel('notifications-invitations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_invitations' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['my-invitations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(invChannel);
    };
  }, [user, queryClient]);

  const pendingInvitations = invitations.filter((i: any) => i.status === 'pending');
  const totalCount = pendingInvitations.length + activities.length;

  const handleRespond = (invitationId: string, teamId: string, accept: boolean) => {
    respondToInvitation.mutate({ invitationId, teamId, accept });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'status_change': return '🔄';
      case 'note_added': return '📝';
      case 'call_logged': return '📞';
      case 'attachment_added': return '📎';
      case 'lead_created': return '✨';
      default: return '📌';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
              {totalCount > 9 ? '9+' : totalCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
        </div>
        <ScrollArea className="max-h-96">
          {pendingInvitations.length === 0 && activities.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {pendingInvitations.map((inv: any) => (
                <div key={inv.id} className="p-3 bg-primary/5">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">👥</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Team Invitation</p>
                      <p className="text-xs text-muted-foreground">
                        You've been invited to join <span className="font-medium text-foreground">{inv.teams?.name}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(inv.created_at), { addSuffix: true })}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 text-xs"
                          onClick={() => handleRespond(inv.id, inv.team_id, true)}
                          disabled={respondToInvitation.isPending}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleRespond(inv.id, inv.team_id, false)}
                          disabled={respondToInvitation.isPending}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {activities.map((activity) => (
                <div key={activity.id} className="p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{getActivityIcon(activity.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
