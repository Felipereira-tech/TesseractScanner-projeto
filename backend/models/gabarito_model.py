# models/gabarito_model.py
from config import supabase

class GabaritoModel:
    
    @staticmethod
    def upsert_gabarito(data):
        """Armazena consultas e inserções diretas do Gabarito no Supabase"""
        return supabase.table("gabarito").upsert(data).execute()

    @staticmethod
    def buscar_respostas_oficiais(prova_id: int):
        """Busca o gabarito oficial pelo ID da prova"""
        return supabase.table("gabarito").select("respostas").eq("id_prova", prova_id).maybe_single().execute()

    @staticmethod
    def inserir_respostas_aluno(data):
        """Salva a prova resolvida pelo aluno"""
        return supabase.table("gabarito_alunos").insert(data).execute()

    @staticmethod
    def inserir_nota(data):
        """Salva a nota final no banco"""
        return supabase.table("notas").insert(data).execute()