import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Moon, Sun, Info, LogOut, ChevronDown } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface Perfil {
  nome: string;
  email: string;
  cargo: string;
}

const PERFIL_PADRAO: Perfil = { nome: 'MR', email: '', cargo: 'QA Analyst' };

export function UserMenu() {
  const [aberto, setAberto] = useState(false);
  const [perfil, setPerfil] = useState<Perfil>(PERFIL_PADRAO);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const salvo = localStorage.getItem('qaroteiro-perfil');
    if (salvo) {
      try { setPerfil(JSON.parse(salvo)); } catch {}
    }
  }, []);

   const iniciais = (() => {
    const partes = (perfil.nome || '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return 'MR';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  })();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setAberto((a) => !a)}
        className="flex items-center gap-2 p-1 pl-1 pr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-semibold">
          {iniciais}
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {aberto && (
        <div className="absolute right-0 top-12 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {perfil.nome}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {perfil.email || 'sem email'}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              {perfil.cargo}
            </p>
          </div>

          <div className="py-1">
            <button
              onClick={() => { navigate('/configuracoes'); setAberto(false); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <User className="w-4 h-4" />
              Editar perfil
            </button>

            <button
              onClick={toggle}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            </button>

            <button
              onClick={() => { navigate('/configuracoes'); setAberto(false); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Settings className="w-4 h-4" />
              Configurações
            </button>

            <button
              disabled
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-400 dark:text-slate-500 transition cursor-not-allowed"
              title="Disponível em breve (OAuth Google/Microsoft)"
            >
              <LogOut className="w-4 h-4" />
              Sair (em breve)
            </button>
          </div>

          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
            <Info className="w-3 h-3" />
            QARoteiro AI · v0.1.0
          </div>
        </div>
      )}
    </div>
  );
}