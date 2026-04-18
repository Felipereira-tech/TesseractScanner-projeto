from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid

# Importações dos módulos separados
from config import get_firebase_clients
from scanner import CartaoScanner

app = FastAPI(title="API de Correção Kyros")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializa as conexões (ocorre apenas na primeira chamada)
db, bucket = get_firebase_clients()

def converter_gabarito(gabarito_raw):
    """ Garante que o gabarito vindo do banco seja uma lista de inteiros """
    mapa_letras = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4}
    gabarito_formatado = []
    for ans in gabarito_raw:
        if isinstance(ans, str) and ans.upper() in mapa_letras:
            gabarito_formatado.append(mapa_letras[ans.upper()])
        else:
            gabarito_formatado.append(int(ans))
    return gabarito_formatado


@app.post("/corrigir-cartao/")
async def corrigir_cartao(
    prova_id: str = Form(...),
    turma_id: str = Form(...), # Alterado de aluno_id para turma_id
    file: UploadFile = File(...)
):
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Arquivo inválido. Envie uma imagem.")

        # 1. Busca os metadados da Prova
        prova_ref = db.collection("provas").document(prova_id).get()
        if not prova_ref.exists:
            raise HTTPException(status_code=404, detail="Prova não encontrada no sistema.")
        
        dados_prova = prova_ref.to_dict()
        gabarito_raw = dados_prova.get("gabarito") 
        total_questoes = dados_prova.get("total_questoes", len(gabarito_raw))
        alternativas = dados_prova.get("alternativas", 5)

        if not gabarito_raw or len(gabarito_raw) != total_questoes:
            raise HTTPException(status_code=400, detail="Inconsistência no gabarito salvo.")

        gabarito_int = converter_gabarito(gabarito_raw)

        # 2. Inicia o Scanner Modular e Processa a Imagem
        contents = await file.read()
        scanner = CartaoScanner(
            total_questoes=total_questoes, 
            gabarito=gabarito_int, 
            alternativas=alternativas
        )
        
        try:
            acertos, respostas_marcadas, img_buffer = scanner.processar(contents)
        except ValueError as ve:
            # Captura os erros específicos do OpenCV (iluminação, bordas, etc)
            raise HTTPException(status_code=422, detail=str(ve))

        # 3. Upload da Imagem Corrigida
        nome_arquivo = f"correcoes/{turma_id}/{prova_id}_{uuid.uuid4().hex}.jpg"
        blob = bucket.blob(nome_arquivo)
        blob.upload_from_string(img_buffer.tobytes(), content_type='image/jpeg')
        blob.make_public()
        url_imagem = blob.public_url

        # 4. Persistência de Resultados na Coleção da Turma
        resultado_db = {
            "turma_id": turma_id,
            "prova_id": prova_id,
            "acertos": int(acertos),
            "total_questoes": total_questoes,
            "respostas_marcadas": respostas_marcadas,
            "imagem_correcao_url": url_imagem,
            "data_correcao": firestore.SERVER_TIMESTAMP
        }
        
        # Salva o resultado indexado pela turma
        db.collection("resultados_turmas").add(resultado_db)

        return {
            "status": "sucesso",
            "nota": acertos,
            "total_questoes": total_questoes,
            "respostas_lidas": respostas_marcadas,
            "imagem_processada": url_imagem
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")