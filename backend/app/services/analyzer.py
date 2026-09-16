from app.ai import GroqProvider
from app.schemas.roteiro import AnalyzeResponse, AnaliseHU, CasoTeste
from app.generators.jira_generator import gerar_jira_wiki
from app.generators.dokuwiki_generator import gerar_dokuwiki
from app.rules.validator import validar
from app.utils import extrair_json, remover_cts_duplicados, para_string


class AnalyzerService:
    def __init__(self, provider: GroqProvider = None):
        self.provider = provider or GroqProvider()

    async def analyze_hu(self, texto: str) -> AnalyzeResponse:
        prompt = self._montar_prompt(texto)

        try:
            resposta_ia = await self.provider.generate_response(prompt)
            dados = extrair_json(resposta_ia)

            if not dados:
                return AnalyzeResponse(
                    analise=AnaliseHU(),
                    quantidade_palavras=len(texto.split()),
                    erro="A IA não retornou um JSON válido. Resposta bruta: " + resposta_ia[:500]
                )

            casos_teste = []
            for i, ct in enumerate(dados.get("casos_teste", []), start=1):
                casos_teste.append(
                    CasoTeste(
                        id=f"CT-{i:02d}",
                        fluxo=ct.get("fluxo", "Cenário feliz"),
                        titulo=ct.get("titulo", ""),
                        passos=ct.get("passos", []),
                        resultado_esperado=ct.get("resultado_esperado", []),
                        origem=ct.get("origem", ""),
                    )
                )

            casos_teste = remover_cts_duplicados(casos_teste)
            for i, ct in enumerate(casos_teste, start=1):
                ct.id = f"CT-{i:02d}"

            analise = AnaliseHU(
                identificacao_alm=para_string(dados.get("identificacao_alm", "")),
                nome_historia=para_string(dados.get("nome_historia", "")),
                link_hu=para_string(dados.get("link_hu", "")),
                link_sistema=para_string(dados.get("link_sistema", "")),
                usuario_senha=para_string(dados.get("usuario_senha", "")),
                tipo_demanda=para_string(dados.get("tipo_demanda", "Nova funcionalidade")),
                tipo_demanda_outros=para_string(dados.get("tipo_demanda_outros", "")),
                tipo_teste_sugerido=para_string(dados.get("tipo_teste", "Funcional")),
                objetivo=para_string(dados.get("objetivo", "N/A")),
                pre_condicao=para_string(dados.get("pre_condicao", "N/A")),
                cenarios_hu=dados.get("cenarios_hu", []) if isinstance(dados.get("cenarios_hu"), list) else [],
                prototipos=para_string(dados.get("prototipos", "N/A")),
                tabelas=para_string(dados.get("tabelas", "N/A")),
                mensagens=para_string(dados.get("mensagens", "N/A")),
                regras_negocio=para_string(dados.get("regras_negocio", "N/A")),
                casos_teste=casos_teste,
            )

            jira_wiki = gerar_jira_wiki(analise)
            dokuwiki = gerar_dokuwiki(analise)
            resultado_validacao = validar(analise, texto, jira_wiki)

            return AnalyzeResponse(
                analise=analise,
                quantidade_palavras=len(texto.split()),
                jira_wiki=jira_wiki,
                dokuwiki=dokuwiki,
                validacao=resultado_validacao,
            )

        except Exception as e:
            import traceback
            traceback.print_exc()
            return AnalyzeResponse(
                analise=AnaliseHU(),
                quantidade_palavras=0,
                erro=f"Erro ao processar com IA: {type(e).__name__} - {repr(e)}"
            )

    def _montar_prompt(self, texto: str) -> str:
        return f"""Você é um engenheiro de QA sênior. Sua tarefa é analisar uma História de Usuário (HU) e produzir um JSON estruturado.

═══════════════════════════════════════════════
REGRA SUPREMA — NÃO INVENTAR
═══════════════════════════════════════════════
NUNCA invente:
- Comportamentos que a HU não descreve.
- Cenários que não estão explicitamente escritos.
- Valores, datas, mensagens ou campos que não aparecem.

═══════════════════════════════════════════════
REGRA Nº1 — COBERTURA OBRIGATÓRIA (LEIA COM ATENÇÃO)
═══════════════════════════════════════════════
VOCÊ DEVE gerar um CT para CADA UM destes itens que a HU apresentar:

(A) CADA bloco "Dado que... / Quando... / Então..." encontrado na HU → 1 CT cada
    → fluxo = "Cenário feliz"
    → Contar os blocos: se a HU tem 2 blocos Dado/Quando/Então, você DEVE gerar 2 CTs.

(B) CADA RN (RN001, RN002, ...) listada na seção "Regras gerais" ou "Regras de negócio" → 1 CT cada
    → fluxo = "Regra de negócio"
    → Só crie esses CTs para RNs listadas SEPARADAMENTE (não basta aparecer no texto).

(C) CADA campo crítico das tabelas (com RN, máscara, obrigatoriedade) → 1 CT agrupado por afinidade.

(D) CADA mensagem explícita do sistema → 1 CT.

EXEMPLO CONCRETO:
    HU tem: 2 blocos "Dado/Quando/Então" + 2 RNs listadas + 17 campos na tabela
    → Mínimo de CTs a gerar: 2 (blocos) + 2 (RNs) + 1-2 (campos agrupados) = 5 CTs
    → Se você gerar apenas 1 CT, está ERRADO.

REGRA CRÍTICA: Se a HU tem N blocos "Dado/Quando/Então", você DEVE retornar no mínimo N CTs. Nunca menos.

═══════════════════════════════════════════════
REGRA Nº2 — CLASSIFICAÇÃO DE FLUXO
═══════════════════════════════════════════════
- "Cenário feliz": CT vem de um bloco "Dado/Quando/Então" DA HU (copie fielmente).
- "Regra de negócio": CT vem de uma RN listada SEPARADAMENTE (sem bloco correspondente).
- "Cenário negativo" / "Cenário alternativo": só se a HU descreve explicitamente.

É PROIBIDO classificar um cenário explícito como "Regra de negócio". Se a HU já tem "Dado/Quando/Então", é "Cenário feliz" — ponto final.

═══════════════════════════════════════════════
REGRA Nº3 — CLASSIFICAÇÃO DO TIPO DE TESTE
═══════════════════════════════════════════════
Analise o CONTEÚDO da HU para escolher tipo_teste:

- "Integração": envolve APIs, integração entre sistemas, consumo de tabelas/dados externos, mensageria, ETL, sincronização.
- "Performance": envolve volume, tempo de resposta, carga, stress.
- "Segurança": envolve autenticação, autorização, permissões, criptografia.
- "Usabilidade": envolve UX, navegação, acessibilidade, layout.
- "Aceitação": validação final com usuário/cliente.
- "Funcional": lógica de negócio pura, funcionalidade isolada.
- "Outros": não se encaixa em nenhum.

Exemplos:
    HU sobre "auth-api consumir tabela tank, integração entre sistemas" → "Integração"
    HU sobre "criar tela de cadastro com campos X, Y, Z" → "Funcional"
    HU sobre "gerar relatório e exibir dados" → "Funcional"
    HU sobre "validar login e permissões de usuário" → "Segurança"

═══════════════════════════════════════════════
REGRA Nº4 — CAPITALIZAÇÃO E FORMATAÇÃO
═══════════════════════════════════════════════
- pre_condicao SEMPRE começa com letra maiúscula.
- Passos começam com "Dado que", "E", "Quando".
- Resultados começam com "Então", "E".
- "Então" NUNCA aparece em Passos.
- Listas em tópicos viram texto em linha única separado por vírgula.
- Se a HU já tem o cenário, COPIE fielmente (não reescreva).

═══════════════════════════════════════════════
PARTE 1 — METADADOS
═══════════════════════════════════════════════
- identificacao_alm: identificador bruto do ALM.
- nome_historia: campo "Nome"/"NOME" da HU. Se não houver, "".
- link_hu: SOMENTE a URL da HU. Não cole texto.
- link_sistema: URL do sistema (só se for URL). Senão "N/A".
- usuario_senha: só se a HU indica. Senão "".
- tipo_demanda: "Melhoria", "Nova funcionalidade" ou "Outros".
- tipo_demanda_outros: se tipo_demanda == "Outros", descreva. Senão "".
- tipo_teste: ver REGRA Nº3.
- objetivo: fiel à HU (o "Como/Quero/Para que"), máx 2 linhas.
- pre_condicao: papel do "Como [papel]". Comece com maiúscula.
- cenarios_hu: títulos curtos dos cenários EXPLÍCITOS.
- prototipos: referência a protótipos, se houver.
- tabelas: referência a tabelas, se houver.
- mensagens: mensagens do sistema, se houver.
- regras_negocio: RNs citadas na HU.

═══════════════════════════════════════════════
FORMATO DE RESPOSTA (apenas JSON)
═══════════════════════════════════════════════
{{
  "identificacao_alm": "",
  "nome_historia": "",
  "link_hu": "",
  "link_sistema": "",
  "usuario_senha": "",
  "tipo_demanda": "Nova funcionalidade",
  "tipo_demanda_outros": "",
  "tipo_teste": "Funcional",
  "objetivo": "",
  "pre_condicao": "",
  "cenarios_hu": [],
  "prototipos": "",
  "tabelas": "",
  "mensagens": "",
  "regras_negocio": "",
  "casos_teste": [
    {{
      "fluxo": "Cenário feliz",
      "titulo": "",
      "origem": "",
      "passos": ["Dado que ...", "Quando ..."],
      "resultado_esperado": ["Então ...", "E ..."]
    }}
  ]
}}

HISTÓRIA DE USUÁRIO:
\"\"\"
{texto}
\"\"\"

Responda apenas com o JSON.
"""