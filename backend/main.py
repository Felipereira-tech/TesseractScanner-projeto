from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid

from config import supabase
from scanner import CartaoScanner

app = FastAPI(title="API de Correção Tesseract")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def converter_gabarito(gabarito_raw):
    mapa_letras = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4}
    if isinstance(gabarito_raw, str):
        gabarito_raw = list(gabarito_raw.upper())
    
    gabarito_formatado = []
    for ans in gabarito_raw:
        if isinstance(ans, str) and ans.upper() in mapa_letras:
            gabarito_formatado.append(mapa_letras[ans.upper()])
        else:
            gabarito_formatado.append(int(ans))
    return gabarito_formatado

@app.post("/corrigir-cartao/")
async def corrigir_cartao(
    prova_id: int = Form(...),
    nome_aluno: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Arquivo inválido. Envie uma imagem.")

        prova_res = supabase.table("provas").select("*").eq("id", prova_id).maybe_single().execute()
        if not prova_res.data:
            raise HTTPException(status_code=404, detail="Prova não encontrada no sistema.")
        
        dados_prova = prova_res.data
        total_questoes = dados_prova.get("quantidade_questoes")

        gabarito_res = supabase.table("gabarito").select("respostas").eq("id_prova", prova_id).maybe_single().execute()
        if not gabarito_res.data:
            raise HTTPException(status_code=404, detail="Gabarito oficial não encontrado para esta prova.")
        
        gabarito_raw = gabarito_res.data.get("respostas")
        gabarito_int = converter_gabarito(gabarito_raw)

        contents = await file.read()
        scanner = CartaoScanner(
            total_questoes=total_questoes, 
            gabarito=gabarito_int, 
            alternativas=5 
        )
        
        try:
            acertos, respostas_marcadas, img_buffer = scanner.processar(contents)
        except ValueError as ve:
            raise HTTPException(status_code=422, detail=str(ve))

        caminho_storage = f"{prova_id}/{nome_aluno}_{uuid.uuid4().hex}.jpg"
        
        try:
            storage_res = supabase.storage.from_("correcoes").upload(
                path=caminho_storage,
                file=img_buffer.tobytes(),
                file_options={"content-type": "image/jpeg"}
            )
            url_imagem = supabase.storage.from_("correcoes").get_public_url(caminho_storage)
        except Exception as e:
            print(f"Erro no storage: {e}")
            url_imagem = None 

        supabase.table("gabarito_alunos").insert({
            "nome_aluno": nome_aluno,
            "id_turma": dados_prova.get("id_turma"),
            "respostas": str(respostas_marcadas)
        }).execute()

        nota_final = (acertos / total_questoes) * 10
        resultado_nota = {
            "nome_aluno": nome_aluno,
            "id_prova": prova_id,
            "acertos": acertos,
            "nota": round(nota_final, 2)
        }
        supabase.table("notas").insert(resultado_nota).execute()

        return {
            "status": "sucesso",
            "aluno": nome_aluno,
            "acertos": acertos,
            "nota": round(nota_final, 2),
            "respostas_lidas": respostas_marcadas,
            "imagem_url": url_imagem
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")
