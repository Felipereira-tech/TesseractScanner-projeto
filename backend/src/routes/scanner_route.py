from fastapi import APIRouter, Form, File, UploadFile
from fastapi.responses import JSONResponse
from src.services.scanner_service import processar_correcao

router = APIRouter()# Cria um roteador FastAPI para definir as rotas relacionadas ao scanner   

@router.post("/corrigir-cartao")
async def corrigir(
    prova_id: int = Form(...),
    nome_aluno: str = Form(...),
    file: UploadFile = File(...)
):# Define uma rota POST para o endpoint "/corrigir-cartao", onde os parâmetros esperados na requisição são prova_id (inteiro obrigatório), nome_aluno (string obrigatória) e file (arquivo obrigatório recebido como parte da requisição multipart/form-data)
    if not file:
        return JSONResponse({"error": "Nenhuma imagem enviada"}, status_code=400)# Verifica se um arquivo foi enviado na requisição, e caso contrário, retorna uma resposta JSON com um erro e o status code 400 (Bad Request)
    
    contents = await file.read()
    resultado = processar_correcao(prova_id, nome_aluno, contents)# Lê o conteúdo do arquivo enviado e chama a função processar_correcao, passando os parâmetros recebidos, para realizar a correção do cartão de resposta  
    return JSONResponse(resultado)# Retorna o resultado da correção como uma resposta JSON para o cliente que fez a requisição, contendo as informações sobre a correção do cartão de resposta. 