import { useEffect, useState } from 'react';
import { TopBar } from '../components/layout/TopBar';
import api from '../services/api';
import { Loader2, Check, AlertTriangle, Cpu, Sliders, Zap, User } from 'lucide-react';

interface Configuracao {
  modelo: string;
  temperatura: number;
  max_tokens: number;
}

interface Perfil {
  nome: string;
  email: string;
  cargo: string;
}

const MODELOS = [
  { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B — mais capaz (padrão)' },
  { id: 'openai/gpt-oss-20b',  label: 'GPT-OSS 20B — mais rápido' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B — o mais rápido' },
];

const PERFIL_PADRAO: Perfil = { nome: 'MR', email: '', cargo: 'QA Analyst' };

export function Configuracoes() {
  const [config, setConfig] = useState<Configuracao | null>(null);
  const [perfil, setPerfil] = useState<Perfil>(() => {
    const salvo = localStorage.getItem('qaroteiro-perfil');
    if (salvo) {
      try { return JSON.parse(salvo); } catch {}
    }
    return PERFIL_PADRAO;
  });
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvoOk, setSalvoOk] = useState(false);
  const [salvoPerfil, setSalvoPerfil] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api.get<Configuracao>('/api/v1/configuracoes')
      .then((r) => setConfig(r.data))
      .catch(() => setErro('Erro ao carregar configurações.'))
      .finally(() => setLoading(false));
  }, []);

  const atualizar = <K extends keyof Configuracao>(campo: K, valor: Configuracao[K]) => {
    setConfig((prev) => (prev ? { ...prev, [campo]: valor } : prev));
    setSalvoOk(false);
  };

  const salvar = async () => {
    if (!config) return;
    setSalvando(true);
    setErro(null);
    try {
      const r = await api.put<Configuracao>('/api/v1/configuracoes', config);
      setConfig(r.data);
      setSalvoOk(true);
      setTimeout(() => setSalvoOk(false), 2500);
    } catch {
      setErro('Erro ao salvar configurações.');
    } finally {
      setSalvando(false);
    }
  };

  const salvarPerfil = () => {
    localStorage.setItem('qaroteiro-perfil', JSON.stringify(perfil));
    setSalvoPerfil(true);
    setTimeout(() => setSalvoPerfil(false), 2500);
    // Força o UserMenu a recarregar
    window.dispatchEvent(new Event('storage'));
  };

  const inputCls = "w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 transition";

  if (loading) {
    return (
      <>
        <TopBar title="Configurações" subtitle="Preferências do sistema" />
        <main className="flex-1 overflow-auto p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title="Configurações" subtitle="Preferências do sistema" />

      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto space-y-4">

          {erro && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{erro}</p>
            </div>
          )}

          {/* ─── Perfil do Usuário ─── */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 transition-colors">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Perfil do Usuário</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Informações exibidas no seu avatar.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Nome</label>
                <input
                  type="text"
                  className={inputCls}
                  value={perfil.nome}
                  onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
                  placeholder="Ex: Matheus Rodrigues"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">E-mail</label>
                <input
                  type="email"
                  className={inputCls}
                  value={perfil.email}
                  onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                  placeholder="Ex: matheus@empresa.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Cargo</label>
                <input
                  type="text"
                  className={inputCls}
                  value={perfil.cargo}
                  onChange={(e) => setPerfil({ ...perfil, cargo: e.target.value })}
                  placeholder="Ex: QA Analyst"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4">
              {salvoPerfil && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5" /> Salvo
                </span>
              )}
              <button
                onClick={salvarPerfil}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition shadow-sm"
              >
                <Check className="w-4 h-4" />
                Salvar perfil
              </button>
            </div>
          </div>

          {/* ─── Modelo de IA ─── */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 transition-colors">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Modelo de IA</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Modelo da Groq usado para interpretar as HUs.
                </p>
              </div>
            </div>
            <select
              className={inputCls}
              value={config?.modelo || ''}
              onChange={(e) => atualizar('modelo', e.target.value)}
            >
              {MODELOS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* ─── Temperatura ─── */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 transition-colors">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Temperatura</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Quanto menor, mais determinística. Ideal para QA: 0.0 a 0.3.
                </p>
              </div>
              <span className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-200 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                {(config?.temperatura ?? 0).toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={config?.temperatura ?? 0}
              onChange={(e) => atualizar('temperatura', parseFloat(e.target.value))}
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              <span>0.0 (determinístico)</span>
              <span>1.0 (criativo)</span>
            </div>
          </div>

          {/* ─── Max tokens ─── */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 transition-colors">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Max tokens</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tamanho máximo da resposta. Recomendado: 8000.
                </p>
              </div>
            </div>
            <input
              type="number"
              min={500}
              max={32000}
              step={500}
              className={inputCls}
              value={config?.max_tokens ?? 8000}
              onChange={(e) => atualizar('max_tokens', parseInt(e.target.value || '0'))}
            />
          </div>

          {/* ─── Botão salvar IA ─── */}
          <div className="flex items-center justify-end gap-3">
            {salvoOk && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" /> Salvo
              </span>
            )}
            <button
              onClick={salvar}
              disabled={salvando}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition shadow-sm"
            >
              {salvando ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : (
                'Salvar configurações da IA'
              )}
            </button>
          </div>

          {/* ─── Sobre ─── */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 transition-colors">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Sobre</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              QARoteiro AI · v0.1.0 · FastAPI + React + Groq
            </p>
          </div>

        </div>
      </main>
    </>
  );
}