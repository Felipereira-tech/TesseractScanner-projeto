import logging

from flask import jsonify, request

from src.services.gabaritos_service import GabaritoService


logger = logging.getLogger(__name__)


class GabaritoController:
    @staticmethod
    def cadastrar():
        try:
            prova_id = request.form.get("prova_id", type=int)
            respostas_raw = request.form.get("respostas_raw")

            resultado = GabaritoService.cadastrar_novo_gabarito(prova_id, respostas_raw)
            return jsonify({"status": "sucesso", "dados": resultado.data}), 201
        except ValueError as e:
            return jsonify({"status": "erro", "mensagem": str(e)}), 400
        except Exception as e:
            logger.exception("Erro ao cadastrar gabarito: %s", e)
            return jsonify({"status": "erro", "mensagem": "Erro interno ao cadastrar gabarito."}), 500

    @staticmethod
    def corrigir():
        try:
            prova_id = request.form.get("prova_id", type=int)
            nome_aluno = request.form.get("nome_aluno")
            id_turma = request.form.get("id_turma", type=int)
            arquivo = request.files.get("file")

            if not arquivo:
                raise ValueError("Envie uma imagem para corrigir o cartao.")

            if not arquivo.mimetype or not arquivo.mimetype.startswith("image/"):
                raise ValueError("Envie uma imagem valida em JPG ou PNG.")

            resultado = GabaritoService.corrigir_gabarito(
                prova_id,
                nome_aluno,
                id_turma,
                arquivo.read(),
            )

            return (
                jsonify(
                    {
                        "status": "sucesso",
                        "aluno": nome_aluno,
                        "resultado": {
                            "acertos": resultado["acertos"],
                            "total": resultado["total"],
                            "nota": resultado["nota"],
                        },
                        "respostas_lidas": resultado["respostas_lidas"],
                        "preview_correcao": resultado["preview_correcao"],
                    }
                ),
                200,
            )
        except ValueError as e:
            return jsonify({"status": "erro", "mensagem": str(e)}), 422
        except Exception as e:
            logger.exception("Erro ao corrigir gabarito: %s", e)
            return jsonify({"status": "erro", "mensagem": "Erro interno no processamento da imagem."}), 500
