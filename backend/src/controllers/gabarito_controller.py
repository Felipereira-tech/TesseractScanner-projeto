import logging
from fastapi import UploadFile
from fastapi.responses import JSONResponse
from src.services.gabaritos_service import GabaritoService

logger = logging.getLogger(__name__)# Configura um logger para o módulo, permitindo o registro de mensagens de log para depuração e monitoramento de erros. 

class GabaritoController:
    @staticmethod# Define um método estático para cadastrar um novo gabarito, permitindo que seja chamado sem a necessidade de instanciar a classe. O método é assíncrono, o que permite lidar com operações de I/O de forma eficiente, como acesso a banco de dados ou processamento de arquivos.
    async def cadastrar(prova_id: int, respostas_raw: str):# Define um método assíncrono para cadastrar um novo gabarito, recebendo o ID da prova e as respostas em formato bruto (string). O método tenta cadastrar o gabarito usando o serviço GabaritoService e retorna uma resposta JSON indicando sucesso ou erro, com mensagens apropriadas.
        try:
            resultado = GabaritoService.cadastrar_novo_gabarito(prova_id, respostas_raw)
            return JSONResponse({"status": "sucesso", "dados": resultado.data}, status_code=201)
        except ValueError as e:
            return JSONResponse({"status": "erro", "mensagem": str(e)}, status_code=400)
        except Exception as e:
            logger.exception("Erro ao cadastrar gabarito: %s", e)
            return JSONResponse({"status": "erro", "mensagem": "Erro interno ao cadastrar gabarito."}, status_code=500)

    @staticmethod
    async def corrigir(prova_id: int, nome_aluno: str, id_turma: int, file: UploadFile):# Define um método assíncrono para corrigir um gabarito, recebendo o ID da prova, o nome do aluno, o ID da turma e o arquivo de imagem enviado pelo usuário. O método processa a imagem, corrige o gabarito e retorna os resultados ou mensagens de erro apropriadas.
        try:
            if not file.content_type or not file.content_type.startswith("image/"):
                raise ValueError("Envie uma imagem valida em JPG ou PNG.")

            contents = await file.read()

            resultado = GabaritoService.corrigir_gabarito(
                prova_id,
                nome_aluno,
                id_turma,
                contents,
            )# Chama o serviço GabaritoService para corrigir o gabarito, passando os parâmetros necessários, incluindo o conteúdo do arquivo de imagem lido de forma assíncrona. O resultado da correção é então formatado em uma resposta JSON detalhada, contendo o status, nome do aluno, resultados da correção (acertos, total, nota), respostas lidas e uma prévia da correção.

            return JSONResponse({
                "status": "sucesso",
                "aluno": nome_aluno,
                "resultado": {
                    "acertos": resultado["acertos"],
                    "total": resultado["total"],
                    "nota": resultado["nota"],
                },
                "respostas_lidas": resultado["respostas_lidas"],
                "preview_correcao": resultado["preview_correcao"],
            }, status_code=200)# Retorna uma resposta JSON detalhada com o resultado da correção, incluindo o status de sucesso, nome do aluno, detalhes do resultado (acertos, total de questões, nota), as respostas lidas e uma prévia da correção. O status HTTP 200 indica que a solicitação foi processada com sucesso.

        except ValueError as e:
            return JSONResponse({"status": "erro", "mensagem": str(e)}, status_code=422)
        except Exception as e:
            logger.exception("Erro ao corrigir gabarito: %s", e)
            return JSONResponse({"status": "erro", "mensagem": "Erro interno no processamento da imagem."}, status_code=500)