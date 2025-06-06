from flask import Flask, jsonify, send_from_directory, redirect
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from config import Config
from models.user import db
from models.post import Post, Comment, PostLike
from models.job import Job
from routes.auth import auth_bp
from routes.posts import posts_bp
from routes.profile import profile_bp
from routes.admin import admin_bp
from routes.connections import connections_bp
from routes.search import search_bp
from routes.jobs import jobs_bp
import os

def create_app():
    app = Flask(__name__, static_folder='../frontend', static_url_path='')
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    jwt = JWTManager(app)
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:5000", "http://127.0.0.1:5000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(posts_bp, url_prefix='/api')
    app.register_blueprint(profile_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(connections_bp, url_prefix='/api')
    app.register_blueprint(search_bp)
    app.register_blueprint(jobs_bp, url_prefix='/api')
    
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
        return send_from_directory(app.static_folder, 'Register.html')
    
    @app.route('/dashboard')
    def dashboard():
        return send_from_directory(app.static_folder, 'components/Dashboard/Dashboard.html')
    
    @app.route('/profile')
    def profile():
        return send_from_directory(app.static_folder, 'components/Profile/Profile.html')
    
    @app.route('/admin')
    def admin_dashboard():
        return send_from_directory(app.static_folder, 'components/AdminDashboard/AdminDashboard.html')
    
    @app.route('/userprofile')
    def user_profile():
        return send_from_directory(app.static_folder ,'components/UserProfile/UserProfile.html')
    
    @app.route('/network')
    def network():
        return send_from_directory(app.static_folder, 'components/Network/Network.html')

    @app.route('/jobs')
    def jobs():
        return send_from_directory(app.static_folder, 'components/Jobs/Jobs.html')

    # Serve uploaded images from backend/static/uploads
    @app.route('/static/uploads/<filename>')
    def uploaded_file(filename):
        return send_from_directory(os.path.join('static', 'uploads'), filename)
    
    # Catch-all route for static files
    @app.route('/<path:path>')
    def serve_static(path):
        return send_from_directory(app.static_folder, path)
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)