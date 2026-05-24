from fastapi import APIRouter, Request
from src.controllers.provas_controller import ProvaController

router = APIRouter()# Cria um roteador FastAPI para definir as rotas relacionadas às provas

@router.post("/provas")
async def prova_criar(request: Request):# Define uma rota POST para criar uma nova prova, recebendo um objeto Request para acessar os dados enviados na requisição
    dados = await request.json()# Extrai os dados JSON da requisição e os armazena na variável dados
    return await ProvaController.criar(dados)# Chama o método criar do ProvaController, passando os dados extraídos da requisição, e retorna a resposta gerada por esse método, que pode ser um JSONResponse indicando sucesso ou erro.