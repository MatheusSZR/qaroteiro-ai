from sqlalchemy import Column, Integer, String, Float
from app.core.database import Base


class Configuracao(Base):
    __tablename__ = "configuracoes"

    id = Column(Integer, primary_key=True, index=True)
    modelo = Column(String(100), default="openai/gpt-oss-120b")
    temperatura = Column(Float, default=0.1)
    max_tokens = Column(Integer, default=8000)