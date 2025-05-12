# routes/admin.py

from flask import Blueprint, jsonify, current_app
from models.user import User, db
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_admin:
            return jsonify({"error": "Admin privileges required"}), 403
        return f(*args, **kwargs)
    return decorated_function

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
                'created_at': user.created_at.isoformat() if user.created_at else None
            })
        return jsonify(users_list)
    except Exception as e:
        current_app.logger.error(f"Error in get_users: {str(e)}")
        return jsonify({"error": str(e)}), 500

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
        current_app.logger.error(f"Error in delete_user: {str(e)}")
        return jsonify({"error": str(e)}), 500
