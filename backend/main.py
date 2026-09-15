from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.core.database import criar_tabelas
from app.core import config_store
import uvicorn

app = FastAPI(title="QARoteiro AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.on_event("startup")
def on_startup():
    criar_tabelas()
    config_store.carregar()
    print("[db] Tabelas verificadas/criadas com sucesso.")
    print("[config] Configurações carregadas.")


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "QARoteiro AI backend está rodando!"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)