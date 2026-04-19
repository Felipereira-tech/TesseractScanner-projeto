# controllers/gabarito_controller.py
from fastapi import HTTPException
from services.gabaritos_service import GabaritoService
import logging

logger = logging.getLogger(__name__)

class GabaritoController:

    @staticmethod
    def cadastrar(prova_id: int, respostas_raw: str):
        try:
            # Chama o serviço usando a sintaxe solicitada na imagem: Classe.funcao
            resultado = GabaritoService.processar_cadastro(prova_id, respostas_raw)
            return {"status": "sucesso", "mensagem": "Gabarito cadastrado", "data": resultado.data}
        
        except Exception as e:
            logger.error(f"Erro no Cadastro: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Erro ao processar dados de cadastro: {str(e)}")

    @staticmethod
    async def corrigir(prova_id: int, nome_aluno: str, id_turma: int, file):
        try:
            if not file.content_type.startswith('image/'):
                raise ValueError("Envie uma imagem válida (JPG/PNG).")

            # Lê os bytes da imagem
            imagem_bytes = await file.read()
            
            # Chama o serviço
            dados = GabaritoService.executar_correcao(prova_id, nome_aluno, id_turma, imagem_bytes)

            return {
                "status": "sucesso",
                "aluno": nome_aluno,
                "resultado": {
                    "acertos": dados["acertos"],
                    "total": dados["total"],
                    "nota": dados["nota"]
                },
                "respostas_lidas": dados["respostas_lidas"],
                "preview_correcao": dados["preview_correcao"]
            }

        except ValueError as ve:
            # O scanner falhou em ler as bolinhas ou gabarito não achado
            raise HTTPException(status_code=422, detail=str(ve))
        
        except Exception as e:
            logger.error(f"Erro Crítico na Correção: {str(e)}")
            raise HTTPException(status_code=500, detail="Erro interno no processamento da imagem.")