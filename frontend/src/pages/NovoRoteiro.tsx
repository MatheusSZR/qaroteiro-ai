import { useEffect, useRef, useState } from 'react';
import { TopBar } from '../components/layout/TopBar';
import api from '../services/api';
import { Sparkles, Copy, Download, Check, AlertTriangle, Loader2, ShieldCheck, ShieldAlert, ShieldX, Trash2, Plus, Save, Settings2, RotateCw } from 'lucide-react';

interface CasoTeste {
  id: string;
  fluxo: string;
  titulo: string;
  passos: string[];
  resultado_esperado: string[];
  origem: string;
}

interface AnaliseHU {
  identificacao_alm: string;
  nome_historia: string;
  link_hu: string;
  link_sistema: string;
  objetivo: string;
  pre_condicao: string;
  cenarios_hu: string[];
  prototipos: string;
  tabelas: string;
  mensagens: string;
  regras_negocio: string;
  casos_teste: CasoTeste[];
}

interface ValidacaoItem {
  ct_id?: string;
  ct_ids?: string[];
  tipo: string;
  mensagem: string;
  valor?: string;
}

interface Cobertura {
  cenarios_cobertos: string[];
  cenarios_faltando: string[];
  regras_hu: string[];
  regras_faltando: string[];
}

interface Validacao {
  score: number;
  erros: ValidacaoItem[];
  avisos: ValidacaoItem[];
  cobertura: Cobertura;
  total_erros: number;
  total_avisos: number;
}

interface AnalyzeResponse {
  analise: AnaliseHU;
  quantidade_palavras: number;
  jira_wiki: string;
  dokuwiki: string;
  validacao?: Validacao;
  erro?: string;
}

interface MetaEditavel {
  usuario_senha: string;
  tipo_demanda: string;
  tipo_teste: string;
}

type Aba = 'analise' | 'configurar' | 'jira' | 'dokuwiki' | 'validacao';

const HU_VAZIA: AnaliseHU = {
  identificacao_alm: '', nome_historia: '', link_hu: '', link_sistema: '',
  objetivo: 'N/A', pre_condicao: 'N/A', cenarios_hu: [],
  prototipos: 'N/A', tabelas: 'N/A', mensagens: 'N/A',
  regras_negocio: 'N/A', casos_teste: [],
};

const META_VAZIA: MetaEditavel = {
  usuario_senha: '(a preencher)',
  tipo_demanda: 'Nova funcionalidade',
  tipo_teste: 'Funcional',
};

const TIPOS_TESTE = [
  'Funcional',
  'Integração',
  'Performance',
  'Aceitação',
  'Usabilidade',
  'Segurança',
  'Outros',
];

const inputCls = "w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 transition";

