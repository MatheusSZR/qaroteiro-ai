from app.core.database import SessionLocal
from app.models.configuracao import Configuracao


DEFAULTS = {
    "modelo": "openai/gpt-oss-120b",
    "temperatura": 0.1,
    "max_tokens": 8000,
}

_cache = None


def _carregar_do_banco():
    db = SessionLocal()
    try:
        c = db.query(Configuracao).first()
        if not c:
            c = Configuracao(**DEFAULTS)
            db.add(c)
            db.commit()
            db.refresh(c)
        return {
            "modelo": c.modelo,
            "temperatura": c.temperatura,
            "max_tokens": c.max_tokens,
        }
    finally:
        db.close()


def carregar():
    global _cache
    _cache = _carregar_do_banco()
    return _cache


def get():
    global _cache
    if _cache is None:
        return carregar()
    return _cache


def atualizar(novo: dict):
    global _cache
    db = SessionLocal()
    try:
        c = db.query(Configuracao).first()
        if not c:
            c = Configuracao(**DEFAULTS)
            db.add(c)
            db.commit()
            db.refresh(c)

        if "modelo" in novo and novo["modelo"]:
            c.modelo = novo["modelo"]
        if "temperatura" in novo and novo["temperatura"] is not None:
            c.temperatura = float(novo["temperatura"])
        if "max_tokens" in novo and novo["max_tokens"] is not None:
            c.max_tokens = int(novo["max_tokens"])

        db.commit()
        db.refresh(c)
        _cache = {
            "modelo": c.modelo,
            "temperatura": c.temperatura,
            "max_tokens": c.max_tokens,
        }
        return _cache
    finally:
        db.close()