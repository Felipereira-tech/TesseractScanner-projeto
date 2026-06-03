from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from src.models.users import UserModel


class UserService:
    @staticmethod
    def cadastrar_novo_usuario(dados):
        nome_usuario = dados.get("nome_usuario", "").strip()
        email = dados.get("email", "").strip()
        senha = dados.get("senha", "").strip()

        if not nome_usuario or len(nome_usuario) < 3:
            raise ValueError("O nome de usuário deve ter pelo menos 3 caracteres.")

        if not email or "@" not in email:
            raise ValueError("Informe um email válido.")

        if not senha or len(senha) < 6:
            raise ValueError("A senha deve ter pelo menos 6 caracteres.")

        usuario_existente = UserModel.buscar_por_email(email)
        if usuario_existente.data:
            raise ValueError("Este email já está registrado.")

        senha_hash = generate_password_hash(senha)

        dados_usuario = {
            "nome_usuario": nome_usuario,
            "email": email,
            "senha": senha_hash,
            "criado_em": datetime.now().isoformat(),
            "atualizado_em": datetime.now().isoformat(),
            "nivel": 0
        }

        resultado = UserModel.salvar(dados_usuario)

        if resultado.data:
            usuario_criado = resultado.data[0] if isinstance(resultado.data, list) else resultado.data
            return {
                "id": usuario_criado.get("id"),
                "nome_usuario": usuario_criado.get("nome_usuario"),
                "email": usuario_criado.get("email"),
                "nivel": usuario_criado.get("nivel"),
                "criado_em": usuario_criado.get("criado_em")
            }

        raise ValueError("Erro ao criar novo usuário.")

    @staticmethod
    def autenticar_usuario(email, senha):
        usuario = UserModel.buscar_por_email(email)

        if not usuario.data:
            raise ValueError("Email ou senha inválidos.")

        usuario_info = usuario.data

        if not check_password_hash(usuario_info.get("senha"), senha):
            raise ValueError("Email ou senha inválidos.")

        return {
            "id": usuario_info.get("id"),
            "nome_usuario": usuario_info.get("nome_usuario"),
            "email": usuario_info.get("email"),
            "nivel": usuario_info.get("nivel")
        }

    @staticmethod
    def buscar_usuario_por_id(usuario_id):
        usuario = UserModel.buscar_por_id(usuario_id)

        if not usuario.data:
            raise ValueError("Usuário não encontrado.")

        return usuario.data

    @staticmethod
    def listar_usuarios():
        resultado = UserModel.listar_todos()
        return resultado.data if resultado.data else []

    @staticmethod
    def atualizar_usuario(usuario_id, dados):
        usuario_existente = UserModel.buscar_por_id(usuario_id)

        if not usuario_existente.data:
            raise ValueError("Usuário não encontrado.")

        dados_atualizacao = {}

        if "nome_usuario" in dados:
            nome = dados.get("nome_usuario", "").strip()
            if len(nome) >= 3:
                dados_atualizacao["nome_usuario"] = nome

        if "email" in dados:
            email = dados.get("email", "").strip()
            if "@" in email:
                email_existente = UserModel.buscar_por_email(email)
                if email_existente.data and email_existente.data.get("id") != usuario_id:
                    raise ValueError("Este email já está registrado.")
                dados_atualizacao["email"] = email

        if "senha" in dados:
            senha = dados.get("senha", "").strip()
            if len(senha) >= 6:
                dados_atualizacao["senha"] = generate_password_hash(senha)

        dados_atualizacao["atualizado_em"] = datetime.now().isoformat()

        resultado = UserModel.atualizar(usuario_id, dados_atualizacao)

        if resultado.data:
            return resultado.data
        raise ValueError("Erro ao atualizar usuário.")

    @staticmethod
    def deletar_usuario(usuario_id):
        usuario_existente = UserModel.buscar_por_id(usuario_id)

        if not usuario_existente.data:
            raise ValueError("Usuário não encontrado.")

        UserModel.deletar(usuario_id)
        return {"status": "sucesso", "mensagem": "Usuário deletado com sucesso."}
