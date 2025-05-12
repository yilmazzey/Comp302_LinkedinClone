from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models.user import db, User
from models.post import Post
import os

posts_bp = Blueprint('posts', __name__)

UPLOAD_FOLDER = os.path.join('static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@posts_bp.route('/posts', methods=['POST'])
@jwt_required()
def create_post():
    try:
        user_id = get_jwt_identity()
        content = request.form.get('content')
        
        if not content:
            return jsonify({'message': 'Content is required'}), 400
            
        image = request.files.get('image')
        image_url = None

        if image and allowed_file(image.filename):
            filename = secure_filename(image.filename)
            upload_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'static', 'uploads'))
            os.makedirs(upload_path, exist_ok=True)
            image.save(os.path.join(upload_path, filename))
            image_url = f'/static/uploads/{filename}'

        post = Post(content=content, image_url=image_url, author_id=user_id)
        db.session.add(post)
        db.session.commit()
        return jsonify(post.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating post: {str(e)}")
        return jsonify({'message': 'Error creating post', 'error': str(e)}), 500

@posts_bp.route('/posts', methods=['GET'])
def get_posts():
    posts = Post.query.order_by(Post.created_at.desc()).all()
    return jsonify([post.to_dict() for post in posts]) 