from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User, db, connections
from werkzeug.utils import secure_filename
import json
import os
from models.post import Post

profile_bp = Blueprint('profile', __name__)

UPLOAD_FOLDER = os.path.join('static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@profile_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        return jsonify(user.to_dict()), 200
        
    except Exception as e:
        return jsonify({'message': 'Error fetching profile', 'error': str(e)}), 500

@profile_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
            

        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
        
        # Handle profile image upload
        if 'profile_image' in request.files:
            image = request.files['profile_image']
            if image and allowed_file(image.filename):
                filename = secure_filename(image.filename)
                upload_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'static', 'uploads'))
                os.makedirs(upload_path, exist_ok=True)
                image_path = os.path.join(upload_path, filename)
                image.save(image_path)
                user.profile_photo = f'/static/uploads/{filename}'
        
        # Update basic profile fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'job_title' in data:
            user.job_title = data['job_title']
        if 'location' in data:
            user.location = data['location']
        if 'bio' in data:
            user.bio = data['bio']
            
        # Update education and experience (stored as JSON strings)
        if 'education' in data:
            user.education = json.dumps(data['education'])
        if 'experience' in data:
            user.experience = json.dumps(data['experience'])
            
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Profile update error: {str(e)}")
        return jsonify({'message': 'Error updating profile', 'error': str(e)}), 500

@profile_bp.route('/api/profile/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_profile(user_id):
    try:
        # Get the target user
        target_user = User.query.get(user_id)
        if not target_user:
            return jsonify({'error': 'User not found'}), 404

        # Get the current user
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        # Get connection status using User model helper
        connection_status = current_user.get_connection_status(user_id) if current_user else None

        # Get user's posts
        posts = Post.query.filter_by(user_id=user_id).order_by(Post.created_at.desc()).all()
        posts_data = [post.to_dict() for post in posts]

        # Get connection count using User model helper
        connections_count = target_user.get_connections_count() if target_user else 0

        return jsonify({
            'id': target_user.id,
            'first_name': target_user.first_name,
            'last_name': target_user.last_name,
            'email': target_user.email,
            'job_title': target_user.job_title,
            'location': target_user.location,
            'bio': target_user.bio,
            'profile_photo': target_user.profile_photo,
            'experience': target_user.experience,
            'education': target_user.education,
            'connections_count': connections_count,
            'connection_status': connection_status,
            'posts': posts_data
        })

    except Exception as e:
        print(f"Error fetching user profile: {str(e)}")
        return jsonify({'error': 'Failed to fetch profile'}), 500