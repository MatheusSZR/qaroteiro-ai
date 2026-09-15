# 🧪 QARoteiro AI

> Transforme Histórias de Usuário (HU) em roteiros de teste de QA profissionais, gerados por IA, nos formatos **Jira Wiki Markup** e **DokuWiki**.

![Status](https://img.shields.io/badge/status-MVP-blueviolet)
![Python](https://img.shields.io/badge/Python-3.12-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688)
![React](https://img.shields.io/badge/React-19-61dafb)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 Sobre

Ferramenta web para QAs e analistas de teste que precisam gerar **roteiros de teste padronizados** a partir de Histórias de Usuário. Em vez de escrever manualmente cada Caso de Teste (CT), o analista cola a HU e recebe:

- **Análise estruturada** da HU (objetivo, pré-condição, cenários, regras, mensagens)
- **Casos de Teste** classificados (feliz, alternativo, negativo, regra de negócio)
- **Roteiro pronto** nos formatos **Jira Wiki Markup** e **DokuWiki**
- **Validação automática** de qualidade (cobertura, duplicatas, informações inventadas)

### Por que existe?

Escrever roteiros de teste manualmente é repetitivo, consome tempo e frequentemente gera inconsistências. Este projeto aplica **IA generativa + motor de regras determinístico** para automatizar a parte repetitiva sem abrir mão da padronização.

---

## ✨ Funcionalidades

- ✅ **Análise com IA** — usa a [Groq API](https://console.groq.com/) (gratuita) com modelos como GPT-OSS 120B e Llama 3.1
- ✅ **Motor de regras determinístico** — separa interpretação (IA) da formatação (código)
- ✅ **Validador automático** — detecta CTs duplicados, informações inventadas, cobertura incompleta e erros de estrutura
- ✅ **Dois formatos de saída** — Jira Wiki Markup e DokuWiki (TerraWiki)
- ✅ **Interface SaaS moderna** — React + Tailwind, dark mode, paleta de comandos (`Ctrl+K`), feedback visual
- ✅ **Histórico persistido** — SQLite local, com busca, score e reabertura
- ✅ **Campos editáveis** — ajuste ALM, links, pré-condição e tipo de demanda antes de gerar
- ✅ **Configurações de IA** — troque o modelo, ajuste temperatura e limite de tokens
- ✅ **Perfil do usuário** — nome, e-mail e cargo no avatar

---

## 🏗 Arquitetura
┌────────────────┐ ┌──────────────────┐ ┌──────────────┐
│ Frontend │ ───► │ Backend │ ───► │ Groq API │
│ React + Vite │ HTTP │ FastAPI │ HTTP │ (IA) │
│ Tailwind │ ◄─── │ + Motor Regras │ ◄─── │ │
└────────────────┘ └──────────────────┘ └──────────────┘
:5173 :8000


**Fluxo:**
1. Usuário cola a HU no frontend
2. Frontend envia para `POST /api/v1/analyze`
3. Backend chama a IA (Groq) com um prompt estruturado
4. IA retorna JSON com análise + CTs
5. Motor de regras valida, deduplica e classifica
6. Geradores produzem Jira Wiki e DokuWiki
7. Validador retorna score de qualidade
8. Frontend exibe em abas (Análise, Configurar, Jira, DokuWiki, Validação)
9. Roteiro é salvo automaticamente no histórico (SQLite)

**Estrutura de pastas:**
qaroteiro-ai/
├── backend/
│ ├── app/
│ │ ├── ai/ # Providers de IA (GroqProvider)
│ │ ├── api/ # Rotas HTTP
│ │ ├── core/ # Configurações e banco
│ │ ├── generators/ # Geradores Jira + DokuWiki
│ │ ├── models/ # Modelos SQLAlchemy
│ │ ├── rules/ # Validador de qualidade
│ │ ├── schemas/ # Pydantic schemas
│ │ ├── services/ # Orquestração (AnalyzerService)
│ │ └── utils.py
│ ├── main.py
│ └── requirements.txt
└── frontend/
├── src/
│ ├── components/ # Componentes reutilizáveis
│ ├── hooks/ # Hooks (useTheme)
│ ├── pages/ # Páginas (Dashboard, NovoRoteiro, etc)
│ └── services/ # Cliente HTTP
└── package.json


---

## 🚀 Como rodar localmente

### Pré-requisitos

- **Python 3.12+** — [Download](https://python.org/downloads)
- **Node.js 18+** — [Download](https://nodejs.org)
- **Git** — [Download](https://git-scm.com)
- **Conta gratuita na Groq** — [console.groq.com](https://console.groq.com/)

### 1. Clonar o repositório
 
git clone https://github.com/MatheusSZR/qaroteiro-ai.git
cd qaroteiro-ai
2. Configurar o backend
bash
cd backend

# Criar e ativar ambiente virtual
python -m venv venv

# Windows:
venv\Scripts\Activate.ps1

# Linux/Mac:
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt
3. Configurar a chave da Groq
Crie uma conta em console.groq.com

Gere uma API Key em API Keys

Crie um arquivo .env em backend/:

env
GROQ_API_KEY=gsk_sua_chave_real_aqui
⚠️ O arquivo .env não é versionado (está no .gitignore). Use o .env.example como referência.

4. Rodar o backend
bash
python main.py
Servidor em http://localhost:8000 (docs automáticos em http://localhost:8000/docs).

5. Rodar o frontend (em outro terminal)
cd frontend
npm install
npm run dev
Acesse http://localhost:5173.

📖 Como usar
Clique em "Novo roteiro" na sidebar (ou aperte Ctrl+K → "Novo roteiro")

Cole a História de Usuário completa no textarea

Clique em "Gerar roteiro" (aguarde 5–15 segundos)

Navegue pelas abas:

Análise — metadados extraídos + CTs classificados

Configurar — edite ALM, links, pré-condição, tipo de demanda antes de gerar

Jira Wiki — roteiro no formato Jira

DokuWiki — roteiro no formato TerraWiki

Validação — score de qualidade + alertas

Copie ou baixe em TXT

O roteiro é salvo automaticamente no Histórico

🧠 Regras de QA aplicadas
Nunca inventar informação que não esteja na HU

Todos os cenários explícitos da HU viram CTs (classificados como "Cenário feliz")

CTs adicionais (alternativos/negativos) só quando deriváveis com segurança

"Então" nunca aparece nos Passos — só no Resultado Esperado

Listas em tópicos viram texto em linha única com vírgulas

Não duplicar CTs — validador detecta e remove

Formatação Jira/DokuWiki validada automaticamente

⚠️ Limitações conhecidas
A IA (mesmo com prompt rigoroso) às vezes gera CTs inventados. O validador captura a maioria, mas não todos.

HUs muito longas (> 10k tokens) podem estourar o contexto do modelo.

O campo Pré-condição ocasionalmente é extraído incorretamente (mitigado pela aba "Configurar").

Histórico é local (SQLite) — sem sincronização entre dispositivos.

Sem autenticação real — é um MVP para uso individual/local.

🛠 Tecnologias
Camada	Tecnologia
Frontend	React 19, Vite, TypeScript, Tailwind CSS, React Router, Lucide Icons
Backend	Python 3.12, FastAPI, Pydantic, SQLAlchemy, httpx
IA	Groq API (GPT-OSS 120B, GPT-OSS 20B, Llama 3.1 8B)
Banco	SQLite
Infra	Git, GitHub
📡 Endpoints principais
Método	Rota	Descrição
GET	/health	Health check
POST	/api/v1/analyze	Analisa HU e gera roteiro
POST	/api/v1/regenerate	Regera formatos após edição
GET	/api/v1/historico	Lista roteiros salvos
GET	/api/v1/historico/{id}	Detalhes de um roteiro
DELETE	/api/v1/historico/{id}	Remove um roteiro
GET	/api/v1/estatisticas	Estatísticas do dashboard
GET	/api/v1/configuracoes	Configurações da IA
PUT	/api/v1/configuracoes	Atualiza configurações
🤝 Contribuindo
Projeto pessoal de portfólio. Sugestões são bem-vindas via Issues.

📄 Licença
MIT — veja LICENSE para detalhes.

👤 Autor
Matheus de Souza Rodrigues

GitHub: @MatheusSZR

LinkedIn: matheus-rodrigues

⭐ Se este projeto foi útil, considere dar uma estrela no repositório!


---

## 📄 LICENSE

Crie `LICENSE` na raiz com:
MIT License

Copyright (c) 2026 Matheus de Souza Rodrigues

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

**Salve.**

---
