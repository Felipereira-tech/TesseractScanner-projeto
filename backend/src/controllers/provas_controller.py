from flask import request, jsonify
from src.services.provas_service import ProvaService

class ProvaController:
    @staticmethod
    def criar():
        try:
            dados = request.json
            resultado = ProvaService.cadastrar_nova_prova(dados)
            return jsonify({"status": "sucesso", "dados": resultado.data}), 201
        except ValueError as e:
            return jsonify({"status": "erro", "mensagem": str(e)}), 400