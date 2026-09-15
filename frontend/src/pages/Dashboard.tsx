import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import api from '../services/api';
import { Sparkles, FileText, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

interface Estatisticas {
  total_roteiros: number;
  total_cts: number;
  total_hus: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<Estatisticas>({
    total_roteiros: 0,
    total_cts: 0,
    total_hus: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Estatisticas>('/api/v1/estatisticas')
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: 'Roteiros gerados',
      value: loading ? '—' : String(stats.total_roteiros),
      icon: FileText,
      color: 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10',
    },
    {
      label: 'Casos de teste',
      value: loading ? '—' : String(stats.total_cts),
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      label: 'HUs analisadas',
      value: loading ? '—' : String(stats.total_hus),
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10',
    },
  ];

  return (
    <>
      <TopBar title="Dashboard" subtitle="Visão geral dos seus roteiros de teste" />

      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 p-8 text-white shadow-lg shadow-brand-600/20">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-medium mb-4">
                <Sparkles className="w-3 h-3" />
                IA na nuvem · Groq
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Transforme HUs em roteiros de teste profissionais
              </h2>
              <p className="text-brand-100 text-sm mb-6">
                Cole sua História de Usuário e gere automaticamente casos de teste nos formatos Jira Wiki Markup e DokuWiki, com cobertura total e validação automática.
              </p>
              <Link
                to="/novo"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 font-medium text-sm rounded-lg hover:bg-brand-50 transition shadow-sm"
              >
                Gerar novo roteiro
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -right-8 -bottom-20 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cards.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-brand-300 dark:hover:border-brand-500/40 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Ações rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/novo"
                className="group flex items-start gap-4 p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500/40 hover:shadow-sm transition"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center shrink-0 group-hover:bg-brand-100 dark:group-hover:bg-brand-500/20 transition">
                  <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Novo roteiro</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Cole uma HU e gere o roteiro completo
                  </p>
                </div>
              </Link>

              <Link
                to="/historico"
                className="group flex items-start gap-4 p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500/40 hover:shadow-sm transition"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition">
                  <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Histórico</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Consulte roteiros gerados anteriormente
                  </p>
                </div>
              </Link>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}