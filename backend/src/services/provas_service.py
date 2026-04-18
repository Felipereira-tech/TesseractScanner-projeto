from src.models.provas import ProvaModel

class ProvaService:
    @staticmethod
    def cadastrar_nova_prova (dados):
        if dados.get("quantidade_questoes", 0) <= 0:
            raise ValueError("A prova precisa ter pelo menos 1 questão.")
        
        return ProvaModel.salvar(dados)