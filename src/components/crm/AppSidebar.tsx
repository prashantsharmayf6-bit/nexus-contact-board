import { LayoutDashboard, Users, Kanban, LogOut, UserCog, UserCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ezycrmLogo from '@/assets/ezycrm-logo.png';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/kanban', icon: Kanban, label: 'Kanban Board' },
  { to: '/users', icon: UserCog, label: 'User Management' },
];

const AppSidebar = () => {
  const { user, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const { data: profile } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const name = profile?.full_name || profile?.first_name || user?.user_metadata?.full_name || user?.email || '';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <img src={ezycrmLogo} alt="EzyCRM" className="h-9 w-9 object-contain flex-shrink-0" />
          {!collapsed && <span className="text-lg font-bold text-sidebar-foreground">EzyCRM</span>}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          {links.map(({ to, icon: Icon, label }) => (
            <SidebarMenuItem key={to}>
              <SidebarMenuButton asChild tooltip={label}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-gradient text-white'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    )
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className={cn("flex items-center gap-3 mb-2", collapsed && "justify-center")}>
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground">{name}</p>
            </div>
          )}
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="My Profile">
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full',
                    isActive
                      ? 'bg-brand-gradient text-white'
                      : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                  )
                }
              >
                <UserCircle className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>My Profile</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Sign out">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={signOut}
              >
                <LogOut className="w-4 h-4 mr-2 flex-shrink-0" />
                {!collapsed && <span>Sign out</span>}
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
