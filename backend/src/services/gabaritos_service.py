import base64
import json

from src.models.gabarito_model import GabaritoModel
from src.services.scanner import CartaoScanner


class GabaritoService:
    @staticmethod
    def cadastrar_novo_gabarito(prova_id, respostas_raw):
        prova = GabaritoService._buscar_prova_ou_erro(prova_id)
        respostas = GabaritoService._normalizar_respostas(respostas_raw)

        if len(respostas) != prova["quantidade_questoes"]:
            raise ValueError(
                f"O gabarito precisa ter {prova['quantidade_questoes']} respostas."
            )

        return GabaritoModel.salvar({"id_prova": prova_id, "respostas": respostas})

    @staticmethod
    def corrigir_gabarito(prova_id, nome_aluno, id_turma, imagem_bytes):
        prova = GabaritoService._buscar_prova_ou_erro(prova_id)

        if not nome_aluno:
            raise ValueError("Informe o nome do aluno.")

        if id_turma is None:
            raise ValueError("Informe a turma do aluno.")

        gabarito_resposta = GabaritoModel.buscar_por_prova_id(prova_id)
        if not gabarito_resposta.data:
            raise ValueError("Gabarito oficial nao encontrado para esta prova.")

        gabarito_oficial = GabaritoService._normalizar_respostas(
            gabarito_resposta.data.get("respostas")
        )
        total_questoes = prova["quantidade_questoes"]

        if len(gabarito_oficial) != total_questoes:
            raise ValueError("O gabarito oficial nao corresponde a quantidade de questoes da prova.")

        scanner = CartaoScanner(
            total_questoes=total_questoes,
            gabarito=gabarito_oficial,
            alternativas=5,
        )
        acertos, respostas_lidas, imagem_corrigida = scanner.processar(imagem_bytes)

        nota = round((acertos / total_questoes) * 10, 2)

        GabaritoModel.salvar_respostas_aluno(
            {
                "nome_aluno": nome_aluno,
                "id_turma": id_turma,
                "id_prova": prova_id,
                "respostas": respostas_lidas,
            }
        )
        GabaritoModel.salvar_nota(
            {
                "nome_aluno": nome_aluno,
                "id_prova": prova_id,
                "acertos": acertos,
                "nota": nota,
            }
        )

        preview_correcao = base64.b64encode(imagem_corrigida).decode("utf-8")

        return {
            "acertos": acertos,
            "total": total_questoes,
            "nota": nota,
            "respostas_lidas": respostas_lidas,
            "preview_correcao": f"data:image/jpeg;base64,{preview_correcao}",
        }

    @staticmethod
    def _buscar_prova_ou_erro(prova_id):
        if prova_id is None:
            raise ValueError("Informe o id da prova.")

        prova = GabaritoModel.buscar_prova_por_id(prova_id)
        if not prova.data:
            raise ValueError("Prova nao encontrada.")

        return prova.data

    @staticmethod
    def _normalizar_respostas(respostas_raw):
        respostas = GabaritoService._carregar_respostas(respostas_raw)
        mapa_alternativas = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4}
        respostas_normalizadas = []

        for indice, resposta in enumerate(respostas, start=1):
            if isinstance(resposta, str):
                resposta = resposta.strip().upper()
                if not resposta:
                    raise ValueError(f"Resposta vazia na questao {indice}.")

                if resposta in mapa_alternativas:
                    respostas_normalizadas.append(mapa_alternativas[resposta])
                    continue

                if resposta.isdigit() and 0 <= int(resposta) <= 4:
                    respostas_normalizadas.append(int(resposta))
                    continue

            if isinstance(resposta, int) and 0 <= resposta <= 4:
                respostas_normalizadas.append(resposta)
                continue

            raise ValueError(
                f"Resposta invalida na questao {indice}. Use A, B, C, D, E ou valores de 0 a 4."
            )

        if not respostas_normalizadas:
            raise ValueError("Informe pelo menos uma resposta para o gabarito.")

        return respostas_normalizadas

    @staticmethod
    def _carregar_respostas(respostas_raw):
        if isinstance(respostas_raw, list):
            return respostas_raw

        if respostas_raw is None:
            raise ValueError("Informe as respostas do gabarito.")

        if not isinstance(respostas_raw, str):
            raise ValueError("Formato de respostas invalido.")

        conteudo = respostas_raw.strip()
        if not conteudo:
            raise ValueError("Informe as respostas do gabarito.")

        if conteudo.startswith("["):
            try:
                respostas = json.loads(conteudo.replace("'", '"'))
            except json.JSONDecodeError as e:
                raise ValueError("Nao foi possivel interpretar as respostas do gabarito.") from e
        elif "," in conteudo:
            respostas = [item.strip() for item in conteudo.split(",")]
        else:
            respostas = [caractere for caractere in conteudo if not caractere.isspace()]

        if not isinstance(respostas, list):
            raise ValueError("Formato de respostas invalido.")

        return respostas
