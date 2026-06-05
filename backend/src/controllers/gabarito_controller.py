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
    async def corrigir(prova_id: int, nome_aluno: str, id_turma: int, file: UploadFile):
        try:
            print(f">>> prova_id={prova_id} | nome_aluno={nome_aluno} | id_turma={id_turma} | file={file.filename}")
            
            if not file.content_type or not file.content_type.startswith("image/"):
                raise ValueError("Envie uma imagem valida em JPG ou PNG.")

            contents = await file.read()
            print(f">>> arquivo recebido: {len(contents)} bytes | content_type={file.content_type}")

            resultado = GabaritoService.corrigir_gabarito(
                prova_id, nome_aluno, id_turma, contents,
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
            print(f">>> VALOR ERROR: {str(e)}")
            return JSONResponse({"status": "erro", "mensagem": str(e)}, status_code=422)
        except Exception as e:
            print(f">>> EXCEPTION: {str(e)}")
            logger.exception("Erro ao corrigir gabarito: %s", e)
            return JSONResponse({"status": "erro", "mensagem": "Erro interno no processamento da imagem."}, status_code=500)
    
    @staticmethod 
    async def processar_coluna(prova_id: int, coluna: int, file: UploadFile):
        try:
            print(f">>> Processar_coluna | prova_id={prova_id} | coluna={coluna}")
            if not file.content_type or not file.content_type.startswith("image/"):
                raise ValueError("Envie uma imagem válida em JPG ou PNG")
            
            contents = await file.read()
            
            resultado = GabaritoService.processar_coluna(prova_id, coluna, contents)
            
            return JSONResponse({
                "status": "sucesso",
                "coluna": coluna,
                "respostas_coluna": resultado["respostas_coluna"],
                "preview_coluna": resultado["preview_coluna"],  
            }, status_code=200)
        
        except ValueError as e:
            print(f">>> VALOR ERROR: {str(e)}")
            return JSONResponse({"status": "erro", "mensagem":str(e)}, status_code=422)
        except Exception as e:
            logger.exception("Erro ao processar coluna: %s", e)
            return JSONResponse({"status": "erro", "mensagem": "Erro interno no processamento da coluna."}, status_code=500)
        
    @staticmethod
    async def finalizar(payload: dict):
        try:
            prova_id = payload.get("prova_id")
            nome_aluno = payload.get("nome_aluno")
            id_turma = payload.get("id_turma")
            respostas_completas = payload.get("respostas")

            resultado = GabaritoService.finalizar_correcao(
                prova_id, nome_aluno, id_turma, respostas_completas
            )

            return JSONResponse({
                "status": "sucesso",
                "aluno": nome_aluno,
                "resultado": {
                    "acertos": resultado["acertos"],
                    "total": resultado["total"],
                    "nota": resultado["nota"],
                },
                "respostas_lidas": resultado["respostas_lidas"],
            }, status_code=200)

        except ValueError as e:
            return JSONResponse({"status": "erro", "mensagem": str(e)}, status_code=422)
        except Exception as e:
            logger.exception("Erro ao finalizar correção: %s", e)
            return JSONResponse({"status": "erro", "mensagem": "Erro interno ao finalizar correção."}, status_code=500)