/* ── Field FORA do componente pra não remontar a cada tecla ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function NovoRoteiro() {
  const [hu, setHu] = useState('');
  const [resposta, setResposta] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [aba, setAba] = useState<Aba>('analise');
  const [copiado, setCopiado] = useState(false);
  const [editavel, setEditavel] = useState<AnaliseHU | null>(null);
  const [meta, setMeta] = useState<MetaEditavel>(META_VAZIA);
  const [sujo, setSujo] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (resposta && !resposta.erro) {
      setEditavel(JSON.parse(JSON.stringify(resposta.analise)));
      setMeta(META_VAZIA);
      setSujo(false);
    }
  }, [resposta]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hu.trim()) return;
    setLoading(true);
    setResposta(null);
    setEditavel(null);
    setSujo(false);
    try {
      const r = await api.post<AnalyzeResponse>('/api/v1/analyze', { texto: hu });
      setResposta(r.data);
      setAba('analise');
    } catch {
      setResposta({
        analise: HU_VAZIA,
        quantidade_palavras: 0,
        jira_wiki: '',
        dokuwiki: '',
        erro: 'Erro ao comunicar com o backend.',
      });
    } finally {
      setLoading(false);
    }
  };

  const limpar = () => {
    setHu('');
    setResposta(null);
    setEditavel(null);
    setMeta(META_VAZIA);
    setCopiado(false);
    setSujo(false);
    setAba('analise');
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const atualizarCampo = (campo: keyof AnaliseHU, valor: string) => {
    setEditavel((prev) => (prev ? { ...prev, [campo]: valor } : prev));
    setSujo(true);
  };

  const atualizarMeta = (campo: keyof MetaEditavel, valor: string) => {
    setMeta((m) => ({ ...m, [campo]: valor }));
    setSujo(true);
  };

  const aplicarAlteracoes = async () => {
    if (!editavel || !resposta) return;
    setAplicando(true);
    try {
      const r = await api.post<AnalyzeResponse>('/api/v1/regenerate', {
        analise: editavel,
        hu_original: hu,
        meta,
      });
      setResposta(r.data);
      setSujo(false);
    } catch {
      alert('Erro ao regerar os formatos.');
    } finally {
      setAplicando(false);
    }
  };

  const textoAtual = () => {
    if (!resposta) return '';
    if (aba === 'jira') return resposta.jira_wiki;
    if (aba === 'dokuwiki') return resposta.dokuwiki;
    return '';
  };

  const copiar = async () => {
    const t = textoAtual();
    if (!t) return;
    await navigator.clipboard.writeText(t);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const baixarTxt = () => {
    const t = textoAtual();
    if (!t) return;
    const nome = aba === 'dokuwiki' ? 'roteiro-dokuwiki' : 'roteiro-jira';
    const blob = new Blob([t], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nome}-${resposta?.analise.identificacao_alm || 'roteiro'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scoreBadge = (score: number) => {
    if (score >= 80) return { cor: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 ring-emerald-200 dark:ring-emerald-500/30', icone: ShieldCheck };
    if (score >= 50) return { cor: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 ring-amber-200 dark:ring-amber-500/30', icone: ShieldAlert };
    return { cor: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 ring-red-200 dark:ring-red-500/30', icone: ShieldX };
  };

  const abasDisponiveis = [
    { id: 'analise' as Aba,    label: 'Análise' },
    { id: 'configurar' as Aba, label: 'Configurar' },
    { id: 'jira' as Aba,       label: 'Jira Wiki' },
    { id: 'dokuwiki' as Aba,   label: 'DokuWiki' },
    { id: 'validacao' as Aba,  label: `Validação${resposta?.validacao ? ` (${resposta.validacao.total_erros + resposta.validacao.total_avisos})` : ''}` },
  ];

  const podeCopiarBaixar = aba === 'jira' || aba === 'dokuwiki';

  return (
    <>
      <TopBar title="Novo roteiro" subtitle="Cole a HU e gere o roteiro de testes" />

      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto space-y-6">

          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">História de Usuário</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cole o texto completo da HU</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 dark:text-slate-500">{hu.length} caracteres</span>
                <button
                  type="button"
                  onClick={limpar}
                  disabled={!hu && !resposta}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  title="Limpar tudo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar
                </button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              className="w-full p-6 text-sm text-slate-800 dark:text-slate-200 font-mono bg-white dark:bg-slate-900 resize-none focus:outline-none placeholder:text-slate-400"
              rows={12}
              placeholder="Cole aqui a História de Usuário completa..."
              value={hu}
              onChange={(e) => setHu(e.target.value)}
            />

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A IA vai analisar e gerar os casos de teste automaticamente.
              </p>
              <button
                type="submit"
                disabled={loading || !hu.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition shadow-sm"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analisando...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Gerar roteiro</>
                )}
              </button>
            </div>
          </form>

          {resposta?.erro && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">Erro ao processar</p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-1 whitespace-pre-wrap">{resposta.erro}</p>
              </div>
              <button
                onClick={limpar}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo
              </button>
            </div>
          )}

          {resposta && !resposta.erro && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
              <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/30 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ring-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/30">
                  <Save className="w-3.5 h-3.5" />
                  Salvo no histórico
                </span>

                {resposta.validacao && (() => {
                  const { cor, icone: Icone } = scoreBadge(resposta.validacao.score);
                  return (
                    <>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ring-1 ${cor}`}>
                        <Icone className="w-3.5 h-3.5" />
                        Qualidade: {resposta.validacao.score}%
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {resposta.validacao.total_erros} erro(s) · {resposta.validacao.total_avisos} aviso(s)
                      </span>
                    </>
                  );
                })()}

                <button
                  onClick={limpar}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Gerar novo roteiro
                </button>
              </div>

              <div className="px-6 border-b border-slate-100 dark:border-slate-800 flex gap-1 flex-wrap">
                {abasDisponiveis.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setAba(t.id)}
                    className={`relative px-4 py-3 text-sm font-medium transition ${
                      aba === t.id
                        ? 'text-brand-700 dark:text-brand-300'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
                    }`}
                  >
                    {t.label}
                    {t.id === 'configurar' && sujo && (
                      <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-amber-500 align-middle" />
                    )}
                    {aba === t.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 dark:bg-brand-400 rounded-t-full" />
                    )}
                  </button>
                ))}

                <div className="ml-auto flex items-center gap-2 py-2">
                  {podeCopiarBaixar && (
                    <>
                      <button
                        onClick={copiar}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                      >
                        {copiado ? <><Check className="w-3.5 h-3.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
                      </button>
                      <button
                        onClick={baixarTxt}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                      >
                        <Download className="w-3.5 h-3.5" /> TXT
                      </button>
                    </>
                  )}
                </div>
              </div>

              {aba === 'analise'    && <AbaAnalise analise={resposta.analise} />}
              {aba === 'configurar' && editavel && (
                <AbaConfigurar
                  editavel={editavel}
                  meta={meta}
                  sujo={sujo}
                  aplicando={aplicando}
                  onChangeCampo={atualizarCampo}
                  onChangeMeta={atualizarMeta}
                  onAplicar={aplicarAlteracoes}
                />
              )}
              {aba === 'jira'       && <AbaTexto wiki={resposta.jira_wiki} />}
              {aba === 'dokuwiki'   && <AbaTexto wiki={resposta.dokuwiki} />}
              {aba === 'validacao'  && <AbaValidacao validacao={resposta.validacao} />}
            </div>
          )}

        </div>
      </main>
    </>
  );
}

/* ────── Abas ────── */

