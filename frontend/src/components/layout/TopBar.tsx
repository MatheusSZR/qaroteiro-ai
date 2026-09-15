import { Search, Bell } from 'lucide-react';
import { UserMenu } from '../UserMenu';

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 gap-6 transition-colors">
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:flex items-center gap-2 w-56 px-3 py-1.5 text-sm text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <Search className="w-3.5 h-3.5" />
          <span className="flex-1 text-left">Buscar...</span>
          <kbd className="text-[10px] px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded font-mono">
            Ctrl K
          </kbd>
        </div>

        <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
          <Bell className="w-4 h-4" />
        </button>

        <UserMenu />
      </div>
    </header>
  );
}