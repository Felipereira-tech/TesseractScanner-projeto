#LÓGICA PARA CRIAÇÃO DE FORMULÁRIOS, INCLUINDO VALIDAÇÕES E TRANSFORMAÇÕES DE DADOS PARA O USO NA API.

from config import supabase

nome_temp = "Simulado 2 - 2026"
disciplina_temp = "Exatas"
quantidade_questoes_temp = 90
id_turma_temp = 3

def criar_prova(nome_prova: str, disciplina: str, quantidade_questoes: int, id_turma: int):
    
    
    if quantidade_questoes == 0:
        raise ValueError("A quantidade de questões deve ser maior que zero.")
    if (not nome_prova) or (not disciplina):
        raise ValueError("O nome da prova não pode ser vazio.")
    try:
        res = supabase.table("provas").insert({
            "nome_prova": nome_prova,
            "disciplina": disciplina,
            "quantidade_questoes": quantidade_questoes,
            "id_turma": id_turma
        }).execute()
        return res.data
    except Exception as e:
        raise RuntimeError(f"Erro ao criar prova: {e}")
        return None
    
if __name__ == "__main__":
    # EXEMPLO DE USO:
    nova_prova = criar_prova(nome_temp, disciplina_temp, quantidade_questoes_temp, id_turma_temp)
    if nova_prova:
        print("Prova criada com sucesso:", nova_prova)