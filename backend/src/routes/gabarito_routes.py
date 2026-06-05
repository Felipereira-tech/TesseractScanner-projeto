from fastapi import APIRouter, Form, File, UploadFile, Body
from src.controllers.gabarito_controller import GabaritoController
from typing import List

router = APIRouter()# Cria um roteador FastAPI para definir as rotas relacionadas ao gabarito

@router.post("/gabarito")# Define uma rota POST para o endpoint "/gabarito"
@router.post("/gabaritos/cadastrar")# Define uma rota POST para o endpoint "/gabaritos/cadastrar"

async def gabarito_cadastrar(
    prova_id: int = Form(...),
    respostas_raw: str = Form(...)# Define os parâmetros esperados na requisição, onde prova_id é um inteiro obrigatório e respostas_raw é uma string obrigatória, ambos recebidos como dados de formulário
):
    return await GabaritoController.cadastrar(prova_id, respostas_raw)# Chama o método cadastrar do GabaritoController, passando os parâmetros recebidos, e retorna a resposta da operação de cadastro do gabarito  

@router.post("/gabaritos/corrigir")
@router.post("/corrigir-dinamico")
async def gabarito_corrigir(
    prova_id: int = Form(...),
    nome_aluno: str = Form(...),
    id_turma: int = Form(1),# Define os parâmetros esperados na requisição, onde prova_id é um inteiro obrigatório, nome_aluno é uma string obrigatória e id_turma é um inteiro opcional com valor padrão 1, todos recebidos como dados de formulário
    file: UploadFile = File(...)# Define os parâmetros esperados na requisição, onde prova_id é um inteiro obrigatório, nome_aluno é uma string obrigatória, id_turma é um inteiro obrigatório e file é um arquivo obrigatório recebido como parte da requisição multipart/form-data
):
    return await GabaritoController.corrigir(prova_id, nome_aluno, id_turma, file)# Chama o método corrigir do GabaritoController, passando os parâmetros recebidos, e retorna a resposta da operação de correção do gabarito

@router.post("/gabaritos/coluna")
async def gabrito_coluna(
    prova_id: int = Form(...),
    coluna: int = Form(...),
    file: UploadFile = File(...)
):
    return await GabaritoController.processar_coluna(prova_id, coluna, file)

@router.post("/gabaritos/finalizar")
async def gabarito_finalizar(payload: dict = Body(...)):
    return await GabaritoController.finalizar(payload)