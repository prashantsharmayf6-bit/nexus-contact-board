import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import NotificationBell from './NotificationBell';

const AppLayout = () => (
  <div className="flex min-h-screen">
    <AppSidebar />
    <div className="flex-1 flex flex-col overflow-auto">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-8 py-3 flex justify-end items-center">
        <NotificationBell />
      </header>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AppLayout;
