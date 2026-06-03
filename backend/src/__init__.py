from flask import Flask
from flask_cors import CORS
from src.routes.gabarito_routes import gabarito_bp
from src.routes.scanner_route import scanner_bp
from src.routes.provas_route import prova_bp
from src.routes.users_routes import users_bp

def create_app():
    app = Flask(__name__)
    
    CORS(app)

    app.register_blueprint(scanner_bp, url_prefix='/api')
    app.register_blueprint(prova_bp, url_prefix='/api')
    app.register_blueprint(gabarito_bp, url_prefix='/api')
    app.register_blueprint(users_bp, url_prefix='/api')
    
    return app
