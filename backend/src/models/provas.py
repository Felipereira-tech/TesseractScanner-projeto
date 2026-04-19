from src.config.database import supabase

class ProvaModel:
    @staticmethod
    def salvar(dados):
        return supabase.table("provas").insert(dados).execute()
