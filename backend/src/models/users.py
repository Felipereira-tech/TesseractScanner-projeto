from src.config.database import supabase

class UserModel:
    @staticmethod
    def salvar(dados):
        return supabase.table("usuarios").insert(dados).execute()

    @staticmethod
    def buscar_por_email(email):
        return (
            supabase.table("usuarios")
            .select("id, nome_usuario, email, senha, nivel, criado_em, atualizado_em")
            .eq("email", email)
            .maybe_single()
            .execute()
        )

    @staticmethod
    def buscar_por_id(usuario_id):
        return (
            supabase.table("usuarios")
            .select("id, nome_usuario, email, nivel, criado_em, atualizado_em")
            .eq("id", usuario_id)
            .maybe_single()
            .execute()
        )

    @staticmethod
    def listar_todos():
        return (
            supabase.table("usuarios")
            .select("id, nome_usuario, email, nivel, criado_em, atualizado_em")
            .execute()
        )

    @staticmethod
    def atualizar(usuario_id, dados):
        return (
            supabase.table("usuarios")
            .update(dados)
            .eq("id", usuario_id)
            .execute()
        )

    @staticmethod
    def deletar(usuario_id):
        return (
            supabase.table("usuarios")
            .delete()
            .eq("id", usuario_id)
            .execute()
        )
    
