import re
from app.schemas.roteiro import AnaliseHU, CasoTeste


KEYWORDS = ["Dado que", "Quando", "Então", "E"]

TIPOS_TESTE = [
    "Funcional",
    "Integração",
    "Performance",
    "Aceitação",
    "Usabilidade",
    "Segurança",
    "Outros",
]


def _aplicar_negrito(texto: str) -> str:
    texto = texto.strip()
    for kw in KEYWORDS:
        if texto.startswith(kw):
            return "*" + kw + "*" + texto[len(kw):]
    return texto


def _sanitizar_para_celula(texto: str, max_len: int = 1500) -> str:
    if not texto:
        return ""
    texto = texto.replace("|", "/")
    texto = texto.replace("\r", " ").replace("\n", " ")
    texto = re.sub(r"\s+", " ", texto).strip()
    if len(texto) > max_len:
        texto = texto[: max_len - 3] + "..."
    return texto


def _formatar_linhas(linhas: list, separador_final: str) -> str:
    if not linhas:
        return ""
    processadas = [_aplicar_negrito(l) for l in linhas]
    saida = ""
    for i, linha in enumerate(processadas):
        if i < len(processadas) - 1:
            saida += linha.rstrip(".,") + ",\n"
        else:
            saida += linha.rstrip(".,") + separador_final
    return saida


def _gerar_ct(ct: CasoTeste, idx: int) -> str:
    ct_id = ct.id or f"CT-{idx:02d}"
    passos = _formatar_linhas(ct.passos, ",")
    resultado = _formatar_linhas(ct.resultado_esperado, ".")

    return (
        f"||{ct_id}||\n"
        f"||Fluxo|{_sanitizar_para_celula(ct.fluxo)}|\n"
        f"||Titulo|{_sanitizar_para_celula(ct.titulo)}|\n"
        f"||Passos|{passos}|\n"
        f"||Resultado Esperado|{resultado}|\n"
        f"||Resultado|<(/) ou (x)>|\n"
        f"||Resultado obtido|Descreve o resultado obtido no teste e caso de erro insira o link do erro|"
    )


def gerar_jira_wiki(analise: AnaliseHU, meta: dict = None) -> str:
    meta = meta or {}
    num_cts = len(analise.casos_teste)

    # === Identificação ===
    identificacao = _sanitizar_para_celula(analise.identificacao_alm) or "(a preencher)"
    link_hu = _sanitizar_para_celula(analise.link_hu) or "(a preencher)"
    link_sistema = _sanitizar_para_celula(analise.link_sistema) or "(a preencher)"
    usuario_senha = _sanitizar_para_celula(meta.get("usuario_senha", "(a preencher)"))

    objetivo_sanit = _sanitizar_para_celula(analise.objetivo, max_len=1000)
    pre_cond_sanit = _sanitizar_para_celula(analise.pre_condicao, max_len=500)

    # Tipo de Demanda
    tipo_demanda = meta.get("tipo_demanda", "Nova funcionalidade")
    td_melhoria = "(/)" if tipo_demanda == "Melhoria" else "(x)"
    td_nova = "(/)" if tipo_demanda == "Nova funcionalidade" else "(x)"
    td_outros = "(/)" if tipo_demanda not in ["Melhoria", "Nova funcionalidade"] else "(x)"

    # Tipo de Teste — lista dinâmica
    tipo_teste_ativo = meta.get("tipo_teste", "Funcional")
    partes_teste = []
    for t in TIPOS_TESTE:
        marca = "(/)" if t == tipo_teste_ativo else "(x)"
        partes_teste.append(f"{marca} {t}")
    tt_linha = " | ".join(partes_teste)

    cts = "\n\n".join(_gerar_ct(ct, i + 1) for i, ct in enumerate(analise.casos_teste))

    wiki = f"""h3. *1. Identificação:*
||Identificação do ALM|{identificacao}|
||Link do sistema/Funcionalidade|{link_sistema}|
||Usuário e senha|{usuario_senha}|
||Tipo de Demanda|{td_melhoria} Melhoria | {td_nova} Nova funcionalidade | {td_outros} Outros, especificar|
||Tipo de Teste|{tt_linha}|
||História de Usuário:|{link_hu}|
||Objetivo e prioridades|{objetivo_sanit}|
||Pré - Condição|{pre_cond_sanit}|
h3. 2. Informações Gerais:
||Número de Casos de Teste|{num_cts}|
||Validações|0 sucessos / 0 erros|
||Observação|{num_cts} casos de teste gerados a partir da HU.|
h3. 3. Validações de cenários:

* +*Validação do caminho de acesso*+

||*Ação do Usuário*||*Resultado Esperado*||*Resultado*||*Resultado Obtido*||*Observação*||
|*Dado que* o usuário acesse o caminho de acesso|O sistema deve apresentar a tela objeto de teste|<(/) ou (x)>|<descreve o resultado obtido no teste e caso de erro insira o link do erro.>|<observações gerais.>|

* +*Casos de teste*+

{cts}

* +*Validação de protótipo*+

||*Ação do Usuário*||*Resultado Esperado*||*Resultado*||*Resultado Obtido*||*Observação*||
|*Dado que* o usuário administrador siga o caminho de acesso|O sistema deve apresentar as telas, conforme os protótipos da HU|<(/) ou (x)>|*<descreve o resultado obtido no teste e caso de erro insira o link do erro.>*|protótipos apresentados na HU:|

* +*Validação de tabela*+

||*Ação do Usuário*||*Resultado Esperado*||*Resultado*||*Resultado Obtido*||*Observação*||
|*Dado que* o usuário administrador siga o caminho de acesso|O sistema deve apresentar os campos e funcionalidades, conforme tabelas da HU|<(/) ou (x)>|*<descreve o resultado obtido no teste e caso de erro insira o link do erro.>*|tabelas apresentados na HU:|

* +*Validação de mensagem*+

||*Ação do Usuário*||*Resultado Esperado*||*Resultado*||*Resultado Obtido*||*Observação*||
|*Dado que* o usuário administrador siga o caminho de acesso|O sistema deve apresentar todos os campos em pleno funcionamento, conforme suas funções previstas.|<(/) ou (x)>|*<descreve o resultado obtido no teste e caso de erro insira o link do erro.>*|<observações gerais.>|

* +*Validação de regra de negócio*+

||*Ação do Usuário*||*Resultado Esperado*||*Resultado*||*Resultado Obtido*||*Observação*||
|*Dado que* o usuário administrador siga o caminho de acesso|O sistema deve apresentar todos os campos em pleno funcionamento, conforme suas funções previstas.|<(/) ou (x)>|*<descreve o resultado obtido no teste e caso de erro insira o link do erro.>*|<observações gerais.>|

* +*Validação de vídeo da funcionalidade*+

||*Ação do Usuário*||*Resultado Esperado*||*Resultado*||*Resultado Obtido*||*Observação*||
|*Dado que* o usuário administrador siga o caminho de acesso|O sistema deve apresentar todos os campos em pleno funcionamento, conforme suas funções previstas.|<(/) ou (x)>|*<descreve o resultado obtido no teste e caso de erro insira o link do erro.>*|<observações gerais.>|
"""
    return wiki