import { useEffect, useState } from 'react';
import { TopBar } from '../components/layout/TopBar';
import api from '../services/api';
import { History, FileText, Trash2, ArrowRight, Loader2, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HistoricoItem {
  id: number;
  identificacao_alm: string;
  nome_historia: string;
  criado_em: string;
  quantidade_cts: number;
  score: number;
}

function scoreBadge(score: number) {
  if (score >= 80) return { cor: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 ring-emerald-200 dark:ring-emerald-500/30', icone: ShieldCheck };
  if (score >= 50) return { cor: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 ring-amber-200 dark:ring-amber-500/30', icone: ShieldAlert };
  return { cor: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 ring-red-200 dark:ring-red-500/30', icone: ShieldX };
}

function formatarData(iso: string) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function Historico() {
  const [itens, setItens] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState<number | null>(null);
  const navigate = useNavigate();

  const carregar = () => {
    setLoading(true);
    setErro(null);
    api.get<HistoricoItem[]>('/api/v1/historico')
      .then((r) => setItens(r.data))
      .catch(() => setErro('Erro ao carregar o histórico.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar();
  }, []);

  const excluir = async (id: number) => {
    if (!confirm('Excluir este roteiro?')) return;
    setExcluindo(id);
    try {
      await api.delete(`/api/v1/historico/${id}`);
      setItens((prev) => prev.filter((i) => i.id !== id));
    } catch {
      alert('Erro ao excluir.');
    } finally {
      setExcluindo(null);
    }
  };

  const abrir = (id: number) => {
    navigate(`/historico/${id}`);
  };

  return (
    <>
      <TopBar title="Histórico" subtitle="Roteiros gerados anteriormente" />

      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {itens.length} {itens.length === 1 ? 'roteiro' : 'roteiros'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Histórico de análises e roteiros de teste
              </p>
            </div>
            <button
              onClick={carregar}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
            >
              Atualizar
            </button>
          </div>

          {erro && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl mb-6">
              <p className="text-sm text-red-700 dark:text-red-400">{erro}</p>
            </div>
          )}

          {loading && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-16 text-center">
              <Loader2 className="w-6 h-6 text-brand-600 mx-auto animate-spin mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Carregando histórico...</p>
            </div>
          )}

          {!loading && !erro && itens.length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-16 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center mb-4">
                <History className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Nenhum roteiro gerado ainda</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
                Assim que você gerar um roteiro, ele aparecerá aqui.
              </p>
              <button
                onClick={() => navigate('/novo')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition"
              >
                Criar novo roteiro
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {!loading && itens.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {itens.map((item) => {
                  const { cor, icone: Icone } = scoreBadge(item.score);
                  return (
                    <div
                      key={item.id}
                      className="group flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                      onClick={() => abrir(item.id)}
                    >
                      <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {item.nome_historia || item.identificacao_alm || '(sem nome)'}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span>{formatarData(item.criado_em)}</span>
                          <span>·</span>
                          <span>{item.quantidade_cts} {item.quantidade_cts === 1 ? 'CT' : 'CTs'}</span>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ring-1 ${cor}`}>
                        <Icone className="w-3 h-3" />
                        {item.score}%
                      </span>

                      <button
                        onClick={(e) => { e.stopPropagation(); excluir(item.id); }}
                        disabled={excluindo === item.id}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition opacity-0 group-hover:opacity-100"
                        title="Excluir"
                      >
                        {excluindo === item.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}