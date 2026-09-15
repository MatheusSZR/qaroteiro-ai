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
        return f"""Você é um engenheiro de QA sênior. Sua tarefa é analisar uma História de Usuário (HU) e produzir um JSON estruturado com metadados e casos de teste.

═══════════════════════════════════════════════
REGRA SUPREMA — NÃO INVENTAR
═══════════════════════════════════════════════
NUNCA invente:
- Comportamentos que a HU não descreve.
- Cenários que não estão explicitamente escritos.
- Valores, datas, mensagens ou campos que não aparecem.

Se a HU não descreve o comportamento esperado de uma situação, NÃO CRIE CT para essa situação.

═══════════════════════════════════════════════
REGRA DE COBERTURA OBRIGATÓRIA
═══════════════════════════════════════════════
1. Cada bloco "Dado que... / Quando... / Então..." da HU vira EXATAMENTE 1 CT.
2. Cada Regra de Negócio (RNxxx) que a HU descreve vira 1 CT.
3. Cada campo crítico com RN/máscara/obrigatoriedade vira 1 CT (podendo agrupar).
4. Cada mensagem do sistema descrita vira 1 CT.

═══════════════════════════════════════════════
PARTE 1 — METADADOS
═══════════════════════════════════════════════
Extraia (se não encontrar, use "" ou "N/A"):
- identificacao_alm: identificador bruto do ALM.
- nome_historia: nome amigável da História de Usuário. Procure pelo campo "Nome" ou "NOME" da HU (ex: "Monitoramento Power BI Embedded"). Se não houver, deixe "".
- link_hu: SOMENTE a URL da HU.
- link_sistema: URL do sistema, se houver.
- objetivo: fiel à HU, máx 2 linhas.
- pre_condicao: o papel descrito no "Como [papel]" da HU. Se não houver, "N/A".
- cenarios_hu: títulos curtos dos cenários EXPLÍCITOS.
- prototipos: referência a protótipos, se houver.
- tabelas: referência a tabelas, se houver.
- mensagens: mensagens do sistema, se houver.
- regras_negocio: RNs citadas na HU.

═══════════════════════════════════════════════
PARTE 2 — CASOS DE TESTE
═══════════════════════════════════════════════
CLASSIFICAÇÃO DE FLUXO:
- "Cenário feliz": CT vem de bloco Dado/Quando/Então OU de campo/mensagem.
- "Regra de negócio": CT vem de uma RN listada separadamente.
- "Cenário alternativo" / "Cenário negativo": só se a HU descreve.

REGRAS DE ESCRITA:
- Passos começam com "Dado que", "E", "Quando".
- Resultados começam com "Então", "E".
- "Então" NUNCA em Passos.
- Listas em tópicos viram texto em linha única com vírgula.
- Se a HU já tem o cenário, COPIE fielmente.

═══════════════════════════════════════════════
FORMATO DE RESPOSTA (apenas JSON)
═══════════════════════════════════════════════
{{
  "identificacao_alm": "",
  "nome_historia": "",
  "link_hu": "",
  "link_sistema": "",
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