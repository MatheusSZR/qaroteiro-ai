import json
import re
from typing import Optional
from difflib import SequenceMatcher


def _tentar_fechar_json(texto: str) -> Optional[str]:
    """
    Tenta fechar um JSON truncado adicionando delimitadores faltantes.
    Funciona para JSONs cortados no meio de strings/arrays.
    """
    # Localiza o início
    inicio = texto.find("{")
    if inicio == -1:
        return None
    texto = texto[inicio:]

    # Se já está completo, retorna como está
    try:
        json.loads(texto)
        return texto
    except json.JSONDecodeError:
        pass

    # Fecha strings abertas
    em_string = False
    escape = False
    ultimo_char_valido = len(texto) - 1

    for i, ch in enumerate(texto):
        if escape:
            escape = False
            continue
        if ch == "\\":
            escape = True
            continue
        if ch == '"':
            em_string = not em_string
        if not em_string:
            ultimo_char_valido = i

    # Se ainda está dentro de uma string, fecha
    if em_string:
        texto = texto[:ultimo_char_valido + 1]
        texto += '"'

    # Conta aberturas não fechadas
    abre_chaves = texto.count("{") - texto.count("}")
    abre_colchetes = texto.count("[") - texto.count("]")

    # Remove vírgulas/traços pendentes no final
    texto = re.sub(r"[,\s]+$", "", texto)
    texto = re.sub(r":\s*$", ": null", texto)

    # Fecha os colchetes e chaves
    texto += "]" * max(0, abre_colchetes)
    texto += "}" * max(0, abre_chaves)

    try:
        json.loads(texto)
        return texto
    except json.JSONDecodeError:
        return None


def extrair_json(texto: str) -> Optional[dict]:
    """
    Tenta extrair um objeto JSON de uma string, mesmo que contenha
    texto antes/depois, esteja envolto em ```json ... ```, ou esteja truncado.
    """
    if not texto:
        return None

    # Remove blocos de markdown
    texto_limpo = re.sub(r"```(?:json)?", "", texto).strip()
    texto_limpo = texto_limpo.replace("```", "").strip()

    # Tentativa 1: parse direto
    try:
        return json.loads(texto_limpo)
    except json.JSONDecodeError:
        pass

    # Tentativa 2: encontrar { ... }
    inicio = texto_limpo.find("{")
    fim = texto_limpo.rfind("}")
    if inicio != -1 and fim != -1 and fim > inicio:
        try:
            return json.loads(texto_limpo[inicio:fim + 1])
        except json.JSONDecodeError:
            pass

    # Tentativa 3: JSON truncado — tentar fechar
    fechado = _tentar_fechar_json(texto_limpo)
    if fechado:
        try:
            return json.loads(fechado)
        except json.JSONDecodeError:
            pass

    return None


def _similaridade(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def remover_cts_duplicados(casos: list, limiar: float = 0.6) -> list:
    unicos = []
    for ct in casos:
        texto = (ct.titulo or "") + " | " + " ".join(ct.resultado_esperado or [])
        duplicado = False
        for outro in unicos:
            texto_outro = (outro.titulo or "") + " | " + " ".join(outro.resultado_esperado or [])
            if _similaridade(texto, texto_outro) >= limiar:
                duplicado = True
                break
        if not duplicado:
            unicos.append(ct)
    return unicos
def para_string(valor) -> str:
    """
    Normaliza um valor para string.
    - Se for None, retorna "N/A".
    - Se for string, retorna como está (ou "N/A" se vazia).
    - Se for lista, junta com "; ".
    - Se for dict, converte para JSON.
    - Outros tipos viram str().
    """
    if valor is None:
        return "N/A"
    if isinstance(valor, str):
        return valor.strip() or "N/A"
    if isinstance(valor, list):
        partes = [str(v).strip() for v in valor if str(v).strip()]
        return "; ".join(partes) if partes else "N/A"
    if isinstance(valor, dict):
        import json as _json
        return _json.dumps(valor, ensure_ascii=False)
    return str(valor)