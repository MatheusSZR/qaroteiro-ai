from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.core.database import Base


class RoteiroSalvo(Base):
    __tablename__ = "roteiros"

    id = Column(Integer, primary_key=True, index=True)
    identificacao_alm = Column(String(300), default="")
    nome_historia = Column(String(300), default="")
    criado_em = Column(DateTime, default=datetime.utcnow, index=True)
    quantidade_cts = Column(Integer, default=0)
    score = Column(Integer, default=0)

    hu_original = Column(Text, default="")
    analise_json = Column(Text, default="{}")
    jira_wiki = Column(Text, default="")
    dokuwiki = Column(Text, default="")
    validacao_json = Column(Text, default="{}")