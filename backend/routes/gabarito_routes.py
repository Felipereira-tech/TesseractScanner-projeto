# routes/gabarito_routes.py
from fastapi import APIRouter, UploadFile, File, Form
from controllers.gabarito_controller import GabaritoController

router = APIRouter()

@router.post("/gabaritos/cadastrar")
async def rota_cadastrar_gabarito(
    prova_id: int = Form(...),
    respostas_raw: str = Form(...)
):
    """ Direciona requisição de cadastro para o Controller """
    return GabaritoController.cadastrar(prova_id, respostas_raw)

@router.post("/corrigir-dinamico/")
async def rota_corrigir_dinamico(
    prova_id: int = Form(...),
    nome_aluno: str = Form(...),
    id_turma: int = Form(...),
    file: UploadFile = File(...)
):
    """ Direciona imagem e dados para o Controller """
    return await GabaritoController.corrigir(prova_id, nome_aluno, id_turma, file)