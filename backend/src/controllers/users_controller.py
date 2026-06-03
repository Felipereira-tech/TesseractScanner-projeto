import logging
from flask import jsonify, request
from src.services.users_service import UserService


logger = logging.getLogger(__name__)


class UserController:
    @staticmethod
    def criar():
        try:
            dados = request.json
            resultado = UserService.cadastrar_novo_usuario(dados)
            return jsonify({"status": "sucesso", "dados": resultado}), 201
        except ValueError as e:
            return jsonify({"status": "erro", "mensagem": str(e)}), 400
        except Exception as e:
            logger.exception("Erro ao criar usuário: %s", e)
            return jsonify({"status": "erro", "mensagem": "Erro interno ao criar usuário."}), 500

    @staticmethod
    def autenticar():
        try:
            dados = request.json
            email = dados.get("email")
            senha = dados.get("senha")

            if not email or not senha:
                raise ValueError("Informe email e senha.")

            resultado = UserService.autenticar_usuario(email, senha)
            return jsonify({"status": "sucesso", "dados": resultado}), 200
        except ValueError as e:
            return jsonify({"status": "erro", "mensagem": str(e)}), 401
        except Exception as e:
            logger.exception("Erro ao autenticar usuário: %s", e)
            return jsonify({"status": "erro", "mensagem": "Erro interno ao autenticar."}), 500

    @staticmethod
    def buscar_por_id(usuario_id):
        try:
            resultado = UserService.buscar_usuario_por_id(usuario_id)
            return jsonify({"status": "sucesso", "dados": resultado}), 200
        except ValueError as e:
            return jsonify({"status": "erro", "mensagem": str(e)}), 404
        except Exception as e:
            logger.exception("Erro ao buscar usuário: %s", e)
            return jsonify({"status": "erro", "mensagem": "Erro interno ao buscar usuário."}), 500

    @staticmethod
    def listar():
        try:
            resultado = UserService.listar_usuarios()
            return jsonify({"status": "sucesso", "dados": resultado}), 200
        except Exception as e:
            logger.exception("Erro ao listar usuários: %s", e)
            return jsonify({"status": "erro", "mensagem": "Erro interno ao listar usuários."}), 500

    @staticmethod
    def atualizar(usuario_id):
        try:
            dados = request.json
            resultado = UserService.atualizar_usuario(usuario_id, dados)
            return jsonify({"status": "sucesso", "dados": resultado}), 200
        except ValueError as e:
            return jsonify({"status": "erro", "mensagem": str(e)}), 400
        except Exception as e:
            logger.exception("Erro ao atualizar usuário: %s", e)
            return jsonify({"status": "erro", "mensagem": "Erro interno ao atualizar usuário."}), 500

    @staticmethod
    def deletar(usuario_id):
        try:
            resultado = UserService.deletar_usuario(usuario_id)
            return jsonify(resultado), 200
        except ValueError as e:
            return jsonify({"status": "erro", "mensagem": str(e)}), 404
        except Exception as e:
            logger.exception("Erro ao deletar usuário: %s", e)
            return jsonify({"status": "erro", "mensagem": "Erro interno ao deletar usuário."}), 500
