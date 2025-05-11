from flask import Flask, jsonify, send_from_directory, redirect
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
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:5000", "http://127.0.0.1:5000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Serve static files and handle routing
    @app.route('/')
    def index():
        return send_from_directory(app.static_folder, 'index.html')
    
    @app.route('/login')
    def login():
        return send_from_directory(app.static_folder, 'index.html')
    
    @app.route('/register')
    def register():
        return send_from_directory(app.static_folder, 'register.html')
    
    @app.route('/dashboard')
    def dashboard():
        return send_from_directory(app.static_folder, 'components/Dashboard/Dashboard.html')
    
    # Catch-all route for static files
    @app.route('/<path:path>')
    def serve_static(path):
        return send_from_directory(app.static_folder, path)
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)