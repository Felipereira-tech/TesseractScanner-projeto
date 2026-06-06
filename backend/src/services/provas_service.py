from src.models.provas import ProvaModel
from src.models.gabarito_model import GabaritoModel

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

    @staticmethod
    def atualizar_prova(prova_id, dados):
        quantidade = dados.get("quantidade_questoes", 0)
        if quantidade <= 0:
            raise ValueError("A prova precisa ter pelo menos 1 questão.")

        dados_banco = {
            "nome_prova": dados.get("nome_prova"),
            "descricao": dados.get("descricao"),
            "quantidade_questoes": quantidade,
        }

        return ProvaModel.atualizar(prova_id, dados_banco)

    @staticmethod
    def deletar_prova(prova_id):
        GabaritoModel.deletar_por_prova_id(prova_id)
        return ProvaModel.deletar(prova_id)
