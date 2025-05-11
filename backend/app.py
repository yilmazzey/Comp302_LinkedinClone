from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from models.user import db
from routes.auth import auth_bp
import os

def create_app():
    app = Flask(__name__, static_folder='../frontend', static_url_path='')
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Serve static files
    @app.route('/')
    def index():
        return send_from_directory(app.static_folder, 'index.html')
    
    @app.route('/register')
    def register():
        return send_from_directory(app.static_folder, 'register.html')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)