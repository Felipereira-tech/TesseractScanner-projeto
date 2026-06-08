import uuid
from src.config.database import supabase
from src.services.scanner import CartaoScanner

PONTUACAO_MAXIMA = 5

def processar_correcao(prova_id, nome_aluno, file_contents):
    # 1. Busca Prova
    prova_res = supabase.table("provas").select("*").eq("id", prova_id).maybe_single().execute()
    if not prova_res.data:
        return {"error": "Prova não encontrada", "code": 404}
    
    total_questoes = prova_res.data.get("quantidade_questoes")

    # 2. Busca Gabarito
    gabarito_res = supabase.table("gabarito").select("respostas").eq("id_prova", prova_id).maybe_single().execute()
    if not gabarito_res.data:
        return {"error": "Gabarito não encontrado", "code": 404}
    
    # Lógica de conversão (seu converter_gabarito)
    gabarito_raw = gabarito_res.data.get("respostas")
    gabarito_int = [ {'A':0,'B':1,'C':2,'D':3,'E':4}[c.upper()] for c in gabarito_raw ]

    # 3. Scanner OpenCV
    scanner = CartaoScanner(total_questoes=total_questoes, gabarito=gabarito_int, alternativas=5)
    acertos, respostas_lidas, img_buffer = scanner.processar(file_contents)

    # 4. Salvar Nota e Retornar
    nota_final = round((acertos / total_questoes) * PONTUACAO_MAXIMA, 2)
    supabase.table("notas").insert({
        "nome_aluno": nome_aluno,
        "id_prova": prova_id,
        "acertos": acertos,
        "nota": nota_final
    }).execute()

    return {
        "aluno": nome_aluno,
        "acertos": acertos,
        "nota": nota_final,
        "respostas": respostas_lidas
    }
