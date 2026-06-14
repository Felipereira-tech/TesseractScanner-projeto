#   NÃO
#   MEXER
#   EM
#   NADA
#   NESTA
#   PORRA
#   !!!!!

import base64
import json

from src.models.gabarito_model import GabaritoModel
from src.services.scanner import CartaoScanner

PONTUACAO_MAXIMA = 5

class GabaritoService:
    @staticmethod
    def cadastrar_novo_gabarito(prova_id, respostas_raw):
        """
        Cadastra o gabarito oficial de uma prova no sistema.
        Busca os dados da prova, valida a quantidade de questões e salva o gabarito.
        """
        # Tenta buscar a prova pelo ID; lança erro caso não encontre
        prova = GabaritoService._buscar_prova_ou_erro(prova_id)
        # Transforma as respostas recebidas em uma lista padronizada de números (0 a 4)
        respostas = GabaritoService._normalizar_respostas(respostas_raw)

        # Valida se o número de respostas fornecido bate com a quantidade configurada na prova
        if len(respostas) != prova["quantidade_questoes"]:
            raise ValueError(
                f"O gabarito precisa ter {prova['quantidade_questoes']} respostas."
            )

        # Persiste o gabarito oficial associado à prova no banco de dados
        return GabaritoModel.salvar({"id_prova": prova_id, "respostas": respostas})

    @staticmethod
    def corrigir_gabarito(prova_id, nome_aluno, id_turma, imagem_bytes):
        """
        Processa a imagem do cartão-resposta de um aluno, realiza a correção
        automática via scanner, calcula a nota e armazena os resultados.
        """
        # Verifica se a prova existe antes de prosseguir com a correção
        prova = GabaritoService._buscar_prova_ou_erro(prova_id)

        # Validações obrigatórias dos dados do aluno e turma
        if not nome_aluno:
            raise ValueError("Informe o nome do aluno.")

        if id_turma is None:
            raise ValueError("Informe a turma do aluno.")

        # Busca o gabarito oficial da prova para poder comparar com as respostas do aluno
        gabarito_resposta = GabaritoModel.buscar_por_prova_id(prova_id)
        if not gabarito_resposta.data:
            raise ValueError("Gabarito oficial nao encontrado para esta prova.")

        # Normaliza o gabarito oficial do banco para garantir o formato numérico correto
        gabarito_oficial = GabaritoService._normalizar_respostas(
            gabarito_resposta.data.get("respostas")
        )
        total_questoes = prova["quantidade_questoes"]

        # Garante que o gabarito recuperado do banco tem o tamanho esperado
        if len(gabarito_oficial) != total_questoes:
            raise ValueError("O gabarito oficial nao corresponde a quantidade de questoes da prova.")

        # Instancia a classe do Scanner (OpenCV) configurando os parâmetros da prova
        scanner = CartaoScanner(
            total_questoes=total_questoes,
            gabarito=gabarito_oficial,
            alternativas=5,
        )
        # Executa o processamento de imagem e retorna os acertos, os índices marcados e o buffer da imagem modificada
        acertos, respostas_lidas, imagem_corrigida = scanner.processar(imagem_bytes)

        # Calcula a nota do aluno na escala de 0 a 5, arredondando para duas casas decimais
        nota = round((acertos / total_questoes) * PONTUACAO_MAXIMA, 1)

        # Salva a lista detalhada de marcações que o scanner leu do cartão do aluno
        GabaritoModel.salvar_respostas_aluno(
            {
                "nome_aluno": nome_aluno,
                "id_turma": id_turma,
                "id_prova": prova_id,
                "respostas": respostas_lidas,
            }
        )
        # Salva o resumo de desempenho (total de acertos e nota final) do aluno
        GabaritoModel.salvar_nota(
            {
                "nome_aluno": nome_aluno,
                "id_prova": prova_id,
                "acertos": acertos,
                "nota": nota,
            }
        )

        # Converte os bytes da imagem corrigida (com elipses coloridas) em uma string Base64 para envio Web
        preview_correcao = base64.b64encode(imagem_corrigida).decode("utf-8")

        # Retorna o relatório completo da correção para a camada de controle/resposta
        return {
            "acertos": acertos,
            "total": total_questoes,
            "nota": nota,
            "respostas_lidas": respostas_lidas,
            # Formata a string para que tags HTML <img> consigam renderizar o JPEG diretamente
            "preview_correcao": f"data:image/jpeg;base64,{preview_correcao}",
        }

    @staticmethod
    def _buscar_prova_ou_erro(prova_id):
        """
        Método auxiliar: Busca uma prova por ID e lança exceções padronizadas
        caso o ID seja nulo ou a prova não seja encontrada no banco.
        """
        if prova_id is None:
            raise ValueError("Informe o id da prova.")

        prova = GabaritoModel.buscar_prova_por_id(prova_id)
        if not prova.data:
            raise ValueError("Prova nao encontrada.")

        return prova.data

    @staticmethod
    def _normalizar_respostas(respostas_raw):
        """
        Método auxiliar: Converte uma lista heterogênea de respostas (Ex: ['A', '2', 'B'])
        em uma lista padronizada de inteiros onde A=0, B=1, C=2, D=3, E=4.
        """
        # Garante a transformação inicial do dado bruto em uma lista de strings/inteiros
        respostas = GabaritoService._carregar_respostas(respostas_raw)
        mapa_alternativas = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4}
        respostas_normalizadas = []

        for indice, resposta in enumerate(respostas, start=1):
            # Tratamento caso o elemento seja texto (string)
            if isinstance(resposta, str):
                resposta = resposta.strip().upper() # Remove espaços e passa para maiúsculo
                if not resposta:
                    raise ValueError(f"Resposta vazia na questao {indice}.")

                # Se for letra (A-E), converte para o índice numérico correspondente (0-4)
                if resposta in mapa_alternativas:
                    respostas_normalizadas.append(mapa_alternativas[resposta])
                    continue

                # Se for um número em formato string (Ex: "3"), converte diretamente para inteiro se válido
                if resposta.isdigit() and 0 <= int(resposta) <= 4:
                    respostas_normalizadas.append(int(resposta))
                    continue

            # Tratamento caso o elemento já seja um número inteiro direto
            if isinstance(resposta, int) and 0 <= resposta <= 4:
                respostas_normalizadas.append(resposta)
                continue

            # Erro acionado caso o caractere não se encaixe em nenhum padrão válido
            raise ValueError(
                f"Resposta invalida na questao {indice}. Use A, B, C, D, E ou valores de 0 a 4."
            )

        if not respostas_normalizadas:
            raise ValueError("Informe pelo menos uma resposta para o gabarito.")

        return respostas_normalizadas

    @staticmethod
    def _carregar_respostas(respostas_raw):
        """
        Método auxiliar: Analisa a entrada bruta do usuário (que pode ser uma lista real, 
        uma string JSON, uma string separada por vírgulas ou texto corrido) e a transforma em uma lista Python.
        """
        # Se já for uma estrutura de lista, retorna ela diretamente
        if isinstance(respostas_raw, list):
            return respostas_raw

        if respostas_raw is None:
            raise ValueError("Informe as respostas do gabarito.")

        if not isinstance(respostas_raw, str):
            raise ValueError("Formato de respostas invalido.")

        conteudo = respostas_raw.strip()
        if not conteudo:
            raise ValueError("Informe as respostas do gabarito.")

        # Cenário 1: String que imita uma lista JSON (Ex: "['A', 'B']")
        if conteudo.startswith("["):
            try:
                # Troca aspas simples por duplas para tornar o JSON válido e faz o parse
                respostas = json.loads(conteudo.replace("'", '"'))
            except json.JSONDecodeError as e:
                raise ValueError("Nao foi possivel interpretar as respostas do gabarito.") from e
        # Cenário 2: String delimitada por vírgulas (Ex: "A,B,C,D")
        elif "," in conteudo:
            respostas = [item.strip() for item in conteudo.split(",")]
        # Cenário 3: String corrida sem espaços (Ex: "ABCDE")
        else:
            respostas = [caractere for caractere in conteudo if not caractere.isspace()]

        # Garante que o resultado final das conversões de string virou de fato uma lista
        if not isinstance(respostas, list):
            raise ValueError("Formato de respostas invalido.")

        return respostas
    
    @staticmethod
    def processar_coluna(prova_id, coluna, imagem_bytes):
        import math, base64
        prova = GabaritoService._buscar_prova_ou_erro(prova_id)
        total_questoes = prova["quantidade_questoes"]
        q_per_col = 24
        num_colunas = math.ceil(total_questoes / q_per_col)

        if coluna < 0 or coluna >= num_colunas:
            raise ValueError(f"Coluna {coluna} inválida. Esta prova tem {num_colunas} colunas.")

        inicio = coluna * q_per_col
        fim = min(inicio + q_per_col, total_questoes)
        questoes_reais = fim - inicio

        # Busca o gabarito real da prova
        gabarito_resposta = GabaritoModel.buscar_por_prova_id(prova_id)
        if not gabarito_resposta.data:
            raise ValueError("Gabarito oficial não encontrado para esta prova.")

        gabarito_completo = GabaritoService._normalizar_respostas(
            gabarito_resposta.data.get("respostas")
        )

        gabarito_coluna = gabarito_completo[inicio:fim]

        scanner = CartaoScanner(
            total_questoes=questoes_reais,
            gabarito=gabarito_coluna,
            alternativas=5,
        )
        _, respostas_lidas, imagem_corrigida = scanner.processar(imagem_bytes)

        preview = base64.b64encode(imagem_corrigida).decode("utf-8")

        return {
            "respostas_coluna": respostas_lidas,
            "preview_coluna": f"data:image/jpeg;base64,{preview}",
        }
        
        
    @staticmethod
    def finalizar_correcao(prova_id, nome_aluno, id_turma, respostas_completas):
        prova = GabaritoService._buscar_prova_ou_erro(prova_id)
        total_questoes = prova["quantidade_questoes"]

        if not nome_aluno:
            raise ValueError("Informe o nome do aluno.")

        gabarito_resposta = GabaritoModel.buscar_por_prova_id(prova_id)
        if not gabarito_resposta.data:
            raise ValueError("Gabarito oficial não encontrado para esta prova.")

        gabarito_oficial = GabaritoService._normalizar_respostas(
            gabarito_resposta.data.get("respostas")
        )

        if len(respostas_completas) != total_questoes:
            raise ValueError(f"Esperado {total_questoes} respostas, recebido {len(respostas_completas)}.")

        acertos = sum(
            1 for i in range(total_questoes)
            if respostas_completas[i] == gabarito_oficial[i]
        )
        nota = round((acertos / total_questoes) * 10, 2)

        GabaritoModel.salvar_respostas_aluno({
            "nome_aluno": nome_aluno,
            "id_turma": id_turma,
            "id_prova": prova_id,
            "respostas": respostas_completas,
        })
        GabaritoModel.salvar_nota({
            "nome_aluno": nome_aluno,
            "id_prova": prova_id,
            "acertos": acertos,
            "nota": nota,
        })

        return {
            "acertos": acertos,
            "total": total_questoes,
            "nota": nota,
            "respostas_lidas": respostas_completas,
        }