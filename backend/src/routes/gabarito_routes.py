from flask import Blueprint

from src.controllers.gabarito_controller import GabaritoController


gabarito_bp = Blueprint("gabarito", __name__)


@gabarito_bp.route("/gabaritos", methods=["POST"])
@gabarito_bp.route("/gabaritos/cadastrar", methods=["POST"])
def gabarito_cadastrar():
    return GabaritoController.cadastrar()


@gabarito_bp.route("/gabaritos/corrigir", methods=["POST"])
@gabarito_bp.route("/corrigir-dinamico", methods=["POST"])
def gabarito_corrigir():
    return GabaritoController.corrigir()
