from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    
    from src.routes.scanner_route import scanner_bp

    app.register_blueprint(scanner_bp, url_prefix='/api')
    
    return app
