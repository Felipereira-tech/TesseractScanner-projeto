from flask import Blueprint
from src.controllers.provas_controller import ProvaController

prova_bp = Blueprint('prova', __name__)

@prova_bp.route("/provas", methods=["POST"])
def prova_criar():
    return ProvaController.criar()
