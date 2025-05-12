from flask import Blueprint, request, jsonify, current_app
from models.user import User, db
from utils.jwt_utils import generate_tokens
import jwt
import logging
from flask_jwt_extended import jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already registered'}), 400
        
        # Create new user
        user = User(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name']
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Generate tokens
        tokens = generate_tokens(user.id)
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict(),
            **tokens
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Registration error: {str(e)}")
        return jsonify({'message': 'Error creating user'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password are required'}), 400
        
        # Find user
        user = User.query.filter_by(email=data['email']).first()
        
        if not user:
            current_app.logger.warning(f"Login attempt with non-existent email: {data['email']}")
            return jsonify({'message': 'Invalid email or password'}), 401
        
        # Check password
        if not user.check_password(data['password']):
            current_app.logger.warning(f"Invalid password attempt for user: {data['email']}")
            return jsonify({'message': 'Invalid email or password'}), 401
        
        # Generate tokens
        tokens = generate_tokens(user.id)
        
        current_app.logger.info(f"Successful login for user: {user.email}")
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            **tokens
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return jsonify({'message': 'An error occurred during login'}), 500

@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    try:
        data = request.get_json()
        
        if not data or 'refresh_token' not in data:
            return jsonify({'message': 'Refresh token is required'}), 400
        
        # Verify refresh token
        payload = jwt.decode(
            data['refresh_token'],
            current_app.config['JWT_SECRET_KEY'],
            algorithms=['HS256']
        )
        
        # Generate new tokens
        tokens = generate_tokens(payload['user_id'])
        
        return jsonify(tokens), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Refresh token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid refresh token'}), 401
    except Exception as e:
        current_app.logger.error(f"Token refresh error: {str(e)}")
        return jsonify({'message': 'An error occurred during token refresh'}), 500

@auth_bp.route('/profile/update', methods=['POST'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        data = request.get_json()
        
        # Update user fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'email' in data:
            # Check if email is already taken by another user
            existing_user = User.query.filter(User.email == data['email'], User.id != user_id).first()
            if existing_user:
                return jsonify({'message': 'Email already in use'}), 400
            user.email = data['email']
            
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Profile update error: {str(e)}")
        return jsonify({'message': 'Error updating profile', 'error': str(e)}), 500
