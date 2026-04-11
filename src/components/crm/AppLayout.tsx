import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import NotificationBell from './NotificationBell';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

const AppLayout = () => (
  <SidebarProvider>
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-4 py-3 flex items-center justify-between">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <NotificationBell />
        </header>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  </SidebarProvider>
);

export default AppLayout;
