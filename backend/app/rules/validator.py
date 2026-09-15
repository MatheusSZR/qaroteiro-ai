import re
from difflib import SequenceMatcher
from typing import List, Dict, Any, Set
from app.schemas.roteiro import AnaliseHU, CasoTeste


# Palavras comuns que NÃO devem ser consideradas "termos inventados"
STOPWORDS = {
    "sistema", "usuario", "usuário", "dado", "quando", "entao", "então", "que",
    "deve", "deveria", "poderia", "apresentar", "apresenta", "analisar", "analise",
    "processar", "processo", "gerar", "gera", "executar", "executa", "ser", "estar",
    "para", "com", "sem", "por", "uma", "uno", "dos", "das", "nos", "nas", "seu",
    "sua", "cada", "todos", "todas", "ainda", "entao", "assim", "como", "onde",
    "quando", "apos", "após", "antes", "durante", "sobre", "entre", "isso", "este",
    "essa", "esse", "aquilo", "aquele", "aquela", "novo", "nova", "realizar",
    "realiza", "fazer", "feito", "caso", "tipo", "campo", "campos", "valor", "valores",
}


def _similaridade(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def _sem_numeros(texto: str) -> str:
    texto = re.sub(r"\bRN\d+\b", "", texto, flags=re.IGNORECASE)
    texto = re.sub(r"\bCT-?\d+\b", "", texto, flags=re.IGNORECASE)
    texto = re.sub(r"\d+", "", texto)
    texto = re.sub(r"\s+", " ", texto).strip()
    return texto


def _tokens(texto: str) -> Set[str]:
    """Extrai palavras significativas (4+ letras, sem stopwords)."""
    palavras = re.findall(r"\b[a-záéíóúâêôãõç]{4,}\b", texto.lower())
    return {p for p in palavras if p not in STOPWORDS}


def _extrair_datas(texto: str) -> List[str]:
    return re.findall(r"\b\d{2}[/-]\d{2}[/-]\d{4}\b", texto)


def _extrair_entre_aspas(texto: str) -> List[str]:
    duplas = re.findall(r'"([^"]{2,60})"', texto)
    simples = re.findall(r"'([^']{2,60})'", texto)
    return duplas + simples


# ─────────────────────────────────────────────────────────
# Validações
# ─────────────────────────────────────────────────────────

def _validar_estrutura_cts(casos: List[CasoTeste]) -> List[Dict[str, Any]]:
    erros = []
    for ct in casos:
        if not ct.titulo.strip():
            erros.append({"ct_id": ct.id, "tipo": "estrutura", "mensagem": "CT sem título."})
        if not ct.passos:
            erros.append({"ct_id": ct.id, "tipo": "estrutura", "mensagem": "CT sem passos."})
        if not ct.resultado_esperado:
            erros.append({"ct_id": ct.id, "tipo": "estrutura", "mensagem": "CT sem resultado esperado."})

        for p in ct.passos:
            if p.strip().lower().startswith("então"):
                erros.append({
                    "ct_id": ct.id, "tipo": "estrutura",
                    "mensagem": f'"Então" dentro dos Passos: "{p[:60]}..."'
                })

        qtd_entao = sum(1 for r in ct.resultado_esperado if r.strip().lower().startswith("então"))
        if qtd_entao > 1:
            erros.append({
                "ct_id": ct.id, "tipo": "estrutura",
                "mensagem": f'Resultado tem {qtd_entao} linhas começando com "Então" (máximo 1).'
            })
    return erros


def _validar_duplicatas(casos: List[CasoTeste], limiar: float = 0.85) -> List[Dict[str, Any]]:
    avisos = []
    for i, ct_a in enumerate(casos):
        for ct_b in casos[i + 1:]:
            a_sem_num = _sem_numeros(ct_a.titulo)
            b_sem_num = _sem_numeros(ct_b.titulo)
            if a_sem_num.lower() == b_sem_num.lower() and a_sem_num:
                continue
            sim = _similaridade(ct_a.titulo, ct_b.titulo)
            if sim >= limiar:
                avisos.append({
                    "ct_ids": [ct_a.id, ct_b.id], "tipo": "duplicata",
                    "similaridade": round(sim, 2),
                    "mensagem": f'{ct_a.id} e {ct_b.id} muito similares ({int(sim * 100)}%).'
                })
    return avisos


def _validar_informacao_inventada(casos: List[CasoTeste], hu_original: str) -> List[Dict[str, Any]]:
    """
    Compara datas, termos entre aspas e substantivos dos CTs com a HU.
    """
    avisos = []
    hu_lower = hu_original.lower()
    hu_tokens = _tokens(hu_original)

    for ct in casos:
        texto_ct = " ".join(ct.passos + ct.resultado_esperado)

        # Datas
        for data in _extrair_datas(texto_ct):
            if data not in hu_original:
                variacao = data.replace("/", "-") if "/" in data else data.replace("-", "/")
                if variacao not in hu_original:
                    avisos.append({
                        "ct_id": ct.id, "tipo": "inventado", "valor": data,
                        "mensagem": f'Data "{data}" no {ct.id} não aparece na HU.'
                    })

        # Termos entre aspas
        for termo in _extrair_entre_aspas(texto_ct):
            t_lower = termo.lower()
            if t_lower in ("ok", "cancelar", "enviar", "todos", "n/a"):
                continue
            if t_lower not in hu_lower:
                avisos.append({
                    "ct_id": ct.id, "tipo": "inventado", "valor": termo,
                    "mensagem": f'Termo "{termo}" no {ct.id} não aparece na HU.'
                })

        # Substantivos do título não presentes na HU (heurística para detectar CT inventado)
        tokens_titulo = _tokens(ct.titulo)
        tokens_inventados = tokens_titulo - hu_tokens
        if len(tokens_titulo) >= 3 and len(tokens_inventados) >= 2:
            avisos.append({
                "ct_id": ct.id, "tipo": "inventado",
                "valor": ", ".join(sorted(tokens_inventados)),
                "mensagem": f'{ct.id} contém termos que não aparecem na HU: {", ".join(sorted(tokens_inventados))}. Pode ser cenário inventado.'
            })

    # Deduplica avisos por (ct_id, valor)
    vistos = set()
    unicos = []
    for a in avisos:
        chave = (a["ct_id"], a.get("valor", ""))
        if chave not in vistos:
            vistos.add(chave)
            unicos.append(a)
    return unicos


def _validar_cobertura(analise: AnaliseHU) -> Dict[str, Any]:
    texto_cts = " ".join(
        (ct.titulo + " " + " ".join(ct.passos) + " " + " ".join(ct.resultado_esperado))
        for ct in analise.casos_teste
    ).lower()

    cenarios_cobertos = []
    cenarios_faltando = []
    for cen in analise.cenarios_hu:
        palavras = [w for w in re.findall(r"\b\w{5,}\b", cen.lower())]
        if not palavras:
            cenarios_cobertos.append(cen)
            continue
        acertos = sum(1 for w in palavras if w in texto_cts)
        if acertos / len(palavras) >= 0.4:
            cenarios_cobertos.append(cen)
        else:
            cenarios_faltando.append(cen)

    # Procura RNs na HU inteira (não só no campo regras_negocio)
    regras_hu_set = set(r.upper() for r in re.findall(r"\bRN\d{2,4}\b", analise.regras_negocio or ""))
    # Adiciona RNs dos cenários também
    for cen in analise.cenarios_hu:
        for rn in re.findall(r"\bRN\d{2,4}\b", cen):
            regras_hu_set.add(rn.upper())

    regras_hu_upper = sorted(regras_hu_set)
    regras_faltando = [rn for rn in regras_hu_upper if rn.lower() not in texto_cts]

    return {
        "cenarios_cobertos": cenarios_cobertos,
        "cenarios_faltando": cenarios_faltando,
        "regras_hu": regras_hu_upper,
        "regras_faltando": regras_faltando,
    }


def _validar_formato_jira(wiki: str) -> List[Dict[str, Any]]:
    erros = []

    matches_demanda = re.findall(r"\(/\)\s*(Melhoria|Nova funcionalidade|Outros)", wiki)
    if len(matches_demanda) > 1:
        erros.append({
            "tipo": "formato",
            "mensagem": f"Tipo de Demanda tem {len(matches_demanda)} opções marcadas com (/)."
        })

    linha_teste = re.search(r"\|\|Tipo de Teste\|(.+?)\|", wiki)
    if linha_teste:
        marcadas = re.findall(r"\(/\)", linha_teste.group(1))
        if len(marcadas) > 1:
            erros.append({
                "tipo": "formato",
                "mensagem": f"Tipo de Teste tem {len(marcadas)} opções marcadas com (/)."
            })

    linhas = wiki.split("\n")
    for i, linha in enumerate(linhas):
        if linha.strip() != "":
            continue
        anterior = next((linhas[j] for j in range(i - 1, -1, -1) if linhas[j].strip()), "")
        proxima = next((linhas[j] for j in range(i + 1, len(linhas)) if linhas[j].strip()), "")
        anterior_e_tabela = anterior.strip().startswith("|")
        proxima_e_tabela = proxima.strip().startswith("|")
        proxima_e_cabecalho_novo = proxima.strip().startswith("||")

        if anterior_e_tabela and proxima_e_tabela and not proxima_e_cabecalho_novo:
            erros.append({
                "tipo": "formato",
                "mensagem": f"Linha vazia dentro de uma tabela (linha {i + 1})."
            })

    return erros


# ─────────────────────────────────────────────────────────
# Principal
# ─────────────────────────────────────────────────────────

def validar(analise: AnaliseHU, hu_original: str, wiki: str) -> Dict[str, Any]:
    erros = []
    avisos = []

    erros.extend(_validar_estrutura_cts(analise.casos_teste))
    erros.extend(_validar_formato_jira(wiki))

    avisos.extend(_validar_duplicatas(analise.casos_teste))
    avisos.extend(_validar_informacao_inventada(analise.casos_teste, hu_original))

    cobertura = _validar_cobertura(analise)
    for cen in cobertura["cenarios_faltando"]:
        avisos.append({
            "tipo": "cobertura",
            "mensagem": f'Cenário da HU pode não estar coberto: "{cen[:80]}"'
        })
    for rn in cobertura["regras_faltando"]:
        avisos.append({
            "tipo": "cobertura",
            "mensagem": f"Regra de negócio {rn} não aparece em nenhum CT."
        })

    score = 100 - (len(erros) * 10) - (len(avisos) * 3)
    score = max(0, min(100, score))

    return {
        "score": score,
        "erros": erros,
        "avisos": avisos,
        "cobertura": cobertura,
        "total_erros": len(erros),
        "total_avisos": len(avisos),
    }