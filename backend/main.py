# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import gabarito_routes

app = FastAPI(title="Arquitetura em Camadas")

# Permissões do Front-End (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra as rotas que criamos
app.include_router(gabarito_routes.router)

@app.get("/")
def root():
    return {"status": "Motor de Correção Online e Operante"}