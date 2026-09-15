import json
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.roteiro import RoteiroSalvo
from app.schemas.roteiro import AnaliseHU, HistoricoItem, HistoricoDetalhe


def _iso_utc(dt) -> str:
    """Converte datetime naive (UTC) para string ISO com 'Z' no final."""
    if not dt:
        return ""
    iso = dt.isoformat()
    if not iso.endswith("Z") and "+" not in iso[-6:]:
        iso += "Z"
    return iso


class HistoricoService:
    def __init__(self, db: Session):
        self.db = db

    def salvar(
        self,
        analise: AnaliseHU,
        hu_original: str,
        jira_wiki: str,
        dokuwiki: str,
        validacao: Optional[dict],
    ) -> RoteiroSalvo:
        score = validacao.get("score", 0) if validacao else 0

        roteiro = RoteiroSalvo(
            identificacao_alm=analise.identificacao_alm or "",
            nome_historia=analise.nome_historia or "",
            quantidade_cts=len(analise.casos_teste),
            score=score,
            hu_original=hu_original,
            analise_json=analise.model_dump_json(),
            jira_wiki=jira_wiki,
            dokuwiki=dokuwiki,
            validacao_json=json.dumps(validacao, ensure_ascii=False) if validacao else "{}",
        )
        self.db.add(roteiro)
        self.db.commit()
        self.db.refresh(roteiro)
        return roteiro

    def listar(self, limite: int = 100) -> List[HistoricoItem]:
        registros = (
            self.db.query(RoteiroSalvo)
            .order_by(RoteiroSalvo.criado_em.desc())
            .limit(limite)
            .all()
        )
        return [
            HistoricoItem(
                id=r.id,
                identificacao_alm=r.identificacao_alm or "",
                nome_historia=r.nome_historia or "",
                criado_em=_iso_utc(r.criado_em),
                quantidade_cts=r.quantidade_cts or 0,
                score=r.score or 0,
            )
            for r in registros
        ]

    def buscar(self, roteiro_id: int) -> Optional[HistoricoDetalhe]:
        r = self.db.query(RoteiroSalvo).filter(RoteiroSalvo.id == roteiro_id).first()
        if not r:
            return None

        try:
            analise = AnaliseHU.model_validate_json(r.analise_json or "{}")
        except Exception:
            analise = AnaliseHU()

        try:
            validacao = json.loads(r.validacao_json or "{}") or None
        except Exception:
            validacao = None

        return HistoricoDetalhe(
            id=r.id,
            identificacao_alm=r.identificacao_alm or "",
            nome_historia=r.nome_historia or "",
            criado_em=_iso_utc(r.criado_em),
            quantidade_cts=r.quantidade_cts or 0,
            score=r.score or 0,
            hu_original=r.hu_original or "",
            analise=analise,
            jira_wiki=r.jira_wiki or "",
            dokuwiki=r.dokuwiki or "",
            validacao=validacao,
        )

    def excluir(self, roteiro_id: int) -> bool:
        r = self.db.query(RoteiroSalvo).filter(RoteiroSalvo.id == roteiro_id).first()
        if not r:
            return False
        self.db.delete(r)
        self.db.commit()
        return True