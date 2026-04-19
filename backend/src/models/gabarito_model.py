from src.config.database import supabase


class GabaritoModel:
    @staticmethod
    def buscar_prova_por_id(prova_id):
        return (
            supabase.table("provas")
            .select("id, quantidade_questoes")
            .eq("id", prova_id)
            .maybe_single()
            .execute()
        )

    @staticmethod
    def salvar(dados):
        return supabase.table("gabarito").upsert(dados).execute()

    @staticmethod
    def buscar_por_prova_id(prova_id):
        return (
            supabase.table("gabarito")
            .select("respostas")
            .eq("id_prova", prova_id)
            .maybe_single()
            .execute()
        )

    @staticmethod
    def salvar_respostas_aluno(dados):
        return supabase.table("gabarito_alunos").insert(dados).execute()

    @staticmethod
    def salvar_nota(dados):
        return supabase.table("notas").insert(dados).execute()
