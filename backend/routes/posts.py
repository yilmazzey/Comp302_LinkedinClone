from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models.user import db, User
from models.post import Post, PostLike
import os
from datetime import datetime
import traceback

posts_bp = Blueprint('posts', __name__)

UPLOAD_FOLDER = os.path.join('static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@posts_bp.route('/posts', methods=['GET'])
@jwt_required()
def get_posts():
    try:
        current_user_id = get_jwt_identity()
        current_app.logger.info(f"Fetching posts for user {current_user_id}")
        
        posts = Post.query.order_by(Post.created_at.desc()).all()
        current_app.logger.info(f"Found {len(posts)} posts")
        
        posts_data = []
        for post in posts:
            try:
                post_dict = post.to_dict()
                post_dict['liked_by_user'] = any(like.user_id == current_user_id for like in post.likes)
                posts_data.append(post_dict)
            except Exception as e:
                current_app.logger.error(f"Error processing post {post.id}: {str(e)}")
                current_app.logger.error(traceback.format_exc())
                continue
        
        return jsonify(posts_data)
    except Exception as e:
        current_app.logger.error(f"Error in get_posts: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

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

@posts_bp.route('/posts/<int:post_id>/like', methods=['POST'])
@jwt_required()
def like_post(post_id):
    try:
        current_user_id = get_jwt_identity()
        current_app.logger.info(f"User {current_user_id} attempting to like post {post_id}")
        
        # Check if post exists
        post = Post.query.get_or_404(post_id)
        
        # Check if user already liked the post
        existing_like = PostLike.query.filter_by(
            user_id=current_user_id,
            post_id=post_id
        ).first()
        
        if existing_like:
            return jsonify({'error': 'Post already liked'}), 400
        
        # Create new like
        new_like = PostLike(
            user_id=current_user_id,
            post_id=post_id
        )
        
        db.session.add(new_like)
        db.session.commit()
        
        current_app.logger.info(f"User {current_user_id} successfully liked post {post_id}")
        return jsonify({
            'message': 'Post liked successfully',
            'likes_count': len(post.likes)
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error liking post: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': 'Failed to like post', 'details': str(e)}), 500

@posts_bp.route('/posts/<int:post_id>/unlike', methods=['POST'])
@jwt_required()
def unlike_post(post_id):
    try:
        current_user_id = get_jwt_identity()
        current_app.logger.info(f"User {current_user_id} attempting to unlike post {post_id}")
        
        # Check if post exists
        post = Post.query.get_or_404(post_id)
        
        # Find the like
        like = PostLike.query.filter_by(
            user_id=current_user_id,
            post_id=post_id
        ).first()
        
        if not like:
            return jsonify({'error': 'Post not liked'}), 400
        
        # Remove the like
        db.session.delete(like)
        db.session.commit()
        
        current_app.logger.info(f"User {current_user_id} successfully unliked post {post_id}")
        return jsonify({
            'message': 'Post unliked successfully',
            'likes_count': len(post.likes)
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error unliking post: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': 'Failed to unlike post', 'details': str(e)}), 500 