from src.models.provas import ProvaModel

class ProvaService:
    @staticmethod
    def cadastrar_nova_prova(dados):
        quantidade = dados.get("quantidade_questoes", 0)
        if quantidade <= 0:
            raise ValueError("A prova precisa ter pelo menos 1 questão.")

        # Mapeia os campos do payload para os nomes reais do banco
        dados_banco = {
            "nome_prova": dados.get("nome_prova"),
            "descricao": dados.get("descricao"),
            "quantidade_questoes": quantidade,
        }

        return ProvaModel.salvar(dados_banco)

    @staticmethod
    def listar_provas():
        from src.config.database import supabase
        return supabase.table("provas").select("*").order("id", desc=True).execute()