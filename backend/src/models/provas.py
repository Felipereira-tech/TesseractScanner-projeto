from src.config.database import supabase

class ProvaModel:
    @staticmethod
    def salvarProva(dados):
        return supabase.table("provas").insert(dados).execute()