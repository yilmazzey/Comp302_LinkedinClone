from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User, db
import json

profile_bp = Blueprint('profile', __name__)

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
            
        data = request.get_json()
        
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
        return jsonify({'message': 'Error updating profile', 'error': str(e)}), 500