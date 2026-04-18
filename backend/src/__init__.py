from flask import Flask
from flask_cors import CORS
from src.routes.scanner_route import scanner_bp
from src.routes.provas_route import prova_bp

def create_app():
    app = Flask(__name__)
    
    CORS(app)

    app.register_blueprint(scanner_bp, url_prefix='/api')
    app.register_blueprint(prova_bp, url_prefix='/api')
    
    return app