# routes/admin.py

from flask import Blueprint, jsonify, current_app
from models.user import User, db
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.admin_utils import admin_required
from models.post import Comment

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
def get_users():
    try:
        users = User.query.all()
        users_list = []
        for user in users:
            users_list.append({
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'is_admin': user.is_admin
            })
        return jsonify(users_list)
    except Exception as e:
        current_app.logger.error(f"Error fetching users: {str(e)}")
        return jsonify({"error": "Failed to fetch users"}), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        
        # Prevent admin from deleting themselves
        current_user_id = get_jwt_identity()
        if user.id == current_user_id:
            return jsonify({"error": "Cannot delete your own account"}), 400
            
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted successfully'})
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting user: {str(e)}")
        return jsonify({"error": "Failed to delete user"}), 500

@admin_bp.route('/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(comment_id):
    try:
        comment = Comment.query.get_or_404(comment_id)
        db.session.delete(comment)
        db.session.commit()
        return jsonify({'message': 'Comment deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
