import { TopBar } from '../components/layout/TopBar';
import { FileText } from 'lucide-react';

export function Templates() {
  return (
    <>
      <TopBar title="Templates" subtitle="Modelos reutilizáveis de roteiro" />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-16 text-center transition-colors">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
              <FileText className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Em breve</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Salve e reutilize templates de roteiro para diferentes tipos de teste.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}