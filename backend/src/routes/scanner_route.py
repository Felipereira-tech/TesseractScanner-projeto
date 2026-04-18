from flask import Blueprint, request, jsonify
from src.services.scanner_service import processar_correcao 

scanner_bp = Blueprint('scanner', __name__)

@scanner_bp.route('/corrigir-cartao', methods=['POST'])
def corrigir():
    prova_id = request.form.get('prova_id')
    nome_aluno = request.form.get('nome_aluno')
    file = request.files.get('file')

    if not file:
        return jsonify({"error": "Nenhuma imagem enviada"}), 400

    resultado = processar_correcao(prova_id, nome_aluno, file.read())
    return jsonify(resultado)
