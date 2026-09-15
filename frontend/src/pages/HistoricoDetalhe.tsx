import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import api from '../services/api';
import { ArrowLeft, Copy, Download, Check, Loader2, AlertTriangle, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

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

interface HistoricoDetalhe {
  id: number;
  identificacao_alm: string;
  criado_em: string;
  quantidade_cts: number;
  score: number;
  hu_original: string;
  analise: AnaliseHU;
  jira_wiki: string;
  dokuwiki: string;
  validacao?: Validacao;
    nome_historia: string;
}

type Aba = 'analise' | 'jira' | 'dokuwiki' | 'validacao' | 'hu';

function scoreBadge(score: number) {
  if (score >= 80) return { cor: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 ring-emerald-200 dark:ring-emerald-500/30', icone: ShieldCheck };
  if (score >= 50) return { cor: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 ring-amber-200 dark:ring-amber-500/30', icone: ShieldAlert };
  return { cor: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 ring-red-200 dark:ring-red-500/30', icone: ShieldX };
}

export function HistoricoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<HistoricoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>('analise');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get<HistoricoDetalhe>(`/api/v1/historico/${id}`)
      .then((r) => setItem(r.data))
      .catch(() => setErro('Roteiro não encontrado.'))
      .finally(() => setLoading(false));
  }, [id]);

  const textoAtual = () => {
    if (!item) return '';
    if (aba === 'jira') return item.jira_wiki;
    if (aba === 'dokuwiki') return item.dokuwiki;
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
    a.download = `${nome}-${item?.identificacao_alm || 'roteiro'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <>
        <TopBar title="Carregando..." />
        <main className="flex-1 overflow-auto p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
        </main>
      </>
    );
  }

  if (erro || !item) {
    return (
      <>
        <TopBar title="Erro" />
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">{erro || 'Não encontrado'}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/historico')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-medium rounded-lg transition"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
          </div>
        </main>
      </>
    );
  }

  const { cor, icone: Icone } = scoreBadge(item.score);
  const podeCopiarBaixar = aba === 'jira' || aba === 'dokuwiki';

  const abas = [
    { id: 'analise' as Aba,   label: 'Análise' },
    { id: 'jira' as Aba,      label: 'Jira Wiki' },
    { id: 'dokuwiki' as Aba,  label: 'DokuWiki' },
    { id: 'validacao' as Aba, label: `Validação${item.validacao ? ` (${item.validacao.total_erros + item.validacao.total_avisos})` : ''}` },
    { id: 'hu' as Aba,        label: 'HU Original' },
  ];

  return (
    <>
            <TopBar
        title={item.nome_historia || item.identificacao_alm || '(sem nome)'}
        subtitle={`${item.identificacao_alm || ''} · Gerado em ${new Date(item.criado_em).toLocaleString('pt-BR')}`}
      />

      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto space-y-6">

          <button
            onClick={() => navigate('/historico')}
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao histórico
          </button>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
            <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/30">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ring-1 ${cor}`}>
                <Icone className="w-3.5 h-3.5" />
                Qualidade: {item.score}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {item.quantidade_cts} CT(s)
              </span>
            </div>

            <div className="px-6 border-b border-slate-100 dark:border-slate-800 flex gap-1 flex-wrap">
              {abas.map((t) => (
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

            {aba === 'analise'   && <AbaAnalise analise={item.analise} />}
            {aba === 'jira'      && <AbaTexto wiki={item.jira_wiki} />}
            {aba === 'dokuwiki'  && <AbaTexto wiki={item.dokuwiki} />}
            {aba === 'validacao' && <AbaValidacao validacao={item.validacao} />}
            {aba === 'hu'        && <AbaHU hu={item.hu_original} />}
          </div>

        </div>
      </main>
    </>
  );
}

/* ───── Subcomponentes ───── */

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

function AbaTexto({ wiki }: { wiki: string }) {
  return (
    <div className="p-6">
      <pre className="text-[11px] leading-relaxed font-mono bg-slate-900 dark:bg-slate-950 text-slate-100 p-5 rounded-lg border border-slate-800 overflow-auto max-h-[600px] whitespace-pre-wrap">
        {wiki || '(vazio)'}
      </pre>
    </div>
  );
}

function AbaHU({ hu }: { hu: string }) {
  return (
    <div className="p-6">
      <pre className="text-xs leading-relaxed font-mono bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 p-5 rounded-lg border border-slate-200 dark:border-slate-800 overflow-auto max-h-[600px] whitespace-pre-wrap">
        {hu || '(vazio)'}
      </pre>
    </div>
  );
}

function AbaValidacao({ validacao }: { validacao?: Validacao }) {
  if (!validacao) {
    return <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">Sem dados de validação.</div>;
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
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">Regras de Negócio</p>
          {validacao.cobertura.regras_hu.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma RN</p>
          ) : (
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {validacao.cobertura.regras_hu.length - validacao.cobertura.regras_faltando.length}
              </span> de {validacao.cobertura.regras_hu.length}
            </p>
          )}
        </div>
      </div>

      {validacao.erros.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-3">Erros ({validacao.erros.length})</h4>
          <ul className="space-y-2">{validacao.erros.map((e, i) => <Item key={i} item={e} cor="erro" />)}</ul>
        </div>
      )}
      {validacao.avisos.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-3">Avisos ({validacao.avisos.length})</h4>
          <ul className="space-y-2">{validacao.avisos.map((a, i) => <Item key={i} item={a} cor="aviso" />)}</ul>
        </div>
      )}
      {validacao.erros.length === 0 && validacao.avisos.length === 0 && (
        <div className="text-center py-10">
          <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Nenhum problema detectado</p>
        </div>
      )}
    </div>
  );
}