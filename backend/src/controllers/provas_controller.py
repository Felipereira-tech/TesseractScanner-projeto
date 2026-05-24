from fastapi.responses import JSONResponse
from src.services.provas_service import ProvaService

class ProvaController:
    @staticmethod
    async def criar(dados: dict):
        try:
            resultado = ProvaService.cadastrar_nova_prova(dados)
            return JSONResponse({"status": "sucesso", "dados": resultado.data}, status_code=201)
        except ValueError as e:
            return JSONResponse({"status": "erro", "mensagem": str(e)}, status_code=400)
    
    @staticmethod
    async def listar():
        try:
            resultado = ProvaService.listar_provas()
            return JSONResponse({"status": "sucesso", "dados": resultado.data})
        except Exception as e:
            return JSONResponse({"status": "erro", "mensagem": str(e)}, status_code=500)