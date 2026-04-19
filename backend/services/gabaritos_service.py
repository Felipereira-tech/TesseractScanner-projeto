# services/gabarito_service.py
import json
import base64
from models.gabarito_model import GabaritoModel
from scanner import CartaoScanner

class GabaritoService:
    
    @staticmethod
    def converter_gabarito(gabarito_raw):
        """Converte ['A', 'B'] ou 'ABC' em índices [0, 1, 2]"""
        mapa = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4}
        if isinstance(gabarito_raw, str):
            gabarito_raw = list(gabarito_raw.upper())
        return [mapa[str(ans).upper()] if str(ans).upper() in mapa else int(ans) for ans in gabarito_raw]

    @staticmethod
    def processar_cadastro(prova_id: int, respostas_raw: str):
        """Faz a limpeza e chama o banco para cadastrar o gabarito"""
        respostas_list = json.loads(respostas_raw.replace("'", '"'))
        gabarito_convertido = GabaritoService.converter_gabarito(respostas_list)
        
        data = {
            "id_prova": prova_id,
            "respostas": gabarito_convertido,
            "criado_em": "now()"
        }
        return GabaritoModel.upsert_gabarito(data)

    @staticmethod
    def executar_correcao(prova_id: int, nome_aluno: str, id_turma: int, imagem_bytes: bytes):
        """Executa a lógica de visão computacional, calcula notas e salva"""
        
        # 1. Busca gabarito oficial
        gabarito_res = GabaritoModel.buscar_respostas_oficiais(prova_id)
        if not gabarito_res.data:
            # Note que aqui lançamos erro normal Python. O Controller vai tratar depois.
            raise ValueError("Gabarito oficial não encontrado para esta prova.")
        
        gabarito_oficial = gabarito_res.data.get("respostas")
        total_questoes = len(gabarito_oficial)

        # 2. Visão Computacional (Scanner)
        scanner = CartaoScanner(
            total_questoes=total_questoes, 
            gabarito=gabarito_oficial,
            alternativas=5
        )
        acertos, marcacoes_aluno, img_corrigida = scanner.processar(imagem_bytes)

        # 3. Cálculo da Nota Final
        nota_final = round((acertos / total_questoes) * 10, 2)

        # 4. Salvar Persistência (Model)
        GabaritoModel.inserir_respostas_aluno({
            "nome_aluno": nome_aluno,
            "id_turma": id_turma,
            "id_prova": prova_id,
            "respostas": marcacoes_aluno 
        })

        GabaritoModel.inserir_nota({
            "nome_aluno": nome_aluno,
            "id_prova": prova_id,
            "acertos": acertos,
            "nota": nota_final
        })

        # 5. Prepara Feedback Base64
        img_b64 = base64.b64encode(img_corrigida).decode('utf-8')

        return {
            "acertos": acertos,
            "total": total_questoes,
            "nota": nota_final,
            "respostas_lidas": marcacoes_aluno,
            "preview_correcao": f"data:image/jpeg;base64,{img_b64}"
        }