function AbaAnalise({ analise }: { analise: AnaliseHU }) {
  const Campo = ({ label, valor }: { label: string; valor: string }) => (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 pt-0.5">{label}</span>
      <span className="col-span-2 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{valor || '—'}</span>
    </div>
  );

  const corFluxo = (fluxo: string) => {
    const f = fluxo.toLowerCase();
    if (f.includes('negativ')) return 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-red-200 dark:ring-red-500/30';
    if (f.includes('alternativ')) return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-200 dark:ring-amber-500/30';
    return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/30';
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
        <Campo label="Identificação do ALM" valor={analise.identificacao_alm} />
        <Campo label="Nome da História"      valor={analise.nome_historia} />
        <Campo label="Link da HU"            valor={analise.link_hu} />
        <Campo label="Link do Sistema"       valor={analise.link_sistema} />
        <Campo label="Pré-condição"          valor={analise.pre_condicao} />
      </div>
      <div className="mt-2">
        <Campo label="Objetivo" valor={analise.objetivo} />
        <Campo label="Protótipos"  valor={analise.prototipos} />
        <Campo label="Tabelas"     valor={analise.tabelas} />
        <Campo label="Mensagens"   valor={analise.mensagens} />
        <Campo label="Regras de Negócio" valor={analise.regras_negocio} />
      </div>

      <div className="mt-8">
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Casos de teste ({analise.casos_teste.length})
        </h4>
        <div className="space-y-3">
          {analise.casos_teste.map((ct) => (
            <div key={ct.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-bold text-brand-700 dark:text-brand-400">{ct.id}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ring-1 ${corFluxo(ct.fluxo)}`}>
                  {ct.fluxo}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">{ct.titulo}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Passos</p>
                  <ul className="space-y-1">
                    {ct.passos.map((p, i) => <li key={i} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{p}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Resultado esperado</p>
                  <ul className="space-y-1">
                    {ct.resultado_esperado.map((r, i) => <li key={i} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{r}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AbaConfigurar({
  editavel, meta, sujo, aplicando, onChangeCampo, onChangeMeta, onAplicar,
}: {
  editavel: AnaliseHU;
  meta: MetaEditavel;
  sujo: boolean;
  aplicando: boolean;
  onChangeCampo: (campo: keyof AnaliseHU, valor: string) => void;
  onChangeMeta: (campo: keyof MetaEditavel, valor: string) => void;
  onAplicar: () => void;
}) {
  return (
    <div className="p-6 space-y-6">

      {sujo && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg">
          <Settings2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-300 flex-1">
            Você tem alterações não aplicadas. Clique em <strong>Aplicar e regerar</strong> para atualizar os formatos.
          </p>
        </div>
      )}

      {/* Identificação */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Identificação
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Identificação do ALM">
            <input
              type="text"
              className={inputCls}
              value={editavel.identificacao_alm}
              onChange={(e) => onChangeCampo('identificacao_alm', e.target.value)}
              placeholder="Ex: TERRACAP-15597 - Autenticar para ver detalhes do item"
            />
          </Field>
          <Field label="Nome da História">
            <input
              type="text"
              className={inputCls}
              value={editavel.nome_historia}
              onChange={(e) => onChangeCampo('nome_historia', e.target.value)}
              placeholder="Ex: Monitoramento Power BI Embedded"
            />
          </Field>
          <Field label="Link da HU">
            <input
              type="text"
              className={inputCls}
              value={editavel.link_hu}
              onChange={(e) => onChangeCampo('link_hu', e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field label="Link do Sistema/Funcionalidade">
            <input
              type="text"
              className={inputCls}
              value={editavel.link_sistema}
              onChange={(e) => onChangeCampo('link_sistema', e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field label="Usuário e senha">
            <input
              type="text"
              className={inputCls}
              value={meta.usuario_senha}
              onChange={(e) => onChangeMeta('usuario_senha', e.target.value)}
              placeholder="Ex: usuario / senha"
            />
          </Field>
          <Field label="Tipo de Demanda">
            <select
              className={inputCls}
              value={meta.tipo_demanda}
              onChange={(e) => onChangeMeta('tipo_demanda', e.target.value)}
            >
              <option value="Nova funcionalidade">Nova funcionalidade</option>
              <option value="Melhoria">Melhoria</option>
              <option value="Outros, especificar">Outros, especificar</option>
            </select>
          </Field>
          <Field label="Tipo de Teste">
            <select
              className={inputCls}
              value={meta.tipo_teste}
              onChange={(e) => onChangeMeta('tipo_teste', e.target.value)}
            >
              {TIPOS_TESTE.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* Descrição */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Descrição
        </h4>
        <div className="space-y-4">
          <Field label="Objetivo e prioridades">
            <textarea
              className={`${inputCls} resize-none font-mono`}
              rows={3}
              value={editavel.objetivo}
              onChange={(e) => onChangeCampo('objetivo', e.target.value)}
            />
          </Field>
          <Field label="Pré-condição">
            <input
              type="text"
              className={inputCls}
              value={editavel.pre_condicao}
              onChange={(e) => onChangeCampo('pre_condicao', e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={onAplicar}
          disabled={aplicando || !sujo}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition shadow-sm"
        >
          {aplicando ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Aplicando...</>
          ) : (
            <><RotateCw className="w-4 h-4" /> Aplicar e regerar</>
          )}
        </button>
      </div>

    </div>
  );
}

function AbaTexto({ wiki }: { wiki: string }) {
  return (
    <div className="p-6">
      <pre className="text-[11px] leading-relaxed font-mono bg-slate-900 dark:bg-slate-950 text-slate-100 p-5 rounded-lg border border-slate-800 overflow-auto max-h-[600px] whitespace-pre-wrap">
        {wiki}
      </pre>
    </div>
  );
}

function AbaValidacao({ validacao }: { validacao?: Validacao }) {
  if (!validacao) {
    return (
      <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Sem dados de validação.
      </div>
    );
  }

  const Item = ({ item, cor }: { item: ValidacaoItem; cor: 'erro' | 'aviso' }) => (
    <li className={`flex gap-3 p-3 rounded-lg border ${
      cor === 'erro'
        ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
        : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
    }`}>
      <div className={`shrink-0 w-1 rounded-full ${cor === 'erro' ? 'bg-red-500' : 'bg-amber-500'}`} />
      <div className="min-w-0">
        {item.ct_id && (
          <span className={`text-[10px] font-bold mr-2 ${cor === 'erro' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
            {item.ct_id}
          </span>
        )}
        {item.ct_ids && (
          <span className={`text-[10px] font-bold mr-2 ${cor === 'erro' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
            {item.ct_ids.join(' + ')}
          </span>
        )}
        <span className="text-xs text-slate-700 dark:text-slate-300">{item.mensagem}</span>
      </div>
    </li>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">Cenários da HU</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{validacao.cobertura.cenarios_cobertos.length}</span> cobertos
            {validacao.cobertura.cenarios_faltando.length > 0 && (
              <> · <span className="font-semibold text-red-600 dark:text-red-400">{validacao.cobertura.cenarios_faltando.length}</span> faltando</>
            )}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">Regras de Negócio</p>
          {validacao.cobertura.regras_hu.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma RN identificada</p>
          ) : (
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {validacao.cobertura.regras_hu.length - validacao.cobertura.regras_faltando.length}
              </span> cobertas de {validacao.cobertura.regras_hu.length}
            </p>
          )}
        </div>
      </div>

      {validacao.erros.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <ShieldX className="w-3.5 h-3.5" />
            Erros ({validacao.erros.length})
          </h4>
          <ul className="space-y-2">
            {validacao.erros.map((e, i) => <Item key={i} item={e} cor="erro" />)}
          </ul>
        </div>
      )}

      {validacao.avisos.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Avisos ({validacao.avisos.length})
          </h4>
          <ul className="space-y-2">
            {validacao.avisos.map((a, i) => <Item key={i} item={a} cor="aviso" />)}
          </ul>
        </div>
      )}

      {validacao.erros.length === 0 && validacao.avisos.length === 0 && (
        <div className="text-center py-10">
          <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Nenhum problema detectado</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">O roteiro passou em todas as verificações automáticas.</p>
        </div>
      )}
    </div>
  );
}