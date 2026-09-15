from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.schemas.roteiro import (
    HUInput, AnalyzeResponse, HistoricoItem, HistoricoDetalhe, RegenerateInput,
    ConfiguracaoResponse, ConfiguracaoUpdate,
)
from app.services.analyzer import AnalyzerService
from app.services.historico import HistoricoService
from app.generators.jira_generator import gerar_jira_wiki
from app.generators.dokuwiki_generator import gerar_dokuwiki
from app.rules.validator import validar
from app.core.database import get_db
from app.core import config_store


router = APIRouter(prefix="/api/v1", tags=["roteiro"])
analyzer = AnalyzerService()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_hu(data: HUInput, db: Session = Depends(get_db)):
    if not data.texto.strip():
        raise HTTPException(status_code=400, detail="A HU não pode estar vazia.")

    resultado = await analyzer.analyze_hu(data.texto)

    if not resultado.erro and resultado.analise.casos_teste:
        try:
            HistoricoService(db).salvar(
                analise=resultado.analise,
                hu_original=data.texto,
                jira_wiki=resultado.jira_wiki,
                dokuwiki=resultado.dokuwiki,
                validacao=resultado.validacao,
            )
        except Exception as e:
            print(f"[histórico] Erro ao salvar: {e}")

    return resultado


@router.post("/regenerate", response_model=AnalyzeResponse)
def regenerate(data: RegenerateInput):
    jira_wiki = gerar_jira_wiki(data.analise)
    dokuwiki = gerar_dokuwiki(data.analise)
    validacao = validar(data.analise, data.hu_original, jira_wiki)

    return AnalyzeResponse(
        analise=data.analise,
        quantidade_palavras=len(data.hu_original.split()),
        jira_wiki=jira_wiki,
        dokuwiki=dokuwiki,
        validacao=validacao,
    )


@router.get("/historico", response_model=List[HistoricoItem])
def listar_historico(db: Session = Depends(get_db)):
    return HistoricoService(db).listar()


@router.get("/historico/{roteiro_id}", response_model=HistoricoDetalhe)
def obter_historico(roteiro_id: int, db: Session = Depends(get_db)):
    item = HistoricoService(db).buscar(roteiro_id)
    if not item:
        raise HTTPException(status_code=404, detail="Roteiro não encontrado.")
    return item


@router.delete("/historico/{roteiro_id}")
def excluir_historico(roteiro_id: int, db: Session = Depends(get_db)):
    ok = HistoricoService(db).excluir(roteiro_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Roteiro não encontrado.")
    return {"ok": True}


@router.get("/estatisticas")
def estatisticas(db: Session = Depends(get_db)):
    from app.models.roteiro import RoteiroSalvo
    total_roteiros = db.query(RoteiroSalvo).count()
    total_cts = db.query(func.coalesce(func.sum(RoteiroSalvo.quantidade_cts), 0)).scalar() or 0
    hus_distintas = db.query(RoteiroSalvo.hu_original).distinct().count()

    return {
        "total_roteiros": total_roteiros,
        "total_cts": int(total_cts),
        "total_hus": hus_distintas,
    }


# ─── Configurações ───
@router.get("/configuracoes", response_model=ConfiguracaoResponse)
def obter_configuracoes():
    cfg = config_store.get()
    return ConfiguracaoResponse(**cfg)


@router.put("/configuracoes", response_model=ConfiguracaoResponse)
def atualizar_configuracoes(data: ConfiguracaoUpdate):
    cfg = config_store.atualizar(data.model_dump(exclude_none=True))
    return ConfiguracaoResponse(**cfg)