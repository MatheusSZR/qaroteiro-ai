from pydantic import BaseModel, field_validator
from typing import List, Optional, Any, Dict


class HUInput(BaseModel):
    texto: str


class CasoTeste(BaseModel):
    id: str = ""
    fluxo: str = ""
    titulo: str = ""
    passos: List[str] = []
    resultado_esperado: List[str] = []
    origem: str = ""

    @field_validator("passos", "resultado_esperado", mode="before")
    @classmethod
    def _normalizar_lista(cls, v: Any) -> List[str]:
        if v is None:
            return []
        if isinstance(v, str):
            linhas = [l.strip() for l in v.split("\n") if l.strip()]
            return linhas if linhas else []
        if isinstance(v, list):
            normalizado = []
            for item in v:
                if item is None:
                    continue
                s = str(item).strip()
                if s:
                    for sub in s.split("\n"):
                        sub = sub.strip()
                        if sub:
                            normalizado.append(sub)
            return normalizado
        return [str(v)]


class AnaliseHU(BaseModel):
    identificacao_alm: str = ""
    nome_historia: str = ""
    link_hu: str = ""
    link_sistema: str = ""
    usuario_senha: str = ""
    tipo_demanda: str = "Nova funcionalidade"
    tipo_demanda_outros: str = ""
    tipo_teste_sugerido: str = "Funcional"       # ← campo adicionado
    objetivo: str = "N/A"
    pre_condicao: str = "N/A"
    cenarios_hu: List[str] = []
    prototipos: str = "N/A"
    tabelas: str = "N/A"
    mensagens: str = "N/A"
    regras_negocio: str = "N/A"
    casos_teste: List[CasoTeste] = []


class AnalyzeResponse(BaseModel):
    analise: AnaliseHU
    quantidade_palavras: int
    jira_wiki: str = ""
    dokuwiki: str = ""
    validacao: Optional[Dict[str, Any]] = None
    erro: Optional[str] = None


class HistoricoItem(BaseModel):
    id: int
    identificacao_alm: str = ""
    nome_historia: str = ""
    criado_em: str = ""
    quantidade_cts: int = 0
    score: int = 0


class HistoricoDetalhe(BaseModel):
    id: int
    identificacao_alm: str = ""
    nome_historia: str = ""
    criado_em: str = ""
    quantidade_cts: int = 0
    score: int = 0
    hu_original: str = ""
    analise: AnaliseHU
    jira_wiki: str = ""
    dokuwiki: str = ""
    validacao: Optional[Dict[str, Any]] = None


class ConfiguracaoResponse(BaseModel):
    modelo: str = "openai/gpt-oss-120b"
    temperatura: float = 0.1
    max_tokens: int = 8000


class ConfiguracaoUpdate(BaseModel):
    modelo: Optional[str] = None
    temperatura: Optional[float] = None
    max_tokens: Optional[int] = None


class RegenerateInput(BaseModel):
    analise: AnaliseHU
    hu_original: str = ""
    meta: Dict[str, Any] = {}