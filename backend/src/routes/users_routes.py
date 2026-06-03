from flask import Blueprint
from src.controllers.users_controller import UserController

users_bp = Blueprint('users', __name__)


@users_bp.route("/usuarios/cadastro", methods=["POST"])
def usuarios_criar():
    return UserController.criar()


@users_bp.route("/usuarios/login", methods=["POST"])
def usuarios_autenticar():
    return UserController.autenticar()


@users_bp.route("/usuarios", methods=["GET"])
def usuarios_listar():
    return UserController.listar()


@users_bp.route("/usuarios/<int:usuario_id>", methods=["GET"])
def usuarios_buscar(usuario_id):
    return UserController.buscar_por_id(usuario_id)


@users_bp.route("/usuarios/<int:usuario_id>", methods=["PUT"])
def usuarios_atualizar(usuario_id):
    return UserController.atualizar(usuario_id)


@users_bp.route("/usuarios/<int:usuario_id>", methods=["DELETE"])
def usuarios_deletar(usuario_id):
    return UserController.deletar(usuario_id)
