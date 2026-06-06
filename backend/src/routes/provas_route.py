from fastapi import APIRouter, Request
from src.controllers.provas_controller import ProvaController

router = APIRouter()# Cria um roteador FastAPI para definir as rotas relacionadas às provas

@router.post("/provas")
async def prova_criar(request: Request):# Define uma rota POST para criar uma nova prova, recebendo um objeto Request para acessar os dados enviados na requisição
    dados = await request.json()# Extrai os dados JSON da requisição e os armazena na variável dados
    return await ProvaController.criar(dados)# Chama o método criar do ProvaController, passando os dados extraídos da requisição, e retorna a resposta gerada por esse método, que pode ser um JSONResponse indicando sucesso ou erro.

@router.get("/provas")
async def prova_listar():# Define uma rota GET para listar todas as provas disponíveis
    return await ProvaController.listar()# Chama o método listar do ProvaController, que retorna uma lista de provas, e retorna essa lista como resposta da requisição GET.

@router.put("/provas/{prova_id}")
async def prova_atualizar(prova_id: int, request: Request):
    dados = await request.json()
    return await ProvaController.atualizar(prova_id, dados)

@router.delete("/provas/{prova_id}")
async def prova_deletar(prova_id: int):
    return await ProvaController.deletar(prova_id)