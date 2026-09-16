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
    """Aplica negrito duplo APENAS na palavra-chave inicial."""
    texto = texto.strip()

    for kw in ["Dado que", "Quando", "Então"]:
        if texto.startswith(kw + " "):
            return f"**{kw}**" + texto[len(kw):]

    if texto == "E" or texto.startswith("E "):
        return "**E**" + texto[1:]

    return texto


def _sanitizar(texto: str, max_len: int = 1500) -> str:
    if not texto:
        return ""
    texto = texto.replace("\r", " ").replace("\n", " ")
    texto = re.sub(r"\s+", " ", texto).strip()
    if len(texto) > max_len:
        texto = texto[: max_len - 3] + "..."
    return texto


def _capitalizar(texto: str) -> str:
    if not texto or texto == "N/A":
        return texto
    return texto[0].upper() + texto[1:]


def _formatar_link(url: str, texto: str = "") -> str:
    url = (url or "").strip()
    if not url or url.upper() == "N/A":
        return "N/A"
    if texto:
        return f"[[{url}|{texto}]]"
    return f"[[{url}]]"


def _formatar_linhas_dokuwiki(linhas: list, separador_final: str) -> str:
    """
    Junta linhas com ' \\\\ ' (quebra DokuWiki).
    Corrige bug de vírgula duplicada após ':' e de falta de espaço em '**E**m'.
    """
    if not linhas:
        return ""

    processadas = [_aplicar_negrito(l) for l in linhas]

    saida = ""
    for i, linha in enumerate(processadas):
        linha_limpa = linha.strip()
        ultima = (i == len(processadas) - 1)

        if ultima:
            if linha_limpa.endswith(":"):
                saida += linha_limpa + separador_final
            elif linha_limpa.endswith((".", "!", "?")):
                saida += linha_limpa
            else:
                saida += linha_limpa + separador_final
        else:
            if linha_limpa.endswith(":"):
                saida += linha_limpa + " \\\\ "
            else:
                saida += linha_limpa.rstrip(".,;") + ", \\\\ "

    return saida


def _gerar_ct_dokuwiki(ct: CasoTeste, idx: int) -> str:
    ct_id = ct.id or f"CT-{idx:02d}"
    passos = _formatar_linhas_dokuwiki(ct.passos, ",")
    resultado = _formatar_linhas_dokuwiki(ct.resultado_esperado, ".")

    return (
        f"^ {ct_id} | |\n"
        f"| Fluxo | {_sanitizar(ct.fluxo)} |\n"
        f"| Titulo | {_sanitizar(ct.titulo)} |\n"
        f"| Passos | {passos} |\n"
        f"| Resultado Esperado | {resultado} |\n"
        f"| Resultado | ✔ ou ❌ |\n"
        f"| Resultado obtido | <descreve o resultado obtido no teste e caso de erro insira o link do erro.> |"
    )


def gerar_dokuwiki(analise: AnaliseHU, meta: dict = None) -> str:
    num_cts = len(analise.casos_teste)

    identificacao = _sanitizar(analise.identificacao_alm) or "(a preencher)"
    link_hu = _formatar_link(analise.link_hu)
    link_sistema = _formatar_link(analise.link_sistema)
    usuario_senha = _sanitizar(analise.usuario_senha) or "(a preencher)"
    objetivo = _sanitizar(analise.objetivo, max_len=1000)
    pre_condicao = _capitalizar(_sanitizar(analise.pre_condicao, max_len=500))

    # Tipo de Demanda
    tipo_demanda = (analise.tipo_demanda or "Nova funcionalidade").strip()
    if tipo_demanda == "Outros":
        extra = _sanitizar(analise.tipo_demanda_outros or "")
        tipo_demanda_txt = f"Outros, especificar: {extra}" if extra else "Outros, especificar"
    else:
        tipo_demanda_txt = tipo_demanda

       # Tipo de Teste
    tipo_teste = (analise.tipo_teste_sugerido or "Funcional").strip()

    cts = "\n\n".join(_gerar_ct_dokuwiki(ct, i + 1) for i, ct in enumerate(analise.casos_teste))

    wiki = f"""====== PLANO DE TESTE ======
===== {identificacao} =====

==== **1. Identificação:** ====
^ Identificação do ALM | {identificacao} |
^ Link do sistema/Funcionalidade | {link_sistema} |
^ Usuário e senha | {usuario_senha} |
^ Tipo de Demanda | {tipo_demanda_txt} |
^ Tipo de Teste | {tipo_teste} |
^ História de Usuário: | {link_hu} |
^ Objetivo e prioridades | {objetivo} |
^ Pré - Condição | {pre_condicao} |

==== **2. Informações Gerais:** ====
^ Número de Casos de Teste | {num_cts} |
^ Validações | <quantidades de sucessos e erros> |
^ Observação | {num_cts} casos de teste gerados a partir da HU. |

==== **3. Validações de cenários:** ====

**Validação do caminho de acesso**
^ Ação do Usuário ^ Resultado Esperado ^ Resultado ^ Resultado Obtido ^ Observação ^
| **Dado que** o usuário acesse o caminho de acesso | O sistema deve apresentar a tela objeto de teste | ✔ ou ❌ | <descreve o resultado obtido no teste e caso de erro insira o link do erro.> | <observações gerais.> |

**Casos de teste**

{cts}

**Validação de protótipo**
^ Ação do Usuário ^ Resultado Esperado ^ Resultado ^ Resultado Obtido ^ Observação ^
| **Dado que** o usuário siga o caminho de acesso | O sistema deve apresentar as telas, conforme os protótipos da HU | ✔ ou ❌ | <descreve o resultado obtido no teste e caso de erro insira o link do erro.> | protótipos apresentados na HU: |

**Validação de tabela**
^ Ação do Usuário ^ Resultado Esperado ^ Resultado ^ Resultado Obtido ^ Observação ^
| **Dado que** o usuário siga o caminho de acesso | O sistema deve apresentar os campos e funcionalidades, conforme tabelas da HU | ✔ ou ❌ | <descreve o resultado obtido no teste e caso de erro insira o link do erro.> | tabelas apresentadas na HU: |

**Validação de mensagem**
^ Ação do Usuário ^ Resultado Esperado ^ Resultado ^ Resultado Obtido ^ Observação ^
| **Dado que** o usuário siga o caminho de acesso | O sistema deve apresentar todos os campos em pleno funcionamento, conforme suas funções previstas. | ✔ ou ❌ | <descreve o resultado obtido no teste e caso de erro insira o link do erro.> | <observações gerais.> |

**Validação de regra de negócio**
^ Ação do Usuário ^ Resultado Esperado ^ Resultado ^ Resultado Obtido ^ Observação ^
| **Dado que** o usuário siga o caminho de acesso | O sistema deve apresentar todos os campos em pleno funcionamento, conforme suas funções previstas. | ✔ ou ❌ | <descreve o resultado obtido no teste e caso de erro insira o link do erro.> | <observações gerais.> |

**Validação de vídeo da funcionalidade**
^ Ação do Usuário ^ Resultado Esperado ^ Resultado ^ Resultado Obtido ^ Observação ^
| **Dado que** o usuário siga o caminho de acesso | O sistema deve apresentar todos os campos em pleno funcionamento, conforme suas funções previstas. | ✔ ou ❌ | <descreve o resultado obtido no teste e caso de erro insira o link do erro.> | <observações gerais.> |
"""
    return wiki