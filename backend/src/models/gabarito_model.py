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
        return supabase.table("gabarito").insert(dados).execute()

    @staticmethod
    def atualizar_por_prova_id(prova_id, dados):
        return supabase.table("gabarito").update(dados).eq("id_prova", prova_id).execute()

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
    def deletar_por_prova_id(prova_id):
        return supabase.table("gabarito").delete().eq("id_prova", prova_id).execute()

    @staticmethod
    def salvar_respostas_aluno(dados):
        return supabase.table("gabarito_alunos").insert(dados).execute()

    @staticmethod
    def salvar_nota(dados):
        return supabase.table("notas").insert(dados).execute()

    @staticmethod
    def listar_notas_por_prova(prova_id):
        return (
            supabase.table("notas")
            .select("*")
            .eq("id_prova", prova_id)
            .order("id", desc=True)
            .execute()
        )

    @staticmethod
    def atualizar_nota(nota_id, dados):
        return supabase.table("notas").update(dados).eq("id", nota_id).execute()

    @staticmethod
    def deletar_nota(nota_id):
        return supabase.table("notas").delete().eq("id", nota_id).execute()
