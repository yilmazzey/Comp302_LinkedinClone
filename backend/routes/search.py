from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User, db
from sqlalchemy import or_
import json

search_bp = Blueprint('search', __name__)

@search_bp.route('/api/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_details(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404

        user_dict = {
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'job_title': user.job_title,
            'location': user.location,
            'bio': user.bio,
            'profile_photo': user.profile_photo,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'updated_at': user.updated_at.isoformat() if user.updated_at else None,
            'is_admin': user.is_admin,
            'education': user.education,
            'experience': user.experience
        }

        return jsonify({
            'success': True,
            'data': user_dict
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@search_bp.route('/api/search/users', methods=['GET'])
@jwt_required()
def search_users():
    try:
        # Get search parameters
        query = request.args.get('query', '')
        location = request.args.get('location', '')
        job_title = request.args.get('job_title', '')
        education = request.args.get('education', '')
        experience = request.args.get('experience', '')

        # Start with base query
        base_query = User.query

        # Apply filters
        if query:
            base_query = base_query.filter(
                or_(
                    User.first_name.ilike(f'%{query}%'),
                    User.last_name.ilike(f'%{query}%')
                )
            )

        if location:
            base_query = base_query.filter(User.location.ilike(f'%{location}%'))

        if job_title:
            base_query = base_query.filter(User.job_title.ilike(f'%{job_title}%'))

        if education:
            # Search in education JSON array
            base_query = base_query.filter(
                or_(
                    User.education.ilike(f'%"school": "%{education}%"%'),
                )
            )

        if experience:
            # Search in experience JSON array
            base_query = base_query.filter(
                or_(
                    User.experience.ilike(f'%"company": "%{experience}%"%')
                )
            )

        # Execute query
        users = base_query.all()

        # Convert to dictionary format
        user_list = []
        for user in users:
            user_dict = {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'job_title': user.job_title,
                'location': user.location,
                'bio': user.bio,
                'profile_photo': user.profile_photo,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'updated_at': user.updated_at.isoformat() if user.updated_at else None,
                'is_admin': user.is_admin,
                'education': user.education,
                'experience': user.experience
            }
            user_list.append(user_dict)

        return jsonify({
            'success': True,
            'data': {
                'total': len(user_list),
                'users': user_list
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500 