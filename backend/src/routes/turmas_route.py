from fastapi import APIRouter
from src.config.database import supabase

router = APIRouter()

@router.get("/turmas")
async def listar_turmas():
    resultado = supabase.table("turmas").select("*").order("nome_turma").execute()
    return {"status": "sucesso", "dados": resultado.data}