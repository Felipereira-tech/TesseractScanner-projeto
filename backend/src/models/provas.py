from src.config.database import supabase

class ProvaModel:
    @staticmethod
    def salvar(dados):
        return supabase.table("provas").insert(dados).execute()

    @staticmethod
    def atualizar(prova_id, dados):
        return supabase.table("provas").update(dados).eq("id", prova_id).execute()

    @staticmethod
    def deletar(prova_id):
        return supabase.table("provas").delete().eq("id", prova_id).execute()
