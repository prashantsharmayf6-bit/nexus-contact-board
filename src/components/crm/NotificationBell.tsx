import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface ActivityNotification {
  id: string;
  type: string;
  description: string;
  created_at: string;
  lead_id: string;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityNotification[]>([]);
  const [open, setOpen] = useState(false);

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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
          {activities.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
              {activities.length > 9 ? '9+' : activities.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
        </div>
        <ScrollArea className="max-h-96">
          {activities.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-border">
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
