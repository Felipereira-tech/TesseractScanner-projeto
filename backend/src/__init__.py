from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes.gabarito_routes import router as gabarito_router
from src.routes.scanner_route import router as scanner_router
from src.routes.provas_route import router as provas_router
from src.routes.turmas_route import router as turmas_router

def create_app():
    app = FastAPI()# Inicializa a aplicação FastAPI
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
     ) # Configura o middleware CORS para permitir requisições de qualquer origem, método e cabeçalho
    
    app.include_router(gabarito_router, prefix="/api")
    app.include_router(scanner_router, prefix="/api")
    app.include_router(provas_router, prefix= "/api")# Inclui os roteadores para as rotas de gabarito, scanner e provas, com o prefixo "api"
    app.include_router(turmas_router, prefix="/api") 
    
    return app# Retorna a instância da aplicação FastAPI configurada    