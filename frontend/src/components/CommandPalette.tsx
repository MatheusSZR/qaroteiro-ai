import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommandPaletteStyled } from '@mshafiqyajid/react-command-palette/styled';
import '@mshafiqyajid/react-command-palette/styles.css';
import api from '../services/api';

interface ItemHistorico {
  id: number;
  nome_historia: string;
  identificacao_alm: string;
}

interface CommandItem {
  id: string;
  label: string;
  group?: string;
  keywords?: string[];
}

export function CommandPalette() {
  const navigate = useNavigate();
  const [itens, setItens] = useState<CommandItem[]>([]);

  useEffect(() => {
    api.get<ItemHistorico[]>('/api/v1/historico')
      .then((r) => {
        const historico: CommandItem[] = r.data.slice(0, 20).map((h) => ({
          id: `hist-${h.id}`,
          label: h.nome_historia || h.identificacao_alm,
          group: 'Histórico',
          keywords: [h.identificacao_alm, h.nome_historia].filter(Boolean) as string[],
        }));
        setItens(historico);
      })
      .catch(() => {});
  }, []);

  const comandos: CommandItem[] = [
    { id: 'nav-dash', label: 'Ir para Dashboard', group: 'Navegação' },
    { id: 'nav-novo', label: 'Novo roteiro', group: 'Navegação' },
    { id: 'nav-hist', label: 'Histórico', group: 'Navegação' },
    { id: 'nav-tpl', label: 'Templates', group: 'Navegação' },
    { id: 'nav-cfg', label: 'Configurações', group: 'Navegação' },
    ...itens,
  ];

  const handleSelect = (item: CommandItem) => {
    const { id } = item;

    if (id === 'nav-dash') return navigate('/');
    if (id === 'nav-novo') return navigate('/novo');
    if (id === 'nav-hist') return navigate('/historico');
    if (id === 'nav-tpl') return navigate('/templates');
    if (id === 'nav-cfg') return navigate('/configuracoes');

    if (id.startsWith('hist-')) {
      const roteiroId = id.replace('hist-', '');
      return navigate(`/historico/${roteiroId}`);
    }
  };

  return (
    <CommandPaletteStyled
      items={comandos}
      onSelect={handleSelect as any}
      placeholder="Digite um comando ou busque no histórico..."
      recentStorageKey="qaroteiro-recent"
    />
  );
}