import logging
from fastapi.responses import JSONResponse
from src.services.users_service import UserService


logger = logging.getLogger(__name__)


class UserController:
    @staticmethod
    async def criar(dados: dict):
        try:
            resultado = UserService.cadastrar_novo_usuario(dados)
            return JSONResponse({"status": "sucesso", "dados": resultado}, status_code=201)
        except ValueError as e:
            return JSONResponse({"status": "erro", "mensagem": str(e)}, status_code=400)
        except Exception as e:
            logger.exception("Erro ao criar usuário: %s", e)
            return JSONResponse({"status": "erro", "mensagem": "Erro interno ao criar usuário."}, status_code=500)

    @staticmethod
    async def autenticar(dados: dict):
        try:
            email = dados.get("email")
            senha = dados.get("senha")

            if not email or not senha:
                raise ValueError("Informe email e senha.")

            resultado = UserService.autenticar_usuario(email, senha)
            return JSONResponse({"status": "sucesso", "dados": resultado}, status_code=200)
        except ValueError as e:
            return JSONResponse({"status": "erro", "mensagem": str(e)}, status_code=401)
        except Exception as e:
            logger.exception("Erro ao autenticar usuário: %s", e)
            return JSONResponse({"status": "erro", "mensagem": "Erro interno ao autenticar."}, status_code=500)

    @staticmethod
    async def buscar_por_id(usuario_id: int):
        try:
            resultado = UserService.buscar_usuario_por_id(usuario_id)
            return JSONResponse({"status": "sucesso", "dados": resultado}, status_code=200)
        except ValueError as e:
            return JSONResponse({"status": "erro", "mensagem": str(e)}, status_code=404)
        except Exception as e:
            logger.exception("Erro ao buscar usuário: %s", e)
            return JSONResponse({"status": "erro", "mensagem": "Erro interno ao buscar usuário."}, status_code=500)

    @staticmethod
    async def listar():
        try:
            resultado = UserService.listar_usuarios()
            return JSONResponse({"status": "sucesso", "dados": resultado}, status_code=200)
        except Exception as e:
            logger.exception("Erro ao listar usuários: %s", e)
            return JSONResponse({"status": "erro", "mensagem": "Erro interno ao listar usuários."}, status_code=500)

    @staticmethod
    async def atualizar(usuario_id: int, dados: dict):
        try:
            resultado = UserService.atualizar_usuario(usuario_id, dados)
            return JSONResponse({"status": "sucesso", "dados": resultado}, status_code=200)
        except ValueError as e:
            return JSONResponse({"status": "erro", "mensagem": str(e)}, status_code=400)
        except Exception as e:
            logger.exception("Erro ao atualizar usuário: %s", e)
            return JSONResponse({"status": "erro", "mensagem": "Erro interno ao atualizar usuário."}, status_code=500)

    @staticmethod
    async def deletar(usuario_id: int):
        try:
            resultado = UserService.deletar_usuario(usuario_id)
            return JSONResponse(resultado, status_code=200)
        except ValueError as e:
            return JSONResponse({"status": "erro", "mensagem": str(e)}, status_code=404)
        except Exception as e:
            logger.exception("Erro ao deletar usuário: %s", e)
            return JSONResponse({"status": "erro", "mensagem": "Erro interno ao deletar usuário."}, status_code=500)
