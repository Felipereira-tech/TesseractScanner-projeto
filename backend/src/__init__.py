from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Importação dos roteadores de cada módulo do sistema para centralizar as rotas da API
from src.routes.gabarito_routes import router as gabarito_router
from src.routes.scanner_route import router as scanner_router
from src.routes.provas_route import router as provas_router
from src.routes.turmas_route import router as turmas_router
from src.routes.debug_route import router as debug_router
from src.routes.users_routes import router as users_router

def create_app():
    """
    Função de fábrica (Factory Pattern) responsável por instanciar, 
    configurar os middlewares (CORS) e registrar todas as rotas da aplicação FastAPI.
    """
    app = FastAPI() # Inicializa a instância principal da aplicação FastAPI

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"], # Permite que requisições venham de qualquer domínio (Crucial para integração com Apps/Web)
        allow_credentials=True, # Permite o envio de cookies/autenticação nas requisições cross-origin (padrão implícito quando omitido)
        allow_methods=["*"], # Permite qualquer método HTTP (GET, POST, PUT, DELETE, etc.)
        allow_headers=["*"], # Permite qualquer cabeçalho HTTP personalizado nas requisições
    ) # Configura o middleware CORS para permitir requisições de qualquer origem, método e cabeçalho

    # Registro dos roteadores de endpoints da API, injetando o prefixo global "/api" em todos eles
    # Exemplo: Se uma rota no roteador for "/corrigir", ela se torna "/api/corrigir"
    app.include_router(gabarito_router, prefix="/api") # Rotas para cadastro e gerenciamento de gabaritos oficiais
    app.include_router(scanner_router, prefix="/api")  # Rotas ligadas diretamente ao processamento de imagem do cartão
    app.include_router(provas_router, prefix="/api")   # Inclui os roteadores para as rotas de gabarito, scanner e provas, com o prefixo "api"
    app.include_router(turmas_router, prefix="/api")   # Rotas para organização de turmas e alunos
    app.include_router(debug_router, prefix="/api")    # Rotas de testes internos e visualização de imagens de depuração
    app.include_router(users_router, prefix="/api")    # Rotas de cadastro, login e manutenção de usuários

    return app # Retorna a instância da aplicação FastAPI configurada
