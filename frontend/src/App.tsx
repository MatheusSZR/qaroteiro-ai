import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { CommandPalette } from './components/CommandPalette';
import { Dashboard } from './pages/Dashboard';
import { NovoRoteiro } from './pages/NovoRoteiro';
import { Historico } from './pages/Historico';
import { HistoricoDetalhePage } from './pages/HistoricoDetalhe';
import { Templates } from './pages/Templates';
import { Configuracoes } from './pages/Configuracoes';

function App() {
  return (
    <BrowserRouter>
      <CommandPalette />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/"                    element={<Dashboard />} />
          <Route path="/novo"                element={<NovoRoteiro />} />
          <Route path="/historico"           element={<Historico />} />
          <Route path="/historico/:id"       element={<HistoricoDetalhePage />} />
          <Route path="/templates"           element={<Templates />} />
          <Route path="/configuracoes"       element={<Configuracoes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;