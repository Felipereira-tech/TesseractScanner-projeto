from fastapi import APIRouter, Request
from src.controllers.users_controller import UserController

router = APIRouter()


@router.post("/usuarios/cadastro")
async def usuarios_criar(request: Request):
    dados = await request.json()
    return await UserController.criar(dados)


@router.post("/usuarios/login")
async def usuarios_autenticar(request: Request):
    dados = await request.json()
    return await UserController.autenticar(dados)


@router.get("/usuarios")
async def usuarios_listar():
    return await UserController.listar()


@router.get("/usuarios/{usuario_id}")
async def usuarios_buscar(usuario_id: int):
    return await UserController.buscar_por_id(usuario_id)


@router.put("/usuarios/{usuario_id}")
async def usuarios_atualizar(usuario_id: int, request: Request):
    dados = await request.json()
    return await UserController.atualizar(usuario_id, dados)


@router.delete("/usuarios/{usuario_id}")
async def usuarios_deletar(usuario_id: int):
    return await UserController.deletar(usuario_id)
