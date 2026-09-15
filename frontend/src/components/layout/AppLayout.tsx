import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </div>
    </div>
  );
}