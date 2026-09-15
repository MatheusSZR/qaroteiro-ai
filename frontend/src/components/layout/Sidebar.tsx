import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Sparkles, History, FileText, Settings, Zap } from 'lucide-react';

const items = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/novo',          icon: Sparkles,        label: 'Novo roteiro' },
  { to: '/historico',     icon: History,         label: 'Histórico' },
  { to: '/templates',     icon: FileText,        label: 'Templates' },
  { to: '/configuracoes', icon: Settings,        label: 'Configurações' },
];

export function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-colors">
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-200 dark:border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">QARoteiro</p>
          <p className="text-[10px] font-medium text-brand-600 dark:text-brand-400 tracking-wide">AI · BETA</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`
            }
          >
            <Icon className="w-4 h-4" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">QARoteiro AI</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">v0.1.0 · Groq</p>
        </div>
      </div>
    </aside>
  );
}