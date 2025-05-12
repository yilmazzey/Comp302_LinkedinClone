from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
from models.user import User

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user or not user.is_admin:
                return jsonify({'message': 'Admin access required'}), 403
                
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'message': 'Error verifying admin status', 'error': str(e)}), 500
            
    return decorated_function 