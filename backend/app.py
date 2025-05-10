from flask import Flask, jsonify, send_from_directory
from models import db
import os

app = Flask(__name__, static_folder='../frontend', static_url_path='')

# SQLite configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///linkedin_clone.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

@app.cli.command('create-db')
def create_db():
    """Create database tables."""
    db.create_all()
    print('Database tables created.')

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/')
def index():
    return 'Backend is running!'

@app.route('/api/health')
def health_check():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True)